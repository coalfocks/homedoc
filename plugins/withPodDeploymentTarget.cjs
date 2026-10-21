const { withPodfile } = require('@expo/config-plugins');

// Xcode 27 rejects old resource-bundle minimums even when the app uses iOS 15+.
// Keep higher pod minimums; lower targets inherit the Pods project's minimum.
module.exports = (config) =>
  withPodfile(config, (mod) => {
    const marker = '# HomeDoc: inherit supported pod deployment targets';
    if (
      mod.modResults.contents.includes(marker) &&
      mod.modResults.contents.includes('fmt_base =')
    )
      return mod;
    const anchor = /react_native_post_install\([\s\S]*?^\s*\)/m;
    if (!anchor.test(mod.modResults.contents))
      throw new Error(
        'Could not locate react_native_post_install; review the generated Podfile before building.',
      );
    mod.modResults.contents = mod.modResults.contents.replace(
      anchor,
      (match) => `${match}
    ${marker}
    project_settings = installer.pods_project.build_configurations.first.build_settings
    %w[IPHONEOS_DEPLOYMENT_TARGET TVOS_DEPLOYMENT_TARGET WATCHOS_DEPLOYMENT_TARGET MACOSX_DEPLOYMENT_TARGET].each do |setting|
      app_minimum = project_settings[setting]
      next if app_minimum.nil?
      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
          pod_minimum = config.build_settings[setting]
          next if pod_minimum.nil? || Gem::Version.new(pod_minimum) >= Gem::Version.new(app_minimum)
          config.build_settings.delete(setting)
        end
      end
    end
    # RN 0.79's fmt consteval path fails on Apple Clang 21 and newer.
    fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      original = File.read(fmt_base)
      patched = original.gsub(/^#\\s*define FMT_USE_CONSTEVAL 1$/, '# define FMT_USE_CONSTEVAL 0')
      if patched != original
        File.chmod(0644, fmt_base)
        File.write(fmt_base, patched)
      end
    end`,
    );
    return mod;
  });

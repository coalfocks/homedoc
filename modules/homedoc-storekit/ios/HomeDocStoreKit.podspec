Pod::Spec.new do |s|
  s.name           = 'HomeDocStoreKit'
  s.version        = '1.0.0'
  s.summary        = 'HomeDoc StoreKit 2 Expo module'
  s.description    = 'Provides direct StoreKit 2 product, purchase, and restore APIs to HomeDoc.'
  s.license        = { :type => 'MIT' }
  s.author         = { 'Cfox' => 'cfox@skriber.com' }
  s.homepage       = 'https://homedocumentation.com'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/coalfocks/homedoc.git', :tag => s.version.to_s }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end

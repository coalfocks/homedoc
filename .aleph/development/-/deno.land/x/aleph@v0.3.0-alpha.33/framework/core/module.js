import util from "../../shared/util.js";
export const moduleExts = [
    'tsx',
    'jsx',
    'ts',
    'js',
    'mjs'
];
export function toPagePath(url) {
    let pathname = trimModuleExt(url);
    if (pathname.startsWith('/pages/')) {
        pathname = util.trimPrefix(pathname, '/pages');
    }
    if (pathname.endsWith('/index')) {
        pathname = util.trimSuffix(pathname, '/index');
    }
    if (pathname === '') {
        pathname = '/';
    }
    return pathname;
}
export function trimModuleExt(url) {
    for (const ext of moduleExts){
        if (url.endsWith('.' + ext)) {
            return url.slice(0, -(ext.length + 1));
        }
    }
    return url;
}
export function importModule(basePath, url, forceRefetch = false) {
    const { __ALEPH: ALEPH  } = window;
    if (ALEPH) {
        return ALEPH.import(url, forceRefetch);
    }
    let src = util.cleanPath(basePath + '/_aleph/' + trimModuleExt(url) + '.js');
    if (forceRefetch) {
        src += '?t=' + Date.now();
    }
    return import(src);
}

//# sourceMappingURL=module.js.map
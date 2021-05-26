import util from "../../shared/util.js";
import { redirect } from "./redirect.js";
const ghostRoute = {
    path: '',
    module: {
        url: ''
    }
};
export class Routing {
    constructor({ basePath ='/' , defaultLocale ='en' , locales =[] , routes =[] , rewrites ={
    }  }){
        this._basePath = basePath;
        this._defaultLocale = defaultLocale;
        this._locales = locales;
        this._routes = routes;
        this._rewrites = rewrites;
    }
    get basePath() {
        return this._basePath;
    }
    get paths() {
        const paths = [];
        this._lookup((path)=>{
            paths.push(path.map((r)=>r.path
            ).join(''));
        }, true);
        return paths;
    }
    // routes returns the routes as copy
    get routes() {
        return JSON.parse(JSON.stringify(this._routes));
    }
    config(options) {
        Object.keys(options).forEach((key)=>{
            if ('_' + key in this) {
                Object.assign(this, {
                    ['_' + key]: options[key]
                });
            }
        });
    }
    update(path, moduleUrl, options = {
    }) {
        const { isIndex , ...rest } = options;
        const newRoute = {
            path: path === '/' ? path : util.trimSuffix(path, '/') + (options.isIndex ? '/' : ''),
            module: {
                url: moduleUrl,
                ...rest
            }
        };
        const dirtyRoutes = new Set();
        let exists = false;
        let targetRoutes = this._routes;
        this._lookup((routePath)=>{
            const path = routePath.map((r)=>r.path
            ).join('');
            const route = routePath[routePath.length - 1];
            const parentRoute = routePath[routePath.length - 2];
            if (route.module.url === newRoute.module.url) {
                Object.assign(route.module, newRoute.module);
                exists = true;
                return false;
            }
            if (!newRoute.path.endsWith('/') && path.startsWith(newRoute.path + '/')) {
                const routes = parentRoute ? parentRoute.children : this._routes;
                const index = routes.indexOf(route);
                if (index >= 0) {
                    routes.splice(index, 1, ghostRoute);
                    dirtyRoutes.add(routes);
                }
                (newRoute.children || (newRoute.children = [])).push({
                    ...route,
                    path: util.trimPrefix(path, newRoute.path)
                });
            } else if (!path.endsWith('/') && newRoute.path.startsWith(path + '/')) {
                newRoute.path = util.trimPrefix(newRoute.path, path);
                targetRoutes = route.children || (route.children = []);
            }
        });
        if (exists) {
            return;
        }
        dirtyRoutes.forEach((routes)=>{
            let index;
            while(~(index = routes.indexOf(ghostRoute))){
                routes.splice(index, 1);
            }
        });
        dirtyRoutes.clear();
        targetRoutes.push(newRoute);
    }
    removeRoute(url) {
        this._lookup((path)=>{
            const route = path[path.length - 1];
            if (route.module.url === url) {
                const parentRoute = path[path.length - 2];
                const routes = parentRoute ? parentRoute.children : this._routes;
                const index = routes.indexOf(route);
                if (index >= 0) {
                    routes.splice(index, 1, ...(route.children || []).map((r)=>({
                            ...r,
                            path: route.path + r.path
                        })
                    ));
                }
                return false;
            }
        });
    }
    createRouter(location) {
        const loc = location || window.location || {
            pathname: '/'
        };
        const url = rewriteURL(loc.pathname + (loc.search || ''), this._basePath, this._rewrites);
        let locale = this._defaultLocale;
        let pathname = decodeURI(url.pathname);
        let routePath = '';
        let params = {
        };
        let nestedModules = [];
        if (pathname !== '/' && this._locales.length > 0) {
            const a = pathname.split('/');
            const a1 = a[1];
            if (a1 !== locale && this._locales.includes(a1)) {
                locale = a1;
                pathname = '/' + a.slice(2).join('/');
            }
        }
        this._lookup((route)=>{
            const path = route.map((r)=>r.path
            ).join('');
            const [p, ok] = matchPath(path, pathname);
            if (ok) {
                nestedModules = route.map((r)=>r.module
                );
                const c = route[route.length - 1].children?.find((c)=>c.path === '/'
                );
                if (c) {
                    nestedModules.push(c.module);
                }
                routePath = path;
                params = p;
                return false;
            }
        }, true);
        // sort search params
        url.searchParams.sort();
        return [
            {
                basePath: this._basePath,
                locale,
                pathname,
                routePath,
                params,
                query: url.searchParams,
                toString () {
                    const qs = this.query.toString();
                    return [
                        this.pathname,
                        qs
                    ].filter(Boolean).join('?');
                },
                push: (url)=>redirect(url)
                ,
                replace: (url)=>redirect(url, true)
            },
            nestedModules
        ];
    }
    lookup(callback) {
        this._lookup(callback);
    }
    _lookup(callback, skipNestedIndex = false, __tracing = [], __routes = this._routes) {
        for (const route of __routes){
            if (skipNestedIndex && __tracing.length > 0 && route.path === '/') {
                continue;
            }
            if (callback([
                ...__tracing,
                route
            ]) === false) {
                return false;
            }
        }
        for (const route of __routes){
            if (route.path !== '/' && route.children?.length) {
                if (this._lookup(callback, skipNestedIndex, [
                    ...__tracing,
                    route
                ], route.children) === false) {
                    return false;
                }
            }
        }
    }
}
function matchPath(routePath, locPath) {
    const params = {
    };
    const routeSegments = util.splitPath(routePath);
    const locSegments = util.splitPath(locPath);
    const depth = Math.max(routeSegments.length, locSegments.length);
    for(let i = 0; i < depth; i++){
        const routeSeg = routeSegments[i];
        const locSeg = locSegments[i];
        if (locSeg === undefined || routeSeg === undefined) {
            return [
                {
                },
                false
            ];
        }
        if (routeSeg.startsWith('[...') && routeSeg.endsWith(']') && routeSeg.length > 5 && i === routeSegments.length - 1) {
            params[routeSeg.slice(4, -1)] = locSegments.slice(i).map(decodeURIComponent).join('/');
            break;
        }
        if (routeSeg.startsWith('[') && routeSeg.endsWith(']') && routeSeg.length > 2) {
            params[routeSeg.slice(1, -1)] = decodeURIComponent(locSeg);
        } else if (routeSeg.startsWith('$') && routeSeg.length > 1) {
            params[routeSeg.slice(1)] = decodeURIComponent(locSeg);
        } else if (routeSeg !== locSeg) {
            return [
                {
                },
                false
            ];
        }
    }
    return [
        params,
        true
    ];
}
export function createBlankRouterURL(basePath = '/', locale = 'en') {
    return {
        basePath,
        locale,
        routePath: '',
        pathname: '/',
        params: {
        },
        query: new URLSearchParams(),
        push: ()=>void 0
        ,
        replace: ()=>void 0
    };
}
/** `rewriteURL` returns a rewrited URL */ export function rewriteURL(reqUrl, basePath, rewrites) {
    const url = new URL('http://localhost' + reqUrl);
    if (basePath !== '/') {
        url.pathname = util.trimPrefix(decodeURI(url.pathname), basePath);
    }
    for(const path in rewrites){
        const to = rewrites[path];
        const [params, ok] = matchPath(path, decodeURI(url.pathname));
        if (ok) {
            url.pathname = util.cleanPath(to.replace(/:(.+)(\/|&|$)/g, (s, k, e)=>{
                if (k in params) {
                    return params[k] + e;
                }
                return s;
            }));
            break;
        }
    }
    return url;
}

//# sourceMappingURL=routing.js.map
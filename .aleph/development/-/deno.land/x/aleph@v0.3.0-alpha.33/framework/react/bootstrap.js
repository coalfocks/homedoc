import { createElement } from "../../../../../esm.sh/react@17.0.2.js";
import { hydrate, render } from "../../../../../esm.sh/react-dom@17.0.2.js";
import { importModule, trimModuleExt } from "../core/module.js";
import { Routing } from "../core/routing.js";
import Router from "./components/Router.js";
import { loadPageDataFromTag } from "./pagedata.js";
import { createPageProps } from "./pageprops.js";
export default async function bootstrap(options) {
    const { basePath , defaultLocale , locales , routes , rewrites , sharedModules , renderMode  } = options;
    const { document  } = window;
    const customComponents = {
    };
    await Promise.all(sharedModules.map(async ({ url , withData  })=>{
        const { default: C  } = await importModule(basePath, url);
        switch(trimModuleExt(url)){
            case '/404':
                customComponents['E404'] = {
                    C,
                    withData
                };
                break;
            case '/app':
                customComponents['App'] = {
                    C,
                    withData
                };
                break;
        }
    }));
    const routing = new Routing({
        routes,
        rewrites,
        basePath,
        defaultLocale,
        locales
    });
    const [url, nestedModules] = routing.createRouter();
    const imports = nestedModules.map(async (mod)=>{
        const { default: Component  } = await importModule(basePath, mod.url);
        return {
            url: mod.url,
            Component
        };
    });
    if (!!customComponents.App?.withData || nestedModules.findIndex((mod)=>!!mod.withData
    ) > -1) {
        await loadPageDataFromTag(url);
    }
    const pageRoute = {
        ...createPageProps(await Promise.all(imports)),
        url
    };
    const routerEl = createElement(Router, {
        customComponents,
        pageRoute,
        routing
    });
    const mountPoint = document.getElementById('__aleph');
    if (renderMode === 'ssr') {
        hydrate(routerEl, mountPoint);
    } else {
        render(routerEl, mountPoint);
    }
    // remove ssr head elements, set a timmer to avoid the tab title flash
    setTimeout(()=>{
        Array.from(document.head.children).forEach((el)=>{
            const tag = el.tagName.toLowerCase();
            if (el.hasAttribute('ssr') && tag !== 'style' && !(tag === 'link' && el.getAttribute('rel') === 'stylesheet')) {
                document.head.removeChild(el);
            }
        });
    }, 0);
};

//# sourceMappingURL=bootstrap.js.map
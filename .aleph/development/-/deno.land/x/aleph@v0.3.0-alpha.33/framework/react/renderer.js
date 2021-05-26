import { createElement } from "../../../../../esm.sh/react@17.0.2.js";
import { renderToString } from "../../../../../esm.sh/react-dom@17.0.2/server.js";
import util from "../../shared/util.js";
import events from "../core/events.js";
import { RouterContext, SSRContext } from "./context.js";
import { E400MissingComponent, E404Page } from "./components/ErrorBoundary.js";
import { AsyncUseDenoError } from "./hooks.js";
import { isLikelyReactComponent } from "./helper.js";
import { createPageProps } from "./pageprops.js";
export async function render(url, App, nestedPageComponents, styles) {
    const global = globalThis;
    const ret = {
        head: [],
        body: '',
        scripts: [],
        data: null
    };
    const rendererStore = {
        headElements: new Map(),
        inlineStyles: new Map(),
        scripts: new Map()
    };
    const dataUrl = 'pagedata://' + url.toString();
    const asyncCalls = [];
    const data = {
    };
    const renderingData = {
    };
    const pageProps = createPageProps(nestedPageComponents);
    const defer = ()=>{
        delete global['rendering-' + dataUrl];
        events.removeAllListeners('useDeno-' + dataUrl);
    };
    // share rendering data
    global['rendering-' + dataUrl] = renderingData;
    // listen `useDeno-*` events to get hooks callback result.
    events.on('useDeno-' + dataUrl, ({ id , value , expires  })=>{
        if (value instanceof Promise) {
            asyncCalls.push([
                id,
                expires,
                value
            ]);
        } else {
            data[id] = {
                value,
                expires
            };
        }
    });
    let el;
    if (App) {
        if (isLikelyReactComponent(App)) {
            if (pageProps.Page == null) {
                el = createElement(E404Page);
            } else {
                el = createElement(App, pageProps);
            }
        } else {
            el = createElement(E400MissingComponent, {
                name: 'Custom App'
            });
        }
    } else {
        if (pageProps.Page == null) {
            el = createElement(E404Page);
        } else {
            el = createElement(pageProps.Page, pageProps.pageProps);
        }
    }
    // `renderToString` might be invoked repeatedly when asyncchronous callbacks exist.
    while(true){
        try {
            if (asyncCalls.length > 0) {
                const calls = asyncCalls.splice(0, asyncCalls.length);
                const datas = await Promise.all(calls.map((a)=>a[2]
                ));
                calls.forEach(([id, expires], i)=>{
                    const value = datas[i];
                    renderingData[id] = value;
                    data[id] = {
                        value,
                        expires
                    };
                });
            }
            Object.keys(rendererStore).forEach((key)=>rendererStore[key].clear()
            );
            ret.body = renderToString(createElement(SSRContext.Provider, {
                value: rendererStore
            }, createElement(RouterContext.Provider, {
                value: url
            }, el)));
            if (Object.keys(data).length > 0) {
                ret.data = data;
            }
            break;
        } catch (error) {
            if (error instanceof AsyncUseDenoError) {
                continue;
            }
            defer();
            throw error;
        }
    }
    // insert head child tags
    rendererStore.headElements.forEach(({ type , props  })=>{
        const { children , ...rest } = props;
        if (type === 'title') {
            if (util.isNEString(children)) {
                ret.head.push(`<title ssr>${children}</title>`);
            } else if (util.isNEArray(children)) {
                ret.head.push(`<title ssr>${children.join('')}</title>`);
            }
        } else {
            const attrs = Object.entries(rest).map(([key, value])=>` ${key}=${JSON.stringify(value)}`
            ).join('');
            if (type === 'script') {
                ret.head.push(`<${type}${attrs}>${Array.isArray(children) ? children.join('') : children || ''}</${type}>`);
            } else if (util.isNEString(children)) {
                ret.head.push(`<${type}${attrs} ssr>${children}</${type}>`);
            } else if (util.isNEArray(children)) {
                ret.head.push(`<${type}${attrs} ssr>${children.join('')}</${type}>`);
            } else {
                ret.head.push(`<${type}${attrs} ssr />`);
            }
        }
    });
    // insert script tags
    rendererStore.scripts.forEach(({ props  })=>{
        const { children , dangerouslySetInnerHTML , ...attrs } = props;
        if (dangerouslySetInnerHTML && util.isNEString(dangerouslySetInnerHTML.__html)) {
            ret.scripts.push({
                ...attrs,
                innerText: dangerouslySetInnerHTML.__html
            });
        }
        if (util.isNEString(children)) {
            ret.scripts.push({
                ...attrs,
                innerText: children
            });
        } else if (util.isNEArray(children)) {
            ret.scripts.push({
                ...attrs,
                innerText: children.join('')
            });
        } else {
            ret.scripts.push(props);
        }
    });
    // insert styles
    Object.entries(styles).forEach(([url, { css , href  }])=>{
        if (css) {
            ret.head.push(`<style type="text/css" data-module-id=${JSON.stringify(url)} ssr>${css}</style>`);
        } else if (href) {
            ret.head.push(`<link rel="stylesheet" href=${JSON.stringify(href)} data-module-id=${JSON.stringify(url)} ssr />`);
        }
    });
    for (const [url, css] of rendererStore.inlineStyles.entries()){
        ret.head.push(`<style type="text/css" data-module-id=${JSON.stringify(url)} ssr>${css}</style>`);
    }
    defer();
    return ret;
}

//# sourceMappingURL=renderer.js.map
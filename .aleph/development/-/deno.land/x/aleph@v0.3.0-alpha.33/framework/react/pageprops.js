import { E400MissingComponent } from "./components/ErrorBoundary.js";
import { isLikelyReactComponent } from "./helper.js";
export function createPageProps(nestedComponents) {
    const pageProps = {
        Page: null,
        pageProps: null
    };
    if (nestedComponents.length > 0) {
        Object.assign(pageProps, createPagePropsSegment(nestedComponents[0]));
    }
    if (nestedComponents.length > 1) {
        nestedComponents.slice(1).reduce((p, seg)=>{
            const c = createPagePropsSegment(seg);
            p.pageProps = c;
            return c;
        }, pageProps);
    }
    return pageProps;
}
function createPagePropsSegment(seg) {
    const pageProps = {
        Page: null,
        pageProps: null
    };
    if (seg.Component) {
        if (isLikelyReactComponent(seg.Component)) {
            pageProps.Page = seg.Component;
        } else {
            pageProps.Page = E400MissingComponent;
            pageProps.pageProps = {
                name: 'Page Component: ' + seg.url
            };
        }
    }
    return pageProps;
}

//# sourceMappingURL=pageprops.js.map
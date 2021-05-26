import { createContext } from "../../../../../esm.sh/react@17.0.2.js";
import { createBlankRouterURL } from "../core/routing.js";
import { createNamedContext } from "./helper.js";
export const RouterContext = createNamedContext(createBlankRouterURL(), 'RouterContext');
export const FallbackContext = createNamedContext({
    to: null
}, 'FallbackContext');
export const SSRContext = createContext({
    headElements: new Map(),
    inlineStyles: new Map(),
    scripts: new Map()
});

//# sourceMappingURL=context.js.map
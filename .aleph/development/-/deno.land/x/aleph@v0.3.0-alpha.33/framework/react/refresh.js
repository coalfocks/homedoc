import runtime from "../../../../../esm.sh/react-refresh@0.10.0/runtime.js";
import util from "../../shared/util.js";
// react-refresh
// @link https://github.com/facebook/react/issues/16604#issuecomment-528663101
runtime.injectIntoGlobalHook(window);
Object.assign(window, {
    $RefreshReg$: ()=>{
    },
    $RefreshSig$: ()=>(type)=>type
});
export const performReactRefresh = util.debounce(runtime.performReactRefresh, 30);
export const RefreshRuntime = runtime;

//# sourceMappingURL=refresh.js.map
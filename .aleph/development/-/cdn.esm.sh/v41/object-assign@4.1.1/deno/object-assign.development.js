/* esm.sh - esbuild bundle(object-assign@4.1.1) deno development */ var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target)=>__defProp(target, "__esModule", {
        value: true
    })
;
var __commonJS = (cb, mod)=>()=>(mod || cb((mod = {
            exports: {
            }
        }).exports, mod), mod.exports)
;
var __reExport = (target, module, desc)=>{
    if (module && typeof module === "object" || typeof module === "function") {
        for (let key of __getOwnPropNames(module))if (!__hasOwnProp.call(target, key) && key !== "default") __defProp(target, key, {
            get: ()=>module[key]
            ,
            enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable
        });
    }
    return target;
};
var __toModule = (module)=>{
    return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {
    }, "default", module && module.__esModule && "default" in module ? {
        get: ()=>module.default
        ,
        enumerable: true
    } : {
        value: module,
        enumerable: true
    })), module);
};
// esm-build-b2a2fa4e3a500c75d27fcae198313321cb68190d/node_modules/object-assign/index.js
var require_object_assign = __commonJS((exports, module)=>{
    /*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  */ "use strict";
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
        if (val === null || val === void 0) {
            throw new TypeError("Object.assign cannot be called with null or undefined");
        }
        return Object(val);
    }
    function shouldUseNative() {
        try {
            if (!Object.assign) {
                return false;
            }
            var test1 = new String("abc");
            test1[5] = "de";
            if (Object.getOwnPropertyNames(test1)[0] === "5") {
                return false;
            }
            var test2 = {
            };
            for(var i = 0; i < 10; i++){
                test2["_" + String.fromCharCode(i)] = i;
            }
            var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
                return test2[n];
            });
            if (order2.join("") !== "0123456789") {
                return false;
            }
            var test3 = {
            };
            "abcdefghijklmnopqrst".split("").forEach(function(letter) {
                test3[letter] = letter;
            });
            if (Object.keys(Object.assign({
            }, test3)).join("") !== "abcdefghijklmnopqrst") {
                return false;
            }
            return true;
        } catch (err) {
            return false;
        }
    }
    module.exports = shouldUseNative() ? Object.assign : function(target, source) {
        var from;
        var to = toObject(target);
        var symbols;
        for(var s = 1; s < arguments.length; s++){
            from = Object(arguments[s]);
            for(var key in from){
                if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }
            if (getOwnPropertySymbols) {
                symbols = getOwnPropertySymbols(from);
                for(var i = 0; i < symbols.length; i++){
                    if (propIsEnumerable.call(from, symbols[i])) {
                        to[symbols[i]] = from[symbols[i]];
                    }
                }
            }
        }
        return to;
    };
});
// esm-build-b2a2fa4e3a500c75d27fcae198313321cb68190d/export.js
var import_object_assign = __toModule(require_object_assign());
var export_default = import_object_assign.default;
export { export_default as default };

//# sourceMappingURL=object-assign.development.js.map
export default {
    isString (a) {
        return typeof a === 'string';
    },
    isNEString (a) {
        return typeof a === 'string' && a.length > 0;
    },
    isArray (a) {
        return Array.isArray(a);
    },
    isNEArray (a) {
        return Array.isArray(a) && a.length > 0;
    },
    isPlainObject (a) {
        return typeof a === 'object' && a !== null && !Array.isArray(a) && Object.getPrototypeOf(a) == Object.prototype;
    },
    isFunction (a) {
        return typeof a === 'function';
    },
    isLikelyHttpURL (s) {
        const p = s.slice(0, 8).toLowerCase();
        return p === 'https://' || p.slice(0, 7) === 'http://';
    },
    trimPrefix (s, prefix) {
        if (prefix !== '' && s.startsWith(prefix)) {
            return s.slice(prefix.length);
        }
        return s;
    },
    trimSuffix (s, suffix) {
        if (suffix !== '' && s.endsWith(suffix)) {
            return s.slice(0, -suffix.length);
        }
        return s;
    },
    splitBy (s, searchString) {
        const i = s.indexOf(searchString);
        if (i >= 0) {
            return [
                s.slice(0, i),
                s.slice(i + 1)
            ];
        }
        return [
            s,
            ''
        ];
    },
    btoaUrl (s) {
        return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    },
    atobUrl (b64) {
        const b = b64.length % 4;
        if (b === 3) {
            b64 += '=';
        } else if (b === 2) {
            b64 += '==';
        } else if (b === 1) {
            throw new TypeError('Illegal base64 Url String');
        }
        b64 = b64.replace(/\-/g, '+').replace(/_/g, '/');
        return atob(b64);
    },
    formatBytes (bytes) {
        if (bytes < 1024) {
            return bytes.toString() + 'B';
        }
        if (bytes < 1024 ** 2) {
            return Math.ceil(bytes / 1024) + 'KB';
        }
        if (bytes < 1024 ** 3) {
            return Math.ceil(bytes / 1024 ** 2) + 'MB';
        }
        if (bytes < 1024 ** 4) {
            return Math.ceil(bytes / 1024 ** 3) + 'GB';
        }
        if (bytes < 1024 ** 5) {
            return Math.ceil(bytes / 1024 ** 4) + 'TB';
        }
        return Math.ceil(bytes / 1024 ** 5) + 'PB';
    },
    splitPath (path) {
        return path.split(/[\/\\]+/g).map((p)=>p.trim()
        ).filter((p)=>p !== '' && p !== '.'
        ).reduce((slice, p)=>{
            if (p === '..') {
                slice.pop();
            } else {
                slice.push(p);
            }
            return slice;
        }, []);
    },
    cleanPath (path) {
        return '/' + this.splitPath(path).join('/');
    },
    debounce (callback, delay) {
        let timer = null;
        return (...args)=>{
            if (timer != null) {
                clearTimeout(timer);
            }
            timer = setTimeout(()=>{
                timer = null;
                callback(...args);
            }, delay);
        };
    },
    debounceX (id, callback, delay) {
        const self = this;
        const timers = self.__debounce_timers || (self.__debounce_timers = new Map());
        if (timers.has(id)) {
            clearTimeout(timers.get(id));
        }
        timers.set(id, setTimeout(()=>{
            timers.delete(id);
            callback();
        }, delay));
    }
};

//# sourceMappingURL=util.js.map
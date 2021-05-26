import events from "./events.js";
class Module {
    get url() {
        return this._url;
    }
    constructor(url){
        this._isLocked = false;
        this._isAccepted = false;
        this._acceptCallbacks = [];
        this._url = url;
    }
    lock() {
        this._isLocked = true;
    }
    accept(callback) {
        if (this._isLocked) {
            return;
        }
        if (!this._isAccepted) {
            sendMessage({
                url: this._url,
                type: 'hotAccept'
            });
            this._isAccepted = true;
        }
        if (callback) {
            this._acceptCallbacks.push(callback);
        }
    }
    async applyUpdate(updateUrl) {
        try {
            const module = await import(updateUrl + '?t=' + Date.now());
            this._acceptCallbacks.forEach((cb)=>cb(module)
            );
        } catch (e) {
            location.reload();
        }
    }
}
const modules = new Map();
const state = {
    socket: null,
    messageQueue: []
};
function sendMessage(msg) {
    const json = JSON.stringify(msg);
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
        state.messageQueue.push(json);
    } else {
        state.socket.send(json);
    }
}
export function connect(basePath) {
    const { location  } = window;
    const { protocol , host  } = location;
    const url = (protocol === 'https:' ? 'wss' : 'ws') + '://' + host + basePath.replace(/\/+$/, '') + '/_hmr';
    const ws = new WebSocket(url);
    ws.addEventListener('open', ()=>{
        state.socket = ws;
        state.messageQueue.splice(0, state.messageQueue.length).forEach((msg)=>ws.send(msg)
        );
        console.log('[HMR] listening for file changes...');
    });
    ws.addEventListener('close', ()=>{
        if (state.socket === null) {
            // re-connect
            setTimeout(()=>{
                connect(basePath);
            }, 300);
        } else {
            state.socket = null;
            console.log('[HMR] closed.');
            // reload the page when re-connected
            setInterval(()=>{
                const ws = new WebSocket(url);
                ws.addEventListener('open', ()=>{
                    location.reload();
                });
            }, 300);
        }
    });
    ws.addEventListener('message', ({ data  })=>{
        if (data) {
            try {
                const { type , url , updateUrl , routePath , isIndex , useDeno ,  } = JSON.parse(data);
                switch(type){
                    case 'add':
                        events.emit('add-module', {
                            url,
                            routePath,
                            isIndex,
                            useDeno
                        });
                        break;
                    case 'update':
                        const mod = modules.get(url);
                        if (mod) {
                            mod.applyUpdate(updateUrl);
                        }
                        break;
                    case 'remove':
                        if (modules.has(url)) {
                            modules.delete(url);
                            events.emit('remove-module', url);
                        }
                        break;
                }
                console.log(`[HMR] ${type} module '${url}'`);
            } catch (err) {
                console.warn(err);
            }
        }
    });
}
export function createHotContext(url) {
    if (modules.has(url)) {
        const mod = modules.get(url);
        mod.lock();
        return mod;
    }
    const mod = new Module(url);
    modules.set(url, mod);
    return mod;
}

//# sourceMappingURL=hmr.js.map
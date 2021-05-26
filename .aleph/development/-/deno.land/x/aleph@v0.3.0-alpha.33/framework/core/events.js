// deno-lint-ignore no-explicit-any
function createIterResult(value, done) {
    return {
        value,
        done
    };
}
export let defaultMaxListeners = 10;
/**
 * See also https://nodejs.org/api/events.html
 */ export class EventEmitter {
    static get defaultMaxListeners() {
        return defaultMaxListeners;
    }
    static set defaultMaxListeners(value) {
        defaultMaxListeners = value;
    }
    constructor(){
        this._events = new Map();
    }
    _addListener(eventName, listener, prepend) {
        this.emit("newListener", eventName, listener);
        if (this._events.has(eventName)) {
            const listeners = this._events.get(eventName);
            if (prepend) {
                listeners.unshift(listener);
            } else {
                listeners.push(listener);
            }
        } else {
            this._events.set(eventName, [
                listener
            ]);
        }
        const max = this.getMaxListeners();
        if (max > 0 && this.listenerCount(eventName) > max) {
            const warning = new Error(`Possible EventEmitter memory leak detected.\n         ${this.listenerCount(eventName)} ${eventName.toString()} listeners.\n         Use emitter.setMaxListeners() to increase limit`);
            warning.name = "MaxListenersExceededWarning";
            console.warn(warning);
        }
        return this;
    }
    /** Alias for emitter.on(eventName, listener). */ addListener(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    /**
   * Synchronously calls each of the listeners registered for the event named
   * eventName, in the order they were registered, passing the supplied
   * arguments to each.
   * @return true if the event had listeners, false otherwise
   */ // deno-lint-ignore no-explicit-any
    emit(eventName, ...args) {
        if (this._events.has(eventName)) {
            if (eventName === "error" && this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const listeners = this._events.get(eventName).slice()// We copy with slice() so array is not mutated during emit
            ;
            for (const listener of listeners){
                try {
                    listener.apply(this, args);
                } catch (err) {
                    this.emit("error", err);
                }
            }
            return true;
        } else if (eventName === "error") {
            if (this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const errMsg = args.length > 0 ? args[0] : Error("Unhandled error.");
            throw errMsg;
        }
        return false;
    }
    /**
   * Returns an array listing the events for which the emitter has
   * registered listeners.
   */ eventNames() {
        return Array.from(this._events.keys());
    }
    /**
   * Returns the current max listener value for the EventEmitter which is
   * either set by emitter.setMaxListeners(n) or defaults to
   * EventEmitter.defaultMaxListeners.
   */ getMaxListeners() {
        return this.maxListeners || EventEmitter.defaultMaxListeners;
    }
    /**
   * Returns the number of listeners listening to the event named
   * eventName.
   */ listenerCount(eventName) {
        if (this._events.has(eventName)) {
            return this._events.get(eventName).length;
        } else {
            return 0;
        }
    }
    _listeners(target, eventName, unwrap) {
        if (!target._events.has(eventName)) {
            return [];
        }
        const eventListeners = target._events.get(eventName);
        return unwrap ? this.unwrapListeners(eventListeners) : eventListeners.slice(0);
    }
    unwrapListeners(arr) {
        const unwrappedListeners = new Array(arr.length);
        for(let i = 0; i < arr.length; i++){
            // deno-lint-ignore no-explicit-any
            unwrappedListeners[i] = arr[i]["listener"] || arr[i];
        }
        return unwrappedListeners;
    }
    /** Returns a copy of the array of listeners for the event named eventName.*/ listeners(eventName) {
        return this._listeners(this, eventName, true);
    }
    /**
   * Returns a copy of the array of listeners for the event named eventName,
   * including any wrappers (such as those created by .once()).
   */ rawListeners(eventName) {
        return this._listeners(this, eventName, false);
    }
    /** Alias for emitter.removeListener(). */ off(eventName, listener) {
        return this.removeListener(eventName, listener);
    }
    /**
   * Adds the listener function to the end of the listeners array for the event
   *  named eventName. No checks are made to see if the listener has already
   * been added. Multiple calls passing the same combination of eventName and
   * listener will result in the listener being added, and called, multiple
   * times.
   */ on(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    /**
   * Adds a one-time listener function for the event named eventName. The next
   * time eventName is triggered, this listener is removed and then invoked.
   */ once(eventName, listener) {
        const wrapped = this.onceWrap(eventName, listener);
        this.on(eventName, wrapped);
        return this;
    }
    // Wrapped function that calls EventEmitter.removeListener(eventName, self) on execution.
    onceWrap(eventName, listener) {
        const wrapper = function(// deno-lint-ignore no-explicit-any
        ...args) {
            this.context.removeListener(this.eventName, this.rawListener);
            this.listener.apply(this.context, args);
        };
        const wrapperContext = {
            eventName: eventName,
            listener: listener,
            rawListener: wrapper,
            context: this
        };
        const wrapped = wrapper.bind(wrapperContext);
        wrapperContext.rawListener = wrapped;
        wrapped.listener = listener;
        return wrapped;
    }
    /**
   * Adds the listener function to the beginning of the listeners array for the
   *  event named eventName. No checks are made to see if the listener has
   * already been added. Multiple calls passing the same combination of
   * eventName and listener will result in the listener being added, and
   * called, multiple times.
   */ prependListener(eventName, listener) {
        return this._addListener(eventName, listener, true);
    }
    /**
   * Adds a one-time listener function for the event named eventName to the
   * beginning of the listeners array. The next time eventName is triggered,
   * this listener is removed, and then invoked.
   */ prependOnceListener(eventName, listener) {
        const wrapped = this.onceWrap(eventName, listener);
        this.prependListener(eventName, wrapped);
        return this;
    }
    /** Removes all listeners, or those of the specified eventName. */ removeAllListeners(eventName) {
        if (this._events === undefined) {
            return this;
        }
        if (eventName) {
            if (this._events.has(eventName)) {
                const listeners = this._events.get(eventName).slice()// Create a copy; We use it AFTER it's deleted.
                ;
                this._events.delete(eventName);
                for (const listener of listeners){
                    this.emit("removeListener", eventName, listener);
                }
            }
        } else {
            const eventList = this.eventNames();
            eventList.map((value)=>{
                this.removeAllListeners(value);
            });
        }
        return this;
    }
    /**
   * Removes the specified listener from the listener array for the event
   * named eventName.
   */ removeListener(eventName, listener) {
        if (this._events.has(eventName)) {
            const arr = this._events.get(eventName);
            let listenerIndex = -1;
            for(let i = arr.length - 1; i >= 0; i--){
                // arr[i]["listener"] is the reference to the listener inside a bound 'once' wrapper
                if (arr[i] == listener || arr[i] && arr[i]["listener"] == listener) {
                    listenerIndex = i;
                    break;
                }
            }
            if (listenerIndex >= 0) {
                arr.splice(listenerIndex, 1);
                this.emit("removeListener", eventName, listener);
                if (arr.length === 0) {
                    this._events.delete(eventName);
                }
            }
        }
        return this;
    }
    /**
   * By default EventEmitters will print a warning if more than 10 listeners
   * are added for a particular event. This is a useful default that helps
   * finding memory leaks. Obviously, not all events should be limited to just
   * 10 listeners. The emitter.setMaxListeners() method allows the limit to be
   * modified for this specific EventEmitter instance. The value can be set to
   * Infinity (or 0) to indicate an unlimited number of listeners.
   */ setMaxListeners(n) {
        if (n !== Infinity) {
            if (n === 0) {
                n = Infinity;
            } else {
                if (!Number.isInteger(n)) {
                    throw new Error('The max number of listeners must be an integer');
                }
                if (n < 0) {
                    throw new Error('The max number of listeners must be >= 0');
                }
            }
        }
        this.maxListeners = n;
        return this;
    }
    /**
   * Creates a Promise that is fulfilled when the EventEmitter emits the given
   * event or that is rejected when the EventEmitter emits 'error'. The Promise
   * will resolve with an array of all the arguments emitted to the given event.
   */ static once(emitter, name) {
        return new Promise((resolve, reject)=>{
            if (emitter instanceof EventTarget) {
                // EventTarget does not have `error` event semantics like Node
                // EventEmitters, we do not listen to `error` events here.
                emitter.addEventListener(name, (...args)=>{
                    resolve(args);
                }, {
                    once: true,
                    passive: false,
                    capture: false
                });
                return;
            } else if (emitter instanceof EventEmitter) {
                // deno-lint-ignore no-explicit-any
                const eventListener = (...args)=>{
                    if (errorListener !== undefined) {
                        emitter.removeListener("error", errorListener);
                    }
                    resolve(args);
                };
                let errorListener;
                // Adding an error listener is not optional because
                // if an error is thrown on an event emitter we cannot
                // guarantee that the actual event we are waiting will
                // be fired. The result could be a silent way to create
                // memory or file descriptor leaks, which is something
                // we should avoid.
                if (name !== "error") {
                    // deno-lint-ignore no-explicit-any
                    errorListener = (err)=>{
                        emitter.removeListener(name, eventListener);
                        reject(err);
                    };
                    emitter.once("error", errorListener);
                }
                emitter.once(name, eventListener);
                return;
            }
        });
    }
    /**
   * Returns an AsyncIterator that iterates eventName events. It will throw if
   * the EventEmitter emits 'error'. It removes all listeners when exiting the
   * loop. The value returned by each iteration is an array composed of the
   * emitted event arguments.
   */ static on(emitter, event) {
        // deno-lint-ignore no-explicit-any
        const unconsumedEventValues = [];
        // deno-lint-ignore no-explicit-any
        const unconsumedPromises = [];
        let error = null;
        let finished = false;
        const iterator = {
            // deno-lint-ignore no-explicit-any
            next () {
                // First, we consume all unread events
                // deno-lint-ignore no-explicit-any
                const value = unconsumedEventValues.shift();
                if (value) {
                    return Promise.resolve(createIterResult(value, false));
                }
                // Then we error, if an error happened
                // This happens one time if at all, because after 'error'
                // we stop listening
                if (error) {
                    const p = Promise.reject(error);
                    // Only the first element errors
                    error = null;
                    return p;
                }
                // If the iterator is finished, resolve to done
                if (finished) {
                    return Promise.resolve(createIterResult(undefined, true));
                }
                // Wait until an event happens
                return new Promise(function(resolve, reject) {
                    unconsumedPromises.push({
                        resolve,
                        reject
                    });
                });
            },
            // deno-lint-ignore no-explicit-any
            return () {
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
                finished = true;
                for (const promise of unconsumedPromises){
                    promise.resolve(createIterResult(undefined, true));
                }
                return Promise.resolve(createIterResult(undefined, true));
            },
            throw (err) {
                error = err;
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
            },
            // deno-lint-ignore no-explicit-any
            [Symbol.asyncIterator] () {
                return this;
            }
        };
        emitter.on(event, eventHandler);
        emitter.on("error", errorHandler);
        return iterator;
        // deno-lint-ignore no-explicit-any
        function eventHandler(...args) {
            const promise = unconsumedPromises.shift();
            if (promise) {
                promise.resolve(createIterResult(args, false));
            } else {
                unconsumedEventValues.push(args);
            }
        }
        // deno-lint-ignore no-explicit-any
        function errorHandler(err) {
            finished = true;
            const toError = unconsumedPromises.shift();
            if (toError) {
                toError.reject(err);
            } else {
                // The next time we call next()
                error = err;
            }
            iterator.return();
        }
    }
}
EventEmitter.captureRejectionSymbol = Symbol.for("nodejs.rejection");
EventEmitter.errorMonitor = Symbol("events.errorMonitor");
export const once = EventEmitter.once;
export const on = EventEmitter.on;
export const captureRejectionSymbol = EventEmitter.captureRejectionSymbol;
export const errorMonitor = EventEmitter.errorMonitor;
const events = new EventEmitter();
events.setMaxListeners(1 << 10); // 1024
export default events;

//# sourceMappingURL=events.js.map
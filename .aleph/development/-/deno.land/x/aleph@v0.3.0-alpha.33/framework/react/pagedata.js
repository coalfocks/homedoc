import util from "../../shared/util.js";
const global = window;
export async function loadPageData(url) {
    const href = url.toString();
    const pagedataUrl = 'pagedata://' + href;
    if (pagedataUrl in global) {
        const { expires , keys  } = global[pagedataUrl];
        if (expires === 0 || Date.now() < expires) {
            return;
        }
        delete global[pagedataUrl];
        keys.forEach((key)=>{
            delete global[`${pagedataUrl}#${key}`];
        });
    }
    const basePath = util.trimSuffix(url.basePath, '/');
    const dataUrl = `${basePath}/_aleph/data/${util.btoaUrl(href)}.json`;
    const data = await (await fetch(dataUrl)).json();
    if (util.isPlainObject(data)) {
        storeData(data, href);
    }
}
export async function loadPageDataFromTag(url) {
    const href = url.toString();
    const ssrDataEl = global.document.getElementById('ssr-data');
    if (ssrDataEl) {
        try {
            const ssrData = JSON.parse(ssrDataEl.innerText);
            if (util.isPlainObject(ssrData)) {
                storeData(ssrData, href);
                return;
            }
        } catch (e) {
        }
    }
    await loadPageData(url);
}
function storeData(data, href) {
    let expires = 0;
    for(const key in data){
        const { expires: _expires  } = data[key];
        if (expires === 0 || _expires > 0 && _expires < expires) {
            expires = _expires;
        }
        global[`pagedata://${href}#${key}`] = data[key];
    }
    global[`pagedata://${href}`] = {
        expires,
        keys: Object.keys(data)
    };
}

//# sourceMappingURL=pagedata.js.map
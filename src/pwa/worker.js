/* globals importScripts, localforage */

importScripts('lib/localforage.js');

const cacheName = 'RandoplanCache_v1';
const indexed_db_app_name = 'RandoplanPOST_DB';
const indexed_db_table_name = 'RandoplanPOST_Cache';
let postCache;

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');

    postCache = localforage.createInstance({
        name: indexed_db_app_name,
        storeName: indexed_db_table_name
    });
    console.info('creating Cache');
    event.waitUntil(caches.open(cacheName).then((cache) => {
        // `Cache` instance for later use.
        return cache.addAll([
            '/static/main.css',
            '/static/main.bundle.js',
            'static/favicon.ico',
            'static/manifest.json'
        ]);
    }));
});

self.addEventListener('activate', (e) => {
    console.info('deleting old caches');
    e.waitUntil(caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key === cacheName) { return null; }
        return caches.delete(key);
      }))
    }));
  });

const serializeHeaders = (headers) => {
    var serialized = {};
    // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
    // notation as well and this is the only way of retrieving all the headers.
    for (var entry of headers.entries()) {
        serialized[entry[0]] = entry[1];
    }
    return serialized;
}

// Serialize is a little bit convolved due to headers is not a simple object.
const serialize = (request) => {
    // var headers = {};
    // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
    // notation as well and this is the only way of retrieving all the headers.
    // for (var entry of request.headers.entries()) {
    //     headers[entry[0]] = entry[1];
    // }
    var serialized = {
        url: request.url,
        // headers: headers,
        method: request.method,
        // mode: request.mode,
        credentials: request.credentials,
        // cache: request.cache,
        // redirect: request.redirect,
        referrer: request.referrer
    };

    // Only if method is not `GET` or `HEAD` is the request allowed to have body.
/*     if (request.method !== 'GET' && request.method !== 'HEAD') {
        return request.clone().text().then(function (body) {
            serialized.body = body;
            return Promise.resolve(serialized);
        });
    }
 */    return Promise.resolve(serialized);
}

/**
 * Serializes a Response into a plain JS object
 *
 * @param {Response} response object
 * @returns {Promise} Promise yielding a Response
 */
 const serializeResponse = (response) => {
    var serialized = {
      headers: serializeHeaders(response.headers),
      status: response.status,
      statusText: response.statusText
    };

    return response.clone().text().then(function(body) {
        serialized.body = body;
        return Promise.resolve(serialized);
    });
}

/**
 * Creates a Response from it's serialized version
 *
 * @param {data} data is serialized Response
 * @returns {Promise} Promise resolving to a Response
 */
 const deserializeResponse = (data) => {
    return Promise.resolve(new Response(data.body, data));
}

const getAndCacheGET = async (request) => {
    const cache = await caches.open(cacheName);
    const url = request.url;
    let response = await fetch(request).catch(() => console.warn(`Could not GET, will try cache for ${url}`));
    if (response !== undefined) {
        console.info(`inserting item into cache with key ${url}`, response);
        cache.put(url, response.clone());
        return response;
    } else {
        // If the network is unavailable, get
        let cachedResponse = await cache.match(url);
        if (cachedResponse === undefined) {
            // try while ignoring query parameters if /
            if (url.startsWith("/?")) {
                cachedResponse = await cache.match(url, {ignoreSearch:true});
            }
            if (cachedResponse == undefined) {
                console.warn(`No matching cache entry for GET for ${url}`);
                return new Response('', {status: 503, statusText: 'Service Unavailable'});
            }
        }
        return cachedResponse;
    }
}

const getAndCachePOST = async (request) => {
    // First try to fetch the request from the server
    const response = await fetch(request.clone()).catch(() => console.warn("Could not POST, will try cache"));
    if (response !== undefined && response.ok) {
        // If it works, put the response into IndexedDB
        const cacheKey = JSON.stringify(await serialize(request));
        if (postCache !== undefined) {
            postCache.setItem(cacheKey, serializeResponse(response.clone()));
        } else {
            postCache = localforage.createInstance({
                name: indexed_db_app_name,
                storeName: indexed_db_table_name
            });
            postCache.setItem(cacheKey, serializeResponse(response.clone()));
        }
        return response;
    } else {
        // If it does not work, return the cached response. If the cache does not
        // contain a response for our request, it will give us a 503-response
        const cacheKey = JSON.stringify(await serialize(request));
        // don't know how this could happen, but evidently it can
        if (postCache === undefined) {
            postCache = localforage.createInstance({
                name: indexed_db_app_name,
                storeName: indexed_db_table_name
            });
        }
        let cachedResponse = await postCache.getItem(cacheKey);
        if (!cachedResponse) {
            console.warn('Returning 503 for POST');
            return response;
        }
        return deserializeResponse(cachedResponse);
    }
}

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (!url.startsWith(self.location.origin) &&
        !url.startsWith("https://maps.googleaapis.com") && !url.startsWith("https://maps.googleapis.com/maps/api/js") &&
        !url.startsWith("https://fonts.gstatic.com") && !url.startsWith("https://maps.googleapis.com/maps/api/timezone") &&
        !url.includes('/rwgps_route')
    ) {
        console.log(`returning and not handling url ${url}`)
        return;
    }
    // we don't need to cache the pinned routes, the intent of caching is to preserve completed forecasts
    if (url.includes('/pinned_routes')) {
        return
    }
    // console.log(`responding to event for ${url} with method ${event.request.method}`);

    // Open the cache
    if (event.request.method === "POST") {
        event.respondWith(getAndCachePOST(event.request));
    } else {
        event.respondWith(getAndCacheGET(event.request));
    }
}
);

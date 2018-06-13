var staticCacheName = 'wittr-static-v1';
var contentImgsCache = 'wittr-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'restaurant.html',
        'manifest.json',
        'favicon.ico',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'js/indexController.js',
        'css/styles_small.css',
        'css/styles_medium.css',
        'css/styles_large.css',
        'data/restaurants.json',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2'
      ]);
    }).catch(function(error) {
      console.log(error); // "oh, no!"
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('wittr-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);
/*
  if (requestUrl.origin === location.origin) {
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
      console.log(event.request);
      console.log("fetch error - only-if-cached");
      return;
    }
    return fetch(event.request).catch(function (error) {
      console.log(error);
      console.log(event.request);
      console.log("fetch error");
    })
  }
*/
  event.respondWith(serveStatic(event.request));
  return;
});

function serveStatic(request) {
  var storageUrl = request.url;
/*
  storageUrl = storageUrl.replace(/&token=.*$/, '');
  storageUrl = storageUrl.replace(/&callback=.*$/, '');
  if (request.url.includes('QuotaService.RecordEvent')) {
    storageUrl = storageUrl.replace(/\?.*$/, '');
  }
*/
  return caches.open(staticCacheName).then(function (cache) {
    return cache.match(storageUrl).then(function (response) {
      if (response) return response;

      return fetch(request).then(function (networkResponse) {
        //console.log(request.url);
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      }).catch(function () {
        console.log(request.url);
        console.log("error");
      });
    });
  });
}

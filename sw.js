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
        'img/1-270x248.jpg',
        'img/2-270x248.jpg',
        'img/3-270x248.jpg',
        'img/4-270x248.jpg',
        'img/5-270x248.jpg',
        'img/6-270x248.jpg',
        'img/7-270x248.jpg',
        'img/8-270x248.jpg',
        'img/9-270x248.jpg',
        'img/10-270x248.jpg'
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
  // console.log(event.request.url);

  // http://localhost:1337/reviews/?restaurant_id=1
  // http://localhost:1337/restaurants/
  if (event.request.url.includes("/restaurants/") || event.request.url.includes("/reviews/")) {
    console.log(event.request.url);
    // console.log('no cache');
    event.respondWith(fetch(event.request, {cache: "no-store"}));
    return
  }
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
  // http://localhost:8000/restaurant.html?id=2
  storageUrl = storageUrl.replace(/\?.*$/, '');
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

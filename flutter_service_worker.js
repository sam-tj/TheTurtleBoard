'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "1index.html": "32e5c98a8fa1571768379096192d64f7",
"app.js": "53080734beb0817192694dca79080a47",
"assets/AssetManifest.json": "8e471e41b55c267ccfe354cf82c39229",
"assets/FontManifest.json": "af0f5aacc8cac1cb72b866ecf42a712c",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/fonts/Pacifico-Regular.ttf": "c1a28478f7a0cc5e25bb395d0543274d",
"assets/images/1drawerBack.jpg": "f9de7ae1f11a2853164d3d55356c9257",
"assets/images/2drawerBack.jpg": "62727359dfc204c01e9a71904723bad9",
"assets/images/defaultBoard.png": "603a946ecf8a762b08e2da118bdcb923",
"assets/images/drawerBack.jpg": "67e0d3e2add89afbdfccf6b585fef393",
"assets/images/em18Con.png": "bf5b3168eeef9991ee35869091fb1521",
"assets/images/ENlcdCon.png": "185293a4f6c67af1c2938ebfbbe6a4e5",
"assets/images/image.svg": "b4437fab94c7f2bde7f03e597e5ad550",
"assets/images/keyCon.png": "10e5556c9233d81359c2a37b9ad8dac1",
"assets/images/lcdCon.png": "952fbfa4803a08ca294216b9bc383901",
"assets/images/logo.png": "cc3beaa98d725e635d2f14e4e5af52f9",
"assets/images/ripple.svg": "fbb941d62e29087e2d63f5c55dc62d21",
"assets/images/sw_push.svg": "9a6ffa7cbf845f22d82c869468ec348f",
"assets/images/sw_release.svg": "faf608eefb292f3b41b9d51758353096",
"assets/NOTICES": "b936cd6971a155f31388b8504635552f",
"assets/res/checkedMeOut.txt": "e4da3b7fbbce2345d7772b0674a318d5",
"assets/res/C_stock_data.csv": "0a47ea758097909033088daa3714bc9a",
"assets/sound/buzzer.wav": "736c2084f87e20d53705726444e1f918",
"favicon.png": "8db3069bf59878a2a108e75415a59c6e",
"icons/Icon-192.png": "24fe1aff79e5665788273117e380db74",
"icons/Icon-512.png": "e29c900e56d1ac9487d98e0f1fbe2cb1",
"index.html": "27733777d4fa8019cead7fc629f76a84",
"/": "27733777d4fa8019cead7fc629f76a84",
"loading.webp": "0dfec5c79f256500cf23980c3c19f70a",
"main.dart.js": "68c06ad119fdcd2b098f3e91592e7322",
"manifest.json": "c8c2cf264c11103dff49482eb5bc5e54"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a no-cache param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'no-cache'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'no-cache'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message === 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

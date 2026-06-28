const CACHE_NAME = 'atlas-medical-v1';
const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './src/main.js',
  './src/modules/scene.js',
  './src/modules/loader.js',
  './src/modules/interaction.js',
  './src/modules/interaction_extended.js',
  './src/modules/groupManager.js',
  './src/modules/quiz.js',
  './src/modules/tourManager.js',
  './src/modules/displayNames.js',
  './src/modules/anatomyColors.js',
  
  // Încarcă CDN-urile Three.js (pentru offline)
  'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/DRACOLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js',
  'https://www.gstatic.com/draco/v1/decoders/draco_decoder.wasm',
  'https://www.gstatic.com/draco/v1/decoders/draco_decoder.js',
  
  // Fișiere de date (pentru ca fișele și numele să fie offline)
  './data/config.json',
  './data/displayNames/skeletal.json',
  './data/displayNames/muscular.json',
  './data/displayNames/nervous.json',
  './data/displayNames/arterial.json',
  './data/displayNames/venous.json',
  './data/displayNames/visceral.json',
  './data/displayNames/joints.json',
  './data/displayNames/integumentary.json',
  './models/Startup.glb'
];

// Instalare și cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Se salvează fișierele în cache pentru offline...');
      return cache.addAll(CACHE_URLS);
    })
  );
});

// Activare și curățare cache vechi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Se șterge cache-ul vechi:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Interceptare cereri de rețea (pentru offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Dacă avem în cache, returnăm direct
      if (cachedResponse) {
        return cachedResponse;
      }
      // Dacă nu, facem cererea pe rețea și o salvăm pentru data viitoare
      return fetch(event.request).then((networkResponse) => {
        // Doar dacă răspunsul e valid, îl punem în cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
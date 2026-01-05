// Background Rotator
// Tries to load image list from /src/images.json; falls back to parsing directory listing
// or attempting numbered filenames. Preloads images and rotates the `#backgroundImage` element.

(function () {
  const bgEl = document.getElementById('backgroundImage');
  if (!bgEl) return;

  const CONFIG = {
    // Use a relative path so `index.html` can be opened via file:// or served from any base path
    path: 'src/',
    manifest: 'images.json',
    interval: 8000, // ms
    maxAutoDetect: 20 // try image1..image20 if no manifest
  };

  const FADE_MS = 1800;

  function setBackground(url) {
    // Fade the new image in above the current one to avoid blank frames
    const next = bgEl.cloneNode();
    next.src = url;
    next.classList.add('bg-layer', 'bg-fade-in');
    next.style.opacity = '0';
    bgEl.parentElement.appendChild(next);

    next.addEventListener('load', () => {
      requestAnimationFrame(() => {
        next.classList.add('bg-fade-in-active');
        setTimeout(() => {
          bgEl.src = url;
          next.remove();
        }, FADE_MS);
      });
    });
  }

  function preload(url) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res({url, ok:true});
      img.onerror = () => res({url, ok:false});
      img.src = url;
    });
  }

  async function tryFetchManifest() {
    try {
      const res = await fetch(CONFIG.path + CONFIG.manifest, {cache: 'no-cache'});
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      return data.map(p => (p.startsWith('http') ? p : CONFIG.path + p));
    } catch (e) {
      return null;
    }
  }

  async function tryDirectoryListing() {
    try {
      const res = await fetch(CONFIG.path, {cache: 'no-cache'});
      if (!res.ok) return null;
      const text = await res.text();
      // very small parser: look for hrefs to images
      const matches = Array.from(text.matchAll(/href="([^"]+\.(png|jpe?g|webp|gif))"/gi));
      if (!matches.length) return null;
      const names = matches.map(m => m[1]);
      return names.map(n => (n.startsWith('http') ? n : CONFIG.path + n));
    } catch (e) {
      return null;
    }
  }

  async function tryNumbered() {
    const candidates = [];
    for (let i = 1; i <= CONFIG.maxAutoDetect; i++) {
      candidates.push(`${CONFIG.path}image${i}.jpg`);
      candidates.push(`${CONFIG.path}image${i}.png`);
      candidates.push(`${CONFIG.path}image${i}.webp`);
    }
    // test in parallel but limit results to ones that succeed
    const results = await Promise.all(candidates.map(preload));
    return results.filter(r => r.ok).map(r => r.url);
  }

  function resolveUrl(url) {
    return new URL(url, window.location.href).href;
  }

  async function findImages() {
    let imgs = await tryFetchManifest();
    if (imgs && imgs.length) return imgs;
    imgs = await tryDirectoryListing();
    if (imgs && imgs.length) return imgs;
    imgs = await tryNumbered();
    if (imgs && imgs.length) return imgs;
    return [];
  }

  async function init() {
    const images = await findImages();
    if (!images.length) {
      // nothing found; keep the default image
      console.warn('Background rotator: no images found in /src. See README for instructions.');
      return;
    }

    // Preload all images
    const good = [];
    for (const url of images) {
      const r = await preload(url);
      if (r.ok) good.push(r.url);
    }
    if (!good.length) return;

    let idx = good.findIndex((url) => resolveUrl(url) === bgEl.src);
    if (idx < 0) {
      idx = 0;
      bgEl.src = good[0];
    }

    setInterval(() => {
      idx = (idx + 1) % good.length;
      setBackground(good[idx]);
    }, CONFIG.interval);
  }

  // run on DOMContentLoaded if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

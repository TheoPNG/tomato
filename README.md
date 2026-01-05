# Background rotator (Tomato Website)

This project adds a large full-page background that automatically rotates through images placed in the `/src` folder.

How it finds images (in order):

- If `/src/images.json` exists and contains a JSON array of image filenames (or full URLs), those are used. Example:

```json
["hero1.jpg", "photos/hero2.png", "https://example.com/external.jpg"]
```

- If no manifest exists, the script will try to fetch `/src/` and parse a directory listing (works if the server returns anchor links).
- If that fails, the script tries numbered filenames in `/src`: `image1.jpg`, `image1.png`, `image1.webp`, `image2.jpg`, ... up to `image20.*`.

How to add your own images:

- Create a folder `src` at the project root and add images inside it, e.g. `/src/hero1.jpg`.
- (Optional) Create `/src/images.json` to explicitly list filenames in the order you want them to appear.

Layout and behavior:

- The script `background-rotator.js` will preload images and rotate the background every 8 seconds.
- The `#bg` element occupies the full viewport and the site header/content appear above it.

Notes:

- Static file servers may or may not expose directory listings; for reliable results create an `images.json` manifest.
- If you'd like tighter control (different interval, transitions), open `background-rotator.js` and edit `CONFIG.interval`.

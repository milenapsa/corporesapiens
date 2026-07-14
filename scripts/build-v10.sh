#!/bin/sh
set -eu

ROOT="${1:-.}"
OUT="${2:-$ROOT/dist-v10}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

rm -rf "$OUT"
mkdir -p "$OUT/assets"

gzip -dc "$ROOT/dist/app-core.js.gz" > "$TMP/app-core.js"
gzip -dc "$ROOT/dist/app-smart.js.gz" > "$TMP/app-smart.js"
gzip -dc "$ROOT/dist/app-v03.js.gz" > "$TMP/app-v03.js"
gzip -dc "$ROOT/dist/styles.css.gz" > "$TMP/styles.css"
gzip -dc "$ROOT/dist/styles-v03.css.gz" > "$TMP/styles-v03.css"
gzip -dc "$ROOT/dist/index.html.gz" > "$TMP/index.html"

for f in manifest.webmanifest privacy.html terms.html comprar.html comece.html corporesapiens-og.png; do
  test -s "$ROOT/$f"
  cp "$ROOT/$f" "$OUT/$f"
done

: > "$OUT/app-v10.js"
for f in "$TMP/app-core.js" "$TMP/app-smart.js" "$TMP/app-v03.js" \
  "$ROOT/app-v04.js" "$ROOT/app-v05.js" "$ROOT/app-v06.js" \
  "$ROOT/app-v07.js" "$ROOT/app-v08.js" "$ROOT/app-v09.js"; do
  test -s "$f"
  printf '\n/* ===== %s ===== */\n' "$(basename "$f")" >> "$OUT/app-v10.js"
  cat "$f" >> "$OUT/app-v10.js"
  printf '\n' >> "$OUT/app-v10.js"
done

: > "$OUT/styles-v10.css"
for f in "$TMP/styles.css" "$TMP/styles-v03.css" \
  "$ROOT/styles-v04.css" "$ROOT/styles-v05.css" "$ROOT/styles-v06.css" \
  "$ROOT/styles-v07.css" "$ROOT/styles-v08.css" "$ROOT/styles-v09.css"; do
  test -s "$f"
  printf '\n/* ===== %s ===== */\n' "$(basename "$f")" >> "$OUT/styles-v10.css"
  cat "$f" >> "$OUT/styles-v10.css"
  printf '\n' >> "$OUT/styles-v10.css"
done

node --check "$OUT/app-v10.js"

awk '
  /<link rel="stylesheet" href="styles\.css">/ {
    print "  <link rel=\"stylesheet\" href=\"styles-v10.css\">"
    next
  }
  /<link rel="stylesheet" href="styles-v0[3-9]\.css">/ { next }
  /<script src="app-core\.js"><\/script>/ {
    print "  <script src=\"app-v10.js\"></script>"
    next
  }
  /<script src="app-smart\.js"><\/script>/ { next }
  /<script src="app-v0[3-9]\.js"><\/script>/ { next }
  /rel="icon"/ || /rel="apple-touch-icon"/ || /name="theme-color"/ { next }
  /<\/head>/ {
    print "  <link rel=\"icon\" href=\"./favicon.ico\" sizes=\"any\">"
    print "  <link rel=\"apple-touch-icon\" href=\"./assets/apple-touch-icon.png\">"
    print "  <meta name=\"theme-color\" content=\"#111113\">"
  }
  { print }
' "$TMP/index.html" > "$OUT/index.html"

sed -i -E 's/Corporesapiens 0\.[0-9]+/Corporesapiens 1.0/g' "$OUT/index.html"

if ! grep -q 'privacy.html' "$OUT/index.html"; then
  sed -i 's#</body>#<footer style="padding:18px;text-align:center;font-size:.85rem"><a href="privacy.html">Privacidade</a> · <a href="terms.html">Termos de uso</a></footer>\n</body>#' "$OUT/index.html"
fi

MASTER="$ROOT/assets/corporesapiens-icon-offwhite-512-v2.png"
test -s "$MASTER"
cp "$MASTER" "$OUT/assets/corporesapiens-icon-512.png"

if command -v magick >/dev/null 2>&1; then
  magick "$MASTER" -resize 192x192 "$OUT/assets/corporesapiens-icon-192.png"
  magick "$MASTER" -resize 180x180 "$OUT/assets/apple-touch-icon.png"
  magick "$MASTER" -define icon:auto-resize=16,32,48,64,128,256 "$OUT/favicon.ico"
elif command -v convert >/dev/null 2>&1; then
  convert "$MASTER" -resize 192x192 "$OUT/assets/corporesapiens-icon-192.png"
  convert "$MASTER" -resize 180x180 "$OUT/assets/apple-touch-icon.png"
  convert "$MASTER" -define icon:auto-resize=16,32,48,64,128,256 "$OUT/favicon.ico"
else
  echo "ImageMagick is required to generate install icons" >&2
  exit 1
fi

cat > "$OUT/sw.js" <<'EOF'
const CACHE_NAME = 'corporesapiens-v1.0.1-brand-v2';
const ASSETS = [
  './',
  './index.html',
  './styles-v10.css',
  './app-v10.js',
  './manifest.webmanifest',
  './favicon.ico',
  './assets/apple-touch-icon.png',
  './assets/corporesapiens-icon-192.png',
  './assets/corporesapiens-icon-512.png',
  './privacy.html',
  './terms.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
EOF

grep -q 'app-v10.js' "$OUT/index.html"
grep -q 'styles-v10.css' "$OUT/index.html"
grep -q 'apple-touch-icon.png' "$OUT/index.html"
grep -q 'corporesapiens-icon-512.png' "$OUT/manifest.webmanifest"
grep -q 'corporesapiens-v1.0.1-brand-v2' "$OUT/sw.js"
test -s "$OUT/favicon.ico"
test -s "$OUT/assets/corporesapiens-icon-192.png"
test -s "$OUT/assets/corporesapiens-icon-512.png"
test -s "$OUT/assets/apple-touch-icon.png"

(
  cd "$OUT"
  sha256sum \
    index.html app-v10.js styles-v10.css manifest.webmanifest sw.js favicon.ico \
    comprar.html comece.html terms.html privacy.html corporesapiens-og.png \
    assets/apple-touch-icon.png assets/corporesapiens-icon-192.png \
    assets/corporesapiens-icon-512.png > PRODUCTION_SHA256SUMS.txt
)

echo BUILD_V10_BRAND_V2_OK

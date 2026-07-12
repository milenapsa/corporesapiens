#!/bin/sh
set -eu

ROOT="${1:-.}"
OUT="${2:-$ROOT/dist-v10}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

rm -rf "$OUT"
mkdir -p "$OUT"

gzip -dc "$ROOT/dist/app-core.js.gz" > "$TMP/app-core.js"
gzip -dc "$ROOT/dist/app-smart.js.gz" > "$TMP/app-smart.js"
gzip -dc "$ROOT/dist/app-v03.js.gz" > "$TMP/app-v03.js"
gzip -dc "$ROOT/dist/styles.css.gz" > "$TMP/styles.css"
gzip -dc "$ROOT/dist/styles-v03.css.gz" > "$TMP/styles-v03.css"
gzip -dc "$ROOT/dist/index.html.gz" > "$TMP/index.html"
gzip -dc "$ROOT/dist/icon.svg.gz" > "$OUT/icon.svg"

for f in manifest.webmanifest privacy.html terms.html; do
  test -s "$ROOT/$f"
  cp "$ROOT/$f" "$OUT/$f"
done

: > "$OUT/app-v10.js"
for f in "$TMP/app-core.js" "$TMP/app-smart.js" "$TMP/app-v03.js" \
  "$ROOT/app-v04.js" "$ROOT/app-v05.js" "$ROOT/app-v06.js" \
  "$ROOT/app-v07.js" "$ROOT/app-v08.js" "$ROOT/app-v09.js"; do
  test -s "$f"
  printf '\n/* ==== %s ==== */\n' "$(basename "$f")" >> "$OUT/app-v10.js"
  cat "$f" >> "$OUT/app-v10.js"
  printf '\n' >> "$OUT/app-v10.js"
done

: > "$OUT/styles-v10.css"
for f in "$TMP/styles.css" "$TMP/styles-v03.css" \
  "$ROOT/styles-v04.css" "$ROOT/styles-v05.css" "$ROOT/styles-v06.css" \
  "$ROOT/styles-v07.css" "$ROOT/styles-v08.css" "$ROOT/styles-v09.css"; do
  test -s "$f"
  printf '\n/* ==== %s ==== */\n' "$(basename "$f")" >> "$OUT/styles-v10.css"
  cat "$f" >> "$OUT/styles-v10.css"
  printf '\n' >> "$OUT/styles-v10.css"
done

node --check "$OUT/app-v10.js"

awk '
  /<link rel="stylesheet" href="styles\.css">/ {print "  <link rel=\"stylesheet\" href=\"styles-v10.css\">"; next}
  /<link rel="stylesheet" href="styles-v0[3-9]\.css">/ {next}
  /<script src="app-core\.js"><\/script>/ {print "  <script src=\"app-v10.js\"></script>"; next}
  /<script src="app-smart\.js"><\/script>/ {next}
  /<script src="app-v0[3-9]\.js"><\/script>/ {next}
  {print}
' "$TMP/index.html" > "$OUT/index.html"

sed -i -E 's/Corporesapiens 0\.[0-9]+/Corporesapiens 1.0/g' "$OUT/index.html"
if ! grep -q 'privacy.html' "$OUT/index.html"; then
  sed -i 's#</body>#<footer style="padding:18px;text-align:center;font-size:.85rem"><a href="privacy.html">Privacidade</a> · <a href="terms.html">Termos de uso</a></footer>\n</body>#' "$OUT/index.html"
fi

cat > "$OUT/sw.js" <<'EOF'
const CACHE="corporesapiens-v1.0.0";
const ASSETS=["./","./index.html","./styles-v10.css","./app-v10.js","./manifest.webmanifest","./icon.svg","./privacy.html","./terms.html"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match("./index.html"))))});
EOF

grep -q 'app-v10.js' "$OUT/index.html"
grep -q 'styles-v10.css' "$OUT/index.html"
grep -q 'corporesapiens-v1.0.0' "$OUT/sw.js"
grep -q 'privacy.html' "$OUT/sw.js"
grep -q 'terms.html' "$OUT/sw.js"

echo BUILD_V10_OK

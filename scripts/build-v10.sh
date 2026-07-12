#!/bin/sh
set -eu

ROOT="${1:-.}"
OUT="${2:-$ROOT/dist-v10}"

rm -rf "$OUT"
mkdir -p "$OUT"

for f in index.html manifest.webmanifest icon.svg privacy.html terms.html; do
  if [ -f "$ROOT/$f" ]; then
    cp "$ROOT/$f" "$OUT/$f"
  fi
done

: > "$OUT/app-v10.js"
for f in app-core.js app-smart.js app-v03.js app-v04.js app-v05.js app-v06.js app-v07.js app-v08.js app-v09.js; do
  test -s "$ROOT/$f"
  printf '\n/* ==== %s ==== */\n' "$f" >> "$OUT/app-v10.js"
  cat "$ROOT/$f" >> "$OUT/app-v10.js"
  printf '\n' >> "$OUT/app-v10.js"
done

: > "$OUT/styles-v10.css"
for f in styles.css styles-v03.css styles-v04.css styles-v05.css styles-v06.css styles-v07.css styles-v08.css styles-v09.css; do
  test -s "$ROOT/$f"
  printf '\n/* ==== %s ==== */\n' "$f" >> "$OUT/styles-v10.css"
  cat "$ROOT/$f" >> "$OUT/styles-v10.css"
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
' "$ROOT/index.html" > "$OUT/index.html.tmp"

mv "$OUT/index.html.tmp" "$OUT/index.html"
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
grep -q '"./app-v10.js"' "$OUT/sw.js"
grep -q '"./styles-v10.css"' "$OUT/sw.js"

echo "BUILD_V10_OK"

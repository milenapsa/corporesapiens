#!/bin/sh
set -eu

ROOT="${1:-.}"
OUT="${2:-$ROOT/dist-v10}"
rm -rf "$OUT"
mkdir -p "$OUT"
cp -a "$ROOT"/. "$OUT"/

: > "$OUT/app-v10.js"
for f in app-core.js app-smart.js app-v03.js app-v04.js app-v05.js app-v06.js app-v07.js app-v08.js app-v09.js; do
  printf '\n/* ==== %s ==== */\n' "$f" >> "$OUT/app-v10.js"
  cat "$ROOT/$f" >> "$OUT/app-v10.js"
  printf '\n' >> "$OUT/app-v10.js"
done

: > "$OUT/styles-v10.css"
for f in styles.css styles-v03.css styles-v04.css styles-v05.css styles-v06.css styles-v07.css styles-v08.css styles-v09.css; do
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
' "$ROOT/index.html" > "$OUT/index.html"

sed -i -E 's/Corporesapiens 0\.[0-9]+/Corporesapiens 1.0/g' "$OUT/index.html"
cp "$ROOT/sw.js" "$OUT/sw.js"
sed -i -E 's/corporesapiens-v0\.[0-9]+\.0/corporesapiens-v1.0.0/g' "$OUT/sw.js"
sed -i 's#"app-core.js"#"app-v10.js","styles-v10.css"#' "$OUT/sw.js"
sed -i '/"app-smart.js"/d;/"app-v0[3-9]\.js"/d;/"styles-v0[3-9]\.css"/d' "$OUT/sw.js"

grep -q 'app-v10.js' "$OUT/index.html"
grep -q 'styles-v10.css' "$OUT/index.html"
grep -q 'corporesapiens-v1.0.0' "$OUT/sw.js"

echo "BUILD_V10_OK"

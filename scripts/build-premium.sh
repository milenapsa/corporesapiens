#!/bin/sh
set -eu

ROOT="${1:-.}"
OUT="${2:-$ROOT/dist-premium}"

"$ROOT/scripts/build-v10.sh" "$ROOT" "$OUT"

cat "$ROOT/styles-v10.css" >> "$OUT/styles-v10.css"

grep -q '--bg-deep: #0b100f' "$OUT/styles-v10.css"
grep -q 'corporesapiens-icon-512.png' "$OUT/styles-v10.css"
test -s "$OUT/assets/corporesapiens-icon-512.png"

echo CORPORESAPIENS_PREMIUM_BUILD_OK

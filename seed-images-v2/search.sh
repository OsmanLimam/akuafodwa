#!/bin/bash
# AkuafoDwa V2 seed image sourcing (stdout variant, -o flag is broken in current CLI)
cd /home/z/my-project/seed-images-v2

QUERIES=(
"yam|pile of fresh yam tubers white yam whole"
"cassava|fresh cassava roots bundle harvested"
"sweet-potato|fresh orange flesh sweet potatoes pile"
"cocoyam|fresh cocoyam taro roots pile"
"maize|dried white maize grains in sack"
"rice|milled white rice grains in sack"
"beans|dried red kidney beans in sack"
"groundnut|fresh groundnuts in shells unshelled pile"
"tomato|fresh ripe red tomatoes in wooden crate"
"pepper|fresh red chili peppers heap at market"
"okra|fresh green okra pods in basket"
"garden-eggs|fresh green garden eggs african eggplant in basket"
"onion|red onions in bag bulk storage"
"cabbage|fresh green cabbage heads whole"
"pineapple|fresh smooth cayenne pineapples whole fruits"
"mango|ripe mangoes in small crate"
"banana|fresh green bananas bunch on stem"
"papaya|fresh papaya fruit whole pile"
"orange|fresh sweet oranges in mesh bag"
"plantain|bunch of green plantains whole"
"cocoa|dried cocoa beans heap"
"cashew|raw cashew nuts with shells pile"
"chicken|live white broiler chickens on farm"
"eggs|fresh brown eggs in tray crate"
"guinea-fowl|live guinea fowl birds"
"goat|live west african dwarf goat"
"sheep|live djallonke sheep west african"
"pig|live pig on farm standing"
"tilapia|fresh whole tilapia fish on ice"
"mackerel|smoked mackerel fish traditional smoking"
"palm-oil|red palm oil in bottle traditional"
"honey|raw natural honey in jar with honeycomb"
"gari|white gari cassava flakes bowl"
"ginger|fresh ginger roots rhizomes pile"
"day-old-chicks|yellow day old chicks baby chickens"
"fertilizer|npk fertilizer bag 50kg agricultural"
)

extract_json() {
  # Strip the 3 status lines the CLI prints before the JSON payload
  awk '/^{/,0' "$1"
}

run_one() {
  local item="$1"
  local slug="${item%%|*}"
  local query="${item#*|}"
  if [ -s "${slug}.json" ]; then
    echo "SKIP ${slug}"
    return 0
  fi
  echo "SEARCH ${slug}: ${query}"
  local tmp
  tmp=$(mktemp)
  if timeout 200 z-ai image-search -q "${query}" -c 6 --gl us --no-rank > "$tmp" 2>&1; then
    extract_json "$tmp" > "${slug}.json"
    if command -v bun >/dev/null 2>&1; then
      bun -e "const j=require('./${slug}.json'); console.log('  -> ${slug}: '+j.count+' results, success='+j.success)" 2>/dev/null || echo "  -> ${slug}: written (validate later)"
    fi
  else
    echo "  -> ${slug}: FAILED"
  fi
  rm -f "$tmp"
}

i=4  # yam already done
total=${#QUERIES[@]}
while [ $i -lt $total ]; do
  for item in "${QUERIES[@]:$i:4}"; do
    run_one "$item" &
  done
  wait
  echo "BATCH DONE ($((i+4))/${total})"
  i=$((i+4))
done
echo "ALL SEARCHES COMPLETE"

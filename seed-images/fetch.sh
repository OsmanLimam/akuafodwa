#!/bin/bash
# Sequential image search fetcher v2 — captures stdout (the -o flag is unreliable)
cd /home/z/my-project/seed-images

declare -A Q=(
  [cassava]="fresh cassava roots harvested in a pile"
  [sweet-potato]="fresh orange sweet potatoes in a pile"
  [cocoyam]="cocoyam taro roots fresh harvest"
  [maize]="dried white maize corn kernels in sacks"
  [rice]="white rice grains in an open sack"
  [groundnut]="raw groundnuts peanuts in shells in a sack"
  [okra]="fresh green okra pods at a market"
  [garden-eggs]="garden eggs african eggplant in a basket"
  [onion]="red onion bulbs in mesh bags at market"
  [cabbage]="fresh green cabbage heads harvest"
  [pineapple]="ripe golden pineapples at a tropical market"
  [mango]="ripe mangoes in a crate at market"
  [banana]="green bananas bunches fresh harvest"
  [pawpaw]="ripe papaya pawpaw fruits at a market"
  [oranges]="fresh oranges in bags at a market"
  [cocoa]="dried cocoa beans in a sack"
  [cashew]="raw cashew nuts in shells in a sack"
  [chicken]="live brown chickens at a poultry farm"
  [eggs-crate]="brown eggs in plastic crates from poultry"
  [guinea-fowl]="guinea fowl birds live at a farm"
  [goats]="live goats at a livestock market in africa"
  [sheep]="sheep flock on a livestock farm"
  [pigs]="pigs at a pig farm livestock"
  [tilapia]="fresh tilapia fish on ice"
  [smoked-fish]="smoked fish display at an african market"
  [palm-oil]="red palm oil in bottles and jerrycans"
  [honey]="natural golden honey in a jar with honeycomb"
  [gari]="gari cassava flakes west african food"
  [ginger]="fresh ginger roots in a pile at market"
  [day-old-chicks]="yellow day old chicks at a poultry farm"
  [fertilizer]="fertilizer bags stacked at a farm supply store"
  [plantain]="green plantain bunches at a market"
  [hero]="colorful african food market stall with fresh vegetables and produce"
)

ORDER=(
  hero cassava sweet-potato cocoyam maize rice groundnut okra garden-eggs onion
  cabbage pineapple mango banana pawpaw oranges cocoa cashew chicken eggs-crate
  guinea-fowl goats sheep pigs tilapia smoked-fish palm-oil honey gari ginger
  day-old-chicks fertilizer plantain
)

# Only fetch the slugs passed as args (or all if none passed)
TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then TARGETS=("${ORDER[@]}"); fi

for slug in "${TARGETS[@]}"; do
  if [ -s "$slug.json" ]; then echo "SKIP $slug"; continue; fi
  ok=0
  for attempt in 1 2 3 4; do
    z-ai image-search -q "${Q[$slug]}" -c 3 --gl us --no-rank 2>/dev/null | sed -n '/^{/,$p' > "$slug.tmp"
    if [ -s "$slug.tmp" ] && grep -q '"success": true' "$slug.tmp"; then
      mv "$slug.tmp" "$slug.json"
      echo "OK $slug"
      ok=1
      break
    fi
    echo "RETRY($attempt) $slug"
    rm -f "$slug.tmp"
    sleep $((attempt * 8))
  done
  [ $ok -eq 0 ] && echo "FAIL $slug"
  sleep 2
done
echo "FETCH RUN DONE"

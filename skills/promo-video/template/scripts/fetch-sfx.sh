#!/usr/bin/env bash
# The effect set from the reference video, from Mixkit (free for commercial use, no attribution; the license
# doesn't allow redistributing the files themselves, so they're fetched here instead of living in git).
# name=mixkit id. See the skill's references/SOUND.md for where each one goes and at what volume.
set -euo pipefail
mkdir -p public/sfx && cd public/sfx
declare -A M=(
  [click]=2568 [select]=3124 [option]=2573 [mouse]=2997 [check]=1120
  [light-pop]=3005 [dry-pop]=2356 [bubble-pop]=2357 [pop-alert]=2354 [confirm]=2867
  [sweep-small]=166 [sweep-short]=175 [swoosh-fast]=3115 [whoosh-fast]=1490 [tech-slide]=3120 [scifi-sweep]=3114
  [impact]=2909 [impact-whoosh]=2903 [sparkle]=2350 [bass-pulse]=2295 [typing]=2531
)
for k in "${!M[@]}"; do
  [ -s "$k.mp3" ] || curl -fsSL -A "Mozilla/5.0" -o "$k.mp3" "https://assets.mixkit.co/active_storage/sfx/${M[$k]}/${M[$k]}-preview.mp3"
done
echo "Sound effects: Mixkit (https://mixkit.co/license/#sfxFree)" > CREDITS.txt
ls | wc -l

#!/usr/bin/env bash
# Two-pass LINEAR loudness normalisation to YouTube's -14 LUFS (one fixed gain: no pumping between lines),
# then a 720p preview. Usage: bash scripts/master.sh out/raw.mp4 out/final.mp4
set -euo pipefail
IN=$1 OUT=$2
J=$(ffmpeg -hide_banner -i "$IN" -vn -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | grep -o '[-0-9.]*' | head -1; }
ffmpeg -v error -y -i "$IN" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
  -c:a aac -b:a 256k -ar 48000 "$OUT"
ffmpeg -v error -y -i "$OUT" -vf scale=1280:-2 -r 30 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k -movflags +faststart "${OUT%.mp4}_720p.mp4"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tail -3
echo "-> $OUT and ${OUT%.mp4}_720p.mp4"

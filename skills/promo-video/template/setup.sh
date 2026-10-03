#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu/Debian VDS (safe to re-run: every step skips what's already there).
# Installs: ffmpeg, Node 22 (nvm) + Remotion/Playwright, Chromium deps, Python venv (Kokoro TTS, librosa,
# OpenCV), Kokoro voice model, whisper.cpp + base.en model, and the Mixkit sound effects.
#   bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"
CACHE="$HOME/.cache/video-kit"
mkdir -p "$CACHE"
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
say() { printf '\n\033[1;34m== %s\033[0m\n' "$*"; }

say "system packages"
if command -v apt-get >/dev/null; then
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq ffmpeg python3 python3-venv python3-pip git curl build-essential cmake >/dev/null
else
  echo "Not apt-based: install ffmpeg, python3-venv, git, curl, cmake and a C++ compiler yourself, then re-run."
fi

say "node"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"; nvm install 22 >/dev/null; nvm use 22 >/dev/null
fi
node -v

say "npm packages + browsers"
npm install --no-audit --no-fund
npx playwright install --with-deps chromium
npx remotion browser ensure

say "python venv"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q kokoro-onnx soundfile librosa opencv-python-headless numpy pillow

say "kokoro voice model"
mkdir -p "$CACHE/kokoro"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$CACHE/kokoro/$f" ] || curl -fL -o "$CACHE/kokoro/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done

say "whisper.cpp (word timings, transcript checks)"
if ! command -v whisper-cli >/dev/null; then
  [ -d "$CACHE/whisper.cpp" ] || git clone -q --depth 1 https://github.com/ggml-org/whisper.cpp "$CACHE/whisper.cpp"
  cmake -S "$CACHE/whisper.cpp" -B "$CACHE/whisper.cpp/build" -DCMAKE_BUILD_TYPE=Release >/dev/null
  cmake --build "$CACHE/whisper.cpp/build" -j"$(nproc)" --target whisper-cli >/dev/null
  BIN="/usr/local/bin"; [ -w "$BIN" ] || BIN="$HOME/.local/bin"; mkdir -p "$BIN"
  ln -sf "$CACHE/whisper.cpp/build/bin/whisper-cli" "$BIN/whisper-cli"
fi
mkdir -p "$CACHE/whisper"
[ -s "$CACHE/whisper/ggml-base.en.bin" ] || curl -fL -o "$CACHE/whisper/ggml-base.en.bin" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

say "sound effects"
bash scripts/fetch-sfx.sh

[ -f video.config.json ] || cp video.config.example.json video.config.json
mkdir -p public/pages public/vo public/music public/fonts public/brand out
say "done — continue with the promo-video skill, step 2 (npm run detect)"

#!/usr/bin/env zsh
set -euo pipefail
setopt nonomatch

# Uso:
#   scripts/concat-tree.sh <DIR_ALVO> <ARQUIVO_SAIDA> [-e "ext1,ext2,..."] [-x "glob1,glob2,..."]
# Ex:
#   scripts/concat-tree.sh app backups/for-gpt/ALL_APP.txt
#   scripts/concat-tree.sh . backups/for-gpt/PROJECT_TS.txt -e "ts,tsx,css,md"
#   scripts/concat-tree.sh app backups/for-gpt/APP_NO_SVG.txt -x "*.svg,*.map"

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 <DIR_ALVO> <ARQUIVO_SAIDA> [-e \"ts,tsx,js,css,md,...\"] [-x \"*.svg,*.map,...\"]" >&2
  exit 1
fi

TARGET_DIR="$1"
OUT_FILE="$2"
shift 2

EXT_FILTER=""
EXCLUDES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--ext) EXT_FILTER="${2:-}"; shift 2 ;;
    -x|--exclude) IFS=',' read -rA EXCLUDES <<< "${2:-}"; shift 2 ;;
    *) echo "Arg desconhecido: $1" >&2; exit 1 ;;
  esac
done

BIN_EXT=( png jpg jpeg webp gif svg ico icns avif mp3 mp4 wav ogg webm woff woff2 ttf otf eot pdf zip tar gz bz2 7z rar wasm )

FIND_ARGS=()
FIND_ARGS+=("$TARGET_DIR" -type f)
FIND_ARGS+=( -path './node_modules' -prune -o -path './.git' -prune -o -path './.next' -prune -o -path './.vercel' -prune -o -type f )

for ext in $BIN_EXT; do FIND_ARGS+=( ! -name "*.${ext}" ); done
for pat in $EXCLUDES; do FIND_ARGS+=( ! -name "$pat" ); done

if [[ -n "$EXT_FILTER" ]]; then
  IFS=',' read -rA EXTS <<< "$EXT_FILTER"
  FIND_ARGS+=( \( )
  local first=1
  for ext in $EXTS; do
    if [[ $first -eq 1 ]]; then FIND_ARGS+=( -name "*.${ext}" ); first=0
    else FIND_ARGS+=( -o -name "*.${ext}" ); fi
  done
  FIND_ARGS+=( \) )
fi

: > "$OUT_FILE"
print "### Concatenado em: $(date -Is)\n### Raiz: $PWD\n" >> "$OUT_FILE"

print -r -- "${(@q)FIND_ARGS}" > /dev/null
for f in $(eval command find "${FIND_ARGS[@]}" | sort); do
  print "\n\n===== ${f} =====\n" >> "$OUT_FILE"
  command cat -- "$f" >> "$OUT_FILE" 2>/dev/null || print "(!) Falha ao ler: $f" >> "$OUT_FILE"
done

print "\n\n### Total de arquivos: $(eval command find "${FIND_ARGS[@]}" | wc -l | tr -d ' ')" >> "$OUT_FILE"
echo "✅ Gerado: $OUT_FILE"

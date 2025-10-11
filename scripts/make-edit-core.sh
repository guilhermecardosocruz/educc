#!/usr/bin/env zsh
set -euo pipefail
BACKUP_DIR=backups/for-gpt
mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/EDIT_CORE_APP.txt"
: > "$OUT"
find app -type f \
  ! -path 'app/api/*' \
  ! -name 'route.ts' \
  ! -name '*.d.ts' \
  \( -name 'page.tsx' -o -name 'layout.tsx' -o -name 'template.tsx' -o -name 'head.tsx' -o -name 'loading.tsx' -o -name 'not-found.tsx' -o -name '*.tsx' -o -name '*.css' -o -name 'metadata.ts' -o -name 'globals.css' \) \
  -print0 \
| sort -z | while IFS= read -r -d '' f; do
  printf '\n\n===== %s =====\n' "$f" >> "$OUT"
  cat -- "$f" >> "$OUT" 2>/dev/null || printf '(Falha ao ler: %s)\n' "$f" >> "$OUT"
done
echo "✅ Gerado: $OUT"

#!/bin/bash
# Publica o conteudo de packages/contracts na branch orfa "npm/contracts",
# onde a raiz do repo E o pacote (instalavel via github:CauaStos/PI-Backend#npm/contracts).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

(cd packages/contracts && npm run build)

IDX=$(mktemp)
export GIT_INDEX_FILE="$IDX"
trap 'rm -f "$IDX"' EXIT

git read-tree --empty

for f in package.json tsconfig.json README.md; do
  [ -f "packages/contracts/$f" ] || continue
  blob=$(git hash-object -w "packages/contracts/$f")
  git update-index --add --cacheinfo "100644,$blob,$f"
done

find packages/contracts/src packages/contracts/dist -type f | while read -r f; do
  rel="${f#packages/contracts/}"
  blob=$(git hash-object -w "$f")
  git update-index --add --cacheinfo "100644,$blob,$rel"
done

tree=$(git write-tree)
git fetch origin refs/heads/npm/contracts:refs/heads/npm/contracts --force 2>/dev/null || true
parent=$(git rev-parse --verify -q "refs/heads/npm/contracts" 2>/dev/null || true)
if [ -n "$parent" ]; then
  commit=$(git commit-tree "$tree" -p "$parent" -m "contracts: $(git rev-parse --short HEAD)")
else
  commit=$(git commit-tree "$tree" -m "contracts: initial publish from $(git rev-parse --short HEAD)")
fi

git push origin "$commit:refs/heads/npm/contracts" --force-with-lease="npm/contracts${parent:+:$parent}"
echo "Published $commit -> npm/contracts"

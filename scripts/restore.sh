#!/usr/bin/env bash
# Restore the heybox project byte-for-byte from the snapshot shipped with this skill.
#   bash restore.sh [target-dir]        (default: ./heybox)
# Verifies the archive checksum, unpacks, verifies every file against 文件清单.sha256,
# and starts a git repo whose first commit is the snapshot.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; assets="$here/../assets"
target="${1:-heybox}"
archive="$assets/heybox-journey-43c.tar.gz"
[ -e "$target" ] && { echo "目标已存在：$target（请换一个目录或先移走）" >&2; exit 1; }
(cd "$assets" && shasum -a 256 -c SHA256SUMS) >/dev/null || { echo "快照校验失败：$archive" >&2; exit 1; }
tmp="$(mktemp -d)"; tar -xzf "$archive" -C "$tmp"; mv "$tmp/heybox" "$target"; rmdir "$tmp"
cd "$target"
bad=$(shasum -a 256 -c 文件清单.sha256 2>/dev/null | grep -vc ': OK$' || true)
[ "$bad" = "0" ] || { echo "有 $bad 个文件与 文件清单.sha256 不一致" >&2; exit 1; }
cmp -s dist/sample.html dist/index.html || { echo "sample.html 与 index.html 不一致" >&2; exit 1; }
git init -q -b main && git add -A && git -c user.name="${GIT_NAME:-heybox}" -c user.email="${GIT_EMAIL:-heybox@localhost}" commit -qm "journey-43c snapshot (restored from heybox-universe skill)"
echo "已恢复到 $(pwd)  ·  $(git ls-files | wc -l | tr -d ' ') 个文件  ·  journey-43c"
echo "预览：python3 启动预览.py --port 8017  然后打开 http://127.0.0.1:8017/sample.html?rev=journey-43c"

#!/usr/bin/env bash
# G10: build the submission zip and check it the way a reviewer will receive it.
#   scripts/check-submission.sh [output.zip]
# Zips the committed repo with its git history (no node_modules, build output, env files or agent
# worktrees), extracts it to a temp dir, and checks: git log works, gitleaks finds nothing in files
# or history, no env files, CLAUDE.md and plan.md at the root, and the zip is a few MB.
set -euo pipefail
cd "$(dirname "$0")/.."

out=${1:-"$PWD/../cadre-support-assistant.zip"}
max_mb=10
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

[[ -z $(git status --porcelain) ]] || { echo "G10 failed: working tree has uncommitted changes"; exit 1; }

# A fresh clone holds exactly what is committed, with full history and nothing ignored.
git clone --quiet --no-hardlinks . "$work/repo"
git -C "$work/repo" remote remove origin
rm -f "$out"
(cd "$work" && zip -qr "$out" repo -x 'repo/node_modules/*' 'repo/.next/*')

mkdir "$work/check"
unzip -q "$out" -d "$work/check"
repo="$work/check/repo"
fail=0
pass() { echo "  ok    $1"; }
bad() { echo "  FAIL  $1"; fail=1; }

git -C "$repo" log --oneline -1 >/dev/null 2>&1 && pass "git log works ($(git -C "$repo" rev-list --count HEAD) commits)" || bad "git log"
gitleaks detect --source "$repo" --no-banner --redact >/dev/null 2>&1 && pass "gitleaks: history clean" || bad "gitleaks found secrets in history"
gitleaks detect --source "$repo" --no-git --no-banner --redact >/dev/null 2>&1 && pass "gitleaks: files clean" || bad "gitleaks found secrets in files"
envs=$(find "$repo" -name '.env*' ! -name '.env.example' -not -path '*/.git/*' | wc -l | tr -d ' ')
[[ $envs == 0 ]] && pass "no env files" || bad "$envs env file(s) in the zip"
[[ -f $repo/CLAUDE.md && -f $repo/plan.md ]] && pass "CLAUDE.md and plan.md at root" || bad "CLAUDE.md or plan.md missing"
mb=$(du -m "$out" | cut -f1)
(( mb <= max_mb )) && pass "zip is ${mb} MB (limit ${max_mb})" || bad "zip is ${mb} MB (limit ${max_mb})"

if (( fail )); then echo "G10 failed"; exit 1; fi
echo "G10 ok: $out"

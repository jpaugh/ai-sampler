#!/usr/bin/env bash
set -ex

[ $# -gt 0 ] || {
  echo "Usage: $0 <file_path>"
  exit 1
}

do_git() {
  git -C "$DIR" $@
}

prints_true() {
  result="$($@)"
  test $result == "true"
}

is_inside_worktree() {
  result="$(do_git --is-inside-work-tree)"

}

FILE="${1}"
DIR="$(dirname "$FILE")"
[[ -d $FILE ]] && DIR="$FILE"

# If it's in a git dir, ignore it
prints_true do_git rev-parse --is-inside-git-dir && {
  echo "false"
  exit
} || true

# If it's not in a worktree, ignore it
prints_true do_git rev-parse --is-inside-work-tree || {
  echo "false"
  exit
}

# If it's not ignored, keep it
do_git check-ignore -q "$FILE" || {
  echo "true"
  exit
}

# It's in a worktree, but it's ignored by git. Ignore it
echo "false"
exit

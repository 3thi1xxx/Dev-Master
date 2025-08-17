#!/usr/bin/env bash
set -euo pipefail
ARCHIVE="${1:?usage: restore-snapshot <snapshots/..tgz>}"
node src/snapshots/SnapshotManager.cjs restore "$ARCHIVE" --yes 
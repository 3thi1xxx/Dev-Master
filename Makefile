.PHONY: init status bump

init:
git submodule update --init --recursive

status:
git submodule status

bump:
git submodule update --remote --merge --recursive
git add .
git commit -m "chore(meta): bump submodule pointers" || true
git push

# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## This repo

- **Before a local pack for a different arch than the last one, `docker rmi` the pinned `ghcr.io/traceapps/nutritrace@sha256:…` reference** — with Docker's classic image store a digest reference holds one platform, so a plain `make` (or a `docker pull` of the pin) fails the second pack with `cannot overwrite digest`. Pack with `make x86` and `make arm` separately. CI packs each arch on its own runner and is unaffected.

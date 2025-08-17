
# Chad/Axiom Trading Tool — Cursor AI Summary & Action Plan

> **Use in Cursor**: Drop this file at the repo root as `CURSOR_SUMMARY.md`. Pin it in Cursor’s left sidebar. When you open a file or start a chat, reference section headers (e.g., “48-Hour Cleanup Plan”) and ask Cursor to apply those steps with diffs. Keep all changes gated behind your existing MEATBRAIN/Chad trust rules.

---

## 1) What this tool is (concise model)
A **Solana‑first trading & analysis platform** that covers the full loop:
- **Data/Integrations**: Birdeye (WS/API), GeckoTerminal, Bubblemaps, Cabalspy; DEX/agg clients (Jupiter, Raydium).
- **Strategy & Risk**: Strategy engine, risk manager, opportunity detector, pattern learning, whale discovery.
- **Execution**: Paper trading + simulator first; live execution hooks present.
- **Ops & GUI**: Monitoring scripts, simple dashboards/GUI server(s).
- **Compliance**: NZ tax tracker and export flows.
- **Tests**: Unit/integration/system tests across feeds, strategy, and paper trading.

---

## 2) What’s good ✅
- **Modular intent** is clear (clients/core/services/integrations/trading).
- **Paper trading-first** posture fits reliability and safe iteration.
- **Broad market intel** across multiple providers enables cross‑validation.
- **Proof mindset** (implementation and live system proofs) aligns with Chad governance.
- **Tests across tiers** exist, not just unit stubs.
- **Compliance present** (NZ tax), rare for indie trading stacks.

---

## 3) What’s great 🌟
- **End‑to‑end surface**: data → strategy → risk → execution → monitoring → GUI → tax/compliance.
- **Realtime & learning hooks**: opportunity detector, pattern learning, cluster/whale logic.
- **Strategy catalog**: strategies as code + JSON make A/B easier.
- **Ops orientation**: monitoring and speed dashboards considered early.

---

## 4) What’s confusing / risky 🤨
- **Identity sprawl**: repo says *ethixxtradebot*; code/docs say *Axiom*; platform is *Chad*. Pick **one** (recommend: **Chad**) and standardize names, configs, folders.
- **Language + module duplication**: JS + a little TS + Python; some modules appear in multiple places (e.g., `AxiomTokenManager`, multiple `server.js`). High drift risk.
- **Runtime artifacts in repo**: logs, paper‑trading snapshots, tax exports, token dumps checked into VCS → guarantees drift & privacy risk.
- **Secrets smell**: `.env` backups, token extractors, `devSigner` in code. Keys must never live in the repo or local code paths.
- **GUI duplication**: `gui/` vs `src/gui/` vs `src/gui/public/` with multiple servers—unclear canonical entry.
- **Script variants**: cluster/whale scripts in *final/fixed/ultimate* flavors—ambiguous blessed path.

---

## 5) What’s unnecessary / should be moved 🧹
- **Move out of repo** (or add to `.gitignore`): `data/`, `tax-records/`, `*-output.log`, `system-test.log`, `paper-trading/*.json`, any `*tokens*`, and **all** `.env*` backups. Keep only a scrubbed `*.example` for reference.
- **Python R&D** not used at runtime → move to `/research` (or separate package) with a thin HTTP/gRPC boundary if needed.
- **.DS_Store** and OS/editor artifacts → always ignored.

---

## 6) Quick scorecard
| Area | Score (0–5) | Notes |
|---|---:|---|
| Architecture | **3.5** | Right modules exist; duplication + identity sprawl lower confidence. |
| Reliability posture | **3.5** | Paper trading, tests, monitors are strong; secrets/runtime artifacts weaken it. |
| Observability | **3.0** | Monitoring present; needs unified metrics/log dashboards. |
| Security/Compliance | **2.0** | devSigner/keys & data‑in‑repo risks; kudos for NZ tracker. |
| Dev ergonomics | **3.0** | Clear dirs, but mixed JS/TS/Py and dupes hinder speed. |

---

## 7) 48‑Hour Cleanup Plan (high‑leverage, low‑risk)
> Execute in **small, auditable commits** with proof logs. Ask Cursor to propose diffs per sub‑task.

### A) Repo hygiene & identity
- [ ] **Converge identity** to **Chad** everywhere (package name, config prefixes, banners).
- [ ] **Purge + ignore**: add rules for `.DS_Store`, `data/`, `tax-records/`, `logs/**`, `paper-trading/**`, `*tokens*`, `*.env*` backups.
- [ ] Add **pre‑commit hooks**: lint, typecheck, test, **gitleaks** (secret scan).

### B) Codebase consolidation
- [ ] **Pick TypeScript** for runtime. Migrate key modules; leave JS as shims temporarily.
- [ ] **Collapse duplicates** to one canonical module per concern:  
  `packages/token/AxiomTokenManager.ts`, `packages/analyzers/LiveTokenAnalyzer.ts`, `packages/signals/WhaleSignalParser.ts`.
- [ ] **Single API/GUI server** location (e.g., `apps/api/server.ts`). Delete alt `server.js` copies.
- [ ] **Demote Python** to `/research` or publish as service with a thin HTTP boundary.

### C) Ops & safety
- [ ] **Signer policy**: remove `devSigner*` from runtime; enforce hardware/remote signer only.
- [ ] **Config hardening**: central config with schema validation (Zod), `NODE_ENV`/`RUN_MODE` guards.
- [ ] **Logging/metrics**: standardize on `pino` + OpenTelemetry; add `requestId` and `tradeId` to traces.

### D) Golden E2E proofs (must pass in CI)
- [ ] **Data handshake**: Birdeye WS connects; receive **N** msgs in **< Xs**; write `proof/e2e-handshake.json` (hash included).
- [ ] **Strategy dry‑run**: run `PumpFunSniper` on a fixed snapshot; deterministic intents; write `proof/strategy-dryrun.json`.
- [ ] **Risk clamp**: feed over‑sized position; assert clamp/abort; write `proof/risk-clamp.json`.

---

## 8) 1–2 Week Plan (medium lifts)
- **Monorepo packaging**:  
  `apps/{api,gui,worker}` and `packages/{core,connectors,integrations,strategies,risk,compliance}`.
- **Typed event bus**: shared TS types: `MarketTick`, `Signal`, `Decision`, `OrderIntent`, `Fill` + in‑proc queue (Redis later).
- **Strategy SDK**: formal `analyze() → decide() → riskCheck() → execute()` with typed contexts and guardrails.
- **GUI consolidation**: single app (Next.js or one Node server). Remove duplicates and dead code.
- **Chad integration**: emit `.pmac.log` + `vault-log.ndjson`; trust scores on signals/decisions; write `.agent.md` drops and `score-*` files.

---

## 9) Proof‑of‑Done (artifacts to attach to PR/CI)
- **Commit series** titled *“Identity normalization”* collapsing duplicates and renames.
- **`gitleaks` report**: clean.
- **CI run** with `pnpm test:e2e` (or `npm`) passing the 3 golden tests; artifacts saved under `proof/` and excluded from git.
- **Manifest delta**: shows runtime files removed; `.gitignore` hardened.
- **`trust-check.json`**: signer policy set to “hardware/remote only”.

---

## 10) Suggested monorepo layout (target)
```text
apps/
  api/
    src/server.ts
  gui/
    src/index.tsx
  worker/
    src/index.ts
packages/
  core/
  connectors/        # Birdeye, GeckoTerminal, Jupiter, Raydium
  integrations/      # Bubblemaps, Cabalspy
  strategies/
  risk/
  compliance/        # NZ tax, exports
  signals/           # whale parsers, detectors
  analyzers/
  token/
research/            # python R&D, notebooks, exports (not in runtime)
proof/               # CI artifacts (gitignored)
config/
tests/
```

---

## 11) Baseline .gitignore (append)
```gitignore
# OS & editors
.DS_Store
.vscode/
.idea/

# Envs & secrets
.env
.env.*
*.env.*
*.key
*.pem

# Runtime artifacts / logs / data / exports
logs/
**/*.log
data/
tax-records/
paper-trading/
proof/
exports/
cache/
dist/
build/

# Snapshots / dumps
**/*tokens*
**/*snapshot*
**/*dump*
```

---

## 12) Pre‑commit & secret‑scan (example)
```jsonc
// package.json (snippet)
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "precommit": "pnpm typecheck && pnpm lint && pnpm test && gitleaks detect --no-banner"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "git add"]
  }
}
```
Add Husky:
```bash
npx husky init
echo "pnpm precommit" > .husky/pre-commit
```

---

## 13) Environment & signer policy (musts)
- **No dev signers** or keys in code. Only hardware/remote signer with minimal scopes.
- Split config by `RUN_MODE={paper,sim,live}`; refuse to start live without signer policy OK.
- Validate configs with Zod; fail fast on missing/invalid env.

---

## 14) CI checklist
- ✅ Install deps, build, typecheck, lint
- ✅ Run unit + integration tests
- ✅ Run **golden E2E proofs** and upload `proof/*.json` artifacts
- ✅ Run **gitleaks**; fail on findings
- ✅ Post manifest delta (removed files, new ignores) as PR comment

---

## 15) TL;DR
You’ve got the right pieces (connectors, strategy/risk, paper trading, monitoring, tax). Your velocity is capped by **identity sprawl**, **duplicate modules**, **mixed languages**, and **runtime junk in VCS**. Fix those four, standardize on **TypeScript**, and lock signer policy—your iteration speed and reliability will jump 2–3×, with audits to prove it.

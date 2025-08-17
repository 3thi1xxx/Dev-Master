# AxiomTraderAgent
- goal: convert legacy Axiom "signals" into audited trade intents for the relay
- trust: start_low
- inputs: config/axiom.config.json, legacy/axiom/*
- outputs: intents -> /dispatch (dry-run by default)
- safety: never holds secrets; never signs; requires council for live
- proof: .pmac.log lines {axiom_trader_dispatch}, vault-log ndjson anchors
- hooks: summarize-axiom-trader.md, score-axiom-trader.md 
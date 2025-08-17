# Galaxy Brain Orchestrator Archive Manifest

This directory contains archived versions of the Galaxy Brain orchestrator discovered across multiple branches, preserved for traceability and diff analysis.

## Active Version
- **Location**: `/agents/galaxy/GalaxyBrainOrchestrator.js`
- **Source**: `new axiom trade/axiom-trade/scripts/` (freshest branch)
- **SHA256**: `2a7b5bfe715402cc8ee9b57d913a45533696860ad327fa11082cf140073876bf`
- **Status**: ✅ **ACTIVE** - This is the diamond baseline used in the trust-safe adapter

## Archived Variants

### galaxy-brain-orchestrator.ea2b01fd.js
- **Source**: `axiomtrade-archive/scripts/galaxy-brain-orchestrator.js`
- **SHA256**: `ea2b01fd623ceb5982a7d19fe76bd630ad8dbb84a9fd7d1e37c6a8a220b5ccba`
- **Notes**: Original archived version

### galaxy-brain-orchestrator.7205084a.js
- **Source**: `chad-lockdown-spine/legacy-intake/axiom/src/axiomtrade-archive/scripts/galaxy-brain-orchestrator.js`
- **SHA256**: `7205084a1d5884cfa6ee79fb71532bf4646e63af81c865c50da0efc1d63200dd`
- **Notes**: Legacy intake variant of axiomtrade-archive

### galaxy-brain-orchestrator.2b4c4ddc.js
- **Source**: `chad-lockdown-spine/legacy-intake/axiom/src/new axiom trade/axiom-trade/scripts/galaxy-brain-orchestrator.js`
- **SHA256**: `2b4c4ddca96c43048dae931bc7f372e6e846a6bb78f6540b7493172bf7ef99b7`
- **Notes**: Legacy intake variant of new axiom trade

## Integration Strategy

The active version was wrapped in `GalaxyBrainAdapter.js` which provides:
- Trust-safe execution with Chad Lockdown Spine hooks
- ProofLogger integration for audit trails
- QueueManager integration for task coordination  
- Mandatory approval gates for dangerous operations
- Dry-run mode by default

## CLI Access

- `cbsh/galaxy-run-dry.sh` - Safe dry run execution
- `cbsh/galaxy-health.sh` - Health check and integrity scan

## Trust Policy

All Galaxy Brain operations require:
- `approved_by` parameter (user identification)
- `chatdrop_id` parameter (session tracking)
- Explicit consent for any git mutations or file system changes
- Full audit logging to `.pmac.log` and `vault-log.ndjson`

---

Generated: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
By: Galaxy Brain Integration Script 
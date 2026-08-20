# Vercel operations log

Record material dashboard or platform changes that cannot be represented directly in Git. Do not record secret values.

| Date | Environment | Change | Actor | Issue/PR | Verification | Rollback |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-08-20 | Production | Baseline only: existing `structura` project uses CLI/Codex deployments without Git commit metadata. No setting changed by issue #7. | AI audit | #7 | Latest observed deployment `dpl_7BJACSvMxhmtzFtSecWC6h1p9h1v` was `READY`. | Use the last known-good Vercel deployment while Git-controlled release remains disabled. |

## Required entry fields

Every future manual entry must identify the environment, setting changed, actor, linked issue/PR, verification evidence and rollback action. Never paste tokens, environment values or customer information.

# STRUCTURA project control

`project-control` is the machine-readable control plane for the STRUCTURA Git-centred AI Production Factory. It does not replace product source or tests; it links them to lifecycle state, risk, review and release evidence.

## Controlled records

- `schemas/` defines product, approval and release records.
- `products/registry.json` inventories existing routes and governed SKUs.
- `products/<slug>/product.json` is the source-of-truth manifest for a governed SKU.
- `approvals/` stores human attestations bound to the candidate commit, exact staged HTTPS origin and artifact hashes.
- `releases/` stores immutable release manifests and artifact hashes.

The permitted lifecycle is:

`IDEA → EVIDENCED → SPECIFIED → BUILDING → TESTING → COLLABORATION → REVIEW_READY → ENGINEER_REVIEW → APPROVED → RELEASED → DEPLOYED`

Exception states are `BLOCKED`, `REWORK`, `DRAFT_NOT_FOR_USE`, `RETIRED` and `ROLLED_BACK`.

Risk levels are `A` (administrative), `B` (commercial or decision support) and `C` (engineering calculation). Risk C content must remain `DRAFT_NOT_FOR_USE` until the engineering review gate has been satisfied.

## Validation

From the repository root, run:

```bash
node scripts/validate-governance.mjs
```

For a controlled release, also run:

```bash
node scripts/validate-governance.mjs --release project-control/releases/<release-manifest>.json
```

The release gate verifies an unconditional approval, exact candidate-commit match, strict staged HTTPS origin and exact artifact path/hash parity. Production promotion must reuse that reviewed staged deployment without rebuilding. The release tag belongs to a later metadata-only attestation commit; it is not required to equal the candidate commit. Templates are parsed by the base gate but are intentionally rejected by the release gate.

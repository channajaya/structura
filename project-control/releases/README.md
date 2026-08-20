# STRUCTURA controlled releases

This directory stores release manifests for the two-commit release-attestation model. A merge to `main` is not a production release, and the release tag does not point directly at the reviewed candidate commit.

## Two-commit release and attestation

1. Complete the product, tests and documentation in a **candidate commit**. Set the governed registry and product manifest to `REVIEW_READY` (or `ENGINEER_REVIEW` where applicable). Do not add final approval metadata to that commit.
2. Build the artifacts reproducibly from the candidate commit and deploy that exact candidate to preview or staging.
3. Record the exact staged deployment HTTPS origin as `candidate_deployment_url` and calculate every artifact's SHA-256 digest. The URL must contain no credentials, path, query or fragment.
4. Review the candidate commit, deployed candidate, artifacts and evidence. Approval must be unconditional: `decision` is exactly `APPROVED` and `conditions` is empty.
5. Create a later **metadata-only attestation commit** containing the release-specific approval and release manifests. Set the release manifest status to `APPROVED` (or `RELEASED` when applicable). Both records must name the same `candidate_commit_sha`, canonical `v`-prefixed tag, product, risk and artifact path/hash set.
6. Run governance and release validation. CI separately verifies that the candidate commit is an ancestor of the attestation commit and that the intervening change is limited to authorised release metadata.
7. Create the canonical immutable `v<major>.<minor>.<patch>` tag on the attestation commit, then promote the exact reviewed `candidate_deployment_url`. Production must not rebuild or create a different deployment.

The tag commit and `candidate_commit_sha` are intentionally different. Do not change validation to require equality; that would reintroduce a circular approval commit.

```bash
node scripts/validate-governance.mjs
node scripts/validate-governance.mjs --release project-control/releases/STRUCTURA-TPL-EST-001-v1.0.0.json
```

## Approval rules

- Risk A requires an approving `OWNER` or `MAINTAINER`.
- Risk B requires an approving `OWNER` and an approving `COMMERCIAL_REVIEWER` or `ENGINEER`.
- Risk C requires an approving `OWNER` and a named approving `ENGINEER`. Add an `INDEPENDENT_CHECKER` where the engineering review gate requires one.
- Every counted reviewer must have `decision: APPROVED` and a non-empty review timestamp.
- The overall decision must be exactly `APPROVED`; conditional approvals are not production-releasable.
- Review evidence and the approval timestamp must be non-empty, and `candidate_deployment_url` must be a strict HTTPS origin.
- The approval's `artifact_hashes` object must match the release manifest artifact paths and hashes exactly.
- Any material change to source, formula, test evidence, documentation or artifact invalidates the approval. Rebuild, re-hash and reapprove it.

## Templates are deliberately non-releasable

The two template JSON files contain readable placeholders and a `PENDING` decision. They must parse as JSON, but they intentionally fail release validation. Never change the templates to contain a fake approval or placeholder hash that appears valid.

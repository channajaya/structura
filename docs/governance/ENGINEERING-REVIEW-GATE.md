# Engineering Review Gate

Status: mandatory

Purpose: bind accountable approval to the exact candidate promoted to production

## Risk classification

Classify the highest consequence of the changed feature, not its apparent coding
complexity.

| Risk | Typical output | Final authority |
| --- | --- | --- |
| A — administrative | Registers, content, workflow aids and non-technical UI | Product owner or delegated owner |
| B — commercial/decision support | Estimates, BOQ, cost, scheduling or engineering-support information | Owner plus competent domain reviewer; engineer when engineering decisions are affected |
| C — engineering calculation | Member capacity, load, reaction, stability, code compliance or submission calculation | Named competent engineer |

Authentication, payments, personal data and irreversible migrations also require
their specialist reviews even when the product output is Risk A.

When classification is uncertain, use the higher class until the named approval
authority documents a reduction. AI may recommend but may not lower risk.

## Risk C conditions

Before a Risk C candidate can be approved, the review pack must identify:

- intended use, jurisdiction, design code and National Annex editions;
- equations, factors, units, assumptions, exclusions and validity limits;
- traceability from requirements and sources to implementation and tests;
- independently derived benchmark cases and expected results;
- boundary, invalid-input, unit and regression results;
- user warnings, report wording and professional-responsibility limitations;
- all changes since the last approved calculation version.

The independent AI check is required but is not a professional sign-off. A second
competent human checker is also required where legislation, client terms, the
engineer's quality system or the consequence of failure demands it.

## Controlled review pack

The final reviewer receives one immutable candidate and evidence pack containing:

1. Repository and planned canonical `vX.Y.Z` release version.
2. Full 40-character candidate Git SHA.
3. Exact unaliased Vercel origin recorded as `candidate_deployment_url`.
4. Filename, size and SHA-256 for every downloadable or generated artifact.
5. Reproducible build and artifact-set evidence.
6. Risk, jurisdiction, affected products/routes and standards.
7. Requirement, formula and source traceability.
8. Automated-test and independent-check summaries.
9. Representative inputs, outputs and rendered reports.
10. Open limitations, residual risk, migration and rollback plan.

The reviewer must be able to reproduce or inspect evidence without relying on an
AI assertion. Failed, skipped or unavailable checks must be visible.

## Review decision

Valid outcomes are:

- `APPROVED`: eligible for release and promotion;
- `REWORK`: return with specific actions;
- `REJECTED`: do not release;
- `RETIRED`: withdraw or replace the affected product.

“Approved with conditions” is not permission to promote. Complete the conditions,
produce a new candidate if anything changed and obtain `APPROVED`.

Approval must be written by the named human authority in the release issue or
other controlled review record using an unambiguous statement such as:

```text
APPROVED FOR PRODUCTION
Repository: channajaya/structura
Release: v1.4.0
Candidate commit: <full-40-character-sha>
Candidate Vercel deployment: <deployment-id-and-url>
Artifact hashes: <filename-and-64-hex-sha256-for-each-artifact>
Risk/jurisdiction: <classification-and-scope>
Reviewer: <name-and-role>
Reviewed at: <ISO-8601-UTC-time>
```

AI may prepare the fields but may not post or impersonate the approval. The
release operator verifies the reviewer is authorized and that all values match
the staged candidate before promotion.

## Approval attestation record

After the human decision, AI or the release operator transcribes it into a
release-specific approval JSON and release JSON in a metadata-only attestation
pull request. Both records must use `candidate_commit_sha` for the earlier
reviewed candidate and must repeat `candidate_deployment_url` and the artifact hashes.

An approval or release file must never claim that its own containing attestation
commit is the reviewed candidate. That SHA does not exist when the file is
authored and adding it would create a circular, self-modifying record. The
attestation commit is identified externally by the canonical annotated `vX.Y.Z`
tag and the release workflow.

The authorized approver reviews the attestation pull request for faithful
transcription. Automation then verifies that:

1. `candidate_commit_sha` is an ancestor of the tag's attestation commit;
2. the candidate-to-attestation diff contains only the exact selected approval
   JSON and release JSON; and
3. candidate deployment and artifact hashes equal the approved values.

Passing these checks proves that the metadata was added after the decision while
the reviewed application, calculation logic and artifacts remained unchanged.

## Approval invalidation

Approval is invalid when any of the following candidate properties changes after
review:

- candidate Git commit or staged Vercel deployment;
- source, formula, input, output, units or engineering assumptions;
- dependency lockfile, build configuration or runtime environment;
- authorization, payment, data schema or migration;
- user guidance, warnings, limitations or downloadable artifacts;
- any listed artifact or artifact hash.

A correction, however small, creates a new exact candidate. The approval scope
may be reduced for a documented cosmetic-only change, but a new approval record
must still identify the new commit and hashes.

The metadata-only attestation commit does not invalidate approval if and only if
the ancestor and exact-path diff checks pass. Any application, artifact,
configuration, lockfile, test, schema, template or unrelated metadata change in
that diff invalidates approval.

## Reviewer's minimum checks

The final reviewer confirms that:

- scope and risk are correct;
- evidence is complete and internally consistent;
- critical/high defects are closed;
- outputs are understandable and do not overstate assurance;
- residual risks and limitations are acceptable;
- the candidate can be rolled back safely;
- approval values match the exact item inspected.

Promotion without a valid record is an incident under the
[Rollback and Incident Procedure](./ROLLBACK-AND-INCIDENT-PROCEDURE.md).

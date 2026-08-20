## Linked issue

Closes #ISSUE_NUMBER

<!-- Every material change must start with an issue. Replace the placeholder. -->

## Product control

- SKU/product:
- Risk level: <!-- A / B / C -->
- Current lifecycle state:
- Proposed lifecycle state:
- Candidate commit SHA proposed for final review: <!-- output of: git rev-parse HEAD -->
- Release-attestation commit SHA: <!-- completed after approval; must change metadata only -->
- Canonical annotated release tag: <!-- vX.Y.Z; points to the attestation commit -->

## Summary and scope

<!-- Explain what changed, why it is needed, and what is deliberately excluded. -->

## Affected implementation

- Files, routes, shared components, or downloadable artifacts:
- Formula/calculation IDs changed:
- Requirements changed:
- Data/schema/migration impact:

## Sources, standards, and assumptions

<!-- List authoritative sources, standards/NA editions, jurisdictions, and assumptions. Use N/A only with a reason. -->

## Traceability

| Requirement ID | Source/formula or implementation | Test/validation ID | Result |
| --- | --- | --- | --- |
|  |  |  |  |

## Verification evidence

### Commands run

```text
npm run governance:check
npm run lint
npm run build
```

### Results

<!-- Record pass/fail, relevant logs, known-answer comparisons, and independent-check evidence. Never paste secrets. -->

### Visual and compatibility evidence

<!-- Add preview links and screenshots/rendered Excel or PDF evidence when appearance/output changes. State browser, device, Excel, and jurisdiction variants tested. -->

## Independent checking and red team

- Builder identity/agent:
- Independent checker identity/agent:
- Checker received builder reasoning: <!-- Must be No for material engineering logic -->
- Misuse, boundary, invalid-input, and regression cases tested:
- Findings and resolutions:

## Security, privacy, authentication, and payments

<!-- Describe impact. Confirm previews use non-production data/credentials. Use N/A only with a reason. -->

## Deployment and rollback

- Preview result:
- Staging/release-candidate result:
- Staged candidate deployment URL:
- Production deployment required: <!-- Yes / No -->
- Approved candidate commit SHA:
- Release record path:
- Approval record path:
- Release-attestation commit SHA:
- Intended immutable annotated tag:
- Last known-good tag/rollback target:
- Rollback steps:

## Limitations and final decisions

- Known limitations:
- Deferred work with linked issues:
- Engineer/owner decision items:

## AI production audit

<!-- Name the AI roles used and summarise material assumptions or escalations. AI must not approve its own release. -->

## Author checklist

- [ ] The linked issue, scope, SKU, risk level, and acceptance criteria are current.
- [ ] This branch contains one coherent change and does not include unrelated work.
- [ ] Requirements, sources/formulas, tests, and evidence are traceable.
- [ ] Builder and checker roles were separated where required.
- [ ] Governance, lint, build, and all affected tests pass on the exact candidate commit named above.
- [ ] Screenshots, renders, known-answer results, or compatibility evidence are attached where applicable.
- [ ] No secret, `.env` value, customer data, licensed source, or private project file is committed or logged.
- [ ] Security, privacy, payment, migration, deployment, and rollback impacts are addressed.
- [ ] Critical/high defects are resolved; limitations and deferred work are explicit.
- [ ] Any source, application, test, artifact, or non-attestation change after candidate approval will require approval of a new candidate commit.
- [ ] The post-approval attestation commit will change only the selected non-template release manifest and approval record JSON files.

## Final review gate

<!-- Reviewers complete this section. Do not fabricate approval or a signature. -->

- [ ] Required CODEOWNERS reviews are complete.
- [ ] Risk A: authorised owner/maintainer approval is recorded.
- [ ] Risk B: owner plus competent commercial/engineering reviewer approval is recorded.
- [ ] Risk C: named competent engineer approval (and independent human check for high-consequence work when required) is recorded.
- [ ] Approval names the exact candidate commit SHA, staged candidate deployment URL, and generated artifact SHA-256 hashes.
- [ ] The annotated release tag points to a later attestation commit, the approved candidate is its ancestor, and the candidate-to-tag diff contains only the selected release and approval records.
- [ ] Production will inspect, smoke-test, and promote the exact recorded staged deployment without rebuilding or redeploying it.
- Review decision: <!-- APPROVED / APPROVED WITH CONDITIONS / RETURNED FOR REWORK / REJECTED -->
- Production release authorization: <!-- Must be APPROVED with all conditions resolved before attestation/tagging -->
- Approval record path:

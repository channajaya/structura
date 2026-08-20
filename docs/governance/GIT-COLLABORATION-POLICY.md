# Git Collaboration Policy

Status: mandatory

Repository: `channajaya/structura`

## Source of truth

Git contains the authoritative source, specifications, tests, governance and
release evidence. GitHub issues and pull requests provide the collaboration and
decision trail. Vercel is a deployment target, not the source of truth.

Never develop an unrecorded production-only change in the Vercel dashboard. Any
emergency configuration change must be documented immediately and reconciled to
Git where configuration is representable as code.

## Issues and branches

Every material change must have an issue with scope, acceptance criteria, risk,
reviewer and rollback impact. Production-factory work references umbrella issue
`#7`; substantial work should use a linked child issue.

Create a short-lived branch from current `main`:

```text
feat/7-short-description
fix/123-short-description
docs/7-governance
chore/123-dependency-update
hotfix/456-production-defect
```

One branch should address one coherent issue. Keep it current with `main` without
force-pushing over another collaborator's work.

## Commits

Commits must be reviewable, buildable where practical and free from generated
noise or secrets. Use imperative Conventional Commit subjects, for example:

```text
feat(calc-ec): add traceable load-combination output
test(estimator): cover markup and margin boundaries
docs(governance): define staged promotion gate
```

The commit body references the issue (`Refs #7` or `Fixes #123`) and explains
material assumptions or migrations. Do not combine formatting-only changes with
functional changes. Do not rewrite published history on `main`.

## Pull requests

Direct pushes to `main` are prohibited. A pull request must contain:

- linked issue and concise scope/exclusions;
- risk A/B/C and named approval authority;
- screenshots or sample outputs for visible/report changes;
- test commands and summarized results;
- independent-check result and unresolved limitations;
- security, data-migration and rollback assessment;
- documentation and configuration changes;
- confirmation that no secret or unlicensed asset was added.

AI may draft and update the pull request but cannot approve it. The author or AI
builder may not be the only reviewer. Review comments are resolved by a commit or
an evidence-backed response; do not silently dismiss material concerns.

## Review and merge gates

| Change | Minimum pre-merge review |
| --- | --- |
| Documentation or low-risk Risk A change | One owner/collaborator review |
| Risk B, authentication, payment, storage or deployment | Owner plus relevant domain/code review |
| Risk C calculation or engineering logic | Independent AI check; competent engineer identified for the final exact-candidate gate |
| Security-sensitive or irreversible migration | Owner and security/data reviewer |

Required repository checks must pass. Use GitHub branch rules and required checks
where the account plan supports them. When a free-plan limitation prevents a
platform-enforced rule, the same control remains mandatory through the pull-
request checklist and a named human merge operator.

Prefer squash merge for a focused feature branch and merge commit where preserving
separate audited commits is material. Delete merged branches. A merge means the
change is eligible to become a release candidate; it does not mean it is approved
or deployed to production.

## Two-commit release-attestation flow

1. Collaborate and run checks on the feature branch and pull-request preview.
2. Complete the required pre-merge reviews.
3. Merge to `main` without triggering a production-domain deployment.
4. Freeze the resulting full `main` SHA as the **candidate commit**.
5. Build, hash and stage that exact candidate using the release policy.
6. Obtain final approval for the candidate SHA, exact `candidate_deployment_url` and
   artifact hashes.
7. From the candidate, open a metadata-only attestation pull request that adds
   only the selected release-specific files under
   `project-control/approvals/*.json` and `project-control/releases/*.json`.
8. Merge it to produce the **attestation commit**. Serialize the release lane so
   no unrelated commit enters `main` between candidate and attestation.
9. Verify the candidate is an ancestor of the attestation commit and that their
   complete diff contains only those selected JSON paths.
10. Create canonical annotated tag `vX.Y.Z` on the attestation commit, then
    promote the already-reviewed candidate deployment without rebuilding it.

This order avoids approving a feature-branch SHA that changes during squash or
merge and allows the approval itself to be committed without a circular commit
reference.

The release workflow must read `candidate_commit_sha` from the release metadata,
resolve the attestation SHA from `vX.Y.Z`, and enforce both checks below:

```text
candidate_commit_sha is an ancestor of attestation_commit_sha
diff(candidate_commit_sha, attestation_commit_sha) is limited to the two selected release JSON files
```

The allow-list is per release, not the entire two directories. Templates,
schemas, application source, tests, lockfiles, configuration, generated artifacts
and other release records are forbidden in the attestation diff.

## Conflict and change control

Rebase or merge carefully and rerun affected checks after conflict resolution.
Never accept both sides mechanically in calculation, route, schema, lockfile or
deployment conflicts. The responsible reviewer must inspect the resolved result.

Any non-attestation change after candidate approval invalidates release approval.
The sole exception is the verified attestation commit described above, because
it adds only the approval/release JSON that records the already-issued decision.
If any other path changes, create a new candidate, restage it, rerun affected
checks and obtain a new exact-candidate approval.

## Repository hygiene

- Commit the lockfile and pin the supported Node/package-manager versions.
- Keep build output, local environment files and credentials ignored.
- Do not commit large binaries when a reproducible source is practical.
- For required release binaries, record filename, size and SHA-256 in the release
  manifest.
- Use canonical annotated, immutable release tags in the exact form `vX.Y.Z`,
  such as `v1.4.0`, pointing to the attestation commit.
- Correct production code through a revert pull request or reviewed follow-up;
  never reset shared history.

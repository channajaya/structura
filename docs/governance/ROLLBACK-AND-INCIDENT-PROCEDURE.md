# Rollback and Incident Procedure

Status: mandatory

Objective: restore a safe service quickly while preserving evidence and Git history

## Incident triggers

Start this procedure for any production condition including:

- incorrect or unsafe engineering results;
- unauthorized access, cross-user data exposure or suspected secret leakage;
- payment, authentication, storage or data-integrity failure;
- failed migration, data loss or corrupted download/report;
- production domain pointing to an unapproved deployment;
- severe availability, performance or browser failure;
- any release whose candidate commit, staged deployment or artifact hashes differ
  from its approval, or whose tag/attestation ancestry or allow-listed diff fails.

## Severity

| Severity | Example | Initial action |
| --- | --- | --- |
| SEV-1 critical | Unsafe calculation, security/data breach, payment corruption, widespread outage | Freeze releases and contain/rollback immediately |
| SEV-2 high | Major workflow unavailable or materially wrong for many users | Contain promptly; rollback unless a safer rapid mitigation exists |
| SEV-3 moderate | Limited non-critical defect with workaround | Record, mitigate and schedule reviewed correction |

When uncertain, begin at the higher severity. AI may identify and recommend a
severity but the owner/incident lead confirms it.

## Immediate response

The incident lead performs these steps without waiting for root-cause certainty:

1. Open an incident issue and record UTC time, reporter, symptoms, affected
   routes/products, release tag and deployment ID.
2. Freeze production promotions and non-essential configuration changes.
3. Preserve relevant Vercel logs, screenshots, sample inputs/outputs, manifest,
   approval record and commit IDs without copying secrets or unnecessary user
   data.
4. Contain exposure: disable the affected feature, revoke a credential or place
   the service in safe maintenance mode when that is faster and safer.
5. Restore the last known-good approved Vercel deployment through the dashboard
   rollback control or by promoting its recorded deployment URL.
6. Run the critical production smoke checks and confirm the domain points to the
   restored deployment.
7. Notify affected owners/reviewers and users according to severity and legal or
   contractual duties.

For an incorrect Risk C result, disable or withdraw the affected calculator or
report immediately. Preserve the exact input/output case and involve the competent
engineer before declaring recovery. Assess whether previous users or submissions
require correction or notification.

## Rollback selection

Use only a previous deployment that has:

- a canonical annotated `vX.Y.Z` tag on a valid attestation commit;
- a matching approved candidate commit, deployment and artifact hashes;
- a verified candidate-ancestor and metadata-only attestation diff;
- a successful historical smoke-test record;
- compatibility with the current database and external configuration.

Do not blindly roll application code back across an irreversible schema change.
Follow the release's documented forward-fix or compatible rollback plan and
restore data only from a verified backup with owner authorization.

Rollback changes the production deployment first when user safety or availability
requires speed. Reconcile Git immediately afterward with a revert pull request or
reviewed corrective commit. Never force-push or reset shared history to hide the
faulty release.

## Secret or security incident

For a suspected credential exposure:

1. Revoke or rotate the credential before attempting history cleanup.
2. Review access/audit logs and affected privileges.
3. Replace dependent environment values and redeploy through the normal exact-
   candidate gate.
4. Invalidate sessions or keys where compromise is plausible.
5. Preserve only redacted evidence and determine notification obligations.

Do not publish exploit details or secret values in the incident issue.

## Recovery and corrective release

Recovery is complete only when:

- the production domain serves a known-good approved deployment;
- critical workflows and monitoring checks pass;
- security/data containment is confirmed;
- the incident lead records current user impact and any continuing limitation;
- the Git/release record matches the actual production state.

A corrective release follows the full issue, branch, independent check, staged
`--skip-domain` candidate, exact approval, metadata-only attestation, canonical
tag and promotion process. Urgency does not permit AI self-approval or an
unreviewed production rebuild.

## Post-incident review

For SEV-1 and SEV-2, complete a blameless review after containment. Record:

- timeline, detection source and duration;
- technical and process root causes;
- affected users, data, calculations and releases;
- why existing tests/gates did or did not detect the issue;
- recovery evidence and communication performed;
- corrective actions, owners, due dates and verification tests.

Update tests, monitoring, runbooks and these governance policies when required.
Close the incident only after actions are tracked in GitHub and the owner—and for
Risk C incidents, the competent engineer—accepts the recovery evidence.

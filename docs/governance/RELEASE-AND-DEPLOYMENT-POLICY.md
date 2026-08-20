# Release and Deployment Policy

Status: mandatory

Platform: Next.js 16 on Vercel

## Separation of environments

STRUCTURA uses three release stages:

| Stage | Purpose | Production domain allowed? |
| --- | --- | --- |
| Pull-request preview | Collaboration, UI review and non-production QA | No |
| Staged production candidate | Production build/runtime validation of an exact `main` commit | No; deploy with `--skip-domain` |
| Production | Public service after exact-candidate approval | Yes; promote the staged deployment |

Preview and production credentials/data must remain separated. Test transactions,
test users and synthetic projects are used outside production.

## No automatic production from `main`

A push or merge to `main` must not assign the production domain. Configure the
Vercel/Git integration so pull-request previews may be automatic while production
promotion remains manual. If the current free plan cannot enforce that separation,
disable Git-triggered production deployment and use the controlled CLI/dashboard
promotion workflow.

`main` means integrated and releasable after gates; it does not mean released.
The production record is canonical annotated tag `vX.Y.Z` on the attestation
commit plus the promoted candidate Vercel deployment.

## Candidate preparation

The release operator must:

1. Select a merged `main` commit, record its full SHA and freeze it as the
   candidate commit.
2. Use a clean checkout of that exact SHA with the repository-pinned Node,
   package-manager and Vercel CLI versions.
3. Install dependencies from the committed lockfile without updating it.
4. Run the repository's lint, type, test, security and production-build commands.
5. Generate candidate evidence containing the candidate SHA, toolchain, test
   summary, artifact filenames/hashes, migration and rollback information.
6. Confirm environment-variable names are present without printing values.
7. Stop if the workspace is dirty, a gate fails or the build is not reproducible.

## Staged Vercel deployment

Deploy the candidate with production build/runtime settings but without assigning
the production domain. The controlled command pattern is:

```text
vercel deploy --prod --skip-domain
```

Use the repository-pinned CLI invocation when one is defined. Capture the exact
exact `candidate_deployment_url`, candidate Git SHA, build logs and artifact hashes. Do not
rebuild or edit the deployment in the Vercel dashboard after recording it.

Validate the unaliased candidate with smoke and domain tests, including:

- home page and all changed routes;
- sign-in/sign-out and authorization boundaries when affected;
- calculation, report, download and project persistence flows when affected;
- payment test mode and webhook validation when affected;
- responsive layout, critical links, health endpoint and browser console;
- production configuration presence without revealing secret values.

## Approval, attestation, tag and promotion

After successful staging, obtain the required exact-candidate approval under the
[Engineering Review Gate](./ENGINEERING-REVIEW-GATE.md). Then:

1. Verify the approved candidate SHA, deployment and hashes byte-for-byte.
2. Create a short-lived attestation branch from the candidate commit. Add only
   the selected release-specific approval JSON and release JSON. These files
   identify `candidate_commit_sha`; neither may name its own containing commit.
3. Merge the metadata-only attestation pull request without allowing unrelated
   changes onto the release lane.
4. Resolve the new attestation commit and verify that the candidate is its
   ancestor and that the complete candidate-to-attestation diff contains only
   the two selected JSON paths. The allowed paths are exact workflow inputs, not
   directory-wide wildcards.
5. Create and push canonical annotated tag `vX.Y.Z`, for example `v1.4.0`,
   pointing to the attestation commit.
6. Promote the already-reviewed candidate deployment to the production domain
   using the
   Vercel promotion command/dashboard control, for example:

   ```text
   vercel promote <approved-deployment-url>
   ```

7. Do not trigger a new build from the attestation commit or tag. Its application
   tree is not the deployed identity; promotion reuses the staged candidate.
8. Run production smoke checks immediately.
9. Publish the changelog and link the tagged attestation records to the issue.

The two-commit verification is a release gate:

```text
candidate C -> metadata-only attestation A -> annotated tag vX.Y.Z
deploy and approve C; verify C is ancestor of A; allow only selected JSON in C..A
```

Failure of the ancestry or exact-diff check blocks tagging and promotion. A
non-metadata change requires a new candidate deployment and new approval.

Only an authorized human release operator promotes production. AI may prepare
commands and verify evidence but must pause before executing the promotion unless
the owner has explicitly authorized that exact release action.

## Release record

Record at minimum:

- canonical `vX.Y.Z` tag and attestation commit SHA derived from that tag;
- approved candidate commit SHA;
- issue and pull requests included;
- approver, approval timestamp and risk scope;
- staged/promoted Vercel deployment ID and URL;
- selected approval/release JSON paths and artifact SHA-256 values;
- tests, smoke checks and known limitations;
- migration, feature-flag and rollback details;
- production promotion time and operator.

SemVer is used: major for incompatible behaviour/data, minor for backward-
compatible features and patch for backward-compatible corrections. Engineering
method, code-edition or National Annex changes must be called out explicitly and
may justify a major version even when the UI is unchanged.

The release/approval JSON may record the candidate SHA but must not attempt to
record its own containing attestation SHA. The canonical tag supplies that
identity without a circular commit reference.

## Post-release checks

Confirm the production domain resolves to the approved deployment, critical
workflows pass, logs contain no new severe errors and monitored integrations are
healthy. Keep the previous known-good deployment available for rollback. A failed
post-release gate invokes the
[Rollback and Incident Procedure](./ROLLBACK-AND-INCIDENT-PROCEDURE.md).

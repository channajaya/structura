# STRUCTURA Production Governance

Status: mandatory

Repository: `channajaya/structura`

Initial implementation tracker: GitHub issue `#7`

This directory defines how STRUCTURA is researched, built, checked, approved,
released, deployed and recovered. Git is the authoritative record. A local file,
an AI conversation, a Vercel deployment or a merge to `main` is not, by itself,
a production release.

## Policy index

| Policy | Purpose |
| --- | --- |
| [AI Production Factory](./AI-PRODUCTION-FACTORY.md) | AI-led product workflow, roles, gates and evidence |
| [Git Collaboration Policy](./GIT-COLLABORATION-POLICY.md) | Issues, branches, commits, pull requests and review |
| [Engineering Review Gate](./ENGINEERING-REVIEW-GATE.md) | Risk classification and exact-candidate approval |
| [Release and Deployment Policy](./RELEASE-AND-DEPLOYMENT-POLICY.md) | Preview, staged deployment, promotion and release records |
| [Security and Secrets](./SECURITY-AND-SECRETS.md) | Access, credentials, dependencies and AI safety |
| [Rollback and Incident Procedure](./ROLLBACK-AND-INCIDENT-PROCEDURE.md) | Recovery, communication and corrective work |

## Non-negotiable controls

1. Every material change starts from an issue. Work created for the initial
   production factory must reference `#7` or a linked child issue.
2. All source, specifications, test evidence and release records are committed
   to Git. Generated binaries must be reproducible or covered by a recorded
   SHA-256 manifest.
3. AI may research, design, implement, test and prepare releases, but it may not
   approve its own output or authorize production.
4. The builder and independent checker must be separate roles and must not share
   hidden reasoning or unpublished assumptions.
5. A merge to `main` does not deploy production. Production is a separate,
   recorded promotion of an approved Vercel deployment.
6. Final approval identifies the immutable candidate commit, its staged
   deployment and artifact hashes. Approval/release JSON is then added by a
   metadata-only attestation commit; it does not alter the candidate application.
7. Risk A and B releases require the designated owner/domain approval. Risk C
   releases require a competent engineer's approval; AI checking does not
   replace professional engineering judgement.
8. Secrets never enter Git, prompts, issues, pull requests, build logs or release
   evidence.
9. Failed gates stop the workflow. They are not waived by AI or by a deployment
   deadline.
10. Production history is never rewritten. Faulty changes are corrected with a
    revert or a new reviewed commit.

## Two-commit release identity

Every production release has two distinct Git identities:

- the **candidate commit** contains the reviewed application, calculations,
  tests, documentation and release artifacts and is the source of the staged
  Vercel deployment; and
- the later **attestation commit** adds only the selected release-specific
  approval and release JSON records.

The human approval names the candidate SHA, staged deployment and artifact
hashes. It does not and cannot name the commit that will later contain the
approval record. The canonical annotated tag `vX.Y.Z` points to the attestation
commit. Release automation verifies that the candidate is its ancestor and that
the entire candidate-to-attestation diff contains only the selected metadata
JSON, proving that the application and artifacts did not change after review.

## Authority and changes

These policies apply to the Next.js 16 application, supporting packages,
calculators, content, infrastructure configuration and Vercel deployment. If
documents conflict, the stricter safety, security or engineering requirement
applies and the owner records the resolution in the relevant issue.

Changes to governance follow the same issue, branch and pull-request process as
product code. The repository owner approves governance changes; a competent
engineer also approves changes that reduce a Risk C control.

The owner reviews this set at least every six months and after any serious
incident, deployment-platform change or material change to the engineering
product scope.

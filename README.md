# STRUCTURA — Digital Engineering Office

STRUCTURA is a Next.js platform for engineering tools, project and commercial workflows, learning content and governed downloadable templates.

The current public launch is controlled by `config/publicLaunch.ts`. Some routes remain in the repository while temporary launch mode directs public traffic to Design Studio. Do not delete hidden products merely because they are not presently linked in the public navigation.

## Local development

This repository uses Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Before requesting review:

```bash
npm run governance:check
npm run lint
npm run build
```

## Production governance

Git is the authoritative technical and audit record. Every material change follows:

`Issue → Branch → Commits → Pull request → Independent checks → Human review → Candidate staging → Release attestation → Tag → Production promotion`

Start with [STRUCTURA Production Governance](./docs/governance/README.md). Machine-readable product, approval and release records are under [`project-control`](./project-control/README.md).

Key rules:

- Do not commit directly to `main`.
- AI may produce and check work but may not approve its own release.
- Risk C engineering outputs remain `DRAFT_NOT_FOR_USE` until a named competent engineer approves the exact candidate.
- A merge to `main` does not automatically publish production.
- Production may promote only the staged candidate identified by a valid approval record and canonical annotated `vX.Y.Z` attestation tag.
- Never commit secrets, customer data, paid standards or private project files.

## Deployment

Automatic Vercel Git deployment is disabled in `vercel.json`. Optional preview and staged-candidate workflows must be explicitly enabled and configured with separated environment credentials. Production promotion is manual, protected and release-record driven.

See [Release and Deployment Policy](./docs/governance/RELEASE-AND-DEPLOYMENT-POLICY.md) for the complete process.

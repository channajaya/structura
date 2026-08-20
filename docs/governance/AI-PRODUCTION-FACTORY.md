# AI Production Factory

Status: mandatory

Applies to: all STRUCTURA software, calculators, templates and release assets

## Operating model

STRUCTURA uses AI as the production team and people as accountable authorities.
AI performs routine research, specification, implementation, checking, testing,
documentation and packaging. The owner or competent engineer makes the final
release decision after reviewing one controlled candidate and its evidence.

The governing rule is:

> AI may create any draft, but only an approved exact candidate may be promoted
> to production.

## Roles and separation

| Role | Accountable output | Independence requirement |
| --- | --- | --- |
| AI orchestrator | State, task list, evidence index and gate status | Cannot approve or promote |
| AI researcher/specifier | Sources, requirements, assumptions and acceptance criteria | Must cite authoritative inputs |
| AI builder | Code, formulas, UI, migrations, documentation and tests | Cannot act as checker |
| Independent AI checker | Re-derived expectations, traceability review and defect report | Receives the approved specification and candidate, not builder reasoning |
| AI test/red-team agent | Automated, boundary, misuse, security and regression evidence | Must report failures without suppressing them |
| Human collaborator | Product, code, UX or domain review | Must disclose unresolved concerns |
| Owner/domain approver | Risk A/B release decision | Must approve the exact candidate |
| Competent engineer | Risk C engineering decision | Cannot be replaced by AI |
| Release operator | Attest, tag, promote, verify and record | May act only after valid approval |

One person may hold owner and release-operator roles. The AI builder, AI checker
and approval authority remain logically separate.

## Production states

`INTAKE -> SPECIFIED -> BUILDING -> CHECKING -> VALIDATING -> PR_READY -> CANDIDATE -> STAGED -> APPROVED -> ATTESTED -> RELEASED`

Exception states are `BLOCKED`, `REWORK`, `REJECTED` and `RETIRED`. Only the
orchestrator updates state, and it links the evidence supporting each transition.
No failed or incomplete gate may be relabelled as passed.

## Required workflow

### 1. Intake and classification

The orchestrator creates or links an issue and records:

- user, problem, product and jurisdiction;
- scope, exclusions and acceptance criteria;
- Risk A, B or C classification;
- affected routes, data, calculations and integrations;
- dependencies, licences and expected deployment impact;
- reviewers and final approval authority.

Unknown jurisdiction, uncertain engineering consequence, conflicting standards
or missing acceptance criteria place the item in `BLOCKED`.

### 2. Evidence and specification

The specifier produces version-controlled requirements before implementation.
Each material requirement and calculation receives a stable ID and maps to a
source or documented derivation, an implementation location and one or more
tests. The specification includes inputs, outputs, units, assumptions,
limitations, failure behaviour, accessibility, privacy and compatibility.

For code-based calculations, the evidence pack also fixes the design-code and
National Annex editions, factors, conventions, tolerances and benchmark cases.

### 3. Build

The builder works on the issue branch and creates the smallest complete change.
It must:

- follow the repository's locked toolchain and architecture;
- preserve auditability of formulas and transformations;
- add or update automated tests with the implementation;
- include loading, empty, invalid and failure states;
- update user, support and release documentation;
- avoid unrelated refactors and hidden hard-coded decisions;
- record any assumption not already in the specification.

### 4. Independent check

The checker independently derives expected behaviour from the specification and
authoritative sources, then examines the candidate. It verifies requirements,
formulas, units, data flow, permissions, error handling and tests. It must create
a defect list with severity, reproduction steps and affected requirement IDs.

The builder resolves defects in new commits. The checker reruns affected checks.
A checker cannot mark a result passed only because the builder says it is
correct.

### 5. Validation and red team

Validation includes, where applicable:

- lint, type, unit, integration and production-build checks;
- known-answer, independent-reference and reconciliation tests;
- zero, blank, negative, minimum, maximum and out-of-range inputs;
- unit, currency, locale, tax, rounding and date behaviour;
- authentication, authorization and cross-user/project isolation;
- dependency, secret and common web-vulnerability checks;
- responsive, keyboard, accessibility, print and report output;
- backward compatibility, migration and rollback behaviour;
- regression against the last production tag.

Red-team testing attempts plausible misuse, overwritten inputs, stale standards,
unexpected sequences, network failure and manipulated URLs or payloads.

### 6. Collaboration and release preparation

The orchestrator assembles a pull request under the
[Git Collaboration Policy](./GIT-COLLABORATION-POLICY.md). After merge, the exact
`main` commit becomes the immutable candidate commit. It is built and deployed
without the production domain. AI prepares a review pack containing:

- change and risk summary;
- requirements-to-source-to-code-to-test traceability;
- test and checker results, including resolved defects;
- sample inputs and outputs;
- limitations, migrations and rollback plan;
- candidate Git SHA, exact `candidate_deployment_url` and every artifact hash;
- a clear recommendation: approve, rework or reject.

The owner or engineer approves that candidate. AI may then prepare a separate,
metadata-only attestation pull request containing the selected release-specific
approval JSON and release JSON. Those records identify the earlier candidate;
they never identify their own containing commit. Automation must prove that the
candidate is an ancestor of the attestation commit and that no file other than
the two selected metadata records changed. The canonical annotated `vX.Y.Z` tag
is placed on the attestation commit, and the already-reviewed candidate
deployment is promoted without rebuilding it.

Approval, attestation and promotion follow the
[Engineering Review Gate](./ENGINEERING-REVIEW-GATE.md) and
[Release and Deployment Policy](./RELEASE-AND-DEPLOYMENT-POLICY.md).

## Quality gate

A candidate is `REVIEW_READY` only when:

| Measure | Minimum result |
| --- | --- |
| Material requirements mapped to implementation and tests | 100% |
| Material formulas mapped to a source or derivation | 100% |
| Required automated and known-answer tests | Pass |
| Open critical or high-severity defects | Zero |
| Unexplained hard-coded calculation decisions | Zero |
| Required documentation and rollback instructions | Complete |
| Known limitations and residual risks | Explicitly disclosed |

An approved exception must identify the requirement, reason, consequence, owner,
expiry and compensating control. Risk C calculation correctness, authorization,
secret exposure and inability to roll back are not waivable by AI.

## AI escalation rules

AI continues autonomously on routine implementation choices that conform to the
approved specification. It stops and requests a human decision for:

- a change in scope, jurisdiction, risk or professional responsibility;
- conflicting or unavailable authoritative sources;
- an irreversible migration or possible user-data loss;
- a new paid service or privilege expansion;
- a security credential, legal/licensing question or personal-data concern;
- a critical/high defect that cannot be resolved safely;
- final merge, engineering approval or production promotion.

All assumptions and escalations remain in GitHub issues or committed evidence;
they must not exist only in chat history.

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const projectControlRoot = resolve(repositoryRoot, "project-control");

const PRODUCT_STATUSES = new Set([
  "IDEA",
  "EVIDENCED",
  "SPECIFIED",
  "BUILDING",
  "TESTING",
  "COLLABORATION",
  "REVIEW_READY",
  "ENGINEER_REVIEW",
  "APPROVED",
  "RELEASED",
  "DEPLOYED",
  "BLOCKED",
  "REWORK",
  "DRAFT_NOT_FOR_USE",
  "RETIRED",
  "ROLLED_BACK"
]);

const RISK_LEVELS = new Set(["A", "B", "C"]);
const APPROVED_REVIEWER_DECISIONS = new Set(["APPROVED"]);
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SEMVER_TAG_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const RELEASE_STATUSES = new Set(["REVIEW_READY", "APPROVED", "RELEASED", "DEPLOYED", "ROLLED_BACK"]);
const PRODUCTION_RELEASE_STATUSES = new Set(["APPROVED", "RELEASED"]);
const RELEASABLE_PRODUCT_STATUSES = new Set(["REVIEW_READY", "ENGINEER_REVIEW", "APPROVED", "RELEASED", "DEPLOYED"]);
const REVIEWER_ROLES = new Set(["OWNER", "MAINTAINER", "COMMERCIAL_REVIEWER", "ENGINEER", "INDEPENDENT_CHECKER"]);

const REQUIRED_PATHS = [
  ".github/CODEOWNERS",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/workflows/quality-gates.yml",
  ".github/workflows/staged-candidate.yml",
  ".github/workflows/vercel-preview.yml",
  ".github/workflows/production-release.yml",
  "docs/governance/README.md",
  "docs/governance/AI-PRODUCTION-FACTORY.md",
  "docs/governance/GIT-COLLABORATION-POLICY.md",
  "docs/governance/ENGINEERING-REVIEW-GATE.md",
  "docs/governance/RELEASE-AND-DEPLOYMENT-POLICY.md",
  "docs/governance/SECURITY-AND-SECRETS.md",
  "docs/governance/ROLLBACK-AND-INCIDENT-PROCEDURE.md",
  "project-control/README.md",
  "project-control/schemas/product-manifest.schema.json",
  "project-control/schemas/release-manifest.schema.json",
  "project-control/schemas/approval-record.schema.json",
  "project-control/products/registry.json",
  "project-control/products/contractor-estimate-job-cost/product.json",
  "project-control/approvals/approval-record.template.json",
  "project-control/releases/release-manifest.template.json",
  "project-control/releases/README.md"
];

const JSON_PATHS = [
  "project-control/schemas/product-manifest.schema.json",
  "project-control/schemas/release-manifest.schema.json",
  "project-control/schemas/approval-record.schema.json",
  "project-control/products/registry.json",
  "project-control/products/contractor-estimate-job-cost/product.json",
  "project-control/approvals/approval-record.template.json",
  "project-control/releases/release-manifest.template.json"
];

const errors = [];
const notices = [];

function addError(message) {
  errors.push(message);
}

function readJson(filePath, label = relative(repositoryRoot, filePath)) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(`${label}: cannot parse JSON (${error.message})`);
    return null;
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidDateTime(value) {
  return isNonEmptyString(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}

function isStrictHttpsOrigin(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      isNonEmptyString(parsed.hostname) &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.pathname === "/" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      (value === parsed.origin || value === `${parsed.origin}/`)
    );
  } catch {
    return false;
  }
}

function isSafeRepositoryRelativePath(value) {
  if (!isNonEmptyString(value) || isAbsolute(value) || value.includes("\\") || value.includes("\0")) return false;
  const segments = value.split("/");
  return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isPathWithin(candidate, parent) {
  const pathFromParent = relative(parent, candidate);
  return pathFromParent === "" || (!pathFromParent.startsWith("..") && !isAbsolute(pathFromParent));
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    addError(`${label}: expected an object`);
    return false;
  }
  return true;
}

function requireFields(object, fields, label) {
  for (const field of fields) {
    if (!(field in object)) {
      addError(`${label}: missing required field '${field}'`);
    }
  }
}

function validateRequiredPaths() {
  for (const repositoryPath of REQUIRED_PATHS) {
    const absolutePath = resolve(repositoryRoot, repositoryPath);
    if (!existsSync(absolutePath)) {
      addError(`required governance path is missing: ${repositoryPath}`);
      continue;
    }
    if (!statSync(absolutePath).isFile()) {
      addError(`required governance path is not a file: ${repositoryPath}`);
    }
  }
}

function validateJsonFilesParse() {
  for (const repositoryPath of JSON_PATHS) {
    const absolutePath = resolve(repositoryRoot, repositoryPath);
    if (existsSync(absolutePath)) {
      readJson(absolutePath, repositoryPath);
    }
  }
}

function validateSchemaFiles() {
  for (const filename of [
    "product-manifest.schema.json",
    "release-manifest.schema.json",
    "approval-record.schema.json"
  ]) {
    const schemaPath = resolve(projectControlRoot, "schemas", filename);
    if (!existsSync(schemaPath)) continue;
    const schema = readJson(schemaPath, `project-control/schemas/${filename}`);
    if (!schema) continue;
    if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
      addError(`project-control/schemas/${filename}: must declare JSON Schema draft 2020-12`);
    }
    if (schema.type !== "object") {
      addError(`project-control/schemas/${filename}: root schema type must be 'object'`);
    }
  }
}

function validateProductManifest(manifest, label, registryProduct = null) {
  if (!requireObject(manifest, label)) return;
  requireFields(
    manifest,
    [
      "schema_version",
      "sku",
      "slug",
      "title",
      "description",
      "risk_level",
      "status",
      "version",
      "jurisdictions",
      "standards",
      "routes",
      "requirements",
      "formula_register",
      "source_register",
      "test_register",
      "known_limitations",
      "builder_agent",
      "checker_agent",
      "human_reviewers",
      "approved_commit",
      "artifact_hashes",
      "release_tag",
      "deployment_id",
      "legacy",
      "legacy_review_required"
    ],
    label
  );

  if (!RISK_LEVELS.has(manifest.risk_level)) {
    addError(`${label}: invalid risk_level '${manifest.risk_level}'`);
  }
  if (!PRODUCT_STATUSES.has(manifest.status)) {
    addError(`${label}: invalid status '${manifest.status}'`);
  }
  if (!SEMVER_PATTERN.test(manifest.version ?? "")) {
    addError(`${label}: version must be semantic versioning without a leading 'v'`);
  }
  if (!isNonEmptyString(manifest.sku) || !isNonEmptyString(manifest.slug) || !isNonEmptyString(manifest.title)) {
    addError(`${label}: sku, slug and title must be non-empty strings`);
  }
  for (const arrayField of [
    "jurisdictions",
    "standards",
    "routes",
    "requirements",
    "formula_register",
    "source_register",
    "test_register",
    "known_limitations",
    "human_reviewers"
  ]) {
    if (!Array.isArray(manifest[arrayField])) {
      addError(`${label}: ${arrayField} must be an array`);
    }
  }
  if (Array.isArray(manifest.routes) && (manifest.routes.length === 0 || manifest.routes.some((route) => !isNonEmptyString(route) || !route.startsWith("/")))) {
    addError(`${label}: routes must contain at least one absolute application route`);
  }
  if (!manifest.artifact_hashes || typeof manifest.artifact_hashes !== "object" || Array.isArray(manifest.artifact_hashes)) {
    addError(`${label}: artifact_hashes must be an object`);
  } else {
    for (const [artifact, digest] of Object.entries(manifest.artifact_hashes)) {
      if (!isNonEmptyString(artifact) || !SHA256_PATTERN.test(digest)) {
        addError(`${label}: artifact_hashes['${artifact}'] must be a 64-character SHA-256 digest`);
      }
    }
  }
  if (manifest.approved_commit !== null && !COMMIT_PATTERN.test(manifest.approved_commit ?? "")) {
    addError(`${label}: approved_commit must be null or an exact 40-character Git commit SHA`);
  }
  if (manifest.release_tag !== null && !SEMVER_TAG_PATTERN.test(manifest.release_tag ?? "")) {
    addError(`${label}: release_tag must be null or a canonical v-prefixed semantic-version tag`);
  }
  if (manifest.risk_level === "C" && ["APPROVED", "RELEASED", "DEPLOYED"].includes(manifest.status)) {
    if (!COMMIT_PATTERN.test(manifest.approved_commit ?? "") || !Array.isArray(manifest.human_reviewers) || manifest.human_reviewers.length === 0) {
      addError(`${label}: approved/released/deployed Risk C products require an approved commit and named human reviewer`);
    }
  }

  if (registryProduct) {
    for (const field of ["sku", "slug", "risk_level", "status"]) {
      if (manifest[field] !== registryProduct[field]) {
        addError(`${label}: ${field} does not match products/registry.json`);
      }
    }
    const manifestRoutes = JSON.stringify([...(manifest.routes ?? [])].sort());
    const registryRoutes = JSON.stringify([...(registryProduct.routes ?? [])].sort());
    if (manifestRoutes !== registryRoutes) {
      addError(`${label}: routes do not match products/registry.json`);
    }
  }
}

function validateRegistry() {
  const registryPath = resolve(projectControlRoot, "products", "registry.json");
  if (!existsSync(registryPath)) return;
  const registry = readJson(registryPath, "project-control/products/registry.json");
  if (!requireObject(registry, "project-control/products/registry.json")) return;
  requireFields(registry, ["schema_version", "updated_at", "products"], "project-control/products/registry.json");
  if (!Array.isArray(registry.products) || registry.products.length === 0) {
    addError("project-control/products/registry.json: products must be a non-empty array");
    return;
  }

  const seenSkus = new Set();
  const seenSlugs = new Set();
  const seenRoutes = new Set();
  let pilot = null;
  let designStudio = null;

  for (const [index, product] of registry.products.entries()) {
    const label = `project-control/products/registry.json products[${index}]`;
    if (!requireObject(product, label)) continue;
    requireFields(
      product,
      [
        "sku",
        "slug",
        "title",
        "routes",
        "risk_level",
        "status",
        "legacy",
        "engineering_content",
        "legacy_review_required",
        "manifest",
        "notes"
      ],
      label
    );
    if (!RISK_LEVELS.has(product.risk_level)) addError(`${label}: invalid risk_level '${product.risk_level}'`);
    if (!PRODUCT_STATUSES.has(product.status)) addError(`${label}: invalid status '${product.status}'`);
    if (!isNonEmptyString(product.sku) || !isNonEmptyString(product.slug) || !isNonEmptyString(product.title)) {
      addError(`${label}: sku, slug and title must be non-empty strings`);
    }
    if (seenSkus.has(product.sku)) addError(`${label}: duplicate sku '${product.sku}'`);
    if (seenSlugs.has(product.slug)) addError(`${label}: duplicate slug '${product.slug}'`);
    seenSkus.add(product.sku);
    seenSlugs.add(product.slug);

    if (!Array.isArray(product.routes) || product.routes.length === 0) {
      addError(`${label}: routes must be a non-empty array`);
    } else {
      for (const route of product.routes) {
        if (!isNonEmptyString(route) || !route.startsWith("/")) {
          addError(`${label}: invalid application route '${route}'`);
        } else if (seenRoutes.has(route)) {
          addError(`${label}: duplicate application route '${route}'`);
        } else {
          seenRoutes.add(route);
        }
      }
    }

    if (product.slug === "design-studio") designStudio = product;
    if (product.sku === "STRUCTURA-TPL-EST-001") pilot = product;

    if (isNonEmptyString(product.manifest)) {
      const manifestPath = resolve(projectControlRoot, product.manifest);
      if (!isPathWithin(manifestPath, projectControlRoot)) {
        addError(`${label}: manifest path escapes project-control`);
      } else if (!existsSync(manifestPath)) {
        addError(`${label}: manifest does not exist at project-control/${product.manifest}`);
      } else {
        const manifest = readJson(manifestPath, `project-control/${product.manifest}`);
        if (manifest) validateProductManifest(manifest, `project-control/${product.manifest}`, product);
      }
    } else if (!product.legacy) {
      addError(`${label}: non-legacy products must link a governed manifest`);
    }
  }

  if (!designStudio) {
    addError("project-control/products/registry.json: Design Studio legacy entry is missing");
  } else if (
    designStudio.risk_level !== "C" ||
    designStudio.legacy !== true ||
    designStudio.engineering_content !== true ||
    designStudio.legacy_review_required !== true ||
    designStudio.status !== "DRAFT_NOT_FOR_USE"
  ) {
    addError("project-control/products/registry.json: engineering Design Studio must be Risk C, legacy, DRAFT_NOT_FOR_USE and legacy-review-required");
  }

  if (!pilot) {
    addError("project-control/products/registry.json: contractor estimate/job-cost pilot is missing");
  } else if (pilot.risk_level !== "B" || pilot.legacy !== false) {
    addError("project-control/products/registry.json: pilot must remain a governed non-legacy Risk B product");
  }
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function approvedReviewers(approval) {
  return Array.isArray(approval.reviewers)
    ? approval.reviewers.filter(
        (reviewer) =>
          reviewer &&
          APPROVED_REVIEWER_DECISIONS.has(reviewer.decision) &&
          isNonEmptyString(reviewer.name) &&
          isValidDateTime(reviewer.reviewed_at)
      )
    : [];
}

function validateApprovalByRisk(approval, label) {
  if (!Array.isArray(approval.reviewers) || approval.reviewers.length === 0) {
    addError(`${label}: reviewers must contain the risk-required human approvals`);
    return;
  }

  for (const [index, reviewer] of approval.reviewers.entries()) {
    const reviewerLabel = `${label} reviewers[${index}]`;
    if (!requireObject(reviewer, reviewerLabel)) continue;
    requireFields(reviewer, ["name", "role", "decision", "reviewed_at"], reviewerLabel);
    if (!isNonEmptyString(reviewer.name)) addError(`${reviewerLabel}: name must be non-empty`);
    if (!REVIEWER_ROLES.has(reviewer.role)) addError(`${reviewerLabel}: invalid role '${reviewer.role}'`);
    if (reviewer.decision !== "APPROVED") addError(`${reviewerLabel}: decision must be exactly APPROVED`);
    if (!isValidDateTime(reviewer.reviewed_at)) addError(`${reviewerLabel}: reviewed_at must be a non-empty ISO date-time`);
  }

  const approved = approvedReviewers(approval);
  const roles = new Set(approved.map((reviewer) => reviewer.role));

  if (approval.risk_level === "A" && !roles.has("OWNER") && !roles.has("MAINTAINER")) {
    addError(`${label}: Risk A approval requires an approving OWNER or MAINTAINER`);
  }
  if (approval.risk_level === "B") {
    if (!roles.has("OWNER")) addError(`${label}: Risk B approval requires an approving OWNER`);
    if (!roles.has("COMMERCIAL_REVIEWER") && !roles.has("ENGINEER")) {
      addError(`${label}: Risk B approval requires an approving COMMERCIAL_REVIEWER or ENGINEER`);
    }
  }
  if (approval.risk_level === "C") {
    if (!roles.has("OWNER")) addError(`${label}: Risk C approval requires an approving OWNER`);
    if (!roles.has("ENGINEER")) addError(`${label}: Risk C approval requires a named approving ENGINEER`);
  }
}

function validateApprovalArtifactParity(approval, release, approvalLabel, releaseLabel) {
  if (!requireObject(approval.artifact_hashes, `${approvalLabel} artifact_hashes`)) return;

  const approvalEntries = Object.entries(approval.artifact_hashes);
  if (approvalEntries.length === 0) {
    addError(`${approvalLabel}: artifact_hashes must contain at least one reviewed artifact`);
  }
  for (const [artifactPath, digest] of approvalEntries) {
    if (!isSafeRepositoryRelativePath(artifactPath)) {
      addError(`${approvalLabel}: artifact_hashes key '${artifactPath}' must be a safe repository-relative artifact path`);
    }
    if (!SHA256_PATTERN.test(digest ?? "") || /^0{64}$/.test(digest ?? "")) {
      addError(`${approvalLabel}: artifact_hashes['${artifactPath}'] must be a non-placeholder 64-character SHA-256 digest`);
    }
  }

  const releaseMap = new Map();
  if (Array.isArray(release.artifacts)) {
    for (const artifact of release.artifacts) {
      if (artifact && isNonEmptyString(artifact.path) && isNonEmptyString(artifact.sha256)) {
        releaseMap.set(artifact.path, artifact.sha256.toLowerCase());
      }
    }
  }
  const approvalMap = new Map(approvalEntries.map(([artifactPath, digest]) => [artifactPath, String(digest).toLowerCase()]));
  const releasePaths = [...releaseMap.keys()].sort();
  const approvalPaths = [...approvalMap.keys()].sort();

  if (JSON.stringify(releasePaths) !== JSON.stringify(approvalPaths)) {
    addError(`${releaseLabel}: release artifact paths do not exactly match ${approvalLabel} artifact_hashes`);
    return;
  }
  for (const artifactPath of releasePaths) {
    if (releaseMap.get(artifactPath) !== approvalMap.get(artifactPath)) {
      addError(`${releaseLabel}: SHA-256 for '${artifactPath}' does not exactly match ${approvalLabel}`);
    }
  }
}

function resolveReleaseArgument(argument) {
  return isAbsolute(argument) ? resolve(argument) : resolve(repositoryRoot, argument);
}

function validateReleaseProduct(release, releaseLabel) {
  const registryPath = resolve(projectControlRoot, "products", "registry.json");
  const registry = readJson(registryPath, "project-control/products/registry.json");
  if (!registry || !Array.isArray(registry.products)) return;

  const product = registry.products.find((entry) => entry?.sku === release.product_sku);
  if (!product) {
    addError(`${releaseLabel}: product_sku '${release.product_sku}' is not registered`);
    return;
  }
  if (product.legacy || !isNonEmptyString(product.manifest)) {
    addError(`${releaseLabel}: legacy product '${release.product_sku}' requires a governed per-SKU manifest before release`);
    return;
  }
  if (product.risk_level !== release.risk_level) {
    addError(`${releaseLabel}: risk_level does not match the registered product`);
  }
  if (!RELEASABLE_PRODUCT_STATUSES.has(product.status)) {
    addError(`${releaseLabel}: registered product status '${product.status}' is not release-ready`);
  }

  const manifestPath = resolve(projectControlRoot, product.manifest);
  if (!isPathWithin(manifestPath, projectControlRoot) || !existsSync(manifestPath)) return;
  const manifestLabel = `project-control/${product.manifest}`;
  const manifest = readJson(manifestPath, manifestLabel);
  if (!manifest) return;
  if (manifest.sku !== release.product_sku) addError(`${releaseLabel}: product_sku does not match ${manifestLabel}`);
  if (manifest.version !== release.product_version) addError(`${releaseLabel}: product_version does not match ${manifestLabel}`);
  if (manifest.risk_level !== release.risk_level) addError(`${releaseLabel}: risk_level does not match ${manifestLabel}`);
  if (!RELEASABLE_PRODUCT_STATUSES.has(manifest.status)) {
    addError(`${releaseLabel}: product manifest status '${manifest.status}' is not release-ready`);
  }
}

function validateRelease(releaseArgument) {
  const releasesRoot = resolve(projectControlRoot, "releases");
  const releasePath = resolveReleaseArgument(releaseArgument);
  const releaseLabel = relative(repositoryRoot, releasePath) || releasePath;

  if (!isPathWithin(releasePath, releasesRoot)) {
    addError(`--release must identify a JSON file inside project-control/releases: ${releaseArgument}`);
    return;
  }
  if (!existsSync(releasePath) || !statSync(releasePath).isFile()) {
    addError(`release manifest does not exist: ${releaseArgument}`);
    return;
  }

  const release = readJson(releasePath, releaseLabel);
  if (!requireObject(release, releaseLabel)) return;
  requireFields(
    release,
    [
      "schema_version",
      "release_id",
      "release_tag",
      "product_sku",
      "product_version",
      "risk_level",
      "status",
      "candidate_commit_sha",
      "approval_record",
      "created_at",
      "artifacts",
      "deployment"
    ],
    releaseLabel
  );

  if (!SEMVER_TAG_PATTERN.test(release.release_tag ?? "")) {
    addError(`${releaseLabel}: release_tag must be a canonical v-prefixed semantic-version tag`);
  }
  if (release.schema_version !== "1.0.0") {
    addError(`${releaseLabel}: schema_version must be '1.0.0'`);
  }
  if (!isNonEmptyString(release.release_id) || !isNonEmptyString(release.product_sku)) {
    addError(`${releaseLabel}: release_id and product_sku must be non-empty strings`);
  }
  if (!SEMVER_PATTERN.test(release.product_version ?? "")) {
    addError(`${releaseLabel}: product_version must be semantic versioning without a leading 'v'`);
  }
  if (!RISK_LEVELS.has(release.risk_level)) {
    addError(`${releaseLabel}: invalid risk_level '${release.risk_level}'`);
  }
  if (!RELEASE_STATUSES.has(release.status)) {
    addError(`${releaseLabel}: invalid release status '${release.status}'`);
  } else if (!PRODUCTION_RELEASE_STATUSES.has(release.status)) {
    addError(`${releaseLabel}: production release status must be APPROVED or RELEASED`);
  }
  if (!isValidDateTime(release.created_at)) {
    addError(`${releaseLabel}: created_at must be a non-empty ISO date-time`);
  }
  if (!COMMIT_PATTERN.test(release.candidate_commit_sha ?? "") || /^0{40}$/.test(release.candidate_commit_sha ?? "")) {
    addError(`${releaseLabel}: candidate_commit_sha must be a non-placeholder exact 40-character Git commit SHA`);
  }
  validateReleaseProduct(release, releaseLabel);
  if (!isNonEmptyString(release.approval_record)) {
    addError(`${releaseLabel}: approval_record must be a non-empty repository-relative path`);
  } else {
    const approvalRoot = resolve(projectControlRoot, "approvals");
    const approvalPath = resolve(repositoryRoot, release.approval_record);
    const approvalLabel = relative(repositoryRoot, approvalPath);
    if (!isPathWithin(approvalPath, approvalRoot)) {
      addError(`${releaseLabel}: approval_record must be inside project-control/approvals`);
    } else if (!existsSync(approvalPath) || !statSync(approvalPath).isFile()) {
      addError(`${releaseLabel}: approval record does not exist at ${release.approval_record}`);
    } else {
      const approval = readJson(approvalPath, approvalLabel);
      if (requireObject(approval, approvalLabel)) {
        requireFields(
          approval,
          [
            "schema_version",
            "record_id",
            "product_sku",
            "risk_level",
            "release_tag",
            "candidate_commit_sha",
            "candidate_deployment_url",
            "artifact_hashes",
            "decision",
            "conditions",
            "reviewers",
            "reviewed_at",
            "evidence",
            "notes"
          ],
          approvalLabel
        );
        if (approval.decision !== "APPROVED") {
          addError(`${approvalLabel}: decision must be exactly APPROVED`);
        }
        if (!Array.isArray(approval.conditions) || approval.conditions.length !== 0) {
          addError(`${approvalLabel}: conditions must be an empty array for a production-releasable approval`);
        }
        if (!COMMIT_PATTERN.test(approval.candidate_commit_sha ?? "") || /^0{40}$/.test(approval.candidate_commit_sha ?? "")) {
          addError(`${approvalLabel}: candidate_commit_sha must be a non-placeholder exact 40-character Git commit SHA`);
        }
        if (approval.candidate_commit_sha !== release.candidate_commit_sha) {
          addError(`${releaseLabel}: candidate_commit_sha does not exactly match ${approvalLabel}`);
        }
        if (!SEMVER_TAG_PATTERN.test(approval.release_tag ?? "")) {
          addError(`${approvalLabel}: release_tag must be a canonical v-prefixed semantic-version tag`);
        }
        if (approval.release_tag !== release.release_tag) {
          addError(`${releaseLabel}: release_tag does not exactly match ${approvalLabel}`);
        }
        if (approval.product_sku !== release.product_sku) {
          addError(`${releaseLabel}: product_sku does not exactly match ${approvalLabel}`);
        }
        if (approval.risk_level !== release.risk_level) {
          addError(`${releaseLabel}: risk_level does not exactly match ${approvalLabel}`);
        }
        if (!isStrictHttpsOrigin(approval.candidate_deployment_url)) {
          addError(`${approvalLabel}: candidate_deployment_url must be an exact HTTPS origin with no credentials, path, query or fragment`);
        }
        if (!isValidDateTime(approval.reviewed_at)) {
          addError(`${approvalLabel}: reviewed_at must be a non-empty ISO date-time`);
        }
        if (!Array.isArray(approval.evidence) || approval.evidence.length === 0 || approval.evidence.some((item) => !isNonEmptyString(item))) {
          addError(`${approvalLabel}: evidence must contain at least one non-empty review-evidence reference`);
        }
        validateApprovalArtifactParity(approval, release, approvalLabel, releaseLabel);
        validateApprovalByRisk(approval, approvalLabel);
      }
    }
  }

  if (!Array.isArray(release.artifacts) || release.artifacts.length === 0) {
    addError(`${releaseLabel}: artifacts must contain at least one hashed artifact`);
  } else {
    const seenArtifactPaths = new Set();
    for (const [index, artifact] of release.artifacts.entries()) {
      const artifactLabel = `${releaseLabel} artifacts[${index}]`;
      if (!requireObject(artifact, artifactLabel)) continue;
      requireFields(artifact, ["name", "path", "sha256"], artifactLabel);
      if (!isNonEmptyString(artifact.name)) addError(`${artifactLabel}: name must be non-empty`);
      if (!isNonEmptyString(artifact.path)) {
        addError(`${artifactLabel}: path must be non-empty`);
        continue;
      }
      if (!isSafeRepositoryRelativePath(artifact.path)) {
        addError(`${artifactLabel}: path must be a safe repository-relative artifact path`);
        continue;
      }
      if (!SHA256_PATTERN.test(artifact.sha256 ?? "") || /^0{64}$/.test(artifact.sha256 ?? "")) {
        addError(`${artifactLabel}: sha256 must be a non-placeholder 64-character hexadecimal digest`);
      }
      const artifactPath = resolve(repositoryRoot, artifact.path);
      if (!isPathWithin(artifactPath, repositoryRoot)) {
        addError(`${artifactLabel}: path escapes the repository`);
        continue;
      }
      if (seenArtifactPaths.has(artifactPath)) {
        addError(`${artifactLabel}: duplicate artifact path '${artifact.path}'`);
        continue;
      }
      seenArtifactPaths.add(artifactPath);
      if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
        addError(`${artifactLabel}: artifact file does not exist at '${artifact.path}'`);
        continue;
      }
      if (SHA256_PATTERN.test(artifact.sha256 ?? "") && sha256File(artifactPath).toLowerCase() !== artifact.sha256.toLowerCase()) {
        addError(`${artifactLabel}: declared SHA-256 does not match the artifact file`);
      }
    }
  }
}

function parseArguments(argumentsList) {
  if (argumentsList.length === 0) return { release: null };
  if (argumentsList.length === 2 && argumentsList[0] === "--release" && isNonEmptyString(argumentsList[1])) {
    return { release: argumentsList[1] };
  }
  addError("usage: node scripts/validate-governance.mjs [--release project-control/releases/<manifest>.json]");
  return { release: null };
}

const options = parseArguments(process.argv.slice(2));

validateRequiredPaths();
validateJsonFilesParse();
validateSchemaFiles();
validateRegistry();
if (options.release) validateRelease(options.release);

for (const notice of notices) console.log(`NOTICE: ${notice}`);

if (errors.length > 0) {
  console.error(`STRUCTURA governance validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`STRUCTURA governance validation passed${options.release ? " including controlled release checks" : ""}.`);

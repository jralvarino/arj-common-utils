#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Usage: ./deploy.sh [patch|minor|major]
# Default bump type is "patch".
# Requires: AWS CLI configured with permissions to CodeArtifact.
#
# Required environment variables (set in CI or export locally):
#   CODEARTIFACT_DOMAIN        - CodeArtifact domain name
#   CODEARTIFACT_DOMAIN_OWNER  - AWS account ID that owns the domain
#   CODEARTIFACT_REPOSITORY    - CodeArtifact repository name
#   CODEARTIFACT_REGION        - AWS region (e.g. us-east-1)
#   NPM_SCOPE                  - npm scope (e.g. @arj)
# ---------------------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load .env from project root if present
if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -o allexport
  # shellcheck source=/dev/null
  source "${ROOT_DIR}/.env"
  set +o allexport
fi

BUMP=${1:-patch}
DOMAIN="${CODEARTIFACT_DOMAIN:?env var CODEARTIFACT_DOMAIN is required}"
DOMAIN_OWNER="${CODEARTIFACT_DOMAIN_OWNER:?env var CODEARTIFACT_DOMAIN_OWNER is required}"
REPOSITORY="${CODEARTIFACT_REPOSITORY:?env var CODEARTIFACT_REPOSITORY is required}"
REGION="${CODEARTIFACT_REGION:?env var CODEARTIFACT_REGION is required}"
SCOPE="${NPM_SCOPE:?env var NPM_SCOPE is required}"
REGISTRY_URL="https://${DOMAIN}-${DOMAIN_OWNER}.d.codeartifact.${REGION}.amazonaws.com/npm/${REPOSITORY}/"

# --- Validate bump type ---
if [[ ! "$BUMP" =~ ^(patch|minor|major)$ ]]; then
  echo "ERROR: invalid bump type '${BUMP}'. Use patch, minor, or major." >&2
  exit 1
fi

echo "==> Running tests..."
cd "$ROOT_DIR"
npm test

echo "==> Bumping version (${BUMP})..."
npm version "$BUMP" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "    New version: ${NEW_VERSION}"

echo "==> Building..."
npm run build

echo "==> Authenticating with AWS CodeArtifact..."
CODEARTIFACT_TOKEN=$(aws codeartifact get-authorization-token \
  --domain "$DOMAIN" \
  --domain-owner "$DOMAIN_OWNER" \
  --region "$REGION" \
  --query authorizationToken \
  --output text)

# Write .npmrc with auth token — project-level takes precedence over global config.
# .npmrc is gitignored so it is safe to overwrite.
cat > "${ROOT_DIR}/.npmrc" <<EOF
registry=https://registry.npmjs.org/
${SCOPE}:registry=${REGISTRY_URL}
//${DOMAIN}-${DOMAIN_OWNER}.d.codeartifact.${REGION}.amazonaws.com/npm/${REPOSITORY}/:_authToken=${CODEARTIFACT_TOKEN}
EOF

cleanup() {
  # Remove auth token but keep registry config
  printf 'registry=https://registry.npmjs.org/\n%s:registry=%s\n' "$SCOPE" "$REGISTRY_URL" \
    > "${ROOT_DIR}/.npmrc"
}
trap cleanup EXIT

echo "==> Publishing v${NEW_VERSION} to CodeArtifact..."
npm publish

echo ""
echo "Successfully deployed ${SCOPE}/arj-common-utils@${NEW_VERSION} to CodeArtifact."

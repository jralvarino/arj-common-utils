# ARJ Common Utils

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?logo=amazondynamodb&logoColor=white)
![AWS Secrets Manager](https://img.shields.io/badge/Secrets_Manager-DD344C?logo=amazonaws&logoColor=white)
![Middy](https://img.shields.io/badge/Middy-6.x-black?logo=nodedotjs&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4.x-3068B7?logo=zod&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Shared TypeScript library providing common utilities for AWS Lambda projects. Centralizes HTTP response helpers, structured logging, DynamoDB client, error handling, Middy middlewares, and base models and services — so each Lambda function stays thin and consistent.

## Modules

| Import path | What it provides |
|---|---|
| `@arj/arj-common-utils/util` | HTTP response helpers (`success`, `created`, `noContent`) + structured logger (`createLogger`) |
| `@arj/arj-common-utils/db` | Pre-configured DynamoDB document client (`ddb`) |
| `@arj/arj-common-utils/error` | `CommonError` and typed subclasses (`NotFoundError`, `BadRequestError`, etc.) |
| `@arj/arj-common-utils/middleware` | Middy middlewares: `globalExceptionHandler`, `zodValidator`, `requestLoggingMiddleware`, `extractUserIdMiddleware` |
| `@arj/arj-common-utils/model` | Shared domain models (e.g. `User`) |
| `@arj/arj-common-utils/service` | Base service implementations (e.g. `UserService`) |

## Build

```bash
npm install
npm run build
```

## Using in a Lambda project

### 1. Configure the scoped registry

In the **consuming project**, create or edit `.npmrc` at the root:

```ini
# Default registry: public npm
registry=https://registry.npmjs.org/

# Only @arj packages come from CodeArtifact
@arj:registry=https://YOUR_DOMAIN-YOUR_AWS_ACCOUNT_ID.d.codeartifact.YOUR_REGION.amazonaws.com/npm/YOUR_REPOSITORY/
```

> Replace `YOUR_DOMAIN`, `YOUR_AWS_ACCOUNT_ID`, `YOUR_REGION`, and `YOUR_REPOSITORY` with your own AWS CodeArtifact values.

Using a scoped registry avoids the 404 errors you get when `aws codeartifact login` overrides the default registry for all packages.

### 2. Authenticate with CodeArtifact (once per session, token valid 12 h)

```bash
aws codeartifact login --tool npm \
  --domain YOUR_DOMAIN \
  --domain-owner YOUR_AWS_ACCOUNT_ID \
  --region YOUR_REGION \
  --repository YOUR_REPOSITORY
```

Then reset the default registry back to npm (the login command overrides it):

```bash
npm config set registry https://registry.npmjs.org/
```

### 3. Install the package

```bash
npm install @arj/arj-common-utils
```

### 4. Import and use

**Response helpers (TypeScript):**

```typescript
import { success, created, noContent } from "@arj/arj-common-utils/util";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return success({ message: "Ok" });
};
```

**Response helpers (JavaScript/CommonJS):**

```javascript
const { success, created, noContent } = require("@arj/arj-common-utils/util");

exports.handler = async (event) => {
  return success({ message: "Ok" });
};
```

**Structured logger:**

```typescript
import { createLogger } from "@arj/arj-common-utils/util";

const logger = createLogger("my-lambda-api");

export const handler = async (event: APIGatewayProxyEvent) => {
  logger.info("Event received", { path: event.path });
  return success({ message: "Ok" });
};
```

**Middy middlewares:**

```typescript
import middy from "@middy/core";
import { z } from "zod";
import {
  globalExceptionHandler,
  zodValidator,
  requestLoggingMiddleware,
  extractUserIdMiddleware,
} from "@arj/arj-common-utils/middleware";
import { success } from "@arj/arj-common-utils/util";

const schema = z.object({
  body: z.string().nullable(),
  pathParameters: z.object({ id: z.string() }),
  queryStringParameters: z.object({}).optional(),
});

const baseHandler = async (event) => {
  return success({ message: "Ok" });
};

export const handler = middy(baseHandler)
  .use(requestLoggingMiddleware())
  .use(extractUserIdMiddleware())
  .use(zodValidator(schema))
  .use(globalExceptionHandler());
```

**DynamoDB client:**

```typescript
import { ddb } from "@arj/arj-common-utils/db";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const result = await ddb.send(
  new GetCommand({ TableName: "my-table", Key: { pk: "123" } })
);
```

**Error handling:**

```typescript
import { NotFoundError, BadRequestError } from "@arj/arj-common-utils/error";

throw new NotFoundError("Item not found");
throw new BadRequestError("Invalid input", { field: "email" });
```

> The package ships with full TypeScript declarations (`.d.ts`). Add `@types/aws-lambda` to `devDependencies` for Lambda event types.

## Publish to AWS CodeArtifact

The deploy script handles versioning, build, authentication, and publishing in a single step.

### 1. Configure environment variables

Copy `.env.example` to `.env` (already gitignored) at the project root and fill in your values:

```bash
cp .env.example .env
```

```dotenv
CODEARTIFACT_DOMAIN=your-domain
CODEARTIFACT_DOMAIN_OWNER=your-aws-account-id
CODEARTIFACT_REPOSITORY=your-repository
CODEARTIFACT_REGION=us-east-1
NPM_SCOPE=@arj
```

> In CI pipelines, set these as environment secrets — the `.env` file is not required.

### 2. Run the deploy script

```bash
# bump patch (e.g. 1.0.5 → 1.0.6) — default
npm run deploy

# bump minor (e.g. 1.0.5 → 1.1.0)
npm run deploy -- minor

# bump major (e.g. 1.0.5 → 2.0.0)
npm run deploy -- major
```

The script (`infrastructure/deployment/deploy.sh`) will:
1. Run the test suite
2. Bump the version in `package.json`
3. Build the project
4. Obtain a short-lived CodeArtifact authorization token via the AWS CLI
5. Publish the package and clean up the token

**Prerequisites:** AWS CLI configured with `codeartifact:GetAuthorizationToken` and `codeartifact:PublishPackageVersion` permissions.

## Layout

```
src/
├── db/           # DynamoDB document client
├── error/        # CommonError and typed subclasses
├── middleware/   # Middy middlewares
├── model/        # Shared domain models
├── repository/   # Internal repository implementations (not exported)
├── service/      # Service implementations
└── util/         # HTTP response helpers + logger
test/             # Unit tests (Vitest)
infrastructure/
├── aws/          # SAM/CloudFormation templates
└── deployment/   # deploy.sh — versioning + CodeArtifact publish
dist/             # Compiled output (after npm run build)
```

# ARJ Common Utils

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?logo=awslambda&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?logo=amazondynamodb&logoColor=white)
![AWS Secrets Manager](https://img.shields.io/badge/Secrets_Manager-DD344C?logo=amazonaws&logoColor=white)
![Middy](https://img.shields.io/badge/Middy-6.x-black?logo=nodedotjs&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4.x-3068B7?logo=zod&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Shared TypeScript package distributed as an AWS Lambda Layer. Centralizes common utilities, HTTP response helpers, structured logging, DynamoDB client, error handling, Middy middlewares, and base models/repositories/services — so each Lambda function stays thin and consistent.

## Modules

| Import path | What it provides |
|---|---|
| `@arj/arj-common-utils/util` | HTTP response helpers (`success`, `created`, `noContent`, …) + structured logger |
| `@arj/arj-common-utils/db` | Pre-configured DynamoDB document client |
| `@arj/arj-common-utils/error` | `CommonError` base class for typed application errors |
| `@arj/arj-common-utils/middleware` | Middy middlewares: global exception handler, Zod validator, request logger, user ID extractor |
| `@arj/arj-common-utils/model` | Shared domain models (e.g. `User`) |
| `@arj/arj-common-utils/repository` | Base repository abstractions (e.g. `UserRepository`) |
| `@arj/arj-common-utils/service` | Base service abstractions (e.g. `UserService`) |

## Build

```bash
npm install
./build.sh
```

## Deploy (SAM)

```bash
sam build
sam deploy --guided   # first time
sam deploy            # subsequent
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

**Response helpers (JavaScript/CommonJS):**

```javascript
const { success, created, noContent } = require("@arj/arj-common-utils/util");

exports.handler = async (event) => {
  return success({ message: "Ok" });
};
```

**Response helpers (TypeScript):**

```typescript
import { success, created, noContent } from "@arj/arj-common-utils/util";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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
import {
  globalExceptionHandlerMiddleware,
  zodValidatorMiddleware,
  requestLoggingMiddleware,
  extractUserIdMiddleware,
} from "@arj/arj-common-utils/middleware";
import { z } from "zod";

const bodySchema = z.object({ name: z.string() });

const baseHandler = async (event) => {
  return success({ message: "Ok" });
};

export const handler = middy(baseHandler)
  .use(requestLoggingMiddleware())
  .use(extractUserIdMiddleware())
  .use(zodValidatorMiddleware({ bodySchema }))
  .use(globalExceptionHandlerMiddleware());
```

**DynamoDB client:**

```typescript
import { dynamoClient } from "@arj/arj-common-utils/db";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const result = await dynamoClient.send(
  new GetCommand({ TableName: "my-table", Key: { pk: "123" } })
);
```

**Error handling:**

```typescript
import { CommonError } from "@arj/arj-common-utils/error";

throw new CommonError("RESOURCE_NOT_FOUND", "Item not found", 404);
```

> The package ships with full TypeScript declarations (`.d.ts`). Add `@types/aws-lambda` to `devDependencies` for Lambda event types.

> If you see warnings like `Unknown project config "shamefully-hoist"`, those are pnpm-only options — safe to ignore or remove from `.npmrc` when using npm.

## Publish to AWS CodeArtifact

1. **Get an authorization token** (valid for 12 hours):

   ```bash
   export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token \
     --domain YOUR_DOMAIN \
     --domain-owner YOUR_AWS_ACCOUNT_ID \
     --region YOUR_REGION \
     --query authorizationToken \
     --output text)
   ```

2. **Set the token for the CodeArtifact registry**:

   ```bash
   npm config set //YOUR_DOMAIN-YOUR_AWS_ACCOUNT_ID.d.codeartifact.YOUR_REGION.amazonaws.com/npm/YOUR_REPOSITORY/:_authToken=$CODEARTIFACT_AUTH_TOKEN
   ```

3. **Build and publish**:

   ```bash
   npm run publish:artifact
   ```

> Replace `YOUR_DOMAIN`, `YOUR_AWS_ACCOUNT_ID`, `YOUR_REGION`, and `YOUR_REPOSITORY` with your own AWS CodeArtifact values.

The `prepublishOnly` script ensures the build runs before publishing. The published package includes only the `dist/` folder (see the `files` field in `package.json`).

## Layout

```
src/
├── db/           # DynamoDB document client
├── error/        # CommonError base class
├── middleware/   # Middy middlewares
├── model/        # Shared domain models
├── repository/   # Base repository abstractions
├── service/      # Base service abstractions
└── util/         # HTTP response helpers + logger
dist/             # Compiled output (after npm run build)
layer/            # Layer artifact (after ./build.sh), used by SAM
```

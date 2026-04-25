import { describe, it, expect } from "vitest";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractUserIdMiddleware } from "../../src/middleware/extract-user-id.middleware.js";
import { UnauthorizedError } from "../../src/error/CommonError.js";

function makeRequest(authorizer?: Record<string, unknown>) {
    return {
        event: {
            requestContext: { authorizer },
        } as unknown as APIGatewayProxyEvent,
        context: {} as never,
        response: null as unknown as APIGatewayProxyResult,
        error: null,
        internal: {},
    };
}

describe("extractUserIdMiddleware", () => {
    const middleware = extractUserIdMiddleware();

    it("attaches userId to the event when authorizer contains userId", async () => {
        const request = makeRequest({ userId: "user-123" });

        await middleware.before!(request as never);

        expect((request.event as never as { userId: string }).userId).toBe("user-123");
    });

    it("throws UnauthorizedError when userId is missing from authorizer", async () => {
        const request = makeRequest({ someOtherField: "value" });

        await expect(middleware.before!(request as never)).rejects.toThrow(UnauthorizedError);
        await expect(middleware.before!(request as never)).rejects.toThrow("Unauthorized: userId missing");
    });

    it("throws UnauthorizedError when authorizer is undefined", async () => {
        const request = makeRequest(undefined);

        await expect(middleware.before!(request as never)).rejects.toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when requestContext is absent", async () => {
        const request = {
            event: {} as unknown as APIGatewayProxyEvent,
            context: {} as never,
            response: null as unknown as APIGatewayProxyResult,
            error: null,
            internal: {},
        };

        await expect(middleware.before!(request as never)).rejects.toThrow(UnauthorizedError);
    });
});

import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { APIGatewayProxyEvent } from "aws-lambda";

vi.mock("../../src/util/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

import { zodValidator } from "../../src/middleware/zod-validator.middleware.js";
import { ValidationError } from "../../src/error/CommonError.js";

function makeRequest(overrides: Partial<APIGatewayProxyEvent> = {}) {
    return {
        event: {
            body: null,
            pathParameters: null,
            queryStringParameters: null,
            path: "/test",
            resource: "/test",
            httpMethod: "GET",
            headers: {},
            multiValueHeaders: {},
            requestContext: {} as never,
            multiValueQueryStringParameters: null,
            isBase64Encoded: false,
            stageVariables: null,
            ...overrides,
        } as APIGatewayProxyEvent,
        context: {} as never,
        response: null as never,
        error: null,
        internal: {},
    };
}

describe("zodValidator", () => {
    const schema = z.object({
        body: z.string().nullable(),
        pathParameters: z.object({ userId: z.string() }),
        queryStringParameters: z.object({ page: z.string().optional() }).optional(),
    });

    it("attaches parsed data to event.validated on success", async () => {
        const middleware = zodValidator(schema);
        const request = makeRequest({ pathParameters: { userId: "u1" } });

        await middleware.before!(request as never);

        const validated = (request.event as never as { validated: unknown }).validated;
        expect(validated).toMatchObject({ pathParameters: { userId: "u1" } });
    });

    it("throws ValidationError when schema validation fails", async () => {
        const middleware = zodValidator(schema);
        const request = makeRequest({ pathParameters: null });

        await expect(middleware.before!(request as never)).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError with formatted field errors", async () => {
        const middleware = zodValidator(schema);
        const request = makeRequest({ pathParameters: null });

        try {
            await middleware.before!(request as never);
            expect.fail("Should have thrown");
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationError);
            const error = e as ValidationError;
            expect(error.message).toBe("Invalid request data");
            expect(Array.isArray(error.details)).toBe(true);
        }
    });

    it("passes when all fields satisfy the schema", async () => {
        const strictSchema = z.object({
            body: z.string(),
            pathParameters: z.object({ id: z.string() }),
            queryStringParameters: z.object({ filter: z.string() }),
        });

        const middleware = zodValidator(strictSchema);
        const request = makeRequest({
            body: '{"data":1}',
            pathParameters: { id: "abc" },
            queryStringParameters: { filter: "active" },
        });

        await expect(middleware.before!(request as never)).resolves.not.toThrow();
    });

    it("works with a simple body-only schema", async () => {
        const simpleSchema = z.object({
            body: z.string().nullable(),
            pathParameters: z.record(z.string()).optional(),
            queryStringParameters: z.record(z.string()).optional(),
        });

        const middleware = zodValidator(simpleSchema);
        const request = makeRequest({ body: null });

        await expect(middleware.before!(request as never)).resolves.not.toThrow();
    });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const mockInfo = vi.hoisted(() => vi.fn());

vi.mock("../../src/util/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: mockInfo,
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

import { requestLoggingMiddleware } from "../../src/middleware/request-logging.middleware.js";

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
    return {
        httpMethod: "GET",
        path: "/items",
        pathParameters: null,
        queryStringParameters: null,
        body: null,
        resource: "/items",
        requestContext: {} as never,
        headers: {},
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        stageVariables: null,
        ...overrides,
    };
}

function makeRequest(event: APIGatewayProxyEvent, response?: Partial<APIGatewayProxyResult>) {
    return {
        event,
        context: {} as never,
        response: (response ?? null) as unknown as APIGatewayProxyResult,
        error: null,
        internal: {},
    };
}

describe("requestLoggingMiddleware", () => {
    const middleware = requestLoggingMiddleware();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("before hook", () => {
        it("logs method and path for a basic request", async () => {
            const request = makeRequest(makeEvent({ httpMethod: "POST", path: "/users" }));

            await middleware.before!(request as never);

            expect(mockInfo).toHaveBeenCalledOnce();
            const [message, meta] = mockInfo.mock.calls[0];
            expect(message).toBe("Request received");
            expect(meta).toMatchObject({ method: "POST", path: "/users" });
        });

        it("includes pathParameters when present", async () => {
            const request = makeRequest(
                makeEvent({ httpMethod: "GET", path: "/users/u1", pathParameters: { userId: "u1" } })
            );

            await middleware.before!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.pathParameters).toEqual({ userId: "u1" });
        });

        it("omits pathParameters when null", async () => {
            const request = makeRequest(makeEvent({ pathParameters: null }));

            await middleware.before!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.pathParameters).toBeUndefined();
        });

        it("includes queryStringParameters when present", async () => {
            const request = makeRequest(makeEvent({ queryStringParameters: { page: "2" } }));

            await middleware.before!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.queryStringParameters).toEqual({ page: "2" });
        });

        it("includes body when present", async () => {
            const request = makeRequest(makeEvent({ httpMethod: "POST", body: '{"foo":"bar"}' }));

            await middleware.before!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.body).toBe('{"foo":"bar"}');
        });

        it("uses UNKNOWN when httpMethod is absent", async () => {
            const event = makeEvent();
            (event as never as Record<string, unknown>).httpMethod = undefined;
            const request = makeRequest(event);

            await middleware.before!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.method).toBe("UNKNOWN");
        });
    });

    describe("after hook", () => {
        it("logs the response statusCode", async () => {
            const request = makeRequest(makeEvent(), { statusCode: 200, body: '{"ok":true}' });

            await middleware.after!(request as never);

            expect(mockInfo).toHaveBeenCalledOnce();
            const [message, meta] = mockInfo.mock.calls[0];
            expect(message).toBe("Response sent");
            expect(meta.statusCode).toBe(200);
        });

        it("parses JSON body for logging", async () => {
            const request = makeRequest(makeEvent(), { statusCode: 200, body: '{"id":"1"}' });

            await middleware.after!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.body).toEqual({ id: "1" });
        });

        it("keeps non-JSON body as a string", async () => {
            const request = makeRequest(makeEvent(), { statusCode: 200, body: "plain text" });

            await middleware.after!(request as never);

            const [, meta] = mockInfo.mock.calls[0];
            expect(meta.body).toBe("plain text");
        });

        it("handles null response gracefully", async () => {
            const request = makeRequest(makeEvent());

            await expect(middleware.after!(request as never)).resolves.not.toThrow();
        });
    });
});

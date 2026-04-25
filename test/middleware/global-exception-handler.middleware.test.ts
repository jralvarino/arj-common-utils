import { describe, it, expect, vi } from "vitest";
import { z, ZodError } from "zod";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

vi.mock("../../src/util/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

import { globalExceptionHandler } from "../../src/middleware/global-exception-handler.middleware.js";
import {
    CommonError,
    NotFoundError,
    UnauthorizedError,
    InternalServerError,
} from "../../src/error/CommonError.js";

function makeRequest(error: Error) {
    return {
        event: {} as APIGatewayProxyEvent,
        context: {} as never,
        response: null as unknown as APIGatewayProxyResult,
        error,
        internal: {},
    };
}

function parseBody(request: ReturnType<typeof makeRequest>) {
    return JSON.parse(request.response.body);
}

function buildZodError(): ZodError {
    const result = z.object({ name: z.string() }).safeParse({});
    if (!result.success) return result.error;
    throw new Error("Expected ZodError");
}

describe("globalExceptionHandler", () => {
    const middleware = globalExceptionHandler();

    describe("ZodError", () => {
        it("returns 400 with VALIDATION_ERROR and formatted field errors", async () => {
            const zodError = buildZodError();
            const request = makeRequest(zodError);

            await middleware.onError!(request as never);

            expect(request.response.statusCode).toBe(400);
            const body = parseBody(request);
            expect(body.errorType).toBe("VALIDATION_ERROR");
            expect(body.message).toBe("Invalid request data");
            expect(body.statusCode).toBe(400);
            expect(Array.isArray(body.details)).toBe(true);
            expect(body.details[0]).toMatchObject({ field: expect.any(String), message: expect.any(String) });
        });

        it("sets Content-Type header to application/json", async () => {
            const request = makeRequest(buildZodError());

            await middleware.onError!(request as never);

            expect(request.response.headers?.["Content-Type"]).toBe("application/json");
        });
    });

    describe("CommonError", () => {
        it("returns the error's statusCode and errorType", async () => {
            const request = makeRequest(new NotFoundError("Item not found"));

            await middleware.onError!(request as never);

            expect(request.response.statusCode).toBe(404);
            const body = parseBody(request);
            expect(body.errorType).toBe("NOT_FOUND");
            expect(body.message).toBe("Item not found");
            expect(body.statusCode).toBe(404);
        });

        it("handles 401 UnauthorizedError", async () => {
            const request = makeRequest(new UnauthorizedError("Token expired"));

            await middleware.onError!(request as never);

            expect(request.response.statusCode).toBe(401);
            expect(parseBody(request).errorType).toBe("UNAUTHORIZED");
        });

        it("handles 500 InternalServerError", async () => {
            const request = makeRequest(new InternalServerError());

            await middleware.onError!(request as never);

            expect(request.response.statusCode).toBe(500);
            expect(parseBody(request).errorType).toBe("INTERNAL_SERVER_ERROR");
        });

        it("includes details when provided", async () => {
            const details = { field: "email" };
            const request = makeRequest(new CommonError("Bad", 400, "BAD_REQUEST", details));

            await middleware.onError!(request as never);

            expect(parseBody(request).details).toEqual(details);
        });
    });

    describe("generic Error", () => {
        it("returns 500 with INTERNAL_SERVER_ERROR", async () => {
            const request = makeRequest(new Error("Unexpected failure"));

            await middleware.onError!(request as never);

            expect(request.response.statusCode).toBe(500);
            const body = parseBody(request);
            expect(body.errorType).toBe("INTERNAL_SERVER_ERROR");
            expect(body.message).toBe("An error occurred while processing your request");
            expect(body.statusCode).toBe(500);
        });

        it("includes error name and stack in details", async () => {
            const request = makeRequest(new TypeError("something broke"));

            await middleware.onError!(request as never);

            const body = parseBody(request);
            expect(body.details.name).toBe("TypeError");
            expect(typeof body.details.stack).toBe("string");
        });
    });
});

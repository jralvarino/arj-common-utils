import { describe, it, expect } from "vitest";
import {
    CommonError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    InternalServerError,
} from "../../src/error/CommonError.js";

describe("CommonError", () => {
    it("defaults to statusCode 500 and INTERNAL_SERVER_ERROR", () => {
        const error = new CommonError("Something went wrong");
        expect(error.message).toBe("Something went wrong");
        expect(error.statusCode).toBe(500);
        expect(error.errorType).toBe("INTERNAL_SERVER_ERROR");
        expect(error.name).toBe("AppError");
    });

    it("uses provided statusCode and errorType", () => {
        const error = new CommonError("Bad request", 400, "MY_CUSTOM_ERROR");
        expect(error.statusCode).toBe(400);
        expect(error.errorType).toBe("MY_CUSTOM_ERROR");
    });

    it("maps statusCode to errorType when none provided", () => {
        const cases: [number, string][] = [
            [400, "BAD_REQUEST"],
            [401, "UNAUTHORIZED"],
            [403, "FORBIDDEN"],
            [404, "NOT_FOUND"],
            [409, "CONFLICT"],
            [422, "UNPROCESSABLE_ENTITY"],
            [429, "TOO_MANY_REQUESTS"],
            [500, "INTERNAL_SERVER_ERROR"],
            [502, "BAD_GATEWAY"],
            [503, "SERVICE_UNAVAILABLE"],
        ];
        for (const [statusCode, expectedType] of cases) {
            const error = new CommonError("msg", statusCode);
            expect(error.errorType).toBe(expectedType);
        }
    });

    it("falls back to INTERNAL_SERVER_ERROR for unmapped statusCode", () => {
        const error = new CommonError("I'm a teapot", 418);
        expect(error.errorType).toBe("INTERNAL_SERVER_ERROR");
    });

    it("stores details", () => {
        const details = { field: "email", issue: "required" };
        const error = new CommonError("Validation failed", 400, "BAD_REQUEST", details);
        expect(error.details).toEqual(details);
    });

    it("is an instance of Error", () => {
        const error = new CommonError("test");
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CommonError);
    });
});

describe("BadRequestError", () => {
    it("has statusCode 400, errorType BAD_REQUEST, and name BadRequestError", () => {
        const error = new BadRequestError("invalid input");
        expect(error.statusCode).toBe(400);
        expect(error.errorType).toBe("BAD_REQUEST");
        expect(error.name).toBe("BadRequestError");
        expect(error.message).toBe("invalid input");
    });

    it("passes details through", () => {
        const error = new BadRequestError("bad", { field: "id" });
        expect(error.details).toEqual({ field: "id" });
    });
});

describe("UnauthorizedError", () => {
    it("defaults to 401 UNAUTHORIZED with default message", () => {
        const error = new UnauthorizedError();
        expect(error.statusCode).toBe(401);
        expect(error.errorType).toBe("UNAUTHORIZED");
        expect(error.name).toBe("UnauthorizedError");
        expect(error.message).toBe("Unauthorized");
    });

    it("accepts custom message", () => {
        const error = new UnauthorizedError("Token expired");
        expect(error.message).toBe("Token expired");
    });
});

describe("ForbiddenError", () => {
    it("defaults to 403 FORBIDDEN", () => {
        const error = new ForbiddenError();
        expect(error.statusCode).toBe(403);
        expect(error.errorType).toBe("FORBIDDEN");
        expect(error.name).toBe("ForbiddenError");
        expect(error.message).toBe("Access denied");
    });
});

describe("NotFoundError", () => {
    it("defaults to 404 NOT_FOUND", () => {
        const error = new NotFoundError();
        expect(error.statusCode).toBe(404);
        expect(error.errorType).toBe("NOT_FOUND");
        expect(error.name).toBe("NotFoundError");
        expect(error.message).toBe("Resource not found");
    });
});

describe("ConflictError", () => {
    it("defaults to 409 CONFLICT", () => {
        const error = new ConflictError();
        expect(error.statusCode).toBe(409);
        expect(error.errorType).toBe("CONFLICT");
        expect(error.name).toBe("ConflictError");
        expect(error.message).toBe("Conflict");
    });
});

describe("ValidationError", () => {
    it("defaults to 400 VALIDATION_ERROR", () => {
        const error = new ValidationError();
        expect(error.statusCode).toBe(400);
        expect(error.errorType).toBe("VALIDATION_ERROR");
        expect(error.name).toBe("ValidationError");
        expect(error.message).toBe("Validation error");
    });
});

describe("InternalServerError", () => {
    it("defaults to 500 INTERNAL_SERVER_ERROR", () => {
        const error = new InternalServerError();
        expect(error.statusCode).toBe(500);
        expect(error.errorType).toBe("INTERNAL_SERVER_ERROR");
        expect(error.name).toBe("InternalServerError");
        expect(error.message).toBe("Internal server error");
    });
});

import { describe, it, expect } from "vitest";
import { success, created, noContent } from "../../src/util/response.util.js";

describe("success", () => {
    it("returns statusCode 200 with JSON body", () => {
        const result = success({ id: "1", name: "Alice" });
        expect(result.statusCode).toBe(200);
        expect(result.headers?.["Content-Type"]).toBe("application/json");
        expect(JSON.parse(result.body)).toEqual({ id: "1", name: "Alice" });
    });

    it("serializes an array body", () => {
        const result = success([1, 2, 3]);
        expect(JSON.parse(result.body)).toEqual([1, 2, 3]);
    });

    it("merges custom headers while keeping Content-Type", () => {
        const result = success({}, { "X-Request-Id": "abc123" });
        expect(result.headers?.["Content-Type"]).toBe("application/json");
        expect(result.headers?.["X-Request-Id"]).toBe("abc123");
    });

    it("allows Content-Type to be overridden by custom headers", () => {
        const result = success({}, { "Content-Type": "text/plain" });
        expect(result.headers?.["Content-Type"]).toBe("text/plain");
    });
});

describe("created", () => {
    it("returns statusCode 201 with JSON body", () => {
        const result = created({ id: "new-id" });
        expect(result.statusCode).toBe(201);
        expect(result.headers?.["Content-Type"]).toBe("application/json");
        expect(JSON.parse(result.body)).toEqual({ id: "new-id" });
    });

    it("merges custom headers", () => {
        const result = created({}, { Location: "/items/1" });
        expect(result.headers?.["Location"]).toBe("/items/1");
    });
});

describe("noContent", () => {
    it("returns statusCode 204 with empty body", () => {
        const result = noContent();
        expect(result.statusCode).toBe(204);
        expect(result.body).toBe("");
        expect(result.headers?.["Content-Type"]).toBe("application/json");
    });

    it("merges custom headers", () => {
        const result = noContent({ "X-Trace-Id": "xyz" });
        expect(result.headers?.["X-Trace-Id"]).toBe("xyz");
    });
});

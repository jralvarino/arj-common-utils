import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "../../src/model/User.js";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("../../src/db/dynamoClient.js", () => ({
    ddb: { send: mockSend },
}));

vi.mock("../../src/util/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

import { UserRepository } from "../../src/repository/UserRepository.js";

const user1: User = { userId: "u1", password: "hash1", name: "Alice" };
const user2: User = { userId: "u2", password: "hash2", name: "Bob" };

describe("UserRepository", () => {
    let repo: UserRepository;

    beforeEach(() => {
        vi.resetAllMocks();
        repo = new UserRepository();
    });

    describe("findById", () => {
        it("returns the user when found", async () => {
            mockSend.mockResolvedValueOnce({ Item: user1 });

            const result = await repo.findById("u1");

            expect(result).toEqual(user1);
            expect(mockSend).toHaveBeenCalledOnce();
        });

        it("returns null when item is not found", async () => {
            mockSend.mockResolvedValueOnce({ Item: undefined });

            const result = await repo.findById("nonexistent");

            expect(result).toBeNull();
        });

        it("propagates errors from DynamoDB", async () => {
            mockSend.mockRejectedValueOnce(new Error("DynamoDB error"));

            await expect(repo.findById("u1")).rejects.toThrow("DynamoDB error");
        });
    });

    describe("findAll", () => {
        it("returns all items in a single page", async () => {
            mockSend.mockResolvedValueOnce({ Items: [user1, user2], LastEvaluatedKey: undefined });

            const result = await repo.findAll();

            expect(result).toEqual([user1, user2]);
            expect(mockSend).toHaveBeenCalledOnce();
        });

        it("paginates through multiple pages", async () => {
            mockSend
                .mockResolvedValueOnce({ Items: [user1], LastEvaluatedKey: { userId: "u1" } })
                .mockResolvedValueOnce({ Items: [user2], LastEvaluatedKey: undefined });

            const result = await repo.findAll();

            expect(result).toEqual([user1, user2]);
            expect(mockSend).toHaveBeenCalledTimes(2);
        });

        it("returns empty array when table is empty", async () => {
            mockSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });

            const result = await repo.findAll();

            expect(result).toEqual([]);
        });

        it("handles undefined Items in response", async () => {
            mockSend.mockResolvedValueOnce({ Items: undefined, LastEvaluatedKey: undefined });

            const result = await repo.findAll();

            expect(result).toEqual([]);
        });

        it("propagates errors from DynamoDB", async () => {
            mockSend.mockRejectedValueOnce(new Error("Scan failed"));

            await expect(repo.findAll()).rejects.toThrow("Scan failed");
        });
    });
});

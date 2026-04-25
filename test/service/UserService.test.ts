import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "../../src/model/User.js";

const mockFindAll = vi.hoisted(() => vi.fn());
const mockFindByUser = vi.hoisted(() => vi.fn());

vi.mock("../../src/repository/UserRepository.js", () => ({
    UserRepository: vi.fn(function () {
        return {
            findAll: mockFindAll,
            findByUser: mockFindByUser,
        };
    }),
}));

import { UserService } from "../../src/service/UserService.js";

const user1: User = { userId: "u1", password: "hash1", name: "Alice" };
const user2: User = { userId: "u2", password: "hash2", name: "Bob" };

describe("UserService", () => {
    let service: UserService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new UserService();
    });

    describe("getAllUsers", () => {
        it("returns all users from the repository", async () => {
            mockFindAll.mockResolvedValueOnce([user1, user2]);

            const result = await service.getAllUsers();

            expect(result).toEqual([user1, user2]);
            expect(mockFindAll).toHaveBeenCalledOnce();
        });

        it("returns an empty array when no users exist", async () => {
            mockFindAll.mockResolvedValueOnce([]);

            const result = await service.getAllUsers();

            expect(result).toEqual([]);
        });

        it("propagates repository errors", async () => {
            mockFindAll.mockRejectedValueOnce(new Error("DB unavailable"));

            await expect(service.getAllUsers()).rejects.toThrow("DB unavailable");
        });
    });

    describe("getUserById", () => {
        it("returns the user when found", async () => {
            mockFindByUser.mockResolvedValueOnce(user1);

            const result = await service.getUserById("u1");

            expect(result).toEqual(user1);
            expect(mockFindByUser).toHaveBeenCalledWith("u1");
        });

        it("returns null when user does not exist", async () => {
            mockFindByUser.mockResolvedValueOnce(null);

            const result = await service.getUserById("unknown");

            expect(result).toBeNull();
        });

        it("propagates repository errors", async () => {
            mockFindByUser.mockRejectedValueOnce(new Error("DB unavailable"));

            await expect(service.getUserById("u1")).rejects.toThrow("DB unavailable");
        });
    });
});

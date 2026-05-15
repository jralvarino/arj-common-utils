export interface User {
    userId: string;
    email: string;
    passwordHash: string;
    apps: string[];
    name?: string;
    avatar?: string;
    salary?: number;
    createdAt?: string;
}
›
import { UserRepository } from "../repository/UserRepository.js";
import { User } from "../model/User.js";

const userRepository = new UserRepository();

export class UserService {
    async getAllUsers(): Promise<User[]> {
        return userRepository.findAll();
    }

    async getUserById(userId: string): Promise<User | null> {
        return userRepository.findById(userId);
    }

    async findByEmail(email: string): Promise<User | null> {
        return userRepository.findByEmail(email);
    }

    async createUser(user: User): Promise<User> {
        return userRepository.create(user);
    }
}

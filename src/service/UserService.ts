import { UserRepository } from "../repository/UserRepository.js";
import { User } from "../model/User.js";

const userRepository = new UserRepository();

export class UserService {
    async getAllUsers(): Promise<User[]> {
        return userRepository.findAll();
    }

    async getUserById(userId: string): Promise<User | null> {
        return userRepository.findByUser(userId);
    }
}

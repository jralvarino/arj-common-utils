import { HouseRepository } from "../repository/HouseRepository.js";
import { House } from "../model/House.js";

const houseRepository = new HouseRepository();

export class HouseService {
    async getAllHouses(): Promise<House[]> {
        return houseRepository.findAll();
    }

    async getHouseById(houseId: string): Promise<House | null> {
        return houseRepository.findById(houseId);
    }

    async createHouse(house: House): Promise<House> {
        return houseRepository.create(house);
    }
}

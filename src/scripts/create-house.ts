import { randomUUID } from "crypto";
import { HouseRepository } from "../repository/HouseRepository.js";
import { House } from "../model/House.js";

const args = process.argv.slice(2);

function arg(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
}

function usage(): never {
    console.error("Uso: node dist/scripts/create-house.js --name <nome> [--member <userId:weight> ...]");
    console.error("Exemplo: node dist/scripts/create-house.js --name 'Casa Principal' --member user1:1 --member user2:1");
    process.exit(1);
}

const name = arg("--name");
if (!name) usage();

const members: { userId: string; weight: number }[] = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--member" && args[i + 1]) {
        const [userId, rawWeight] = args[i + 1].split(":");
        if (!userId) {
            console.error(`Membro inválido: ${args[i + 1]} — formato esperado userId:weight`);
            process.exit(1);
        }
        members.push({ userId, weight: rawWeight ? Number(rawWeight) : 1 });
    }
}

const now = new Date().toISOString();
const house: House = {
    houseId: randomUUID(),
    name: name!,
    members,
    createdAt: now,
    updatedAt: now,
};

const repo = new HouseRepository();

repo.create(house)
    .then((saved) => {
        console.log("Casa cadastrada com sucesso:");
        console.log(JSON.stringify(saved, null, 2));
    })
    .catch((err) => {
        console.error("Erro ao cadastrar casa:", err.message ?? err);
        process.exit(1);
    });

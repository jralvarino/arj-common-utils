import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../db/dynamoClient.js";
import { House } from "../model/House.js";
import { createLogger } from "../util/logger.js";

const logger = createLogger("arj-common-utils");
const TABLE_NAME = process.env.HOUSE_TABLE_NAME ?? "house";

export class HouseRepository {
    async findById(houseId: string): Promise<House | null> {
        logger.debug("DynamoDB get", { table: TABLE_NAME, key: { houseId } });
        const result = await ddb.send(
            new GetCommand({ TableName: TABLE_NAME, Key: { houseId } })
        );
        return (result.Item as House) ?? null;
    }

    async findAll(): Promise<House[]> {
        logger.debug("DynamoDB scan", { table: TABLE_NAME });
        const items: House[] = [];
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await ddb.send(
                new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey: lastKey })
            );
            items.push(...((result.Items as House[]) ?? []));
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        return items;
    }

    async create(house: House): Promise<House> {
        logger.debug("DynamoDB put", { table: TABLE_NAME, houseId: house.houseId });
        await ddb.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: house,
                ConditionExpression: "attribute_not_exists(houseId)",
            })
        );
        return house;
    }
}

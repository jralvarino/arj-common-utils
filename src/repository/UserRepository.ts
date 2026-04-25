import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../db/dynamoClient.js";
import { User } from "../model/User.js";
import { createLogger } from "../util/logger.js";

const logger = createLogger("arj-common-utils");
const USER_TABLE = "user";

export class UserRepository {
    async findByUser(userId: string): Promise<User | null> {
        logger.debug("DynamoDB get", { table: USER_TABLE, key: { userId } });
        const result = await ddb.send(
            new GetCommand({
                TableName: USER_TABLE,
                Key: { userId },
            })
        );
        logger.debug("DynamoDB get result", { table: USER_TABLE, userId, found: !!result.Item });
        return (result.Item as User) || null;
    }

    async findAll(): Promise<User[]> {
        logger.debug("DynamoDB scan", { table: USER_TABLE });
        const items: User[] = [];
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await ddb.send(
                new ScanCommand({
                    TableName: USER_TABLE,
                    ExclusiveStartKey: lastKey,
                })
            );
            items.push(...((result.Items as User[]) || []));
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        logger.debug("DynamoDB scan result", { table: USER_TABLE, totalCount: items.length });
        return items;
    }
}

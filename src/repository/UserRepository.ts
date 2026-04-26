import { GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "../db/dynamoClient.js";
import { User } from "../model/User.js";
import { createLogger } from "../util/logger.js";

const logger = createLogger("arj-common-utils");
const TABLE_NAME = process.env.USER_TABLE_NAME ?? "user";

export class UserRepository {
    async findById(userId: string): Promise<User | null> {
        logger.debug("DynamoDB get", { table: TABLE_NAME, key: { userId } });
        const result = await ddb.send(
            new GetCommand({ TableName: TABLE_NAME, Key: { userId } })
        );
        return (result.Item as User) ?? null;
    }

    async findByEmail(email: string): Promise<User | null> {
        logger.debug("DynamoDB query by email", { table: TABLE_NAME });
        const result = await ddb.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "email-index",
                KeyConditionExpression: "email = :email",
                ExpressionAttributeValues: { ":email": email },
                Limit: 1,
            })
        );
        return (result.Items?.[0] as User) ?? null;
    }

    async findAll(): Promise<User[]> {
        logger.debug("DynamoDB scan", { table: TABLE_NAME });
        const items: User[] = [];
        let lastKey: Record<string, unknown> | undefined;
        do {
            const result = await ddb.send(
                new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey: lastKey })
            );
            items.push(...((result.Items as User[]) ?? []));
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        return items;
    }

    async create(user: User): Promise<User> {
        logger.debug("DynamoDB put", { table: TABLE_NAME, userId: user.userId });
        await ddb.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: user,
                ConditionExpression: "attribute_not_exists(userId)",
            })
        );
        return user;
    }
}

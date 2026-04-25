import type { MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UnauthorizedError } from "../error/CommonError.js";

export type WithUserId = { userId: string };

export const extractUserIdMiddleware = (): MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
    return {
        before: async (request) => {
            const authorizer = request.event.requestContext?.authorizer as { userId?: string } | undefined;
            const userId = authorizer?.userId;
            if (!userId) {
                throw new UnauthorizedError("Unauthorized: userId missing");
            }
            (request.event as APIGatewayProxyEvent & WithUserId).userId = userId;
        },
    };
};

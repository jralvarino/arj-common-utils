import type { APIGatewayProxyResult } from "aws-lambda";

const createResponse = (
  body: unknown,
  statusCode: number = 200,
  headers?: Record<string, string>
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

export const success = (body: unknown, headers?: Record<string, string>): APIGatewayProxyResult => {
  return createResponse(body, 200, headers);
};

export const created = (body: unknown, headers?: Record<string, string>): APIGatewayProxyResult => {
  return createResponse(body, 201, headers);
};

export const noContent = (headers?: Record<string, string>): APIGatewayProxyResult => {
  return {
    statusCode: 204,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: "",
  };
};

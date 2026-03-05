import { Logger } from "@aws-lambda-powertools/logger";

export const createLogger = (serviceName: string): Logger =>
  new Logger({ serviceName });

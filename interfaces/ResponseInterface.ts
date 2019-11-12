import { DeployStatsInterface } from "./DeployStatsInterface";

export interface ResponseInterface {
    statusCode: number;
    body: {
        lambdaRuntime?: string;
        message?: string;
        deploymentCount?: number;
        stats?: DeployStatsInterface;
    };
  }
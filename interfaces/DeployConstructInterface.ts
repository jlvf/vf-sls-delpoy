import S3 from "aws-sdk/clients/s3";
import { DynamoDB } from "aws-sdk/clients/all";

export interface DeployConstructInterface {
    s3: S3;
    ddbClient: DynamoDB.DocumentClient;
    s3Bucket: string;
    s3Prefix?: string;
    slsServiceName: string;
    tableName: string;
    deploytime_utc_ms: number;
    cfOutputs?: Array<any>;
}
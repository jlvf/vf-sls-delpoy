import S3 from "aws-sdk/clients/s3";
import { DeployConstructInterface } from "./interfaces/DeployConstructInterface";
import { DeployTableSchemaInterface } from "./interfaces/DeployTableSchemaInterface";

export class Deploy {
    
    constructor(private deploy: DeployConstructInterface) {}

    async getLatestSLSTemplateObject(): Promise<S3.Object> {
        const params = {
            Bucket: this.deploy.s3Bucket,
            Prefix: this.deploy.s3Prefix,
            MaxKeys: 10 // apears that sls keeps a max history of 5 deployments with .zip and .json files
        };
        const response = await this.deploy.s3.listObjectsV2(params).promise();
        if (response.Contents.length > 1) {
            return response.Contents[response.Contents.length - 2];
        }
        return null;
    }

    parseJsonStrToDynamoDBItem(jsonStr: string): object {
        // DynamoDb Items cannot contain empty strings
        // this replaces "" with null unless the qoute is preceded by an escape char i.e. \"
        jsonStr = jsonStr.replace(/(?<!\\)"(?<!\\)"/g, null); 
        return JSON.parse(jsonStr);
    }

    async getSLSTemplateFileObject(s3Key: string): Promise<object> {
        const params: S3.GetObjectRequest = {
            Bucket: this.deploy.s3Bucket,
            Key: s3Key
        };
        const response = await this.deploy.s3.getObject(params).promise();
        return this.parseJsonStrToDynamoDBItem(response.Body.toString('utf-8'));
    }

    async insertLatestSLSTemplate(): Promise<boolean> {
        const slsTemplateObj = await this.getLatestSLSTemplateObject();
        const Item: DeployTableSchemaInterface = {
            service_name: this.deploy.slsServiceName,
            created_utc_ms: new Date().getTime(),
            template: await this.getSLSTemplateFileObject(slsTemplateObj.Key)
        };

        const params = {
            TableName: this.deploy.tableName,
            Item
        };
        let result: boolean = true;
        await this.deploy.ddbClient.put(params).promise()
            .catch((err) => {
                result = false;
                console.error("DocumentClient Error", err);
            });
        return result;
    }

}
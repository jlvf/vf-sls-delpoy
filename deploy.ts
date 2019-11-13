import S3 from "aws-sdk/clients/s3";
import { DeployConstructInterface } from "./interfaces/DeployConstructInterface";
import { DeployTableSchemaInterface } from "./interfaces/DeployTableSchemaInterface";
import { DeployStatsInterface } from "./interfaces/DeployStatsInterface";

export class Deploy {

    public template: any;
    
    constructor(private deploy: DeployConstructInterface) {}

    async getLatestSLSTemplateObject(): Promise<S3.Object> {
        const params = {
            Bucket: this.deploy.s3Bucket,
            Prefix: this.deploy.s3Prefix
        };
        const response = await this.deploy.s3.listObjectsV2(params).promise();
        if (response.Contents.length > 1) {
            for (let i = response.Contents.length - 1; i >= 0; i--) {
                if (response.Contents[i].Key.match(/.json$/)) {
                    return response.Contents[i];
                }
            }
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
            deploytime_utc_ms: this.deploy.deploytime_utc_ms,
            template: await this.getSLSTemplateFileObject(slsTemplateObj.Key)
        };

        this.template = Item;

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

    convertMsToTime(miliseconds: number): string {
        let days, hours, minutes, seconds;
        if (miliseconds < 1000) {
            return (miliseconds / 1000).toFixed(2) + " seconds";
        }
        seconds = Math.floor(miliseconds / 1000);
        minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        days = Math.floor(hours / 24);
        hours = hours % 24;
        const d = days > 0 ? days + " days " : "";
        const h = hours > 0 ? hours + " hours " : "";
        const m = minutes > 0 ? minutes + " minutes " : "";
        const s = seconds > 0 ? seconds + " seconds " : "";
        return (d + h + m + s).trim();
    }

    async getDeployments(): Promise<any[]> {
        let scanResults = [];
        const params = {
            TableName: this.deploy.tableName,
            ProjectionExpression: "service_name, created_utc_ms, deploytime_utc_ms",
            LastEvaluatedKey: null
        };
        let data = await this.deploy.ddbClient.scan(params).promise();
        scanResults = data.Items;
        while (typeof data.LastEvaluatedKey != "undefined") {
            params.LastEvaluatedKey = data.LastEvaluatedKey;
            data = await this.deploy.ddbClient.scan(params).promise();
            scanResults = [...scanResults, ...data.Items]
        }
        return scanResults;
    }

    getAverageTimeBetweenDeployments(items) {
        if (items.length <= 1) {
            return this.convertMsToTime(0);
        }
        let t = 0;
        for (let i = 1; i < items.length; i++) {
            const t2 = items[i].created_utc_ms;
            const t1 = items[i-1].created_utc_ms;
            const diff = t2 - t1;
            t = t + diff;
        }
        return this.convertMsToTime(t / items.length);
    }

    getAverageDeploymentDuration(items) {
        if (items.length === 0) {
            return this.convertMsToTime(0);
        }
        let t = 0;
        for (let i = 0; i < items.length; i++) {
            t = t + items[i].deploytime_utc_ms;
        }
        return this.convertMsToTime(t / items.length);
    }

    async getDeploymentStats(): Promise<DeployStatsInterface> {
        const items = await this.getDeployments();
        return <DeployStatsInterface> {
            DeploymentCount: items.length,
            AverageTimeBetweenDeployments: this.getAverageTimeBetweenDeployments(items),
            AverageDeploymentDurration: this.getAverageDeploymentDuration(items),
            LatestDeploymentDurration: this.convertMsToTime(this.deploy.deploytime_utc_ms)
        }
    }

}
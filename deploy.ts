import S3 from "aws-sdk/clients/s3";

export class Deploy {

    public templateFile: string;
    
    constructor(private s3: S3) {}

    async getLatestSLSDeployJson(Bucket: string, Prefix?: string): Promise<S3.Object> {
        const params = {
            Bucket,
            Prefix,
            MaxKeys: 10
        };
        const response = await this.s3.listObjectsV2(params).promise();
        if (response.Contents.length > 1) {
            return response.Contents[response.Contents.length - 2];
        }
        return null;
    }

}
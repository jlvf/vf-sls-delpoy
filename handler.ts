import 'source-map-support/register';
import {Deploy} from './deploy';
import S3 from 'aws-sdk/clients/s3';
import { DynamoDB } from 'aws-sdk/clients/all';

export const initstack = async (event, _context) => {
  const deploy = new Deploy({
    s3: new S3(), 
    ddbClient: new DynamoDB.DocumentClient(),
    s3Bucket: process.env.SLS_DEPLOY_BUCKET,
    s3Prefix: process.env.SLS_BUCKET_PREFIX,
    tableName: process.env.DDB_TABLE_NAME,
    slsServiceName: process.env.SLS_SERVICE_NAME
  });
  const didTemplateInsert: boolean = await deploy.insertLatestSLSTemplate();

  return {
    statusCode: didTemplateInsert ? 200 : 500,
    body: JSON.stringify({
      message: didTemplateInsert ? process.env.SLS_SERVICE_NAME + " has been deployed" 
                                 : process.env.SLS_SERVICE_NAME + " template could not be inserted into " + process.env.DDB_TABLE_NAME,
      // templateKey: slsTemplateObject.Key
      // input: event,
      // SLS_BUCKET_PREFIX: process.env.SLS_BUCKET_PREFIX
      // env: process.env
    }, null, 2),
  };
}

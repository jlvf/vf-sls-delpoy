import 'source-map-support/register';
import {Deploy} from './deploy';
import S3 from 'aws-sdk/clients/s3';
import { DynamoDB } from 'aws-sdk/clients/all';
import { ResponseInterface } from './interfaces/ResponseInterface';

export const initstack = async (event, _context) => {
  const lambdastart = new Date().getTime();
  if (typeof event === "string") {
    event = JSON.parse(event);
  }
  const response: ResponseInterface = {
    statusCode: 200,
    body: {}
  };
  if (typeof event.deploytime_utc_ms === "undefined") {
    if (typeof event.slsd !== "undefined") {
      response.statusCode = 500;
      response.body.message = "deploytime_utc_ms is required";
      return response;
    }
  }
  const deploy = new Deploy({
    s3: new S3(), 
    ddbClient: new DynamoDB.DocumentClient(),
    s3Bucket: process.env.SLS_DEPLOY_BUCKET,
    s3Prefix: process.env.SLS_BUCKET_PREFIX,
    tableName: process.env.DDB_TABLE_NAME,
    slsServiceName: process.env.SLS_SERVICE_NAME,
    deploytime_utc_ms: event.deploytime_utc_ms
  });
  if (typeof event.slsd !== "undefined") {
    const slsd = await deploy.insertLatestSLSTemplate();
    if (slsd) {
      response.body.message = process.env.SLS_SERVICE_NAME + " has been deployed";
    } else {
      response.body.message = process.env.SLS_SERVICE_NAME + " template could not be inserted into " + process.env.DDB_TABLE_NAME
    }
  }
  if (typeof event.stats !== "undefined") {
    response.body.stats = await deploy.getDeploymentStats();
  }
  response.body.lambdaRuntime = deploy.convertMsToTime((new Date().getTime()) - lambdastart);
  return response;
}

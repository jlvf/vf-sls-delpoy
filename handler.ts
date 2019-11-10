import 'source-map-support/register';
import {Deploy} from './deploy';
import S3 from 'aws-sdk/clients/s3';

export const initstack = async (event, _context) => {
  const deploy = new Deploy(new S3());
  const slsTemplateObject = await deploy.getLatestSLSDeployJson("bitiverse-sls-deployments", "serverless/vfi/dev/");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Lambda Works!',
      templateKey: slsTemplateObject.Key
      // input: event,
      // env: process.env
    }, null, 2),
  };
}

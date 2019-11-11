# SLS app

## Initial Setup

Create a serverless project with **aws-nodejs-typescript** and **aws-sdk** in the CWD

> create the serverless template
```bash
sls create --template aws-nodejs-typescript --name vf-deploy-service
```

> install dependencies and add the aws-sdk
```bash
npm install
npm install aws-sdk
```

> create a new serverless app in the serverless dashboard
```bash
sls
```

> Modify serverless.yml

```YML
provider:
  region: ${opt:region, 'us-west-2'}
  stage: ${opt:stage, 'dev'}
  stackName: ${opt:stackName, 'vfdeploy-dev-stack'}
  deploymentBucket:
    name: bitiverse-sls-deployments
```

Add these variables to serverless.yml. The deployment bucket is used to store all serverless deployments inside of a single bucket, You must create the s3 bucket if you add the deploymentBucket variable. 

The ${opt:...} allows for serverless.yml variables to be overwritten from the CLI: `sls deploy --stackName ... --aws-profile myaws`

## Deploy

> create the cloudformation stack

```bash
sls deploy --aws-profile myaws
```

> remove the cloudformation stack

```bash
sls remove -v --aws-profile myaws
```

## Invoke

Local
```bash
sls invoke local --function=initstack --aws-profile myaws
```

Remote
```bash
sls invoke --function=initstack --aws-profile myaws
```

## Questions I have

1. In serverless.yml when concatinating the service name in the functions enviornment variables I tried Fn:Join; it returned [object,object] the solution was to simply do the serverless ${self:...}/${self:..} this gave the desired results; However, when creating the DynamoDB table name in the provider environment variables Fn:Join worked as expected. Is this a serverless peculiarity? 
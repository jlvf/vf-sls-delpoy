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

## Plugins

1. Create
```bash
mkdir sls_deployalizer
cd sls_deployalizer
sls create --template plugin
npm init
```

2. Modify index.js
```js
 this.hooks = {
      'before:deploy:deploy': this.beforeWelcome.bind(this),     
      'after:deploy:deploy': this.afterHelloWorld.bind(this),
 };
```

3. Link plugin to npm
```bash
npm link
```

4. Link plugin to project
```bash
cd path/to/project
npm link welcome
```

5. results
```bash
sls deploy --aws-profile myaws

  Serverless: Bundling with Webpack...
  ...
  ...
  Serverless: Hello from Serverless!
  ...
  ...
  ...
  Serverless: Please come again!

```


## Notes

1. In serverless.yml when concatinating the service name in the functions enviornment variables I tried Fn:Join; it returned [object,object] the solution was to simply do the serverless ${self:...}/${self:..} this gave the desired results; However, when creating the DynamoDB table name in the provider environment variables Fn:Join worked as expected. Is this a serverless peculiarity?
  **using ${...} works everywhere in serverless.yml**

1. Refering to deploy.ts -> getLatestSLSTemplateObject()) When adding/modifying serverless.yml aws resources the serverless s3 deployment bucket may receive more than one lambda zip file. This changes how I initially retrevied the json template by using the last two files from the s3 List. A better approach is to use a for or while loop to search for the json file. An even better approach would be to split the Key of the bucket and verify that each key you are checking are in the same directory via the timestamp from the Key. Do not use the LastModifed in this approach because each file can have a diffrent value that may or may not group the files together correctly.

1. Is there a way to create an AssumeRolePolicyDocument using the serverless side; without writing it in the Resources section of serverless.yml?

1. I had a problem with the spawn child process dying before all the data was printed to stdin. This occured with --view download because the template is simi large: half of the json would arrive and then the child would die before I could parse the entire string. I solved this by adding exit handelers. Is there a better way to force the child to wait for more input or are exit handlers the best approach?
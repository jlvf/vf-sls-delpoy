# Voice Foundry SLS Deployment App

This application is an example of how to integrate [serverless.com](serverless.com) with an **AWS**, **LAMBDA** and **DynamoDB** CI/CD deployment. Checkout [sls.md](https://github.com/oussiden/vf-sls-delpoy/blob/master/sls.md) for basic serverless CLI commands.

## Install

Make sure nodejs, npm, serverless and aws-cli are installed

1. Clone the repo and cd into the directory
2. run `npm install`

## SLS Deployalizer Plugin Commands

> These options are an extension to the **sls deploy** command. You must enable the sls_deployalizer by adding the --slsd option

```bash
sls deploy --slsd --stats --view resources,download ...
````

| Command | Description |
|:--------| :---------- |
|--slsd   | Enables the sls_deployalizer plugin, this must be enabled for all other commands to work. |
|--stats  | Returns the deployment statistics such as number of deployments and deployment averages |
|--view   | Returns the current serverless deploy template or parts of the template |
|--gui    | Opens an Angular gui interface to display deployment info |

### **View Options**

> --view options can be mixed and matched by delaminating them with a comma: `--view download,resources,functions`

| Option  | Description |
|:----------| :---------- |
|no value   | Providing an empty value will cause the entire serverless template to print |
|resources  | Display only the aws logical resources |
|functions  | Display only the lambda functions |
|download   | Saves the active templates file in ./templates/...<br> ./templates will be created if it does not exist |

## Resources

| URL       | Description |
|:----------|:------------|
|https://www.regular-expressions.info/lookaround.html| Used to figure out regex look behind when converting the template to json object |
|https://regex101.com/| Used to test regex |
|https://serverless.com/| Cloud CI/CD deployment service|
|https://serverless.com/framework/docs/providers/aws/| Serverless CLI Docs |
|https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/| AWS-SDK for JavaScript |
|https://stackoverflow.com/questions/47446075/getting-output-of-child-process-created-with-inherit| How to get a child process to output to the main stdin |
|https://www.youtube.com/watch?v=9o8B3L0-d9c| Tutorial on child_process |
|https://www.linkedin.com/pulse/serverless-plugins-michael-vargas/| Serverless Plugin tutorial |
|https://serverless.com/blog/writing-serverless-plugins/| Serverless plugin tutorial part 1 |
|https://serverless.com/blog/writing-serverless-plugins-2/ | Serverless plugin tutorial part 2 |
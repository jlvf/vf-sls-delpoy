# Voice Foundry SLS Deployment App

This application is an example of how to integrate [serverless.com](serverless.com) with an **AWS**, **LAMBDA** and **DynamoDB** CI/CD deployment. Checkout [sls.md](https://github.com/oussiden/vf-sls-delpoy/blob/master/sls.md) for basic serverless CLI commands.

## System Requirements

I tested this application on both Mac and Ubuntu 18.04 but I did not test it in windows.

## Install

Make sure nodejs, npm, serverless and aws-cli are installed. This application has an angular gui interface. If you use --gui it will install the node_modules automatically inside of the gui folder. If you do not have `ng serve` then do not use the --gui as it may give un expected results.

Make sure you change the aws deployment bucket in serverless.yml to match your deployment bucket

1. clone the repo and cd into the directory
2. run `npm install`
3. run `cd sls_deployalizer`
4. run `npm link`
5. run `cd ../`
6. run `npm link sls_deployalizer`
7. run `serverless login`
3. run `sls deploy --slsd --gui --aws-profile yourprofile`

## What to expect

<img src="https://github.com/oussiden/vf-sls-delpoy/blob/master/example.png" alt="SLS Deployalzier" style='height: 100px;'/>

When you run `sls deploy --slsd ...`, you will see the above logo. Below the logo will be a list of all the slsd commands that you supplied. If you supplied the `--gui` command the sls deployalizer will load an angular application and display the deployment results and also an aggregated list of past deployments. 


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

> --view options can be mixed and matched by delaminating them with a comma: `--view download,resources,functions` or you can use them individually

| Option  | Description |
|:----------| :---------- |
|no value   | Providing an empty value will cause the entire serverless template to print |
|resources  | Display only the aws logical resources |
|functions  | Display only the lambda functions |
|download   | Saves the active templates file in ./templates/...<br> ./templates will be created if it does not exist |

## Gui

When you run `sls --slsd --gui` then after deployment the sls deployalizer plugin will get the api gateway stage endpoint and place it in gui/proxy.config.json file and then open your default browser and make an api request to the same lambda function used after deployment.

On the first run sls deployalizer will attempt to install the angular application inside of the gui folder using npm install. you can see this in the gui class. 

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
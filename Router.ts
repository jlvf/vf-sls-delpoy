import S3 from "aws-sdk/clients/s3";
import { Deployalizer } from "./Deployalizer";
import { DynamoDB } from 'aws-sdk/clients/all';

export class Router {

    private LambdaStart = new Date().getTime();
    private statusCode: number = 200;
    private body: any = {"test": "test"};
    private headers: any = { 
      'Content-Type': 'application/json' 
    };
    private deployalizer: Deployalizer;
    public iswaiting: boolean = true;
    
    constructor(private event, private context) {
  
    }
  
    private isValidRequest(): boolean {
      if (!this.isSlsdRequest() && !this.isBrowserRequest()) {
        this.setError("Either slsd or httpMethod is a required attribute");
        return false;
      } else if (this.isSlsdRequest()) {
        if (typeof this.event.deploytime_utc_ms === "undefined") {
          this.setError("deploytime_utc_ms is required when using the slsd attribute");
          return false;
        }
      }
      return true;
    }
  
    private initSLSDeploy() {
      this.deployalizer = new Deployalizer({
        s3: new S3(), 
        ddbClient: new DynamoDB.DocumentClient(),
        s3Bucket: process.env.SLS_DEPLOY_BUCKET,
        s3Prefix: process.env.SLS_BUCKET_PREFIX,
        tableName: process.env.DDB_TABLE_NAME,
        slsServiceName: process.env.SLS_SERVICE_NAME,
        deploytime_utc_ms: typeof this.event.deploytime_utc_ms === "undefined" ? null : this.event.deploytime_utc_ms,
        cfOutputs: typeof this.event.cloudFormationOutputs !== "undefined" ? this.event.cloudFormationOutputs : null
      });
    }
  
    private async routeRequest() {
      if (this.isSlsdRequest()) {
        await this.runSlsDeploy();
      } else if (this.isBrowserRequest()) {
        const data = await this.getBrowserData();
        this.setSuccess("Request From Browser", data);
      }
    }
  
    async getBrowserData() {
      return {
        s3Bucket: process.env.SLS_DEPLOY_BUCKET,
        s3Prefix: process.env.SLS_BUCKET_PREFIX,
        ddbTableName: process.env.DDB_TABLE_NAME,
        slsServiceName: process.env.SLS_SERVICE_NAME,
        appName: process.env.APP_NAME,
        slsStageName: process.env.SLS_STAGE_NAME,
        stackName: process.env.STACK_NAME,
        templates: await this.deployalizer.getAllSLSTemplates(),
        stats: await this.deployalizer.getDeploymentStats()
      }
    }
  
    async runSlsDeploy() {
      const slsd = await this.deployalizer.insertLatestSLSTemplate();
      if (slsd) {
        this.setSuccess(process.env.SLS_SERVICE_NAME + " has been created and data has been deployed");
      } else {
        this.setError(process.env.SLS_SERVICE_NAME + " template could not be inserted into " + process.env.DDB_TABLE_NAME)
      }
      if (this.isStats()) {
        this.body.stats = await this.deployalizer.getDeploymentStats();
      }
      if (this.isView()) {
        this.body.template = this.deployalizer.template;
      }
    }
  
    isSlsdRequest() {
      return typeof this.event.slsd !== "undefined";
    }
  
    isBrowserRequest() {
      return typeof this.event.httpMethod !== "undefined";
    }
  
    isStats() {
      return typeof this.event.stats !== "undefined";
    }
  
    isView() {
      return typeof this.event.view !== "undefined";
    }
  
    setError( message: string) {
      this.statusCode = 500;
      this.body = {message: "Invalid SLSD Request: " + message};
    }
  
    setSuccess(message: string, data?: any) {
      this.statusCode = 200;
      this.body = {
        message,
        ...data
      }
    }
  
    async response() {
      if (this.isValidRequest()) {
        this.initSLSDeploy();
        await this.routeRequest();
      }
      if (this.statusCode === 200) {
        this.body.lambdaRuntime = this.deployalizer.convertMsToTime((new Date().getTime()) - this.LambdaStart);
      }
      return {
        statusCode: this.statusCode,
        headers: this.headers,
        body: JSON.stringify(this.body)
      }
    }
  }
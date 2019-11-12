'use strict';

const child_process = require('child_process');

class ServerlessPlugin {

  startDeploy = 0;

  constructor(serverless, options) {
    
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      sls_deployalizer: {
        usage: 'Invokes the initstack function after deployment',
        lifecycleEvents: ['beforeDeploy', 'afterDeploy'],
        options: {
          slsd: {
            usage: 'Enable the SLS Deployalizer Plugin (e.g. "--slsd")',
            required: false,
          },
          stats: {
            usage: 'Get the deployment statistics (e.g. "--stats")',
            required: false,
          },
          view: {
            usage: 'View the serverless deployment template (e.g. "--view null | resources | functions | download")',
            required: false
          }
        },
      },
    };

    this.hooks = {
      'before:deploy:deploy': this.beforeDeploy.bind(this),     
      'after:deploy:deploy': this.afterDeploy.bind(this),
    };
  }

  isSlsd(option) {
    if (!option) {
      return typeof this.options['slsd'] !== "undefined";
    } else {
      return typeof this.options[option] !== "undefined";
    }
  }

  beforeDeploy() {
    this.startDeploy = new Date().getTime();
    if (this.isSlsd()) {
      this.serverless.cli.log('');
      this.serverless.cli.log('--------------------------------------');
      this.serverless.cli.log('-          SLS_DEPLOYALIZER          -');
      this.serverless.cli.log('--------------------------------------');
    }
    const options = this.commands.sls_deployalizer.options;
    const keys = Object.keys(options);
    for (const key of keys) {
      if (this.isSlsd(key)) {
        this.serverless.cli.log("- "+options[key].usage);
      }
    }
    this.serverless.cli.log('');
  }

  getCustomOptions() {
    const options = [];
    const data = {};
    data.deploytime_utc_ms = new Date().getTime() - this.startDeploy;
    if (this.isSlsd()) {
      data.slsd = true;
    }
    if (this.isSlsd('stats')) {
      data.stats = true;
    }
    if (this.isSlsd('view')) {
      data.view = true;
    }
    if (typeof this.options['aws-profile'] !== 'undefined') {
      options.push('--aws-profile');
      options.push(this.options['aws-profile']);
    }
    if (Object.keys(data).length > 0) {
      options.push('--data')
      options.push(JSON.stringify(data));
    }
    return options;
  }

  processViewDownload(response) {
    const fs = require('fs');
    const folder = './templates';
    if (!fs.existsSync(folder)){
      fs.mkdirSync(folder);
    }
    const data = JSON.stringify(response.body.template);
    const fname = response.body.template.service_name + "-" + response.body.template.created_utc_ms + "-sls-template.json";
    fs.writeFile(folder+"/"+fname, data, (err) => {
      if (err) {
        this.serverless.cli.log("Could not save "+fname);
        console.log(err);
      } else {
        this.serverless.cli.log(fname + " saved");
      }
    });
  }

  processViewResource(response) {
    const resources = []
    const keys = Object.keys(response.body.template.template.Resources);
    for (const key of keys) {
      resources.push(key);
    }
    response.body.template.resources = resources;
  }

  processViewFunctions(response) {
    const functions = []
    const keys = Object.keys(response.body.template.template.Resources);
    for (const key of keys) {
      if (response.body.template.template.Resources[key].Type === "AWS::Lambda::Function") {
        functions.push(key);
      }
    }
    response.body.template.functions = functions;
  }

  getViewRunOptions() {
    const viewOptions = this.options['view'].split(',');
    const runOptions = [];
    for (const opt of viewOptions) {
      if (opt === 'download') {
        runOptions.unshift(opt);
      } else {
        runOptions.push(opt);
      }
    }
    return runOptions;
  }

  processView(response) {
    response.body.template = JSON.parse(response.body.template);
    if (this.options['view'].length > 0) {
      const runOptions = this.getViewRunOptions();
      if (runOptions.length > 0) {
        for (const opt of runOptions) {
          if (opt.trim() === 'download') {
            this.processViewDownload(response);
          }
          if (opt.trim() === 'resources') {
            this.processViewResource(response);
          }
          if (opt.trim() === "functions") {
            this.processViewFunctions(response);
          }
        }
        delete response.body.template.template;
      }
    }
  }

  afterDeploy() {
    if (this.isSlsd()) {
      const spawn = child_process.spawn;
      const customOptions = this.getCustomOptions();
      const options = ['invoke', '--function=initstack', ...customOptions];
      const child = spawn('/usr/local/bin/sls', options, {
        stdio: ['inherit', 'pipe', 'pipe'],
        detached: true,
      });
      child.stdout.on('data', (data) => {
        const response = JSON.parse(data.toString());
        if (this.isSlsd('view')) {
          this.processView(response);
        }
        this.printResponse(response);
      });  
    } 
  }

  printHelper(bump, data) {
    const keys = Object.keys(data);
    for (const key of keys) {
      if (typeof data[key] === 'object') {
        this.serverless.cli.log(bump+key+":");
        this.printHelper(bump + ' ', data[key]);
      } else {
        this.serverless.cli.log(bump+key+": "+data[key]);
      }
    }
  }

  printResponse(data) {
    // this.serverless.cli.log(jsonStr);
    // const data = JSON.parse(jsonStr);
    // const body = JSON.parse(data.body);
    const keys = Object.keys(data);
    this.serverless.cli.log('');
    this.serverless.cli.log('--------------------------------------');
    this.serverless.cli.log('-         Function Response          -');
    this.serverless.cli.log('--------------------------------------');
    for (const key of keys) {
      if (typeof data[key] === 'object') {
        this.serverless.cli.log(key +":");
        this.printHelper(' ', data[key]);
      } else {
        this.serverless.cli.log(key+": "+data[key]);
      }
    }
  }

}

module.exports = ServerlessPlugin;

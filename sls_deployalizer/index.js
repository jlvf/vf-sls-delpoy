'use strict';

const child_process = require('child_process');

class ServerlessPlugin {

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    // this.provider = this.serverless.getProvider(this.serverless.service.provider.name);

    this.commands = {
      sls_deployalizer: {
        usage: 'Helps you start your first Serverless plugin',
        lifecycleEvents: ['beforeDeploy'],
        options: {
          slsd: {
            usage: 'Use the SLS Deployalizer Plugin (e.g. "--slsd")',
            required: false,
          },
          avg: {
            usage: 'Get the average time between deployments (e.g. "--avg")',
            required: false,
          },
          count: {
            usage: 'Get the number of past deployments (e.g. "--count")',
            required: false
          }
        },
      },
    };

    this.hooks = {
      // 'before:welcome:hello': this.beforeWelcome.bind(this),
      // 'welcome:hello': this.welcomeUser.bind(this),
      // 'welcome:world': this.displayHelloMessage.bind(this),
      // 'after:welcome:world': this.afterHelloWorld.bind(this),
      'before:deploy:deploy': this.beforeDeploy.bind(this),     
      'after:deploy:deploy': this.afterDeploy.bind(this),
    };
  }

  isSlsd() {
    return typeof this.options['slsd'] !== "undefined";
  }

  isAvg() {
    return typeof this.options['avg'] !== "undefined" && this.isSlsd();
  }

  isCount() {
    return typeof this.options['count'] !== "undefined" && this.isSlsd();
  }

  beforeDeploy() {
    if (this.isSlsd()) {
      this.serverless.cli.log('');
      this.serverless.cli.log('--------------------------------------');
      this.serverless.cli.log('-          SLS_DEPLOYALIZER          -');
      this.serverless.cli.log('--------------------------------------');
    }
    if(this.isAvg()) {
      this.serverless.cli.log('- Return Average Time Between Deployments');
    }
    if(this.isCount()) {
      this.serverless.cli.log('- Return Number Of Past Deployments');
    }
    this.serverless.cli.log('');
  }

  getCustomOptions() {
    const options = [];
    const data = {};
    if (this.isCount()) {
      data.count = true;
    }
    if (this.isAvg()) {
      data.avg = true;
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
        this.printResponse(data.toString());
        // this.serverless.cli.log(data.toString());
      });  
    } 
  }

  printHelper(bump, jsonobj) {
    const keys = Object.keys(jsonobj);
    for (const key of keys) {
      if (typeof jsonobj[key] === 'object') {
        this.serverless.cli.log(bump+key +":");
        bump = bump + '\t';
        this.printHelper(bump, jsonobj[key]);
      } else {
        this.serverless.cli.log(bump+key+": "+jsonobj[key]);
      }
    }
  }

  printResponse(jsonStr) {
    const data = JSON.parse(jsonStr);
    const body = JSON.parse(data.body);
    const keys = Object.keys(body);
    this.serverless.cli.log('');
    this.serverless.cli.log('--------------------------------------');
    this.serverless.cli.log('-         Function Response          -');
    this.serverless.cli.log('--------------------------------------');
    for (const key of keys) {
      if (typeof body[key] === 'object') {
        this.serverless.cli.log(key +":");
        this.printHelper('\t', body[key]);
      } else {
        this.serverless.cli.log(key+": "+body[key]);
      }
    }
  }

}



  
module.exports = ServerlessPlugin;

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
            usage: 'Use the SLS Deployalizer Plugin (e.g. "--slsd")',
            required: false,
          },
          stats: {
            usage: 'Get the deployment statistics (e.g. "--stats")',
            required: false,
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
    if(this.isSlsd('stats')) {
      this.serverless.cli.log('- Get deployment statistics');
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
        this.printResponse(JSON.parse(data.toString()));
      });  
    } 
  }

  printHelper(bump, data) {
    const keys = Object.keys(data);
    for (const key of keys) {
      if (typeof data[key] === 'object') {
        this.serverless.cli.log(bump+key +":");
        bump = bump + '\t';
        this.printHelper(bump, data[key]);
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
        this.printHelper('\t', data[key]);
      } else {
        this.serverless.cli.log(key+": "+data[key]);
      }
    }
  }

}

module.exports = ServerlessPlugin;

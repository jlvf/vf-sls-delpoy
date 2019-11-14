'use strict';

const child_process = require('child_process');
const spawn = child_process.spawn;
const Invoker = require('./Invoker');
const Viewer = require('./Viewer');
const Gui = require('./Gui');

class SLSDeployalizer {

  startDeploy = 0;
  gui = null;
  exitApp = false;
  cloudFormationOutputs = null;
  invoker = null;

  constructor(serverless, options) {
    this.invoker = new Invoker(this);
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
          },
          gui: {
            usage: 'Open an angular gui that displays deployment information (e.g. "--gui")',
            required: false
          }
        },
      },
    };

    this.hooks = {
      'before:deploy:deploy': this.beforeDeploy.bind(this),     
      'after:deploy:deploy': this.afterDeploy.bind(this),
      // 'aws:info:displayEndpoints': this.loadGatewayEndpoint.bind(this)
    };

    process.on('exit', this.mainExit.bind(this,{cleanup:"exit"}));
    process.on('SIGINT', this.mainExit.bind(this, {exit:"SIGINT"}));
    process.on('SIGUSR1', this.mainExit.bind(this, {exit:"SIGUSR1"}));
    process.on('SIGUSR2', this.mainExit.bind(this, {exit:"SIGUSR2"}));
    process.on('uncaughtException', this.mainExit.bind(this, {exit:"uncaughtException"}));

  }

  onInvokeComplete(response) {
    if (response) {
      if (this.isSlsd('view')) {
        const view = new Viewer(this, response);
        view.processView();
      }
      this.printResponse(response);
      if (this.isSlsd('gui')) {
        const gui = new Gui(this);
        gui.runGui();
        //this.runGui();
      } else {
        this.serverless.cli.log("Thank you for using SLS Deployalizer!");
      }
    } else {
      this.serverless.cli.log("There was an error with the invoke function");
    }
  }

  mainExit(options, exitCode) {
      if (!this.exitApp) {
        let intv = setInterval(() => {
          if (this.exitApp) {
            this.serverless.cli.log("Thank you for using SLS Deployalizer!");
            process.exit();
            clearInterval(intv);
          } else if (!this.gui) {
            this.serverless.cli.log("Thank you for using SLS Deployalizer!");
            process.exit();
            clearInterval(intv);
          }
        }, 500);
    }
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
      this.serverless.cli.log('-          SLS DEPLOYALIZER          -');
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
    data.cloudFormationOutputs = this.cloudFormationOutputs;
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

  onCFOutputsExit = (code) => {
    const customOptions = this.getCustomOptions();
    const options = ['invoke', '--function=initstack', ...customOptions];
    this.invoker.invokeLambdaFunction(options);
    // this.invokeLambdaFunction(options);
  }

  getCloudFormationOutputs() {
    const options = ['cloudformation', 'describe-stacks', '--stack-name', this.serverless.service.provider.stackName, '--query', 'Stacks[0].Outputs', '--region', this.serverless.service.provider.region];
    if (typeof this.options['aws-profile'] !== 'undefined') {
      options.push('--profile');
      options.push(this.options['aws-profile']);
    }
    this.serverless.cli.log('getting cloudformation outputs...');
    const child = spawn('aws', options, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      child.on('exit', this.onCFOutputsExit);
      child.on('SIGINT', this.onCFOutputsExit);
      child.on('SIGUSR1', this.onCFOutputsExit);
      child.on('SIGUSR2', this.onCFOutputsExit);
      child.on('uncaughtException', this.onCFOutputsExit);
      child.stdio[1].on('data', (data) => {
        const result = JSON.parse(data.toString());
        this.cloudFormationOutputs = result;
      });
    }

  afterDeploy() {
    if (this.isSlsd()) {
      this.getCloudFormationOutputs();
    } 
  }

  printHelper(bump, data) {
    if (data) {
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
  }

  printResponse(data) {
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

module.exports = SLSDeployalizer;

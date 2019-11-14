'use strict';

const child_process = require('child_process');
const spawn = child_process.spawn;

class Gui {

    constructor(parent) {
      this.parent = parent;
      this.gui = null;
    }
  
    isGuiInstalled() {
      const fs = require('fs');
      return fs.existsSync("gui/node_modules");
    }
  
    onInstallGuiExit(options, exitCode) {
      process.chdir('../');
      this.runGui(true);
    }
  
    installGui() {
      this.parent.serverless.cli.log('installing gui...');
      process.chdir('gui');
      const child = spawn('npm', ['install'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      child.on('exit', this.onInstallGuiExit.bind(this, {cleanup:true}));
      child.on('SIGINT', this.onInstallGuiExit.bind(this, {exit:true}));
      child.on('SIGUSR1', this.onInstallGuiExit.bind(this, {exit:true}));
      child.on('SIGUSR2', this.onInstallGuiExit.bind(this, {exit:true}));
      child.on('uncaughtException', this.onInstallGuiExit.bind(this, {exit:true}));
      child.stdio[1].on('data', (data) => {
        this.parent.serverless.cli.log(data.toString());
      });
    }
  
    runGui(skipCheck = false) {
      if(!this.isGuiInstalled() && !skipCheck) {
        this.installGui();
      } else {
        this.loadGatewayEndpoint();
        this.parent.serverless.cli.log("");
        this.parent.serverless.cli.log("Opening Gui...");
        this.parent.serverless.cli.log("hit ctrl-c to exit");
        this.parent.serverless.cli.log("");
        process.chdir('gui');
        this.gui = spawn('npm', ['run','dev'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });
  
        this.gui.on('exit', this.onGuiExit);
        this.gui.on('SIGINT', this.onGuiExit);
        this.gui.on('SIGUSR1', this.onGuiExit);
        this.gui.on('SIGUSR2', this.onGuiExit);
        this.gui.on('uncaughtException', this.onGuiExit);
  
        this.gui.stdio[1].on('data', (data) => {
          this.parent.serverless.cli.log(data.toString());
        });
  
        const intv = setInterval(() => {
          if (this.parent.exitApp) {
            clearInterval(intv);
          }
        }, 500);
      }
    }
  
    onGuiExit = (code) => {
      this.parent.serverless.cli.log("Closing Gui Connection");
      this.parent.exitApp = true;
    }
  
    loadGatewayEndpoint() {
      const options = [];
      if (typeof this.options['aws-profile'] !== 'undefined') {
        options.push('--aws-profile');
        options.push(this.options['aws-profile']);
      }
      this.parent.serverless.cli.log('updating proxy.config.json...')
      const child = spawn('sls', ['info', ...options], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      child.stdio[1].on('data', (data) => {
        const fs = require('fs');
        const regexMatch = data.toString().match(/POST - ([a-zA-Z0-9.\-:\/]*)/);
        if (regexMatch) {
          const apiGatewayUrl = regexMatch[1].trim('\n');
          let proxyFile = JSON.parse(fs.readFileSync('../gui/proxy.config.json'));
          proxyFile['/api/*'].target = apiGatewayUrl;
          fs.writeFileSync('../gui/proxy.config.json', JSON.stringify(proxyFile, null, 4));
          child.kill();
        }    
      });
    }
  }

  module.exports = Gui;

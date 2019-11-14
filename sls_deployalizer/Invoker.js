'use strict';

const child_process = require('child_process');
const spawn = child_process.spawn;

class Invoker {

    subProcess = null;
    data = "";
    parent = null;
  
    constructor(parent) {
      this.parent = parent;
    }
  
    onInvokeExit = (code) => {
      if (code === 0) {
        const response = JSON.parse(this.data);
        response.body = JSON.parse(response.body);
        this.parent.onInvokeComplete(response);
      }
    }
  
    invokeLambdaFunction(options) {
      let invokeComplete = false;
      this.subProcess = spawn('/usr/local/bin/sls', options, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: true
      });
      
      this.subProcess.on('exit', this.onInvokeExit);
      this.subProcess.on('SIGINT', this.onInvokeExit);
      this.subProcess.on('SIGUSR1', this.onInvokeExit);
      this.subProcess.on('SIGUSR2', this.onInvokeExit);
      this.subProcess.on('uncaughtException', this.onInvokeExit.bind(this));
  
      this.subProcess.stdio[1].on('data', (data) => {
        const tmp = data.toString();
        this.data += tmp.trim();
      });
    }
  
  }

  module.exports = Invoker;
  
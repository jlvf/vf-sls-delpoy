'use strict';

class Viewer {

    constructor(parent, response) {
      this.parent = parent;
      this.response = response;
    }
  
    processViewDownload() {
      const fs = require('fs');
      const folder = './templates';
      if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
      }
      const data = JSON.stringify(this.response.body.template, null, 4);
      const fname = this.response.body.template.service_name + "-" + this.response.body.template.created_utc_ms + "-sls-template.json";
      fs.writeFile(folder+"/"+fname, data, (err) => {
        if (err) {
          this.parent.serverless.cli.log("Could not save "+fname);
          console.log(err);
        } else {
          this.parent.serverless.cli.log(fname + " saved");
        }
      });
    }
  
    processViewResource() {
      const resources = []
      const keys = Object.keys(this.response.body.template.template.Resources);
      for (const key of keys) {
        resources.push(key);
      }
      this.response.body.template.resources = resources;
    }
  
    processViewFunctions() {
      const functions = []
      const keys = Object.keys(this.response.body.template.template.Resources);
      for (const key of keys) {
        if (this.response.body.template.template.Resources[key].Type === "AWS::Lambda::Function") {
          functions.push(key);
        }
      }
      this.response.body.template.functions = functions;
    }
  
    getViewRunOptions() {
      const viewOptions = this.parent.options['view'].split(',');
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
  
    processView() {
      if (this.parent.options['view'].length > 0) {
        const runOptions = this.getViewRunOptions();
        if (runOptions.length > 0) {
          for (const opt of runOptions) {
            if (opt.trim() === 'download') {
              this.processViewDownload();
            }
            if (opt.trim() === 'resources') {
              this.processViewResource();
            }
            if (opt.trim() === "functions") {
              this.processViewFunctions();
            }
          }
          delete this.response.body.template.template;
        }
      }
    }
  
  }

module.exports = Viewer;

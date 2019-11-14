import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api.service';
import { keyframes } from '@angular/animations';

export interface DeploymentsInterface {
  stats: any;
  templates: any;
  env: any;
}

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {

  public deployments: any = null;
  public activeDeployment: any = null;
  public resources: any = [];
  public outputs: any = [];
  public functions: any = [];
  public currentIndex: number = 0;

  constructor(private apiService: ApiService) {
    this.init();
  }

  init() {
    this.apiService.getDeployments().subscribe((callback: DeploymentsInterface) => {
      this.deployments = callback;
      this.currentIndex = callback.templates.length - 1;
      this.loadDeployment(this.currentIndex);
    });
  }

  isCurrentDeployment(): boolean {
    return this.currentIndex === this.deployments.templates.length - 1;
  }

  loadResources() {
    this.resources = this.activeDeployment.template.Resources;
  }

  loadFunctions() {
    this.functions = [];
    const rkeys = this.getKeys(this.resources);
    for (const key of rkeys) {
      if (key.match(/Function/g)) {
        this.functions.push(key);
      }
    }
  }

  loadDeployment(index) {
    this.activeDeployment = this.deployments.templates[index];
    this.loadResources();
    this.loadFunctions();
  }

  loadOutput() {
    // this.output = this.activeDeployment.template.Outputs;
  }

  next() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadDeployment(this.currentIndex);
    }
  }

  convertMsToDt(ms: number) {
    return new Date(ms).toDateString();
  }

  convertMsToTime(miliseconds: number): string {
    let days, hours, minutes, seconds;
    if (miliseconds < 1000) {
        return (miliseconds / 1000).toFixed(2) + " seconds";
    }
    seconds = Math.floor(miliseconds / 1000);
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    days = Math.floor(hours / 24);
    hours = hours % 24;
    const d = days > 0 ? days + " days " : "";
    const h = hours > 0 ? hours + " hours " : "";
    const m = minutes > 0 ? minutes + " minutes " : "";
    const s = seconds > 0 ? seconds + " seconds " : "";
    return (d + h + m + s).trim();
}

  prev() {
    if (this.currentIndex < this.deployments.templates.length - 1) {
      this.currentIndex++;
      this.loadDeployment(this.currentIndex);
    }
  }

  getKeys(item: any): Array<any> {
    return Object.keys(item);
  }

  ngOnInit() {
  }

}

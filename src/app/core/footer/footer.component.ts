import { Component, OnInit } from '@angular/core';
import { VersionService } from 'src/app/shared/services/version.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  webAppVersion: string;
  apiVersion: string;

  constructor(
    private versionSrv: VersionService
  ) { }


  async ngOnInit() {
    this.loadWebAppVersion();
    await this.loadApiVersion();
  }

  loadWebAppVersion(){
    const version = environment.version;
    this.webAppVersion = version;
  }

  async loadApiVersion(){
    const {success, data} = await this.versionSrv.GetVersionApi();
    if(success){
      this.apiVersion = data.version;
    }
  }

}

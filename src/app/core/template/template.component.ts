import { Component } from '@angular/core';

import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent {

  constructor( public responsiveSrv: ResponsiveService ) { }

}

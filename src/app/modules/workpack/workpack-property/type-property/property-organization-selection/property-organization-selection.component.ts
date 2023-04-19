import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-property-organization-selection',
  templateUrl: './property-organization-selection.component.html',
  styleUrls: ['./property-organization-selection.component.scss']
})
export class PropertyOrganizationSelectionComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  responsive: boolean;
  $destroy = new Subject();
  language: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
  }

  ngOnInit(): void {
    this.setLanguage();
  }
  
  ngOnDestroy() {
    this.$destroy.complete();
    this.$destroy.subscribe();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

}

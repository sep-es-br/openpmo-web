import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';

@Component({
  selector: 'app-property-integer',
  templateUrl: './property-integer.component.html',
  styleUrls: ['./property-integer.component.scss']
})
export class PropertyIntegerComponent implements OnInit {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  type = TypePropertyModelEnum;
  responsive: boolean;
  $destroy = new Subject();
  language: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe( value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
  }

  ngOnInit(): void {
    this.language = this.translateSrv.currentLang;
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  
}


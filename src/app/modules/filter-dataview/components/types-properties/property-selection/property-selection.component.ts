import { takeUntil } from 'rxjs/operators';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-property-selection',
  templateUrl: './property-selection.component.html',
  styleUrls: ['./property-selection.component.scss']
})
export class PropertySelectionComponent implements OnInit {

  @Input() property: IFilterProperty;
  @Input() value;
  @Output() changed = new EventEmitter();
  type = TypePropertyModelEnum;
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

  handleChangedValue() {
    this.changed.next({value: this.value})
  }

}

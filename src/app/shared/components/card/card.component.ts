import { Component, Input, OnDestroy, Output, SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ICard } from '../../interfaces/ICard';
import { ResponsiveService } from '../../services/responsive.service';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit, OnDestroy, OnChanges {

  @Input() properties: ICard;
  @Output() selectedFilter = new EventEmitter();
  @Output() editFilter = new EventEmitter();
  @Output() newFilter = new EventEmitter();
  @Output() createNewElement = new EventEmitter();
  @Output() changeCheckCompleted = new EventEmitter();
  @Output() changeFullScreen = new EventEmitter();

  responsive: boolean;
  subResponsive: Subscription;
  language: string;
  $destroy = new Subject();
  filterListOptions: SelectItem[];
  filterSelected: number;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
      }
    );
    if (this.properties && !!this.properties.showFilters) {
      this.loadFilterListOptions();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.properties && changes.properties.currentValue && !!this.properties.showFilters
    ) {
      this.loadFilterListOptions();
    }
  }

  ngOnInit() {
    this.setLanguage();
    if (this.properties && !!this.properties.showFilters) {
      this.loadFilterListOptions();
    }
  }

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.properties?.onToggle?.complete();
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadFilterListOptions() {
    this.filterListOptions = [{
      label: this.translateSrv.instant('filterAll'),
      value: null
    }];
    if (this.properties && this.properties.filters) {
      this.properties.filters.forEach( filter => {
        this.filterListOptions.push({
          label: filter.name,
          value: filter.id
        });
        if (!!filter.favorite) {
          this.filterSelected = filter.id;
        }
      });
    }
    this.filterListOptions.push({
      label: 'divider',
      value: -1,
      disabled: true
    });
    this.filterListOptions.push({
      label: this.translateSrv.instant('newFilter'),
      value: -1
    });
  }

  handleCollapsed(event?) {
    this.properties.initialStateCollapse = event ? event : !this.properties.initialStateCollapse;
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
    console.log('language', this.language)
  }

  handleFilterSelected(idFilter: number) {
    this.selectedFilter.emit({filter: idFilter});
  }

  handleFilterEdit(idFilter: number) {
    this.editFilter.emit({filter: idFilter});
  }

  handleNewFilter() {
    this.newFilter.emit();
  }

  handleCreateNewElement() {
    this.createNewElement.emit();
  }

  handleChangeCheckCompleted(event) {
    this.changeCheckCompleted.emit(event);
  }

  handleChangeFullScreen() {
    this.changeFullScreen.emit();
  }

}

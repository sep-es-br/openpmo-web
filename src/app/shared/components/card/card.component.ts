import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Component, Input, OnDestroy, Output, SimpleChanges, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ICard } from '../../interfaces/ICard';
import { ResponsiveService } from '../../services/responsive.service';
import { SelectItem } from 'primeng/api';
import {IWorkpack} from '../../interfaces/IWorkpack';
import { WorkpackShowTabviewService } from '../../services/workpack-show-tabview.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit, OnDestroy, OnChanges {

  @Input() properties: ICard;
  @Input() loading: boolean;
  @Output() selectedFilter = new EventEmitter();
  @Output() editFilter = new EventEmitter();
  @Output() newFilter = new EventEmitter();
  @Output() createNewElement = new EventEmitter();
  @Output() changeCheckCompleted = new EventEmitter();
  @Output() changeFullScreen = new EventEmitter();
  @Output() searchText = new EventEmitter();
  searchTextAux = undefined;

  responsive: boolean;
  subResponsive: Subscription;
  language: string;
  $destroy = new Subject();
  filterListOptions: SelectItem[];
  canEditCheckCompleted: boolean;
  showTabview = false;
  showAnimationSearch = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    public translateSrv: TranslateService,
    private workpackSrv: WorkpackService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
      }
    );
    if (this.properties && !!this.properties.showFilters) {
      this.loadFilterListOptions();
    }
    this.workpackSrv.observableCanEditCheckCompleted.pipe(takeUntil(this.$destroy)).subscribe( canEdit => {
      if (canEdit) {
        this.canEditCheckCompleted = true;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.properties && changes.properties.currentValue) || changes.loading
    ) {
      this.showAnimationSearch = !this.properties.searchTerm || this.properties.searchTerm === '' ? false : true;
      this.properties.progressBarValues = this.properties.progressBarValues &&
        this.properties.progressBarValues.filter( item => item.total !== 0 );
      this.canEditCheckCompleted = this.properties.canEditCheckCompleted;
      if (!!this.properties.showFilters) {
        this.loadFilterListOptions();
      }

    }
  }

  ngOnInit() {
    this.properties.progressBarValues = this.properties?.progressBarValues &&
      this.properties.progressBarValues.filter( item => item.total !== 0 );
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
        if (this.properties.idFilterSelected) {
          this.properties.idFilterSelected = this.properties.idFilterSelected;
        } else {
          if (!!filter.favorite) {
            this.properties.idFilterSelected = filter.id;
          }
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

  handleChangeFullScreen(fullScreenMode: boolean) {
    this.changeFullScreen.emit(fullScreenMode);
  }

  handleSearchText() {
    const inputtext = document.getElementById('id-app-inputtext'+this.properties.cardTitle);
    inputtext.focus();
    const value = this.properties.searchTerm;
    if (value !== this.searchTextAux) {
      this.searchText.emit({term: value});
      this.searchTextAux = value;
    }
    if (value === '' || !value) {
      this.showAnimationSearch = false;
    }
  }

  get label(): string {
    return this.properties.workpackType ? this.properties.workpackType === 'Milestone' ? 'completed' : 'scopeCompleted' : '';
  }

}

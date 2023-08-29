import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Route, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { SelectItem, TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { iconsJournal } from 'src/app/shared/constants/iconsJournal';
import { StatusJournalEnum } from 'src/app/shared/enums/StatusJournalEnum';
import { TypeJournalEnum } from 'src/app/shared/enums/TypeJournalEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ITreeViewScopePlan, ITreeViewScopeWorkpack } from 'src/app/shared/interfaces/ITreeScopePersons';
import { IWorkpackData, IWorkpackParams } from 'src/app/shared/interfaces/IWorkpackDataParams';
import { IJournal } from 'src/app/shared/interfaces/Journal';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { JournalService } from 'src/app/shared/services/journal.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-workpack-section-journal',
  templateUrl: './workpack-section-journal.component.html',
  styleUrls: ['./workpack-section-journal.component.scss']
})
export class WorkpackSectionJournalComponent implements OnInit, OnDestroy {

  @ViewChild('journal') journalElement: ElementRef;

  showTabview = false;
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  formSearch: FormGroup;
  calendarFormat: string;
  optionsType: SelectItem[] = [];
  responsive: boolean;
  $destroy = new Subject();
  treeViewScope: TreeNode[] = [];
  selectedWorkpacks: TreeNode[] = [];
  journalData: IJournal[] = [];
  typeJounalEnum = TypeJournalEnum;
  statusJounalEnum = StatusJournalEnum;
  hasMore = true;
  hasAll = true;
  page = 0;
  pageSize = 5;
  yearRange: string;
  isLoading = false;
  language: string;
  cardJournalProperties: ICard;
  collapsePanelsStatus: boolean;
  editPermission: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private journalSrv: JournalService,
    private route: Router,
    private authService: AuthService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService,
    private configDataViewSrv: ConfigDataViewService,
    private workpackSrv: WorkpackService
  ) {
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardJournalProperties = Object.assign({}, {
        ...this.cardJournalProperties,
        collapseble: this.showTabview ? false : true,
        initialStateCollapse: this.collapsePanelsStatus
      });
    });
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
      const panelStatus = this.configDataViewSrv.getPanelStatus();
      this.collapsePanelsStatus = this.showTabview ? false : (panelStatus === 'collapse' ? true : false);
      this.handleChangeShowTabview();
    });
    this.cardJournalProperties = {
      toggleable: false,
      initialStateToggle: false,
      notShowCardTitle: this.showTabview ? true : false,
      cardTitle: 'journal',
      collapseble: this.showTabview ? false : true,
      initialStateCollapse: this.collapsePanelsStatus,
    };
    this.setLanguage();
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart - 10).toString() + ':' + (yearStart + 10).toString();
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.formSearch = this.formBuilder.group({
      from: [''],
      to: [''],
      type: [['INFORMATION']],
      scopeName: ''
    });
    this.optionsType = Object.keys(TypeJournalEnum).map(key => ({
      label: this.translateSrv.instant(TypeJournalEnum[key]),
      value: key
    }));
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
    this.journalSrv.observableResetJournal.pipe(takeUntil(this.$destroy)).subscribe( reset => {
      if (reset) {
        this.loadJournalReset();
      }
    });
    this.journalSrv.observableResetScope.pipe(takeUntil(this.$destroy)).subscribe( reset => {
      if (reset) {
        this.loadScopeReset();
      }
    });
  }

  async ngOnInit() {
    
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  handleChangeShowTabview() {
    this.cardJournalProperties = Object.assign({}, {
      ...this.cardJournalProperties,
      notShowCardTitle: this.showTabview ? true : false,
      collapseble: !this.showTabview
    });
  }


  // buscando os dados do journal no service
  loadJournalReset() {
    const {
      workpackData,
      workpackParams,
      searchParams,
      journalData,
      hasMore,
      hasAll,
      loading
    } = this.journalSrv.getJournal();
    this.workpackData = workpackData;
    this.workpackParams = workpackParams;
    this.journalData = journalData;
    this.editPermission = this.workpackSrv.getEditPermission() ? true : false;
    this.formSearch.reset({
      ...searchParams
    });
    this.hasAll = hasAll;
    this.hasMore = hasMore;
    if (loading) this.isLoading = true;
    if (!loading) this.buidJournalView();
  }


  // buscar o scope do service
  loadScopeReset() {
    const {
      treeViewScope,
      selectedWorkpacks,
    } = this.journalSrv.getJournal();
    this.treeViewScope = treeViewScope;
    this.selectedWorkpacks = selectedWorkpacks;
    this.loadTreeViewScope();
  }

  async getJournal() {
    this.isLoading = true;
    this.journalSrv.loadJournal({
      scopeName: this.formSearch.controls.scopeName.value,
      from: this.getFrom(),
      to: this.getTo(),
      type: this.formSearch.controls.type.value,
      selectedWorkpacks: this.selectedWorkpacks,
      page: this.page,
      size: this.pageSize,
      hasAll: this.hasAll,
      hasMore: this.hasMore
    });
  }

  async buidJournalView() {
    this.journalData = this.journalData.map(journal => {
      journal.evidences = journal.evidences?.map(evidence => {
        const isImg = evidence.mimeType.includes('image');
        let icon: string;
        switch (evidence.mimeType) {
          case 'application/pdf':
            icon = 'far fa-file-pdf';
            break;
          case 'text/csv':
            icon = 'fas fa-file-csv';
            break;
          case 'application/msword':
            icon = 'far fa-file-word';
            break;
          case 'application/vnd.ms-excel':
          case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            icon = 'far fa-file-excel';
            break;
          case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          case 'application/vnd.ms-powerpoint':
            icon = 'far fa-file-powerpoint';
            break;
          default:
            icon = 'far fa-file';
            break;
        }
        return {
          ...evidence,
          isImg,
          icon
        };
      });
      return {
        ...journal,
        information: this.typeJounalEnum[journal.type] === this.typeJounalEnum.DATE_CHANGED ? {
          title: this.formatTitle(journal.information),
          description: `${this.translateSrv.instant('justification')}: ${journal.information.reason}`
        } : { ...journal.information },
        icon: iconsJournal[journal.type].icon,
        color: iconsJournal[journal.type].color,
        background: iconsJournal[journal.type].background,
      };
    });
    this.isLoading = false;
  }

  formatTitle(information) {
    const previousDate = this.language === 'pt-BR' ? moment(information.previousDate, 'yyyy-MM-DD').format('DD/MM/yyyy') :
      moment(information.previousDate, 'yyyy-MM-DD').format('yyyy/MM/DD')
    const newDate = this.language === 'pt-BR' ? moment(information.newDate, 'yyyy-MM-DD').format('DD/MM/yyyy') :
      moment(information.newDate, 'yyyy-MM-DD').format('yyyy/MM/DD')
    return `${this.translateSrv.instant('previousDate')}: ${previousDate} - ${this.translateSrv.instant('newDate')}: ${newDate}`;
  }

  async loadTreeViewScope() {
    const selected = this.selectedWorkpacks && this.selectedWorkpacks.length > 1 ?
        this.selectedWorkpacks.length + ' ' + this.translateSrv.instant('selectedItems') :
        this.selectedWorkpacks[0].label;
      this.formSearch.controls.scopeName.setValue(selected);
  }

  handleDownload(dataurl: string, filename: string) {
    const accessToken = this.authService.getAccessToken();
    const header = {
      method: 'GET',
      headers: new Headers({
        Authorization: 'Bearer ' + accessToken
      })
    };
    fetch(dataurl, header)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch(console.error);
  }

  async handleHideOverlayScope(_event?) {
    const selected = this.selectedWorkpacks && this.selectedWorkpacks.length > 1 ?
      this.selectedWorkpacks.length + ' ' + this.translateSrv.instant('selectedItems') :
      this.selectedWorkpacks[0]?.label;
    this.formSearch.controls.scopeName.setValue(selected);
    await this.handleFilter();
  }

  async handleFilter(event?) {
    this.clearPaginate();
    if (event) {
      let selectedTypes = event.value;
      if (event.itemValue === 'ALL' && event.value.find(value => value === 'ALL')) {
        selectedTypes = selectedTypes.filter(op => op === 'ALL');
      } else {
        selectedTypes = selectedTypes.filter(op => op !== 'ALL');
      }
      this.formSearch.controls.type.setValue(Array.from(selectedTypes));
    }
    await this.getJournal();
  }

  async handleViewMore(_event) {
    this.page++;
    await this.getJournal();
  }

  async handleViewAll() {
    this.clearPaginate();
    this.pageSize = 9999999999999;
    this.hasAll = false;
    await this.getJournal();
  }

  clearPaginate() {
    this.page = 0;
    this.pageSize = 5;
    this.journalData = [];
  }

  private getFrom() {
    const from = this.formSearch.controls.from.value;
    if (from) {
      return moment(from).format('DD/MM/YYYY');
    }
    return null;
  }

  private getTo() {
    const to = this.formSearch.controls.to.value;
    if (to) {
      return moment(to).format('DD/MM/YYYY');
    }
    return null;
  }

  handleNewInformation() {
    this.route.navigate(['workpack/journal'], {
      queryParams: {
        idWorkpack: this.workpackData.workpack.id
      }
    })
  }

}


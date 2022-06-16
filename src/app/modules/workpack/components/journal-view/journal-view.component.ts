import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import * as moment from 'moment';
import {SelectItem, TreeNode} from 'primeng/api';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {iconsJournal} from 'src/app/shared/constants/iconsJournal';
import {StatusJournalEnum} from 'src/app/shared/enums/StatusJournalEnum';
import {TypeJournalEnum} from 'src/app/shared/enums/TypeJournalEnum';
import {ICard} from 'src/app/shared/interfaces/ICard';
import {ITreeViewScopePlan, ITreeViewScopeWorkpack} from 'src/app/shared/interfaces/ITreeScopePersons';
import {IWorkpack} from 'src/app/shared/interfaces/IWorkpack';
import {IJournal} from 'src/app/shared/interfaces/Journal';
import {JournalService} from 'src/app/shared/services/journal.service';
import {OfficeService} from 'src/app/shared/services/office.service';
import {ResponsiveService} from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-journal-view',
  templateUrl: './journal-view.component.html',
  styleUrls: ['./journal-view.component.scss']
})
export class JournalViewComponent implements OnInit, OnDestroy {
  @ViewChild('journal') journalElement: ElementRef;

  @Input()
  cardJournalProperties: ICard;

  @Input()
  workpack: IWorkpack;

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

  constructor(
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private officeSrv: OfficeService,
    private journalSrv: JournalService,
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.formSearch = this.formBuilder.group({
      from: [''],
      to: [''],
      type: [['ALL']],
      scopeName: ''
    });
    this.optionsType = Object.keys(TypeJournalEnum).map(key => ({
      label: this.translateSrv.instant(TypeJournalEnum[key]),
      value: key
    }));
  }

  async ngOnInit(): Promise<void> {
    await this.loadTreeViewScope();
    await this.loadJournalData();
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart - 1).toString() + ':' + (yearStart + 15).toString();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadJournalData() {
    const type = this.formSearch.controls.type.value;
    const {data, success} = await this.journalSrv.GetAll({
      scopeName: this.formSearch.controls.scopeName.value,
      from: this.getFrom(),
      to: this.getTo(),
      type: this.formSearch.controls.type.value ? type.join(',') : null,
      scope: this.selectedWorkpacks.map(node => node.data).join(','),
      page: this.page,
      size: this.pageSize
    });
    if (success) {
      this.journalData = this.journalData.concat(data);
      this.hasMore = data.length > 0 && data.length === this.pageSize;
    }


    this.journalData = this.journalData.map(journal => {
      journal.evidences = journal.evidences?.map(evidence => {
        const isImg = evidence.mimeType.includes('image');
        let icon: string;
        switch (evidence.mimeType) {
          case 'application/pdf':
            icon = 'far fa-file-pdf';
            break;
          case 'application/msword':
            icon = 'far fa-file-word';
            break;
          case 'application/vnd.ms-excel':
          case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            icon = 'far fa-file-excel';
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
        icon: iconsJournal[journal.type].icon,
        color: iconsJournal[journal.type].color,
        background: iconsJournal[journal.type].background,
      };
    });

  }

  async loadTreeViewScope() {
    const {data, success} = await this.officeSrv.GetTreeScopePersons(this.workpack.plan.idOffice);
    if (success) {
      const treePlan = data.plans.find(plan => plan.id === this.workpack.plan.id);
      const treeWorkpackCurrent = this.findTreeWorkpack(this.workpack.id, treePlan) as any;
      this.treeViewScope = this.loadTreeNodeWorkpacks([{...treeWorkpackCurrent}]);
      this.selectedWorkpacks = this.setSelectedNodes(this.treeViewScope);
      const selected = this.selectedWorkpacks && this.selectedWorkpacks.length > 1 ?
        this.selectedWorkpacks.length + ' ' + this.translateSrv.instant('selectedItems') :
        this.selectedWorkpacks[0].label;
      this.formSearch.controls.scopeName.setValue(selected);
    }
  }

  setSelectedNodes(list: TreeNode[]) {
    let result = [];
    list.forEach(l => {
      result.push(l);
      if (l.children && l.children.length > 0) {
        const resultChildren = this.setSelectedNodes(l.children);
        result = result.concat(resultChildren);
      }
    });
    return result;
  }

  findTreeWorkpack(id: number, treePlan: ITreeViewScopePlan) {
    let treeWorkpack;
    treePlan.workpacks.some(workpack => {
      treeWorkpack = workpack.id === id ? workpack : this.findTreeWorkpackChildren(id, workpack.children);
      return treeWorkpack;
    });
    return treeWorkpack;
  }

  findTreeWorkpackChildren(id: number, treeWorkpacks: ITreeViewScopeWorkpack[]) {
    let treeWorkpack;
    if (treeWorkpacks) {
      treeWorkpacks.some(workpack => {
        treeWorkpack = workpack.id === id ? workpack : this.findTreeWorkpackChildren(id, workpack.children);
        return treeWorkpack;
      });
    }
    return treeWorkpack;
  }


  loadTreeNodeWorkpacks(treeWorkpacks: ITreeViewScopeWorkpack[], parent?: TreeNode): TreeNode[] {
    if (!treeWorkpacks) {
      return [];
    }
    return treeWorkpacks.map(worckpack => {
      if (worckpack.children) {
        const node = {
          label: worckpack.name,
          icon: worckpack.icon,
          data: worckpack.id,
          children: undefined,
          parent,
          selectable: true,
          type: 'workpack',
          expanded: true
        };
        node.children = this.loadTreeNodeWorkpacks(worckpack.children, node);
        return node;
      }
      return {
        label: worckpack.name,
        data: worckpack.id,
        children: undefined,
        parent,
        icon: worckpack.icon,
        selectable: true
      };
    });
  }

  handleDownload(dataurl: string, filename: string) {
    fetch(dataurl)
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
      this.selectedWorkpacks[0].label;
    this.formSearch.controls.scopeName.setValue(selected);
    await this.handleFilter();
  }

  async handleFilter(_event?) {
    this.clearPaginate();
    await this.loadJournalData();
  }

  async handleViewMore(_event) {
    this.page++;
    await this.loadJournalData();
  }

  async handleViewAll() {
    this.clearPaginate();
    this.pageSize = 9999999999999;
    this.hasAll = false;
    await this.loadJournalData();
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

}

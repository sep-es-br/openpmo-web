import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem, TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { iconsJournal } from 'src/app/shared/constants/iconsJournal';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { StatusJournalEnum } from 'src/app/shared/enums/StatusJournalEnum';
import { TypeJournalEnum } from 'src/app/shared/enums/TypeJournalEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ITreeViewScopePlan, ITreeViewScopeWorkpack } from 'src/app/shared/interfaces/ITreeScopePersons';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { IJournal } from 'src/app/shared/interfaces/Journal';
import { JournalService } from 'src/app/shared/services/journal.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

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
  optionsType: SelectItem[] = []

  responsive: boolean;
  $destroy = new Subject();

  treeViewScope: TreeNode[] = [];
  selectedWorkpacks: TreeNode[] = [];

  journalData: IJournal[] = [];
  typeJounalEnum = TypeJournalEnum;
  statusJounalEnum = StatusJournalEnum;

  canVerifyScroll = true;
  page = 0;
  pageSize = 5;
  constructor(
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private officeSrv: OfficeService,
    private journaçSrv: JournalService,
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.formSearch = this.formBuilder.group({
      from: [''],
      to: [''],
      type: ['ALL'],
    });
    this.optionsType = Object.keys(TypeJournalEnum).map(key => {
      return {
        label: this.translateSrv.instant(TypeJournalEnum[key]),
        value: key
      }
    })
  }

  async ngOnInit(): Promise<void> {
    await this.loadTreeViewScope();
    await this.loadJournalData();
    this.eventListenerScrollJournal();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadJournalData() {
    const {data, success} = await this.journaçSrv.GetAll({
      ...this.formSearch.value,
      scope: this.selectedWorkpacks.map(node => node.data),
      page: this.page,
      size: this.pageSize
    });
    if(success) {
      this.journalData = this.journalData.concat(data);
      this.canVerifyScroll = data.length > 0 && data.length === this.pageSize;
    }


    this.journalData = this.journalData.map(journal => {
      journal.evidences = journal.evidences?.map(evidence => {
        const isImg = evidence.mimeType.includes('image');
        let icon = '';
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
        }
      })
      return {
        ...journal,
        icon: iconsJournal[journal.type].icon,
        color: iconsJournal[journal.type].color,
        background: iconsJournal[journal.type].background,
      }
    })

  }
  println(event) {
    console.log(event);
  }

  async loadTreeViewScope() {
    const { data, success } = await this.officeSrv.GetTreeScopePersons(this.workpack.plan.idOffice);
    if (success) {
      const treePlan = data.plans.find(plan => plan.id === this.workpack.plan.id);
      const treeWorkpackCurrent = this.findTreeWorkpack(this.workpack.id, treePlan) as any;
      const treeNode = this.loadTreeNodeWorkpacks([{ ...treeWorkpackCurrent }]);
      this.treeViewScope = treeNode;
      this.selectedWorkpacks = this.treeViewScope;
    }
  }

  eventListenerScrollJournal() {
    this.journalElement.nativeElement.addEventListener('scroll', (event) => this.verifyScrollEnd(event));
  }

  async verifyScrollEnd(event) {
    if(this.canVerifyScroll) {
      const {scrollTop, scrollHeight, clientHeight} = this.journalElement.nativeElement;
      const isScrollEnd = Math.ceil(scrollTop) + clientHeight >= scrollHeight;
      if(isScrollEnd) {
        this.canVerifyScroll = false;
        this.page++;
        await this.loadJournalData();
      }
    }
  }

  findTreeWorkpack(id: number, treePlan: ITreeViewScopePlan) {
    let treeWorkpack;
    treePlan.workpacks.some(workpack => {
      treeWorkpack = workpack.id === id ? workpack : this.findTreeWorkpackChildren(id, workpack.children);
      return treeWorkpack;
    })
    return treeWorkpack;
  }

  findTreeWorkpackChildren(id: number, treeWorkpacks: ITreeViewScopeWorkpack[]) {
    let treeWorkpack;
    if (treeWorkpacks) {
      treeWorkpacks.some(workpack => {
        treeWorkpack = workpack.id === id ? workpack : this.findTreeWorkpackChildren(id, workpack.children);
        return treeWorkpack;
      })
    }
    return treeWorkpack;
  }


  loadTreeNodeWorkpacks(treeWorkpacks: ITreeViewScopeWorkpack[], parent?: TreeNode): TreeNode[] {
    if (treeWorkpacks) {
      const listTreeNode = treeWorkpacks.map(worckpack => {
        if (worckpack.children) {
          const node = {
            label: worckpack.name,
            icon: worckpack.icon,
            data: worckpack.id,
            children: undefined,
            parent,
            selectable: true,
            type: 'workpack'
          };
          node.children = this.loadTreeNodeWorkpacks(worckpack.children, node);
          return node;
        }
        return { label: worckpack.name, data: worckpack.id, children: undefined, parent, icon: worckpack.icon, selectable: true };
      });
      return listTreeNode;
    }
    return [];
  }

  handleDownload(dataurl: string, filename: string) {
    fetch(dataurl)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch(console.error);
  }

  async handleHideOverlayScope(event?) {
    await this.loadJournalData();
  }

}
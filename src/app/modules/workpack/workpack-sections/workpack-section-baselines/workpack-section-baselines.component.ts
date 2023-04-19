import { IWorkpackData, IWorkpackParams } from '../../../../shared/interfaces/IWorkpackDataParams';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { BaselineService } from '../../../../shared/services/baseline.service';
import { TypeWorkpackEnum } from '../../../../shared/enums/TypeWorkpackEnum';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { TranslateService } from '@ngx-translate/core';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { Subject } from 'rxjs';
import { IBaseline } from '../../../../shared/interfaces/IBaseline';
import { ISection } from '../../../../shared/interfaces/ISectionWorkpack';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-workpack-section-baselines',
  templateUrl: './workpack-section-baselines.component.html',
  styleUrls: ['./workpack-section-baselines.component.scss']
})
export class WorkpackSectionBaselinesComponent implements OnInit, OnDestroy {

  baselinesSectionShowInactives = false;
  sectionBaselines: ISection;
  baselines: IBaseline[];
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  $destroy = new Subject();
  collapsePanelsStatus: boolean;
  displayModeAll: string;
  responsive = false;
  showTabview = false;

  constructor(
    private workpackSrv: WorkpackService,
    private translateSrv: TranslateService,
    private configDataViewSrv: ConfigDataViewService,
    private responsiveSrv: ResponsiveService,
    private baselineSrv: BaselineService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    this.workpackSrv.observableResetWorkpack.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.workpackData = this.workpackSrv.getWorkpackData();
        this.workpackParams = this.workpackSrv.getWorkpackParams();
        if (this.workpackParams.idWorkpack && this.workpackData.workpack.type === TypeWorkpackEnum.ProjectModel) {
          this.loadBaselineSection(this.collapsePanelsStatus);
        }
      }
    });
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.sectionBaselines = this.sectionBaselines && Object.assign({}, {
        ...this.sectionBaselines,
        cardSection: {
          ...this.sectionBaselines.cardSection,
          initialStateCollapse: this.collapsePanelsStatus
        }
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async loadBaselineSection(collapsePanelsStatus) {
    this.sectionBaselines = {
      cardSection: {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: !this.showTabview ? 'baselines' : '',
        collapseble: true,
        initialStateCollapse: collapsePanelsStatus,
        showFilters: false,
        isLoading: true,
        showCreateNemElementButton: false,
      }
    };
    this.sectionBaselines = {
      ...this.sectionBaselines,
      cardSection: {
        ...this.sectionBaselines.cardSection,
        isLoading: false
      },
      cardItemsSection: await this.loadSectionBaselinesCards(this.baselinesSectionShowInactives)
    }
  }

  async loadSectionBaselinesCards(showInactives: boolean) {
    const resultBaselines = await this.baselineSrv.GetAll({ 'id-workpack': this.workpackParams.idWorkpack });
    this.baselines = resultBaselines.success ? resultBaselines.data : [];
    if (this.baselines && this.baselines.length > 0) {
      const cardItems = this.baselines.filter(b => {
        if (!showInactives) {
          if (!!b.active) { return b; }
        } else {
          return b;
        }
      }).map(base => ({
        typeCardItem: 'listItem',
        icon: !!base.cancelation ? 'fas fa-times' : 'baseline',
        iconColor: base.cancelation && '#FF7F81',
        iconSvg: !base.cancelation ? true : false,
        nameCardItem: base.name,
        baselineStatus: base.status.toLowerCase(),
        baselineStatusDate: base.active ? base.activationDate : (base.status === 'PROPOSED' ? base.proposalDate :
          (base.status === 'APPROVED' ? base.activationDate : 'NONE')),
        baselineActive: base.active,
        itemId: base.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          disabled: !this.workpackSrv.getEditPermission() || base.status !== 'DRAFT',
          command: (event) => this.deleteBaseline(base)
        }],
        urlCard: '/workpack/baseline',
        paramsUrlCard: [
          { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
          { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          { name: 'id', value: base.id },
        ]
      }));
      if (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.cancelPropose && !this.workpackData.workpack.pendingBaseline) {
        cardItems.push({
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          baselineStatus: undefined,
          baselineStatusDate: undefined,
          baselineActive: undefined,
          itemId: null,
          menuItems: [],
          urlCard: '/workpack/baseline',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          ]
        });
      }
      return cardItems;
    } else {
      const cardItem = (this.workpackSrv.getEditPermission() && !this.workpackData.workpack.cancelPropose && !this.workpackData.workpack.pendingBaseline) ?
        [{
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconColor: null,
          iconSvg: true,
          nameCardItem: null,
          itemId: null,
          urlCard: '/workpack/baseline',
          paramsUrlCard: [
            { name: 'idWorkpack', value: this.workpackParams.idWorkpack },
            { name: 'idWorkpackModelLinked', value: this.workpackParams.idWorkpackModelLinked },
          ]
        }] : [];
        setTimeout(() => {}, 5000)
      return cardItem;
    }
  }

  async handleBaselineShowInactiveToggle(event) {
    this.sectionBaselines = {
      ...this.sectionBaselines,
      cardItemsSection: await this.loadSectionBaselinesCards(event)
    }
  }

  async deleteBaseline(base: IBaseline) {
    const result = await this.baselineSrv.delete(base, { useConfirm: true });
    if (result.success) {
      this.sectionBaselines.cardItemsSection = Array.from(this.sectionBaselines.cardItemsSection.filter(item => item.itemId !== base.id));
    }
  }

}

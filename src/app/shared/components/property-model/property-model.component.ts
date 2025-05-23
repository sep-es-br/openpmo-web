import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Calendar } from 'primeng/calendar';

import { IconPropertyWorkpackModelEnum } from 'src/app/shared/enums/IconPropertyWorkpackModelEnum';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TypePropertModelEnum as TypePropertyModelEnum}  from 'src/app/shared/enums/TypePropertModelEnum';
import * as moment from 'moment';
import { SelectItem, TreeNode } from 'primeng/api';
import { TypeOrganization } from '../../enums/TypeOrganization';

@Component({
  selector: 'app-property-model',
  templateUrl: './property-model.component.html',
  styleUrls: ['./property-model.component.scss']
})
export class PropertyModelComponent implements OnDestroy, OnChanges, AfterViewInit {

  @ViewChild(Calendar) calendarComponent: Calendar;
  @Input() property: IWorkpackModelProperty;
  @Output() delete = new EventEmitter();
  @Output() changed = new EventEmitter();
  IconsEnum = IconPropertyWorkpackModelEnum;
  responsive = false;
  $destroy = new Subject();
  calendarFormat: string;
  yearRange: string;
  language: string;
  optionsSector: SelectItem[];
  typeOrganizationEnum = TypeOrganization;


  constructor(
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.setLanguage();
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => {
        this.setLanguage();
        this.loadSectorOptions();
      }, 200);
    });
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => this.responsive = responsive);
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart - 1).toString() + ':' + (yearStart + 15).toString();
    this.loadSectorOptions();
  }

  ngAfterViewInit(): void {
    if (this.property?.type === TypePropertyModelEnum.DateModel) {
      this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
        setTimeout(() => {
          this.calendarComponent?.ngOnInit();
          this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormat');
          this.calendarComponent.updateInputfield();
        }, 150)
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.property?.extraList && this.property?.multipleSelection) {
      this.selectedSelectAllIfChildrenAllSelecteds(this.property.extraList[0]);
    }
    this.setDefaultMax();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadSectorOptions() {
    this.optionsSector = [
      {label: this.translateSrv.instant(this.typeOrganizationEnum.Private), value: this.typeOrganizationEnum.Private.toLocaleUpperCase()},
      {label: this.translateSrv.instant(this.typeOrganizationEnum.Public), value: this.typeOrganizationEnum.Public.toLocaleUpperCase()},
      {label: this.translateSrv.instant(this.typeOrganizationEnum.Third), value: this.typeOrganizationEnum.Third.toLocaleUpperCase()}
    ];
  }

  setDefaultMax() {
    if (this.property) {
      if (this.property.type === 'TextModel' && this.property.max == null) {
        this.property.max = 50;
      }
      if (this.property.type === 'TextAreaModel' && this.property.max == null) {
        this.property.max = 600;
      }
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
   
  }

  checkDefaultValue() {
    if ([TypePropertyModelEnum.LocalitySelectionModel, TypePropertyModelEnum.OrganizationSelectionModel]
      .includes(TypePropertyModelEnum[this.property.type])) {
      if (this.property?.defaults) {
        const isArray = this.property?.defaults instanceof Array;
        if (this.property.multipleSelection && !isArray) {
          this.property.defaults = [this.property.defaults as any];
        }
        if (!this.property.multipleSelection && isArray) {
          this.property.defaults = (this.property.defaults as any[]).shift();
        }
        this.property.selectedLocalities = this.translateSrv.instant('selectDefaultValue');
        this.property.showIconButtonSelectLocality = true;
      }
    } else {
      const isArray = this.property?.defaultValue instanceof Array;
      if (this.property.multipleSelection && !isArray) {
        this.property.defaultValue = this.property.defaultValue ? [this.property.defaultValue as any] : [];
      }
      if (!this.property.multipleSelection && isArray) {
        this.property.defaultValue = (this.property.defaultValue as any[]).shift();
      }
    }
  }

  checkIfRemovedValueIsDefault({ value }) {
    const isArray = this.property?.defaultValue instanceof Array;
    if (isArray) {
      const arr = this.property?.defaultValue as string[];
      if (arr.includes(value.trim())) {
        arr.splice(arr.findIndex(r => r === value.trim()), 1);
        this.property.defaultValue = Array.from(arr);
      }
    } else if (!isArray && this.property.defaultValue === value.trim()) {
      this.property.defaultValue = '';
    }
  }

  handleCollapseChanged(collapsed: boolean) {
    this.property.isCollapsed = collapsed;
  }

  handleNodeSelect(event, property) {
    if (this.property.multipleSelection) {
      this.selectedOrUnselectAllChildren(event.node, true);
    }
    this.changed.emit({property});
    
  }

  handleNodeUnselect(event, property) {
    if (this.property.multipleSelection) {
      this.selectedOrUnselectAllChildren(event.node, false);
    }
    this.changed.emit({property});
    
  }

  selectedSelectAllIfChildrenAllSelecteds(node: TreeNode) {
    const localitiesSelected = this.property.extraListDefaults as TreeNode[];
    const allChildrenSelected = this.verifyAllChildrenSelected(node);
    if (allChildrenSelected) {
      const selectAllNode = this.findSelectAllNodeFromParent(node);
      if (selectAllNode) {
        localitiesSelected.push(selectAllNode);
      }
    }
    if (node.children) {
      node.children.forEach(child => this.selectedSelectAllIfChildrenAllSelecteds(child));
    }
  }

  verifyAllChildrenSelected(node: TreeNode) {
    return node && node.children?.every(child => this.nodeIsSelecteAll(child) ?
      true :
      (this.property?.extraListDefaults as TreeNode[])?.includes(child));
  }

  findSelectAllNodeFromParent(node: TreeNode) {
    return node.children?.find(child => child.key?.includes('SELECTALL'));
  }

  selectedOrUnselectAllChildren(node: TreeNode, selected: boolean) {
    if (this.nodeIsSelecteAll(node)) {
      if (node.parent) {
        node.parent.children.forEach((child: TreeNode) =>
          selected ? this.selectedNode(child, selected) : this.unselectNode(child, selected));
      }
    }
  }

  selectedNode(node: TreeNode, selected: boolean) {
    const localitiesSelected = this.property.extraListDefaults as TreeNode[];
    const nodeIsSelected = localitiesSelected.find(locality => locality.data === node.data);
    if (!nodeIsSelected) {
      localitiesSelected.push(node);
      if (node.children) {
        node.children.forEach((child: TreeNode) =>
          selected ? this.selectedNode(child, selected) : this.unselectNode(child, selected));
      }
    }
  }

  unselectNode(node: TreeNode, selected: boolean) {
    const localitiesSelected = this.property.extraListDefaults as TreeNode[];
    const indexNodeSelected = localitiesSelected.findIndex(locality => locality.data === node.data);
    if (indexNodeSelected >= 0) {
      localitiesSelected.splice(indexNodeSelected, 1);
      if (node.children) {
        node.children.forEach((child: TreeNode) =>
          selected ? this.selectedNode(child, selected) : this.unselectNode(child, selected));
      }
    }
  }

  nodeIsSelecteAll(node: TreeNode) {
    return node.key?.includes('SELECTALL');
  }
}


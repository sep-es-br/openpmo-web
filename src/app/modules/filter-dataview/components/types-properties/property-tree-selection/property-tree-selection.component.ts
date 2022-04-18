import { TreeNode } from 'primeng/api';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-property-tree-selection',
  templateUrl: './property-tree-selection.component.html',
  styleUrls: ['./property-tree-selection.component.scss']
})
export class PropertyTreeSelectionComponent implements OnInit, OnDestroy {

  @Input() property: IFilterProperty;
  @Input() value: TreeNode | TreeNode[];
  @Output() changed = new EventEmitter();
  responsive: boolean;
  $destroy = new Subject();
  labelButtonLocalitySelected: string;
  showIconButton: boolean;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() =>
      {
        this.setLabelButton();
      }, 150)
    );
  }

  ngOnInit(): void {
    this.setLabelButton();
    this.selectedSelectAllIfChildrenAllSelecteds(this.property.localityList[0] as TreeNode);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLabelButton(event?) {
    if (Array.isArray(this.value)) {
      if (this.value && this.value.length === 1 ){
        const selecteds = this.value as TreeNode[];
        this.labelButtonLocalitySelected = selecteds[0].label;
        this.showIconButton = false;
      }
      if (this.value && this.value.length > 1 ){
        this.labelButtonLocalitySelected = `${this.value.filter(v => v.data)?.length} ${this.translateSrv.instant('selectedsLocalities')}`;
        this.showIconButton = false;
      }
      if (!this.value || (this.value && this.value.length === 0) ){
        this.labelButtonLocalitySelected = this.translateSrv.instant('selectDefaultValue');
        this.showIconButton = true;
      }
    } else {
      const selected = this.value as TreeNode;
      this.labelButtonLocalitySelected = selected?.label;
      this.showIconButton = false;
    }
  }

  handleNodeSelect(event) {
    this.selectedOrUnselectAllChildren(event.node, true);
    this.changed.emit({value: this.value});
    this.setLabelButton(event);
  }

  handleNodeUnselect(event) {
    this.selectedOrUnselectAllChildren(event.node, false);
    this.changed.emit({value: this.value});
    this.setLabelButton(event);
  }

  selectedSelectAllIfChildrenAllSelecteds(node: TreeNode) {
    const localitiesSelected = this.value as TreeNode[];
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
    return node.children?.every(child => this.nodeIsSelecteAll(child) ?
      true :
      (this.value as TreeNode[])?.includes(child));
  }

  findSelectAllNodeFromParent(node: TreeNode) {
    return node.children?.find(child => child.key?.includes('SELECTALL'));
  }

  selectedOrUnselectAllChildren(node: TreeNode, selected: boolean) {
    if (this.nodeIsSelecteAll(node)) {
      if (node.parent) {
        node.parent.children.forEach((child: TreeNode) =>
          selected ? this.selectedNode(child) : this.unselectNode(child));
      }
    }
  }

  selectedNode(node: TreeNode) {
    const localitiesSelected = this.value as TreeNode[];
    const nodeIsSelected = localitiesSelected.find(locality => locality.data === node.data);
    if (!nodeIsSelected && !this.nodeIsSelecteAll(node)) {
      localitiesSelected.push(node);
    }
  }

  unselectNode(node: TreeNode) {
    const localitiesSelected = this.value as TreeNode[];
    const indexNodeSelected = localitiesSelected.findIndex(locality => locality.data === node.data);
    if (indexNodeSelected >= 0 && !this.nodeIsSelecteAll(node)) {
      localitiesSelected.splice(indexNodeSelected, 1);
    }
  }

  nodeIsSelecteAll(node: TreeNode) {
    return node.key?.includes('SELECTALL');
  }

}

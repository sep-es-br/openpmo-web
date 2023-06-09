import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-property-tree-selection',
  templateUrl: './property-tree-selection.component.html',
  styleUrls: ['./property-tree-selection.component.scss']
})
export class PropertyTreeSelectionComponent implements OnChanges {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();
  responsive: boolean;
  $destroy = new Subject();
  search = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    public translateSrv: TranslateService,
  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        this.setLabelButton();
      }, 150)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.property?.localityList && this.property?.multipleSelection) {
      this.selectedSelectAllIfChildrenAllSelecteds(this.property.localityList[0]);
      if (!this.property.labelButtonLocalitySelected) {
        this.property.labelButtonLocalitySelected = [];
      }
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLabelButton(event?) {
    if (Array.isArray(this.property.localitiesSelected)) {
      if (this.property.localitiesSelected && this.property.localitiesSelected.length === 1) {
        this.property.labelButtonLocalitySelected = [this.property.localitiesSelected[0].label];
        this.property.showIconButton = false;
      }
      if (this.property.localitiesSelected && this.property.localitiesSelected.length > 1) {
        this.property.labelButtonLocalitySelected = this.property.localitiesSelected.filter(l => !l.data.toString().includes('SELECTALL')).map(loc => loc.label);
        this.property.showIconButton = false;
      }
      if (!this.property.localitiesSelected || (this.property.localitiesSelected && this.property.localitiesSelected.length === 0)) {
        this.property.labelButtonLocalitySelected = [];
        this.property.showIconButton = true;
      }
    } else {
      this.property.labelButtonLocalitySelected = [this.property.localitiesSelected?.label];
      this.property.showIconButton = false;
    }
  }

  handleInputClick() {
    this.search = true;
  }

  handleNodeSelect(event) {
    if (this.property.multipleSelection) {
      this.selectedOrUnselectAllChildren(event.node, true);
    }
    this.changed.emit(event);
    this.setLabelButton(event);
  }

  handleNodeUnselect(event) {
    if (this.property.multipleSelection) {
      this.selectedOrUnselectAllChildren(event.node, false);
    }
    this.changed.emit(event);
    this.setLabelButton(event);
  }

  selectedSelectAllIfChildrenAllSelecteds(node: TreeNode) {
    const localitiesSelected = this.property.localitiesSelected as TreeNode[];
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
      this.property?.localitiesSelected && (this.property?.localitiesSelected as TreeNode[])?.includes(child));
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
    const localitiesSelected = this.property.localitiesSelected as TreeNode[];
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
    const localitiesSelected = this.property.localitiesSelected as TreeNode[];
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


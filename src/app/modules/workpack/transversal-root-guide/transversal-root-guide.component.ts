import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TreeNode } from 'primeng/api';
import { ITransversalStructuralLink } from 'src/app/shared/interfaces/ITransversal';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { TransversalService } from 'src/app/shared/services/transversal.service';

@Component({
  selector: 'app-transversal-root-guide',
  templateUrl: './transversal-root-guide.component.html',
  styleUrls: ['./transversal-root-guide.component.scss']
})
export class TransversalRootGuideComponent implements OnChanges {

  @Input() idTransversalProgram: number;
  @Input() idPlan: number;
  @Input() structuralLinks: ITransversalStructuralLink[];
  @Output() rootModelNameChange = new EventEmitter<string>();

  loading = false;
  collapsed = false;
  tree: TreeNode[] = [];
  private itemsById = new Map<number, ITransversalStructuralLink>();

  constructor(
    private transversalSrv: TransversalService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router
  ) { }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if ((changes.structuralLinks && this.structuralLinks) ||
      ((changes.idTransversalProgram || changes.idPlan) && this.idTransversalProgram && this.idPlan)) {
      await this.loadTree();
    }
  }

  private async loadTree(): Promise<void> {
    this.loading = true;
    let links: ITransversalStructuralLink[] = [];
    try {
      if (this.structuralLinks) {
        links = this.structuralLinks;
      } else {
        const result = await this.transversalSrv.getStructuralLinks(this.idTransversalProgram);
        links = result?.success ? result.data || [] : [];
      }
    } finally {
      this.loading = false;
    }
    this.itemsById = new Map(links.map(item => [Number(item.idWorkpack), item]));
    this.rootModelNameChange.emit(links[0]?.rootModelName || 'Visão');

    const nodes = new Map<number, TreeNode>();
    links.forEach(item => nodes.set(Number(item.idWorkpack), {
      label: item.name,
      data: { kind: 'workpack', item },
      expanded: true,
      selectable: item.clickable,
      children: []
    }));
    const roots: TreeNode[] = [];
    links.forEach(item => {
      const node = nodes.get(Number(item.idWorkpack));
      const parent = item.idParentWorkpack && nodes.get(Number(item.idParentWorkpack));
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    const buildModelGroups = (items: TreeNode[], includeModelGroups = true): TreeNode[] => {
      const groups = new Map<string, TreeNode[]>();
      items.forEach(node => {
        const item = node.data.item as ITransversalStructuralLink;
        const group = groups.get(item.modelName) || [];
        group.push(node);
        groups.set(item.modelName, group);
      });
      const modelGroups = Array.from(groups.entries()).map(([modelName, children]) => ({
        label: `${modelName.toUpperCase()} (${children.length})`,
        data: { kind: 'model', modelName },
        expanded: true,
        selectable: false,
        children: children.map(node => {
          node.children = buildModelGroups(node.children || []);
          node.leaf = node.children.length === 0;
          return node;
        })
      }));
      return includeModelGroups
        ? modelGroups
        : modelGroups.flatMap(group => group.children || []);
    };
    this.tree = buildModelGroups(roots, false);
  }

  toggleTree(expand: boolean): void {
    this.collapsed = !expand;
    const setExpanded = (nodes: TreeNode[]): void => nodes.forEach(node => {
      node.expanded = expand;
      setExpanded(node.children || []);
    });
    setExpanded(this.tree);
    this.tree = [...this.tree];
  }

  async openStructuralItem(item: ITransversalStructuralLink): Promise<void> {
    if (!item?.clickable) { return; }
    const path: ITransversalStructuralLink[] = [];
    let current: ITransversalStructuralLink = item;
    const visited = new Set<number>();
    while (current && !visited.has(Number(current.idWorkpack))) {
      visited.add(Number(current.idWorkpack));
      path.unshift(current);
      current = current.idParentWorkpack ? this.itemsById.get(Number(current.idParentWorkpack)) : undefined;
    }
    const rootModelIndex = path.findIndex(link =>
      link.modelName?.toLowerCase() === item.rootModelName?.toLowerCase());
    const structuralPath = rootModelIndex >= 0 ? path.slice(rootModelIndex) : path;

    const existing = this.breadcrumbSrv.get || [];
    const transversalRootIndex = existing.findIndex(crumb => Number(crumb.queryParams?.id) === Number(this.idTransversalProgram));
    const breadcrumb = transversalRootIndex >= 0 ? existing.slice(0, transversalRootIndex + 1) : existing;
    if (transversalRootIndex >= 0) {
      const rootCrumb = { ...breadcrumb[transversalRootIndex], queryParams: {
        ...breadcrumb[transversalRootIndex].queryParams,
        idTransversalRoot: this.idTransversalProgram
      }};
      breadcrumb[transversalRootIndex] = rootCrumb;
    }
    breadcrumb.push(...structuralPath.map(link => ({
      key: link.modelName,
      info: link.name,
      tooltip: link.fullName,
      routerLink: ['/workpack'],
      queryParams: {
        id: link.idWorkpack,
        idPlan: this.idPlan,
        idTransversalRoot: this.idTransversalProgram
      },
      modelName: link.modelName
    })));
    this.breadcrumbSrv.storageBreadcrumb(breadcrumb);
    await this.router.navigate(['/workpack'], { queryParams: {
      id: item.idWorkpack,
      idPlan: this.idPlan,
      idTransversalRoot: this.idTransversalProgram
    }});
  }

  openNode(node: TreeNode): void {
    if (node?.data?.kind === 'workpack') {
      this.openStructuralItem(node.data.item as ITransversalStructuralLink);
    }
  }
}

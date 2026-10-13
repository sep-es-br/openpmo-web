import { ITransversalSelectionOption } from '../interfaces/ITransversal';
import { TreeNode } from 'primeng/api';

export function orderTransversalSelectionOptions(
  options: ITransversalSelectionOption[]
): ITransversalSelectionOption[] {
  const byId = new Map(options.map(option => [Number(option.id), option]));
  const byParent = new Map<number, ITransversalSelectionOption[]>();
  const roots: ITransversalSelectionOption[] = [];

  options.forEach(option => {
    const parentId = Number(option.parentId);
    if (option.parentId && byId.has(parentId)) {
      byParent.set(parentId, [...(byParent.get(parentId) || []), option]);
    } else {
      roots.push(option);
    }
  });

  const result: ITransversalSelectionOption[] = [];
  const visited = new Set<number>();
  const append = (option: ITransversalSelectionOption, depth: number) => {
    const id = Number(option.id);
    if (visited.has(id)) { return; }
    visited.add(id);
    result.push({
      ...option,
      displayName: `${'— '.repeat(depth)}${option.fullName || option.name}`
    });
    (byParent.get(id) || []).forEach(child => append(child, depth + 1));
  };

  roots.forEach(root => append(root, 0));
  options.forEach(option => append(option, 0));
  return result;
}

export function buildTransversalSelectionTree(
  options: ITransversalSelectionOption[]
): TreeNode[] {
  const byId = new Map(options.map(option => [Number(option.id), option]));
  const byParent = new Map<number, ITransversalSelectionOption[]>();
  const roots: ITransversalSelectionOption[] = [];

  options.forEach(option => {
    const parentId = Number(option.parentId);
    if (option.parentId && byId.has(parentId)) {
      byParent.set(parentId, [...(byParent.get(parentId) || []), option]);
    } else {
      roots.push(option);
    }
  });

  const visited = new Set<number>();
  const append = (option: ITransversalSelectionOption): TreeNode | null => {
    const id = Number(option.id);
    if (visited.has(id)) { return null; }
    visited.add(id);
    const children = (byParent.get(id) || [])
      .map(child => append(child))
      .filter(child => !!child) as TreeNode[];
    return {
      key: String(id),
      label: option.name,
      data: String(id),
      selectable: true,
      children
    };
  };

  const tree = roots.map(root => append(root)).filter(node => !!node) as TreeNode[];
  options.forEach(option => {
    if (!visited.has(Number(option.id))) {
      const orphan = append(option);
      if (orphan) { tree.push(orphan); }
    }
  });
  return tree;
}

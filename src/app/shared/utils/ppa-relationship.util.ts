import { TypePropertyModelEnum } from '../enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from '../models/PropertyTemplateModel';

/**
 * Filtro em cascata do grupo "Relação com o PPA": o código do programa está embutido
 * no label de todo item, então Indicadores e Ação podem ser filtrados pelo Programa
 * selecionado sem nenhuma consulta adicional.
 *
 *   Programa 5001 - Gestao Dinamica e Eficiente
 *   Indicador 5001 - Empresas parceiras
 *   Acao 1640 - 5001 - Educacao Fiscal
 */
const PROGRAM_RE = /^Programa\s+(\d+)\b/;
const INDICATOR_RE = /^Indicador\s+(\d+)\b/;
const ACTION_RE = /^Acao\s+\d+\s*-\s*(\d+)\b/;

export type PpaRole = 'source' | 'dependent' | null;

export interface IPpaOption {
  label: string;
  value: string;
}

export interface IPpaWiring {
  source: PropertyTemplateModel;
  dependents: PropertyTemplateModel[];
}

export const programCodeFromLabel = (label: string): string | null => {
  if (!label) {
    return null;
  }
  const match = PROGRAM_RE.exec(label) || INDICATOR_RE.exec(label) || ACTION_RE.exec(label);
  return match ? match[1] : null;
};

const allMatch = (options: IPpaOption[], regex: RegExp): boolean =>
  !!options && options.length > 0 && options.every(option => regex.test(option.label));

export const masterOptions = (property: PropertyTemplateModel): IPpaOption[] =>
  (property.allPossibleValues || property.possibleValues || []) as IPpaOption[];

export const classifyPpaProperty = (property: PropertyTemplateModel): PpaRole => {
  if (!property || property.type !== TypePropertyModelEnum.SelectionModel) {
    return null;
  }
  const options = masterOptions(property);
  if (allMatch(options, PROGRAM_RE)) {
    return 'source';
  }
  if (allMatch(options, INDICATOR_RE) || allMatch(options, ACTION_RE)) {
    return 'dependent';
  }
  return null;
};

/**
 * Reconhece o grupo pelos prefixos dos labels, não por id ou nome de propriedade.
 * Se os dados do PPA mudarem de formato, devolve null e o formulário volta ao
 * comportamento sem filtro.
 */
export const detectPpaWiring = (group: PropertyTemplateModel): IPpaWiring | null => {
  const properties = (group && group.groupedProperties) || [];
  let source: PropertyTemplateModel = null;
  const dependents: PropertyTemplateModel[] = [];
  properties.forEach(property => {
    const role = classifyPpaProperty(property);
    if (role === 'source') {
      source = property;
    } else if (role === 'dependent') {
      dependents.push(property);
    }
  });
  return source && dependents.length > 0 ? { source, dependents } : null;
};

export const selectedProgramCodes = (source: PropertyTemplateModel): Set<string> => {
  const value = source && source.value;
  const selected: string[] = Array.isArray(value) ? value as string[] : (value ? [value as string] : []);
  const codes = new Set<string>();
  selected.forEach(item => {
    const code = programCodeFromLabel(item);
    if (code) {
      codes.add(code);
    }
  });
  return codes;
};

/** Sem programa selecionado, mantém a lista completa. */
export const filterDependentOptions = (all: IPpaOption[], codes: Set<string>): IPpaOption[] => {
  if (codes.size === 0) {
    return (all || []).slice();
  }
  return (all || []).filter(option => {
    const code = programCodeFromLabel(option.label);
    return code !== null && codes.has(code);
  });
};

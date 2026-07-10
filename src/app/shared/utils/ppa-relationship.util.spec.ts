import { TypePropertyModelEnum } from '../enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from '../models/PropertyTemplateModel';
import {
  classifyPpaProperty,
  detectPpaWiring,
  filterDependentOptions,
  programCodeFromLabel,
  selectedProgramCodes
} from './ppa-relationship.util';

const option = (label: string) => ({ label, value: label });

const selection = (labels: string[], value?: string[]): PropertyTemplateModel => {
  const property = new PropertyTemplateModel();
  property.type = TypePropertyModelEnum.SelectionModel;
  property.multipleSelection = true;
  property.possibleValues = labels.map(option);
  property.value = value;
  return property;
};

const PROGRAMS = ['Programa 5001 - Gestao Dinamica e Eficiente', 'Programa 5007 - Saude Integral'];
const INDICATORS = ['Indicador 5001 - Empresas parceiras', 'Indicador 5007 - Cobertura da atencao basica'];
const ACTIONS = ['Acao 1640 - 5001 - Educacao Fiscal', 'Acao 4255 - 5007 - Capacitacao'];

describe('ppa-relationship.util', () => {

  describe('programCodeFromLabel', () => {
    it('extrai o código do programa nos três formatos do PPA', () => {
      expect(programCodeFromLabel(PROGRAMS[0])).toBe('5001');
      expect(programCodeFromLabel(INDICATORS[0])).toBe('5001');
      expect(programCodeFromLabel(ACTIONS[0])).toBe('5001');
    });

    it('usa o segundo número da ação, não o código da própria ação', () => {
      expect(programCodeFromLabel('Acao 1640 - 5001 - Educacao Fiscal')).toBe('5001');
    });

    it('devolve null para labels fora do padrão', () => {
      expect(programCodeFromLabel('Concluído')).toBeNull();
      expect(programCodeFromLabel('')).toBeNull();
      expect(programCodeFromLabel(null)).toBeNull();
    });
  });

  describe('classifyPpaProperty', () => {
    it('classifica programa como source e indicador/ação como dependent', () => {
      expect(classifyPpaProperty(selection(PROGRAMS))).toBe('source');
      expect(classifyPpaProperty(selection(INDICATORS))).toBe('dependent');
      expect(classifyPpaProperty(selection(ACTIONS))).toBe('dependent');
    });

    it('ignora selects que não são do PPA', () => {
      expect(classifyPpaProperty(selection(['Concluído', 'Cancelado']))).toBeNull();
    });

    it('ignora quando apenas parte das opções casa o padrão', () => {
      expect(classifyPpaProperty(selection([PROGRAMS[0], 'Outro qualquer']))).toBeNull();
    });

    it('ignora propriedades que não são SelectionModel', () => {
      const property = selection(PROGRAMS);
      property.type = TypePropertyModelEnum.TextModel;
      expect(classifyPpaProperty(property)).toBeNull();
    });

    it('classifica a partir da lista mestre quando possibleValues já está filtrado', () => {
      const property = selection([]);
      property.allPossibleValues = INDICATORS.map(option);
      expect(classifyPpaProperty(property)).toBe('dependent');
    });
  });

  describe('detectPpaWiring', () => {
    it('reconhece o grupo do PPA', () => {
      const group = new PropertyTemplateModel();
      group.groupedProperties = [selection(PROGRAMS), selection(ACTIONS), selection(INDICATORS)];
      const wiring = detectPpaWiring(group);
      expect(wiring).toBeTruthy();
      expect(wiring.source).toBe(group.groupedProperties[0]);
      expect(wiring.dependents.length).toBe(2);
    });

    it('devolve null quando não há programa no grupo', () => {
      const group = new PropertyTemplateModel();
      group.groupedProperties = [selection(INDICATORS)];
      expect(detectPpaWiring(group)).toBeNull();
    });

    it('devolve null quando não há dependentes', () => {
      const group = new PropertyTemplateModel();
      group.groupedProperties = [selection(PROGRAMS)];
      expect(detectPpaWiring(group)).toBeNull();
    });

    it('devolve null para um grupo sem propriedades', () => {
      expect(detectPpaWiring(new PropertyTemplateModel())).toBeNull();
    });
  });

  describe('selectedProgramCodes', () => {
    it('reúne os códigos de todos os programas selecionados', () => {
      const codes = selectedProgramCodes(selection(PROGRAMS, PROGRAMS));
      expect(Array.from(codes).sort()).toEqual(['5001', '5007']);
    });

    it('devolve conjunto vazio quando nada está selecionado', () => {
      expect(selectedProgramCodes(selection(PROGRAMS)).size).toBe(0);
      expect(selectedProgramCodes(selection(PROGRAMS, [])).size).toBe(0);
    });
  });

  describe('filterDependentOptions', () => {
    const all = [...INDICATORS].map(option);

    it('mantém a lista completa quando nenhum programa está selecionado', () => {
      const result = filterDependentOptions(all, new Set<string>());
      expect(result.length).toBe(2);
      expect(result).not.toBe(all);
    });

    it('filtra pelo programa selecionado', () => {
      const result = filterDependentOptions(all, new Set(['5001']));
      expect(result.map(o => o.label)).toEqual([INDICATORS[0]]);
    });

    it('faz a união quando há mais de um programa selecionado', () => {
      expect(filterDependentOptions(all, new Set(['5001', '5007'])).length).toBe(2);
    });

    it('devolve lista vazia para um programa sem itens', () => {
      expect(filterDependentOptions(all, new Set(['5046']))).toEqual([]);
    });

    it('sempre devolve uma nova referência de array', () => {
      expect(filterDependentOptions(all, new Set(['5001']))).not.toBe(all);
    });
  });

});

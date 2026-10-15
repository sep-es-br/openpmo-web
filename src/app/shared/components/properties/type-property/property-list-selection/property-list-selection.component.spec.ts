import { PropertyListSelectionComponent } from './property-list-selection.component';
import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { PropertyListCatalog } from 'src/app/shared/interfaces/IPropertyListItem';
import { IStrategicChallenge } from 'src/app/shared/services/indicator.service';

describe('PropertyListSelectionComponent', () => {
  let component: PropertyListSelectionComponent;
  let indicatorService: jasmine.SpyObj<any>;

  const challenges: IStrategicChallenge[] = [
    {
      managementId: 1,
      management: 'Gestão A',
      groupId: 10,
      groupType: 'Eixo',
      group: 'Grupo A',
      subgroupId: 100,
      subgroupType: 'Tema',
      subgroup: 'Subgrupo A',
      challengeId: 1000,
      challenge: 'Desafio A'
    },
    {
      managementId: 2,
      management: 'Gestão B',
      groupId: 20,
      groupType: 'Eixo',
      group: 'Grupo B',
      subgroupId: 200,
      subgroupType: 'Tema',
      subgroup: 'Subgrupo B',
      challengeId: 2000,
      challenge: 'Desafio B'
    }
  ];

  beforeEach(() => {
    indicatorService = jasmine.createSpyObj('IndicatorService', ['getOdsCatalog', 'getChallengeCatalog']);
    component = new PropertyListSelectionComponent(
      indicatorService,
      jasmine.createSpyObj('MessageService', ['add']),
      jasmine.createSpyObj('TranslateService', ['instant'])
    );
  });

  it('loads all ODS entries without additional filters', async () => {
    const property = listProperty('ODS');
    indicatorService.getOdsCatalog.and.returnValue(Promise.resolve({
      success: true,
      data: [{ order: 1, name: 'ODS 1', description: 'Erradicação da pobreza' }]
    }));

    component.property = property;
    await component.openListSelectionDialog();

    expect(component.listDialogItems.map(item => item.id)).toEqual(['ods:1']);
    expect(component.listDialogItems[0].label).toBe('ODS 1');
    expect(component.listDialogItems[0].description).toBeUndefined();
  });

  it('opens ODS without previous selections and appends only new items', async () => {
    const property = listProperty('ODS');
    property.selectedListItems = [{
      id: 1,
      foreignKey: 'ods:1',
      name: 'ODS 1'
    }];
    indicatorService.getOdsCatalog.and.returnValue(Promise.resolve({
      success: true,
      data: [
        { order: 1, name: 'ODS 1', description: 'Primeiro objetivo' },
        { order: 2, name: 'ODS 2', description: 'Segundo objetivo' }
      ]
    }));

    component.property = property;
    await component.openListSelectionDialog();

    expect(component.selectedListDialogItems).toEqual([]);
    expect(component.listDialogItems.map(item => item.id)).toEqual(['ods:2']);

    component.confirmListSelection([component.listDialogItems[0]]);

    expect(property.selectedListItems.map(item => item.foreignKey)).toEqual(['ods:1', 'ods:2']);
  });

  it('filters challenges by management and resets dependent filters', async () => {
    const property = listProperty('CHALLENGE');
    indicatorService.getChallengeCatalog.and.returnValue(Promise.resolve({ success: true, data: challenges }));

    component.property = property;
    await component.openListSelectionDialog();
    component.selectedGroupIds = [20];
    component.selectedSubgroupIds = [200];
    component.selectedManagementIds = [1];
    component.managementChanged();

    expect(component.selectedGroupIds).toEqual([]);
    expect(component.selectedSubgroupIds).toEqual([]);
    expect(component.listDialogItems).toEqual([]);
  });

  it('normalizes the Portuguese challenge payload and builds cascading levels', async () => {
    const property = listProperty('CHALLENGE');
    indicatorService.getChallengeCatalog.and.returnValue(Promise.resolve({
      success: true,
      data: [{
        gestaoId: 1,
        gestao: 'Gestão A',
        grupoId: 10,
        grupoTipo: 'Eixo',
        grupo: 'Eixo A',
        subgrupoId: 100,
        subgrupoTipo: 'Área',
        subgrupo: 'Área A',
        desafioId: 1000,
        desafio: 'Desafio A'
      } as any]
    }));

    component.property = property;
    await component.openListSelectionDialog();
    component.selectedManagementIds = [1];
    component.managementChanged();

    expect(component.managementOptions).toEqual([{ value: 1, label: 'Gestão A' }]);
    expect(component.groupFilterLabel).toBe('Eixo');
    expect(component.groupOptions).toEqual([{ value: 10, label: 'Eixo A' }]);

    component.selectedGroupIds = [10];
    component.groupChanged();
    expect(component.subgroupFilterLabel).toBe('Área');
    expect(component.subgroupOptions).toEqual([{ value: 100, label: 'Área A' }]);

    component.selectedSubgroupIds = [100];
    component.subgroupChanged();
    expect(component.listDialogItems.map(item => item.id)).toEqual(['challenge:1000']);
  });

  it('loads challenges after area when the next hierarchy level is a dash', async () => {
    const property = listProperty('CHALLENGE');
    indicatorService.getChallengeCatalog.and.returnValue(Promise.resolve({
      success: true,
      data: [{
        managementId: 1,
        management: 'Gestão 2019-22',
        groupId: 10,
        groupType: 'Área Estratégica',
        group: 'Cultura, Turismo, Esporte e Lazer',
        subgroupId: 0,
        subgroupType: '-',
        subgroup: '-',
        challengeId: 1000,
        challenge: 'Desafio da gestão 2019'
      }]
    }));

    component.property = property;
    await component.openListSelectionDialog();
    component.selectedManagementIds = [1];
    component.managementChanged();
    component.selectedGroupIds = [10];
    component.groupChanged();

    expect(component.showSubgroupFilter).toBe(false);
    expect(component.challengeFiltersComplete).toBe(true);
    expect(component.listDialogItems.map(item => item.id)).toEqual(['challenge:1000']);
  });

  it('hides persisted challenges and appends only newly selected items', async () => {
    const property = listProperty('CHALLENGE');
    property.selectedListItems = [{
      id: 999,
      foreignKey: 'challenge:1000',
      name: 'Nome salvo'
    }];
    indicatorService.getChallengeCatalog.and.returnValue(Promise.resolve({ success: true, data: challenges }));

    component.property = property;
    await component.openListSelectionDialog();
    component.managementChanged([2]);
    component.groupChanged([20]);
    component.subgroupChanged([200]);
    const selectedItem = component.listDialogItems.find(item => item.id === 'challenge:2000');
    component.confirmListSelection([selectedItem]);

    expect(property.selectedListItems[0].id).toBe(999);
    expect(property.selectedListItems[0].foreignKey).toBe('challenge:1000');
    expect(property.selectedListItems[0].name).toBe('Nome salvo');
    expect(property.selectedListItems[1].foreignKey).toBe('challenge:2000');
    expect(property.selectedListItems[1].name).toBe('Desafio B');
  });

  it('prevents editing when the property is disabled', async () => {
    component.property = Object.assign(listProperty('ODS'), { disabled: true });
    component.ngOnChanges({});
    await component.openListSelectionDialog();

    expect(component.displayListSelectionDialog).toBe(false);
    expect(component.cardItems.length).toBe(0);
    expect(indicatorService.getOdsCatalog).not.toHaveBeenCalled();
  });

  it('emits changes and serializes selected list items through the shared property model', async () => {
    component.property = listProperty('ODS');
    indicatorService.getOdsCatalog.and.returnValue(Promise.resolve({
      success: true, data: [{ order: 1, name: 'ODS 1' }]
    }));
    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);
    await component.openListSelectionDialog();
    component.confirmListSelection([component.listDialogItems[0]]);

    expect(changed).toHaveBeenCalledWith(component.property);
    expect(component.property.dirty).toBe(true);
    expect(component.property.getValues().items).toEqual([{
      foreignKey: 'ods:1', label: 'ODS 1', fullName: 'ODS 1'
    }]);

    component.cardItems[0].menuItems[0].command({});
    expect(component.property.getValues().items).toEqual([]);
  });

  function listProperty(listCatalog: PropertyListCatalog): PropertyTemplateModel {
    return Object.assign(new PropertyTemplateModel(), {
      id: 1,
      type: TypePropertyModelEnum.ListModel,
      listCatalog,
      active: true,
      label: 'Lista',
      name: 'Lista',
      selectedListItems: []
    });
  }
});

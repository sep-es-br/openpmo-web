import { PreprojectCriteriaGroupComponent } from './preproject-criteria-group.component';
import { TypePropertModelEnum } from 'src/app/shared/enums/TypePropertModelEnum';
import { IWorkpackModelProperty } from 'src/app/shared/interfaces/IWorkpackModelProperty';
import { IStrategicChallenge } from 'src/app/shared/services/indicator.service';

describe('PreprojectCriteriaGroupComponent', () => {
  let component: PreprojectCriteriaGroupComponent;
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
    component = new PreprojectCriteriaGroupComponent(
      indicatorService,
      jasmine.createSpyObj('MessageService', ['add']),
      jasmine.createSpyObj('TranslateService', ['instant'])
    );
  });

  it('loads all ODS entries without additional filters', async () => {
    const property = listProperty(TypePropertModelEnum.SdgListModel);
    indicatorService.getOdsCatalog.and.returnValue(Promise.resolve({
      success: true,
      data: [{ order: 1, name: 'ODS 1', description: 'Erradicação da pobreza' }]
    }));

    await component.openListSelectionDialog(property);

    expect(component.listDialogItems.map(item => item.id)).toEqual(['ods:1']);
    expect(component.listDialogItems[0].label).toBe('ODS 1');
    expect(component.listDialogItems[0].description).toBeUndefined();
  });

  it('opens ODS without previous selections and appends only new items', async () => {
    const property = listProperty(TypePropertModelEnum.SdgListModel);
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

    await component.openListSelectionDialog(property);

    expect(component.selectedListDialogItems).toEqual([]);
    expect(component.listDialogItems.map(item => item.id)).toEqual(['ods:2']);

    component.confirmListSelection([component.listDialogItems[0]]);

    expect(property.selectedListItems.map(item => item.foreignKey)).toEqual(['ods:1', 'ods:2']);
  });

  it('filters challenges by management and resets dependent filters', async () => {
    const property = listProperty(TypePropertModelEnum.ChallengeListModel);
    indicatorService.getChallengeCatalog.and.returnValue(Promise.resolve({ success: true, data: challenges }));

    await component.openListSelectionDialog(property);
    component.selectedGroupIds = [20];
    component.selectedSubgroupIds = [200];
    component.selectedManagementIds = [1];
    component.managementChanged();

    expect(component.selectedGroupIds).toEqual([]);
    expect(component.selectedSubgroupIds).toEqual([]);
    expect(component.listDialogItems).toEqual([]);
  });

  it('normalizes the Portuguese challenge payload and builds cascading levels', async () => {
    const property = listProperty(TypePropertModelEnum.ChallengeListModel);
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

    await component.openListSelectionDialog(property);
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
    const property = listProperty(TypePropertModelEnum.ChallengeListModel);
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

    await component.openListSelectionDialog(property);
    component.selectedManagementIds = [1];
    component.managementChanged();
    component.selectedGroupIds = [10];
    component.groupChanged();

    expect(component.showSubgroupFilter).toBe(false);
    expect(component.challengeFiltersComplete).toBe(true);
    expect(component.listDialogItems.map(item => item.id)).toEqual(['challenge:1000']);
  });

  it('hides persisted challenges and appends only newly selected items', async () => {
    const property = listProperty(TypePropertModelEnum.ChallengeListModel);
    property.selectedListItems = [{
      id: 999,
      foreignKey: 'challenge:1000',
      name: 'Nome salvo'
    }];
    indicatorService.getChallengeCatalog.and.returnValue(Promise.resolve({ success: true, data: challenges }));

    await component.openListSelectionDialog(property);
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

  function listProperty(type: TypePropertModelEnum): IWorkpackModelProperty {
    return {
      id: 1,
      type,
      active: true,
      label: 'Lista',
      name: 'Lista',
      selectedListItems: []
    };
  }
});

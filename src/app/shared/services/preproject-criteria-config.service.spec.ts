import { PreprojectCriteriaConfigService } from './preproject-criteria-config.service';
import { PreprojectModelService } from './preproject-model.service';

describe('Preproject criterion property weights', () => {
  it('sends weights only for scored properties and keeps group and guide weights', async () => {
    const modelService = jasmine.createSpyObj('PreprojectModelService', [
      'findOrCreateByOfficeId', 'createCriteriaTab'
    ]);
    modelService.findOrCreateByOfficeId.and.returnValue(Promise.resolve({
      success: true, data: { id: 1 }
    }));
    modelService.createCriteriaTab.and.callFake((_id, payload) => Promise.resolve({
      success: true, data: { ...payload, id: 2 }
    }));
    const service = new PreprojectCriteriaConfigService(modelService as PreprojectModelService);
    await service.addCriterion(1, {
      name: 'Guia', position: 1, icon: '', weight: 3, operation: 'SUM',
      properties: [
        { type: 'TextModel', name: 'Texto', label: 'Texto', active: true, weight: 8 },
        { type: 'CriteriaSelectionModel', name: 'Grau', label: 'Grau', active: true, weight: 2 },
        { type: 'SdgListModel', name: 'Lista de ODS', label: 'ODS', active: true, weight: 4 },
        { type: 'ChallengeListModel', name: 'Desafios', label: 'Desafios', active: true, weight: 5 }
      ],
      groups: [{
        title: 'Grupo', sortIndex: 1, weight: 6, operation: 'SUM',
        enablementKey: false, disabledValue: '', legend: '', properties: []
      }]
    });
    const payload = modelService.createCriteriaTab.calls.mostRecent().args[1];
    expect(payload.weight).toBe(3);
    expect(payload.organized[0].weight).toBe(6);
    expect(payload.properties[0].weight).toBeUndefined();
    expect(payload.properties.slice(1).map(property => property.weight)).toEqual([2, 4, 5]);
  });
});

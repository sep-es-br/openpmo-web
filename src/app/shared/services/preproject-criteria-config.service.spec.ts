import { PreprojectCriteriaConfigService } from './preproject-criteria-config.service';
import { PreprojectModelService } from './preproject-model.service';

describe('Preproject criteria configuration', () => {
  it('shows inactive guides only for pre-projects already linked to them', async () => {
    const modelService = jasmine.createSpyObj('PreprojectModelService', ['findById']);
    modelService.findById.and.returnValue(Promise.resolve({
      success: true,
      data: { properties: [
        { id: 1, type: 'CriteriaTabModel', name: 'Ativa', active: true },
        { id: 2, type: 'CriteriaTabModel', name: 'Inativa', active: false }
      ] }
    }));
    const service = new PreprojectCriteriaConfigService(modelService as PreprojectModelService);

    expect((await service.getCriteriaByModelId(10)).map(guide => guide.id)).toEqual([1]);
    expect((await service.getCriteriaByModelId(10, [2])).map(guide => guide.id)).toEqual([1, 2]);
  });

  it('keeps a guide inactive when its properties are edited', async () => {
    const modelService = jasmine.createSpyObj('PreprojectModelService', ['updateCriteriaTab']);
    modelService.updateCriteriaTab.and.callFake((_id, payload) => Promise.resolve({
      success: true,
      data: { ...payload, id: 2 }
    }));
    const service = new PreprojectCriteriaConfigService(modelService as PreprojectModelService);

    await service.updateCriterion(2, {
      name: 'Inativa', active: false, position: 1, icon: 'fas fa-cog',
      weight: 1, operation: 'SUM', properties: [], groups: []
    });

    expect(modelService.updateCriteriaTab.calls.mostRecent().args[1].active).toBeFalse();
  });
  it('preserves false for multiple selection when saving and reloading root and grouped properties', async () => {
    const modelService = jasmine.createSpyObj('PreprojectModelService', ['updateCriteriaTab', 'findCriteriaTabById']);
    let saved: any;
    modelService.updateCriteriaTab.and.callFake((id, payload) => {
      saved = { ...JSON.parse(JSON.stringify(payload)), id };
      return Promise.resolve({ success: true, data: saved });
    });
    modelService.findCriteriaTabById.and.callFake(() => Promise.resolve({ success: true, data: saved }));
    const service = new PreprojectCriteriaConfigService(modelService as PreprojectModelService);
    const selection = {
      id: 10, type: 'CriteriaSelectionModel', name: 'Grau', label: 'Grau', active: true,
      weight: 1, multipleSelection: false, defaultValue: 'A',
      possibleValuesDetails: [{ label: 'A', value: 1 }]
    };
    const result = await service.updateCriterion(2, {
      name: 'Guia', position: 1, icon: '', weight: 1, operation: 'SUM',
      properties: [selection],
      groups: [{ title: 'Grupo', sortIndex: 1, weight: 1, operation: 'SUM',
        enablementKey: false, disabledValue: '', legend: '', properties: [{ ...selection, id: 11 }] }]
    });
    expect(saved.properties[0].multipleSelection).toBeFalse();
    expect(saved.organized[0].properties[0].multipleSelection).toBeFalse();
    expect(result.properties[0].multipleSelection).toBeFalse();
    expect(result.groups[0].properties[0].multipleSelection).toBeFalse();
    const loaded = await service.getCriterion(2);
    expect(loaded.properties[0].multipleSelection).toBeFalse();
    expect(loaded.groups[0].properties[0].multipleSelection).toBeFalse();
    expect(loaded.properties[0].defaultValue).toBe('A');
  });

  it('uses the legacy checked default only when the API omits multipleSelection', () => {
    const service = new PreprojectCriteriaConfigService({} as PreprojectModelService);
    const result = service.mapCriteriaFromResponse([{ id: 2, properties: [
      { type: 'CriteriaSelectionModel', multipleSelection: false },
      { type: 'CriteriaSelectionModel', multipleSelection: true },
      { type: 'CriteriaSelectionModel' }
    ] }]);
    expect(result[0].properties.map(property => property.multipleSelection)).toEqual([false, true, true]);
  });

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

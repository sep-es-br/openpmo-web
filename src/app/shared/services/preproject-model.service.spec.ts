import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { HttpRequestInterceptor } from '../interceptor/http-request.interceptor';
import { APP_CONFIG } from '../tokens/AppConfigToken';
import { AuthService } from './auth.service';
import { PreprojectCriteriaConfigService } from './preproject-criteria-config.service';
import { PreprojectModelService } from './preproject-model.service';

describe('Preproject criteria request freshness', () => {
  const api = 'http://localhost/api';
  const modelUrl = `${api}/pre-project-models`;
  let http: HttpClient;
  let requests: HttpTestingController;
  let models: PreprojectModelService;
  let criteria: PreprojectCriteriaConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PreprojectModelService,
        PreprojectCriteriaConfigService,
        { provide: APP_CONFIG, useValue: { API: api } },
        { provide: AuthService, useValue: { getAccessToken: () => 'token' } },
        { provide: MessageService, useValue: { clear: () => {}, add: () => {} } },
        { provide: ConfirmationService, useValue: {} },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: Router, useValue: {} },
        { provide: HTTP_INTERCEPTORS, useClass: HttpRequestInterceptor, multi: true }
      ]
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    models = TestBed.inject(PreprojectModelService);
    criteria = TestBed.inject(PreprojectCriteriaConfigService);
  });

  afterEach(() => requests.verify());

  ['create', 'update'].forEach(action => {
    it(`sends organized groups and root properties separately on ${action}`, async () => {
      const storedCriterion = {
        id: 20, type: 'CriteriaTabModel', name: 'Relevância', sortIndex: 1,
        icon: 'fas fa-cog', weight: 2, operation: 'SUM',
        properties: [{
          id: 21, type: 'TextModel', name: 'Justificativa', label: 'Justificativa',
          sortIndex: 1, defaultValue: 'Texto original'
        }],
        organized: [{
          id: 22, type: 'CriteriaGroupModel', name: 'Impacto', sortIndex: 2,
          weight: 3, operation: 'AVERAGE', enablementKey: false,
          properties: [{
            id: 23, type: 'CriteriaSelectionModel', name: 'Alinhamento', sortIndex: 1,
            weight: 4, multipleSelection: false,
            acceptedOptions: [{ label: 'Alto', value: 5, position: 1, defaultOption: true }]
          }]
        }]
      };
      const loaded = criteria.getCriterion(20);
      requests.expectOne(`${modelUrl}/criteria-tabs/20`).flush(storedCriterion);
      const criterion = await loaded;
      criterion.name = 'Relevância editada';
      criterion.properties[0].defaultValue = 'Texto editado';
      criterion.groups[0].title = 'Impacto editado';
      criterion.groups[0].properties[0].weight = 7;

      let saved;
      if (action === 'create') {
        const { id, ...newCriterion } = criterion;
        saved = criteria.addCriterion(1, newCriterion);
        requests.expectOne(`${modelUrl}/office/1`).flush({ id: 10 });
        await Promise.resolve();
      } else {
        saved = criteria.updateCriterion(20, criterion);
      }

      const request = requests.expectOne(action === 'create'
        ? `${modelUrl}/10/criteria-tabs` : `${modelUrl}/criteria-tabs/20`);
      const body = request.request.body;
      expect(request.request.method).toBe(action === 'create' ? 'POST' : 'PUT');
      expect(body.organizedProperties).toBeUndefined();
      expect(body.groups).toBeUndefined();
      expect(body.properties.length).toBe(1);
      expect(body.properties[0].id).toBe(21);
      expect(body.properties[0].defaultValue).toBe('Texto editado');
      expect(body.organized.length).toBe(1);
      expect(body.organized[0].id).toBe(22);
      expect(body.organized[0].name).toBe('Impacto editado');
      expect(body.organized[0].properties[0].id).toBe(23);
      expect(body.organized[0].properties[0].weight).toBe(7);
      expect(body.organized[0].properties[0].acceptedOptions).toEqual(
        storedCriterion.organized[0].properties[0].acceptedOptions
      );
      expect(body.organized[0].properties[0].possibleValuesDetails).toBeUndefined();
      request.flush({ ...body, id: 20 });
      const result = await saved;
      expect(result.properties[0].defaultValue).toBe('Texto editado');
      expect(result.groups[0].title).toBe('Impacto editado');
      expect(result.groups[0].properties[0].weight).toBe(7);
    });
  });

  it('sends empty collections when all groups and root properties are removed', async () => {
    const saved = criteria.updateCriterion(20, {
      name: 'Relevância', position: 1, icon: 'fas fa-cog', weight: 1,
      operation: 'SUM', groups: [], properties: []
    });
    const request = requests.expectOne(`${modelUrl}/criteria-tabs/20`);
    expect(request.request.body.organized).toEqual([]);
    expect(request.request.body.properties).toEqual([]);
    expect(request.request.body.organizedProperties).toBeUndefined();
    request.flush({ ...request.request.body, id: 20 });
    const result = await saved;
    expect(result.groups).toEqual([]);
    expect(result.properties).toEqual([]);
  });

  it('sends the deletion after reading a criterion and immediately reloads the office model', async () => {
    const initialModel = models.findOrCreateByOfficeId(1);
    requests.expectOne(`${modelUrl}/office/1`).flush({ id: 10, properties: [{ id: 20 }] });
    await initialModel;

    const detail = models.findCriteriaTabById(20);
    requests.expectOne(`${modelUrl}/criteria-tabs/20`).flush({ id: 20, name: 'Criterion' });
    await detail;

    const deletion = criteria.deleteCriterion(20);
    const deleteRequest = requests.expectOne(`${modelUrl}/criteria-tabs/20`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await deletion;

    const refreshed = models.findOrCreateByOfficeId(1);
    requests.expectOne(`${modelUrl}/office/1`).flush({ id: 10, properties: [] });
    expect((await refreshed).data.properties).toEqual([]);
  });

  it('reloads the office model immediately after creating a criterion', async () => {
    const initialModel = models.findOrCreateByOfficeId(1);
    requests.expectOne(`${modelUrl}/office/1`).flush({ id: 10, properties: [] });
    await initialModel;

    const creation = models.createCriteriaTab(10, { name: 'New criterion' });
    const createRequest = requests.expectOne(`${modelUrl}/10/criteria-tabs`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ id: 20, name: 'New criterion' });
    await creation;

    const refreshed = models.findOrCreateByOfficeId(1);
    requests.expectOne(`${modelUrl}/office/1`).flush({ id: 10, properties: [{ id: 20 }] });
    expect((await refreshed).data.properties).toEqual([{ id: 20 }]);
  });

  it('reloads the details immediately after editing a criterion', async () => {
    const initial = models.findCriteriaTabById(20);
    requests.expectOne(`${modelUrl}/criteria-tabs/20`).flush({ id: 20, name: 'Original' });
    await initial;

    const update = models.updateCriteriaTab(20, { name: 'Updated' });
    const updateRequest = requests.expectOne(`${modelUrl}/criteria-tabs/20`);
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({ id: 20, name: 'Updated' });
    await update;

    const refreshed = models.findCriteriaTabById(20);
    requests.expectOne(`${modelUrl}/criteria-tabs/20`).flush({ id: 20, name: 'Updated' });
    expect((await refreshed).data.name).toBe('Updated');
  });

  it('sends repeated identical saves and keeps the cache control header internal', async () => {
    for (let index = 0; index < 2; index++) {
      const save = models.updateConfiguration(10, { active: true, operation: 'SUM' });
      const request = requests.expectOne(`${modelUrl}/10`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.headers.has('X-Skip-Request-Cache')).toBe(false);
      expect(request.request.headers.get('Authorization')).toBe('Bearer token');
      expect(request.request.withCredentials).toBe(true);
      request.flush({ id: 10, active: true, operation: 'SUM' });
      expect((await save).success).toBe(true);
    }
  });

  it('rejects an unsuccessful deletion', async () => {
    const deletion = criteria.deleteCriterion(20);
    const assertion = expectAsync(deletion).toBeRejectedWithError('Failed to delete criterion');
    requests.expectOne(`${modelUrl}/criteria-tabs/20`).flush(
      { message: 'Cannot delete criterion' },
      { status: 400, statusText: 'Bad Request' }
    );
    await assertion;
  });

  it('preserves caching elsewhere while distinguishing GET from DELETE', async () => {
    const url = `${api}/other/20`;
    const initial = http.get(url).toPromise();
    requests.expectOne(url).flush({ id: 20 });
    await initial;

    const cached = http.get(url).toPromise();
    requests.expectNone(url);
    await cached;

    const deletion = http.delete(url).toPromise();
    const deleteRequest = requests.expectOne(url);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await deletion;
  });
});

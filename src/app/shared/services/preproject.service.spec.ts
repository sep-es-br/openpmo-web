import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { APP_CONFIG } from '../tokens/AppConfigToken';
import { PreprojectService } from './preproject.service';

describe('PreprojectService', () => {
  const api = 'http://localhost/api';
  let service: PreprojectService;
  let requests: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PreprojectService,
        { provide: APP_CONFIG, useValue: { API: api } },
        { provide: MessageService, useValue: {} },
        { provide: ConfirmationService, useValue: {} },
        { provide: TranslateService, useValue: { instant: (key: string) => key } }
      ]
    });
    service = TestBed.inject(PreprojectService);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => requests.verify());

  it('creates a preproject with the selected office', async () => {
    const response = service.create({
      name: 'Anteprojeto',
      fullName: 'Anteprojeto completo',
      idOffice: 2,
      idOrganization: 30,
      expectedCompletionDate: '2026-11-30',
      expectedDeliveries: 'Entrega'
    });
    const request = requests.expectOne(`${api}/pre-projects`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.idOffice).toBe(2);
    request.flush({ success: true, data: { id: 500, idPreProjectModel: 10 } });
    expect((await response).data.id).toBe(500);
  });

  it('loads and saves one criteria tab independently', async () => {
    const loaded = service.findCriteriaTabValues(500, 100);
    const getRequest = requests.expectOne(`${api}/pre-projects/500/criteria-tabs/100/values`);
    expect(getRequest.request.method).toBe('GET');
    getRequest.flush({ success: true, data: { idCriteriaTab: 700, idCriteriaTabModel: 100, values: [], groups: [] } });
    await loaded;

    const saved = service.saveCriteriaTabValues(500, 100, { values: [], groups: [] });
    const putRequest = requests.expectOne(`${api}/pre-projects/500/criteria-tabs/100/values`);
    expect(putRequest.request.method).toBe('PUT');
    expect(putRequest.request.body).toEqual({ values: [], groups: [] });
    putRequest.flush({ success: true, data: { idCriteriaTab: 700, idCriteriaTabModel: 100, values: [], groups: [] } });
    await saved;
  });
});

import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IMeasureUnit } from '../interfaces/IMeasureUnit';

@Injectable({
  providedIn: 'root'
})
export class MeasureUnitService extends BaseService<IMeasureUnit> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('unitMeasures', injector);
   }
}

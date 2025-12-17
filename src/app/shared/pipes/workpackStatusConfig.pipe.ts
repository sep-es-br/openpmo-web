import { Pipe, PipeTransform } from '@angular/core';
import { DeliverableStatus, getWorkpackStatusConfigByStatus, ProjectStatus, WorkpackStatusConfig } from '../enums/WorkpackStatusEnum';

@Pipe({
  name: 'workpackStatusConfig',
})
export class WorkpackStatusConfigPipe implements PipeTransform {
  transform(status: ProjectStatus | DeliverableStatus): WorkpackStatusConfig | undefined {
    return getWorkpackStatusConfigByStatus(status);
  }
}

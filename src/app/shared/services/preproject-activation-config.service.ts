import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreprojectActivationConfigService {

  private readonly storageKey = '@pmo/preproject-selection-enabled';

  isEnabled(idOffice: number): boolean {
    if (!Number.isFinite(idOffice) || idOffice <= 0) {
      return false;
    }

    return localStorage.getItem(this.getStorageKey(idOffice)) === 'true';
  }

  save(idOffice: number, enabled: boolean): void {
    if (!Number.isFinite(idOffice) || idOffice <= 0) {
      return;
    }

    localStorage.setItem(this.getStorageKey(idOffice), String(enabled));
  }

  private getStorageKey(idOffice: number): string {
    return `${this.storageKey}/${idOffice}`;
  }
}

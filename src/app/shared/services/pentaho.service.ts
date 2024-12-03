import { HttpClient } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { APP_CONFIG } from "../tokens/AppConfigToken";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class PentahoService {
  private baseUrl: string;

  constructor(private http: HttpClient, private injector: Injector) {
    const appConfig = injector.get(APP_CONFIG)
    this.baseUrl = `${appConfig.API}`
  }

  getUoOptions(costAccountId: number): Observable<DropdownOption[]> {
    const url = `${this.baseUrl}/cost-accounts/pentaho/budgetUnit/${costAccountId}`;
    return this.http.get<any>(url, { responseType: 'json' }).pipe(
      map(data => {
        const options: DropdownOption[] = [];
        for (const item of data.data.resultset) {
          options.push({ code: item[0], name: item[1], fullName: item[2] });
        }
        return options;
      })
    );
  }

  getPlanoOrcamentarioOptions(codUo: string, costAccountId: number): Observable<DropdownOption[]> {
    const url = `${this.baseUrl}/cost-accounts/pentaho/budgetPlan?codUo=${codUo}&costAccountId=${costAccountId}`;
    return this.http.get<any>(url, { responseType: 'json' }).pipe(
      map(data => {
        const options: DropdownOption[] = [];
        for (const item of data.data.resultset) {
          options.push({ name: item[0], code: item[1], fullName: item[2] });
        }
        return options;
      })
    );
  }
}

export interface DropdownOption {
  code: string;
  name: string;
  fullName: string;
}
import { HttpClient } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { APP_CONFIG } from "../tokens/AppConfigToken";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { IHttpResult } from "../interfaces/IHttpResult";

@Injectable({
  providedIn: "root"
})
export class PentahoService {
  private baseUrl: string;

  constructor(private http: HttpClient, private injector: Injector) {
    const appConfig = injector.get(APP_CONFIG)
    this.baseUrl = `${appConfig.API}`
  }

  // getUoOptions(costAccountId: number): Observable<DropdownOption[]> {
  //   const url = `${this.baseUrl}/cost-accounts/pentaho/budgetUnit/${costAccountId}`;
  //   return this.http.get<any>(url, { responseType: 'json' }).pipe(
  //     map(data => {
  //       const options: DropdownOption[] = [];
  //       for (const item of data.data.resultset) {
  //         options.push({ code: item[0], name: item[1], fullName: item[2] });
  //       }
  //       return options;
  //     })
  //   );
  // }
  getUoOptions(costAccountId: number): Observable<DropdownOption[]> {
    const url = `${this.baseUrl}/cost-accounts/pentaho/budgetUnit/${costAccountId}`;
    return this.http.get<any>(url, { responseType: 'json' }).pipe(
      map(data => {
        const options: DropdownOption[] = [];
        if (data && data.data && data.data.resultset) {
          for (const item of data.data.resultset) {
            options.push({ code: item[0], name: item[1], fullName: item[2] });
          }
        }
        return options;
      }),
      catchError(error => {
        console.error('Erro ao buscar opções de Unidade Orçamentária', error);
        return of([]);
      })
    );
  }
  

  // getPlanoOrcamentarioOptions(codUo: string, costAccountId: number): Observable<DropdownOption[]> {
  //   const url = `${this.baseUrl}/cost-accounts/pentaho/budgetPlan?codUo=${codUo}&costAccountId=${costAccountId}`;
  //   return this.http.get<any>(url, { responseType: 'json' }).pipe(
  //     map(data => {
  //       const options: DropdownOption[] = [];
  //       for (const item of data.data.resultset) {
  //         options.push({ name: item[0], code: item[1], fullName: item[2] });
  //       }
  //       return options;
  //     })
  //   );
  // }
  getPlanoOrcamentarioOptions(codUo: string, costAccountId: number): Observable<DropdownOption[]> {
    const url = `${this.baseUrl}/cost-accounts/pentaho/budgetPlan?codUo=${codUo}&costAccountId=${costAccountId}`;
    return this.http.get<any>(url, { responseType: 'json' }).pipe(
      map(data => {
        const options: DropdownOption[] = [];
        if (data && data.data && data.data.resultset) {
          for (const item of data.data.resultset) {
            options.push({ name: item[0], code: item[1], fullName: item[2] });
          }
        }
        return options;
      }),
      catchError(error => {
        console.error('Erro ao buscar opções de Plano Orçamentário', error);
        return of([]);
      })
    );
  }
  

  getLiquidatedValues(codPo: string, codUo: string): Promise<IHttpResult<any>> {
    const url = `${this.baseUrl}/schedules/pentaho/po/liquidated/${codPo}/${codUo}`;

    return this.http.get<IHttpResult<any>>(url).toPromise()
      .catch(error => {
        console.error("Erro ao buscar valores liquidados.")
        return { success: false, data: { resultset: []}}
      })
  }
}

export interface DropdownOption {
  code: string;
  name: string;
  fullName: string;
}
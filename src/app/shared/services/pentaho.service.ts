import { HttpClient, HttpParams } from "@angular/common/http";
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

  
  getInstrumentsOptions(codUo: string, startYear: number, endYear : number): Observable<IInstrument[]> {
    const url = `${this.baseUrl}/cost-accounts/pentaho/instrumentsList?`;
    const params = new HttpParams()
                    .set("codUo", codUo)
                    .set("startYear", startYear.toString())
                    .set("endYear", endYear.toString());

    return this.http.get<any>(url, { responseType: 'json' , params: params }).pipe(
      map(({data}) => data?.resultset as any[]),
      map(resultset => resultset?.map( values => {
        return {
          modalidade: values[0],
          num_original: values[1],
          codigo_SIGEFES: values[2],
          nome: values[3],
          dsc_objetivo: values[4],
          dat_inicio_vigencia: values[5],
          dat_fim_vigencia: values[6],
          cod_favorecido: values[7],
          nome_favorecido: values[8],
          valor: values[9]
        } as IInstrument;
      })),
      catchError(error => {
        console.error('Erro ao buscar lista de instrumentos', error);
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

export interface IInstrument {
    modalidade: string;
    num_original: string;
    codigo_SIGEFES: string;
    nome: string;
    dsc_objetivo: string;
    dat_inicio_vigencia: string;
    dat_fim_vigencia: string;
    cod_favorecido: string;
    nome_favorecido: string;
    valor: number;
}
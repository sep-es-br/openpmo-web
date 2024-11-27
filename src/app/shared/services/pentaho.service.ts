import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'https://bi.sep.local/pentaho/plugin/cda/api/doQuery?path=/public/dashboard/plano_orcamentario/api_po_liquidado.cda&dataAccessId=api_po_liquidado';

  constructor(private http: HttpClient) {}

  getLiquidatedValues(codPo: string) {
    const url = `${this.apiUrl}&parampCodPo=${codPo}`;
    const headers = new HttpHeaders({
      Authorization: 'Basic ' + btoa('anonimo.bi:Da$hb0ard')
    });

    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        const data = response.resultset;
        const result = {};

        // Parsing and mapping the data
        data.forEach((item) => {
          const year = item[0];
          result[year] = {
            jan: item[4],
            feb: item[5],
            mar: item[6],
            apr: item[7],
            may: item[8],
            jun: item[9],
            jul: item[10],
            aug: item[11],
            sep: item[12],
            oct: item[13],
            nov: item[14],
            dec: item[15],
          };
        });
        
        return result;
      })
    );
  }
}

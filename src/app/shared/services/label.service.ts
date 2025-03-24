import { Injectable, Injector } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { APP_CONFIG } from "../tokens/AppConfigToken";

@Injectable({
    providedIn: "root",
})
export class LabelService {

    private baseUrl: string;

    constructor(private http: HttpClient, private injector: Injector) {
        const appConfig = injector.get(APP_CONFIG);
        this.baseUrl = `${appConfig.API}/label`;
    }

    getLabels(idWorkpack: number): Observable<any> {
        const url = `${this.baseUrl}/${idWorkpack}`;
        return this.http.get<any>(url);
    }
}
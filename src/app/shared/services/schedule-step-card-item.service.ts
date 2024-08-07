import { HttpClient } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { APP_CONFIG } from "../tokens/AppConfigToken";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class ScheduleStepCardItemService {
    private baseUrl: string;

    constructor(private http: HttpClient, private injector: Injector) {
        const appConfig = injector.get(APP_CONFIG);
        this.baseUrl = `${appConfig.API}/schedules`
    }

    /**
     * Captures the current baseline from the provided workpack
     * @param workpackId 
     * @returns HTTP response
     */
    getCurrentBaseline(workpackId: number): Observable<any> {
        const url = `${this.baseUrl}/baseline/${workpackId}`
        return this.http.get<any>(url);
    }
}
import { HttpClient } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { APP_CONFIG } from "../tokens/AppConfigToken";
import { BehaviorSubject, Observable } from "rxjs";
import { IBaseResponse } from "../interfaces/IBaseResponse";

@Injectable({
    providedIn: "root",
})
export class ScheduleStepCardItemService {
    private baseUrl: string;

    private _isCurrentBaseline$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    public get isCurrentBaseline$(): BehaviorSubject<boolean> {
        return this._isCurrentBaseline$;
    }

    constructor(private http: HttpClient, private injector: Injector) {
        const appConfig = injector.get(APP_CONFIG);
        this.baseUrl = `${appConfig.API}/schedules`
    }

    /**
     * Captures the current baseline from the provided workpack
     * @param workpackId 
     * @returns HTTP response
     */
    getCurrentBaseline(workpackId: number): Observable<IBaseResponse<boolean>> {
        const url = `${this.baseUrl}/baseline/${workpackId}`
        return this.http.get<any>(url);
    }
}
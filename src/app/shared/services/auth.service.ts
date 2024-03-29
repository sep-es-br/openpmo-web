import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import jwtDecode from 'jwt-decode';

import { StoreKeys } from '../constants';
import { IPerson } from '../interfaces/IPerson';
import { PersonService } from './person.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { IAppConfig } from '../interfaces/IAppConfig';
import { APP_CONFIG } from '../tokens/AppConfigToken';

interface TokenPayload {
  sub: number;
  email: string;
  administrator: boolean;
  exp: number;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  appConfig: IAppConfig;
  currentUserInfo: IPerson;
  userLogout = new Subject();
  private isLoginDenied = new BehaviorSubject<boolean>(false);


  constructor(
    public http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(APP_CONFIG) appConfig: IAppConfig,
    private personSrv: PersonService,
  ) {
    this.appConfig = appConfig;
  }

  signIn() {
    this.document.location.href = this.getUrlForAuth();
  }

  async refresh() {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        const { data, success } = await this.http.get<any>(
          `${this.appConfig.API}/signin/refresh?refreshToken=${refreshToken}`
        ).toPromise();
        if (success) {
          this.saveToken(data);
        } else {
          this.clearTokens();
        }
        return success;
      }
    } catch (err) {
    }
    this.clearTokens();
    return false;
  }

  async signOut() {
    this.clearStorage();
    this.userLogout.next(true);
    this.currentUserInfo = undefined;
    window.location.href = 'https://acessocidadao.es.gov.br/is/logout';
  }

  async signOutCitizenAccess() {
    window.location.href = 'https://acessocidadao.es.gov.br/is/logout';
  }

  saveToken(data: any) {
    localStorage.setItem(StoreKeys.ACCESS_TOKEN, data.token);
    localStorage.setItem(StoreKeys.REFRESH_TOKEN, data.refreshToken);
  }

  clearTokens() {
    localStorage.removeItem(StoreKeys.ACCESS_TOKEN);
    localStorage.removeItem(StoreKeys.REFRESH_TOKEN);
  }

  clearStorage() {
    localStorage.clear();
  }

  getAccessToken() {
    return localStorage.getItem(StoreKeys.ACCESS_TOKEN);
  }

  getRefreshToken() {
    return localStorage.getItem(StoreKeys.REFRESH_TOKEN);
  }

  getTokenPayload(): TokenPayload {
    return this.getAccessToken() ? jwtDecode(this.getAccessToken()) : undefined;
  }

  async setInfoPerson() {
    const authenticated = await this.isAuthenticated();
    if (authenticated) {
      const { success, data } = await this.personSrv.GetByKey(this.getTokenPayload()?.key);
      if (success) {
        this.currentUserInfo = data;
        localStorage.setItem('@PMO/infoPerson', JSON.stringify(this.currentUserInfo));
      }
    }
  }

  getInfoPerson() {
    const infoPersonItem = localStorage.getItem('@PMO/infoPerson');
    if (infoPersonItem) {
      return JSON.parse(infoPersonItem);
    }
  }

  getIdPerson(): number {
    return this.getTokenPayload()?.sub;
  }

  async isAuthenticated(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    if (accessToken) {
      return !this.jwtHelperService.isTokenExpired(accessToken) || await this.refresh();
    }
    return false;
  }

  get obsIsLoginDenied() {
    return this.isLoginDenied.asObservable();
  }
  nextIsLoginDenied(value: boolean) {
    this.isLoginDenied.next(value);
  }

  async isUserAdmin(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const interval = setInterval(() => {
        const payload = this.getTokenPayload();
        if (payload) {
          clearInterval(interval);
          resolve(payload.administrator);
        }
        if (tries > 20) {
          clearInterval(interval);
          resolve(false);
        }
        tries++;
      }, 500);
    });
  }

  private getUrlForAuth() {
    return `${this.appConfig.API}/oauth2/authorization/idsvr?front_callback_url=${this.getFrontFallbackUrl()}`;
  }
  private getUrlForSignout(token: string) {
    return `${this.appConfig.API}/signout?token=${token}`;
  }

  private getFrontFallbackUrl(): string {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }
}

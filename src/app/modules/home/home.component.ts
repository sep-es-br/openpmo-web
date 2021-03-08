import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { filter, map } from 'rxjs/operators';
import { ISocialLoginResult } from 'src/app/shared/interfaces/ISocialLoginResult';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';
import { StoreKeys } from '../../shared/constants';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    private authSrv: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService,
    private translateChangeSrv: TranslateChangeService
  ) {
    this.breadcrumbSrv.setMenu([]);
    this.activatedRoute.queryParams
      .pipe(
        map(({ AcessoDto }) =>
          (!this.authSrv.isAuthenticated() && !AcessoDto)
            ? this.router.navigate(['/login'])
            : AcessoDto
        ),
        filter((dto) => !!dto)
      ).subscribe((dto) => {
        if (dto === 'error.unauthorized') {
         const lang = (window.navigator.language).split('-');
         this.translateChangeSrv.changeLangDefault(lang[0]);
          this.messageSrv.add({
            severity: 'warn',
            summary: this.translateSrv.instant('warn'),
            detail: this.translateSrv.instant('messages.error.unauthorizedApplication')
          });
          this.router.navigate(['/login']);
        } else {
          const userInfo = JSON.parse(atob(dto)) as ISocialLoginResult;
          this.authSrv.saveToken(userInfo);
          this.router.navigate(['/home']);
        }
      });
  }

  ngOnInit(): void {
    this.router.navigate(['/offices']);
  }
}

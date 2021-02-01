import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ISocialLoginResult } from 'src/app/shared/interfaces/ISocialLoginResult';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';

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
    private breadcrumbSrv: BreadcrumbService
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
        const userInfo = JSON.parse(atob(dto)) as ISocialLoginResult;
        this.authSrv.saveToken(userInfo);
        this.router.navigate(['/home']);
      });
  }

  ngOnInit(): void {
    this.router.navigate(['/offices']);
  }
}

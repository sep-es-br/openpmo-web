import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';

@Component({
  selector: 'app-user-slide-menu',
  templateUrl: './user-slide-menu.component.html',
  styleUrls: ['./user-slide-menu.component.scss']
})
export class UserSlideMenuComponent implements OnInit {

  @Output() onCloseUserMenu = new EventEmitter();
  isUserAdmin = false;
  currentUserInfo: IPerson;
  itemsLanguages: MenuItem[] = [];
  username = '';

  constructor(
    public authSrv: AuthService,
    private translateSrv: TranslateService,
    private translateChangeSrv: TranslateChangeService,
  ) {
    this.currentUserInfo = this.authSrv.getInfoPerson();
    if (this.currentUserInfo) {
      this.isUserAdmin = this.currentUserInfo.administrator;
    }
    this.loadItemsLanguage();
  }

  async ngOnInit() {
    const payload = this.authSrv.getTokenPayload();
    this.username = this.isUserAdmin
      ? 'Admin'
      : (this.currentUserInfo.name?.split(' ').shift() || payload.email);
  }

  showTooltip() {
    setTimeout(() => {
      const ptooltip = document.querySelector('.p-tooltip');
      if (!ptooltip) {
        return;
      }
      const style = ptooltip.getAttribute('style');
      ptooltip.setAttribute('style', `${style} z-index: 99999 !important`);
    }, 10);
  }

  loadItemsLanguage() {
    this.itemsLanguages = [
      {
        label: this.translateSrv.instant('currentLanguage'),
        icon: 'fas fa-flag',
        items: [
          {
            label: 'Português', command: () => {
              this.changeLanguage('pt-BR');
              this.closeUserMenu();
            }
          },
          {
            label: 'English', command: () => {
              this.changeLanguage('en-US');
              this.closeUserMenu();
            }
          }
        ]
      }
    ]
  }

  changeLanguage(language: string) {
    this.translateChangeSrv.changeLangDefault(language);
    window.location.reload();
  }

  closeUserMenu() {
    this.onCloseUserMenu.emit();
  }

}

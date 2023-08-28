import {takeUntil} from 'rxjs/operators';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ResponsiveService} from '../../services/responsive.service';
import {WorkpackShowTabviewService} from '../../services/workpack-show-tabview.service';
import {Subject} from 'rxjs';
import {WorkpackService} from '../../services/workpack.service';
import {ConfirmationService} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';
import {SaveButtonService} from '../../services/save-button.service';

export interface ITabViewScrolled {
  menu: string;
  key: string;
}

@Component({
  selector: 'app-tabview-scrolled',
  templateUrl: './tabview-scrolled.component.html',
  styleUrls: ['./tabview-scrolled.component.scss']
})
export class TabviewScrolledComponent implements OnChanges, OnDestroy {

  @Output() selectedTabChange = new EventEmitter<{ tabs: ITabViewScrolled; setStorage: boolean }>();
  @Input() tabs: ITabViewScrolled[] = [];
  @Input() selectedTab: ITabViewScrolled;
  @Input() idWorkpack: number;
  tabBody: string;
  showTabview: boolean;
  $destroy = new Subject();
  pendingChanges = false;
  showMessageNotFound: boolean;
  tabViewStorage = 'open-pmo:WORKPACK_TABVIEW';

  constructor(
    private responsiveSrv: ResponsiveService,
    public workpackShowTabViewSrv: WorkpackShowTabviewService,
    private workpackSrv: WorkpackService,
    private confirmationSrv: ConfirmationService,
    private translateSrv: TranslateService,
    private saveButtonSrv: SaveButtonService
  ) {
    this.responsiveSrv.resizeEvent.subscribe(() => {
      setTimeout(() => {
        this.prepareScrolls();
      });
    });
    this.workpackShowTabViewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
      setTimeout(() => {
        this.prepareScrolls();
      });
    });
    this.workpackSrv.observablePendingChanges.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.pendingChanges = value;
    });
  }

  ngOnDestroy() {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  existsWorkpackTabStorage() {
    const storageTab = localStorage.getItem(this.tabViewStorage);
    if (!storageTab) {
      return false;
    }
    const selectedTabStorage = JSON.parse(storageTab);
    return selectedTabStorage.some(tab => tab.idWorkpack === this.idWorkpack);
  }

  findIndexTabStorage() {
    const storageTab = localStorage.getItem(this.tabViewStorage);
    const selectedTabStorage = JSON.parse(storageTab);
    const index = selectedTabStorage.findIndex(tab => tab.id === this.idWorkpack);
    if (index === -1) {
      return 0;
    }
    const indexTab = this.tabs?.findIndex(tab => tab.key === selectedTabStorage[index].tab.key);
    return indexTab !== -1 ? indexTab : 0;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.tabs && changes.tabs.currentValue) {
      setTimeout(() => {
        if (!this.selectedTab || !this.tabs.some(tab => tab.key === this.selectedTab.key)) {
          const index = this.existsWorkpackTabStorage() ? this.findIndexTabStorage() : 0;
          this.selectTab(this.tabs[index], this.existsWorkpackTabStorage() && index !== 0);
        }
        this.prepareScrolls();
        if (!this.tabs.length) {
          this.showMessageNotFound = true;
        }
      }, 1000);
    }
  }

  selectTab(item: ITabViewScrolled, setStorage: boolean) {
    if (this.pendingChanges) {
      this.confirmationSrv.confirm({
        message: this.translateSrv.instant('messages.confirmClearPendingChanges'),
        key: 'clearPendingChangesConfirm',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async() => {
          this.selectedTab = item;
          this.tabBody = `${item.key}`;
          this.workpackSrv.nextPendingChanges(false);
          this.selectedTabChange.emit({ tabs: this.selectedTab, setStorage });
          this.saveButtonSrv.nextShowSaveButton(false);
        },
        reject: () => {
        }
      });
    } else {
      this.selectedTab = item;
      this.tabBody = `${item.key}`;
      this.selectedTabChange.emit({ tabs: this.selectedTab, setStorage });
    }
  }

  prepareScrolls() {
    if (!this.showTabview) {
      return;
    }
    const tabs = document.querySelectorAll('.app-tabview-scrolled-header-item');
    const tabsContainer = document.querySelector('.app-tabview-scrolled-header');
    if (tabs && tabsContainer) {
      const tabsContainerWidth = tabsContainer.clientWidth;
      const tabsWidth = Array.from(tabs).reduce((acc, tab) => acc + tab.clientWidth, 0);
      const scrollWidth = tabsWidth - tabsContainerWidth;

      const tabActive = document.querySelector('.app-tabview-scrolled-header-item .header-link.active');
      if (tabActive) {
        const tabActiveLeft = tabActive.getBoundingClientRect().left;
        const tabsContainerLeft = tabsContainer.getBoundingClientRect().left;
        const tabsContainerCenter = tabsContainerLeft + tabsContainerWidth / 2;
        if (tabActiveLeft < tabsContainerCenter) {
          tabsContainer.scrollLeft = 0;
        } else if (tabActiveLeft > tabsContainerCenter) {
          tabsContainer.scrollLeft = scrollWidth;
        }
      }

      if (scrollWidth > 0) {
        const scrollRight = document.querySelector('.nav-scroll-right');
        scrollRight.classList.remove('hidden');
      }
      const scrollLeft = document.querySelector('.nav-scroll-left');
      scrollLeft.classList[tabsContainer.scrollLeft === 0 ? 'add' : 'remove']('hidden');
    }
  }

  scrollLeft() {
    const tabsContainer = document.querySelector('.app-tabview-scrolled-header');
    if (tabsContainer.scrollLeft - 300 <= 0) {
      const scrollLeft = document.querySelector('.nav-scroll-left');
      scrollLeft.classList.add('hidden');
    }
    if (tabsContainer.scrollLeft < tabsContainer.scrollWidth) {
      const scrollRight = document.querySelector('.nav-scroll-right');
      scrollRight.classList.remove('hidden');
    }
    tabsContainer.scrollLeft -= 300;

  }

  scrollRight() {
    const tabsContainer = document.querySelector('.app-tabview-scrolled-header');
    tabsContainer.scrollLeft += 300;
    const scrollLeft = document.querySelector('.nav-scroll-left');
    scrollLeft.classList.remove('hidden');
    const appTabview = document.querySelector('.app-tabview-scrolled');

    if ((appTabview.clientWidth + tabsContainer.scrollLeft + 300) >= tabsContainer.scrollWidth) {
      const scrollRight = document.querySelector('.nav-scroll-right');
      scrollRight.classList.add('hidden');
    }
  }

}

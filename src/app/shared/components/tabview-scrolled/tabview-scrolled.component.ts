import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';

export interface ITabViewScrolled {
  menu: string;
  key: string;
}
@Component({
  selector: 'app-tabview-scrolled',
  templateUrl: './tabview-scrolled.component.html',
  styleUrls: ['./tabview-scrolled.component.scss']
})
export class TabviewScrolledComponent implements OnChanges {

  @Output() selectedTabChange = new EventEmitter<ITabViewScrolled>();
  @Input() tabs: ITabViewScrolled[] = [];
  selectedTab: ITabViewScrolled;
  tabBody: string;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.tabs && changes.tabs.currentValue) {
      this.selectTab(this.tabs[0]);
      setTimeout(() => {
        this.prepareScrolls();
      });
    }
  }

  selectTab(item: ITabViewScrolled) {
    this.selectedTab = item;
    this.tabBody = `${item.key}`;
    this.selectedTabChange.emit(this.selectedTab);
  }

  prepareScrolls() {
    const tabs = document.querySelectorAll('.app-tabview-scrolled-header-item');
    const tabsContainer = document.querySelector('.app-tabview-scrolled-header');
    const tabsContainerWidth = tabsContainer.clientWidth;
    const tabsWidth = Array.from(tabs).reduce((acc, tab) => acc + tab.clientWidth, 0);
    const scrollWidth = tabsWidth - tabsContainerWidth;
    if (scrollWidth > 0) {
      const scrollRight = document.querySelector('.nav-scroll-right');
      scrollRight.classList.remove('hidden');
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

import { BehaviorSubject } from 'rxjs';
import { TemplateComponent } from './template.component';

describe('TemplateComponent', () => {
  let component: TemplateComponent;
  let responsiveSrv: { next: jasmine.Spy; nextResizeEvent: jasmine.Spy };
  let workpackShowTabViewSrv: { next: jasmine.Spy };
  let splitterPanels: HTMLElement[];
  let mainContent: HTMLElement;

  beforeEach(() => {
    responsiveSrv = {
      next: jasmine.createSpy('next'),
      nextResizeEvent: jasmine.createSpy('nextResizeEvent'),
    };
    workpackShowTabViewSrv = { next: jasmine.createSpy('next') };

    component = new TemplateComponent(
      responsiveSrv as any,
      { observable: new BehaviorSubject(false) } as any,
      {} as any,
      { observable: new BehaviorSubject(false) } as any,
      workpackShowTabViewSrv as any
    );

    splitterPanels = [
      document.createElement('div'),
      document.createElement('div'),
    ];
    splitterPanels.forEach((panel) => {
      panel.classList.add('p-splitter-panel-nested');
      document.body.appendChild(panel);
    });

    mainContent = document.createElement('div');
    mainContent.classList.add('main-content');
    Object.defineProperty(mainContent, 'clientWidth', {
      configurable: true,
      value: 1000,
    });
    document.body.appendChild(mainContent);
  });

  afterEach(() => {
    splitterPanels.forEach((panel) => panel.remove());
    mainContent.remove();
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the panel sizes emitted by the splitter after dragging', () => {
    splitterPanels[0].setAttribute(
      'style',
      'flex-basis: calc(35% - 4px); max-width: calc(15% - 4px);'
    );
    splitterPanels[1].setAttribute(
      'style',
      'flex-basis: calc(65% - 4px); max-width: calc(90% - 4px);'
    );
    const panelStyles = splitterPanels.map((panel) =>
      panel.getAttribute('style')
    );

    component.onResizeEnd({ sizes: [35, 65] });

    expect(component.menuWidth).toBe(35);
    expect(component.mainWidth).toBe(65);
    expect(splitterPanels.map((panel) => panel.getAttribute('style'))).toEqual(
      panelStyles
    );
  });

  it('should not cap the menu width when opening the panel', () => {
    const splitterContainer = document.createElement('div');
    splitterContainer.classList.add('splitter-container');
    Object.defineProperty(splitterContainer, 'clientWidth', {
      configurable: true,
      value: 1000,
    });
    document.body.appendChild(splitterContainer);

    component.openSlideMenu();

    expect(component.menuWidth).toBe(21);
    expect(component.mainWidth).toBe(79);
    expect(splitterPanels[0].getAttribute('style')).toBe(
      'flex-basis: calc(21% - 4px);'
    );
    expect(splitterPanels[1].getAttribute('style')).toBe(
      'flex-basis: calc(79% - 4px);'
    );

    splitterContainer.remove();
  });
});

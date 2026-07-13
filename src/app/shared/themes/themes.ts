import { ITheme } from '../interfaces/ITheme';

export const DEFAULT_THEME_NAME = 'es';

const ES_THEME: ITheme = {
  name: 'es',
  documentTitle: 'Open PMO',
  favicon: 'assets/svg/favicon.svg',
  loginLogo: {
    src: 'assets/images/logo-openpmo-horizontal.png',
    alt: 'Open PMO'
  },
  footerBrandLogos: [
    {
      src: 'assets/images/brasao_rodape.png',
      alt: 'Governo do Estado do Espírito Santo'
    }
  ]
};

const PB_THEME: ITheme = {
  name: 'pb',
  documentTitle: 'SIPGR',
  favicon: 'assets/themes/pb/favicon.png',
  loginLogo: {
    src: 'assets/images/logo-openpmo-horizontal.png',
    alt: 'Open PMO'
  },
  footerBrandLogos: [
    {
      src: 'assets/themes/pb/logo-governo-paraiba.png',
      alt: 'Governo do Estado da Paraíba',
      height: '36px'
    },
    {
      src: 'assets/themes/pb/logo-codata.png',
      alt: 'CODATA - Companhia de Processamento de Dados da Paraíba',
      height: '26px'
    }
  ]
};

const THEMES: { [name: string]: ITheme } = {
  [ES_THEME.name]: ES_THEME,
  [PB_THEME.name]: PB_THEME
};

export const resolveTheme = (name?: string): ITheme =>
  THEMES[(name || '').trim().toLowerCase()] || THEMES[DEFAULT_THEME_NAME];

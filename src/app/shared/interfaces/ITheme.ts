export interface IThemeLogo {
  src: string;
  alt: string;
  height?: string;
}

export interface ITheme {
  name: string;
  documentTitle: string;
  favicon: string;
  loginLogo: IThemeLogo;
  footerBrandLogos: IThemeLogo[];
}

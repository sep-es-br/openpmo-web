export interface IThemeLogo {
  src: string;
  alt: string;
  /*
   * Altura no rodapé. Cada marca tem uma proporção própria — o brasão do ES é quase
   * quadrado, o wordmark da CODATA é seis vezes mais largo que alto — então uma altura
   * única deixaria umas gigantes e outras minúsculas. Omitir mantém a altura do CSS.
   */
  height?: string;
}

export interface ITheme {
  name: string;
  documentTitle: string;
  favicon: string;
  loginLogo: IThemeLogo;
  /*
   * Logos institucionais do rodapé: identificam o órgão que opera esta instalação.
   * O ES tem um (o brasão do estado); o PB tem dois (Governo da Paraíba e CODATA).
   *
   * Não confundir com o modal "Sobre": lá ficam os créditos de autoria do OpenPMO,
   * que são da equipe do Espírito Santo e permanecem os mesmos em qualquer tema.
   */
  footerBrandLogos: IThemeLogo[];
}

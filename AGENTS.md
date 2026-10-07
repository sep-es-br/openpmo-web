# AGENTS.md — OpenPMO Web

> Contexto técnico para agentes de IA que trabalham neste repositório. Este arquivo foi elaborado a partir do `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`, `.eslintrc.json`, `karma.conf.js`, `e2e/` e da estrutura atual de `src`.

## 📚 Fonte de Conhecimento & Regras de Negócio (OpenPMO)

Para entender as regras de negócio, arquitetura, fluxos de usuário e especificações do projeto, consulte a documentação oficial via **GitBook LLM Index**:

- **Índice Geral de IA (`llms.txt`):** `https://sep-es-br.gitbook.io/manuais-openpmo/llms.txt`
- **Manual Principal:** `https://sep-es-br.gitbook.io/manuais-openpmo`

### 💡 Como o Codex deve consultar a documentação:
1. Sempre que precisar entender um fluxo de negócio, autenticação ou funcionalidade (ex: *Conceitos Básicos*, *Acompanhamento de Projetos*), consulte primeiro os links mapeados no `llms.txt`.
2. Para obter a documentação em formato Markdown limpo de qualquer página, adicione a extensão `.md` ao final da URL da página correspondente.
   - *Exemplo:* Se a página for `https://sep-es-br.gitbook.io/manuais-openpmo/manual-do-usuario/conceitos-basicos`, acesse `https://sep-es-br.gitbook.io/manuais-openpmo/manual-do-usuario/conceitos-basicos.md`.

O GitBook é a **fonte da verdade para regras de negócio, fluxos funcionais e comportamento esperado do OpenPMO**. Antes de implementar ou corrigir uma funcionalidade, consulte essa documentação e alinhe a mudança ao que estiver especificado nela. Use o código e a configuração locais como fonte da verdade para o estado técnico atualmente implementado; se houver conflito, não invente uma regra: registre a divergência e confirme qual comportamento deve prevalecer.

## Perfil técnico

- **Linguagem principal:** TypeScript `4.0.5` (resolução exata do `package-lock.json`); JavaScript é usado nos arquivos de configuração e no Protractor/Karma.
- **Framework principal:** Angular `11.0.4`.
- **CLI e build:** Angular CLI `11.0.4` e `@angular-devkit/build-angular` `0.1100.4`.
- **Gerenciador de pacotes:** npm, com `package-lock.json` em lockfile version `2`. Prefira instalações reprodutíveis com `npm ci`.
- **Node.js:** o projeto não declara uma versão em `engines`; valide a versão disponível no ambiente antes de atualizar dependências. A linha Angular 11/TypeScript 4.0 deve ser preservada salvo decisão explícita de migração.
- **Estilos:** SCSS para componentes e estilos globais; componentes gerados pelo schematics usam SCSS.
- **Testes unitários:** Jasmine `3.6.0` + Karma `5.1.1` + `karma-chrome-launcher` `3.1.0`.
- **E2E legado:** Protractor `7.0.0`, configurado em `e2e/protractor.conf.js`, com Chrome local e `baseUrl` `http://localhost:4200/`.
- **Lint:** ESLint `7.15.0` com Angular ESLint `0.8.0-beta.5`.

## Dependências principais — versões exatas

As versões a seguir são as resolvidas pelo `package-lock.json`. O `package.json` usa intervalos (`^`/`~`) em vários casos; não considere um intervalo como versão efetivamente instalada quando o lockfile estiver disponível.

### Runtime

- `@angular/animations` — `11.0.4`.
- `@angular/cdk` — `11.0.2`.
- `@angular/common` — `11.0.4`.
- `@angular/compiler` — `11.0.4`.
- `@angular/core` — `11.0.4`.
- `@angular/forms` — `11.0.4`.
- `@angular/platform-browser` — `11.0.4`.
- `@angular/platform-browser-dynamic` — `11.0.4`.
- `@angular/router` — `11.0.4`.
- `@auth0/angular-jwt` — `5.0.2`.
- `@fortawesome/angular-fontawesome` — `0.8.1`.
- `@fortawesome/fontawesome-free` — `5.15.1`.
- `@fortawesome/fontawesome-svg-core` — `1.2.34`.
- `@fortawesome/free-brands-svg-icons` — `5.15.2`.
- `@fortawesome/free-regular-svg-icons` — `5.15.2`.
- `@fortawesome/free-solid-svg-icons` — `5.15.2`.
- `@fullcalendar/core` — `5.4.0`.
- `@ngx-translate/core` — `13.0.0`.
- `@ngx-translate/http-loader` — `6.0.0`.
- `chart.js` — `2.9.4`.
- `chartjs-plugin-datalabels` — `0.7.0`.
- `jwt-decode` — `3.1.2`.
- `moment` — `2.29.1`.
- `ngx-cookie` — `5.0.2`.
- `ngx-image-cropper` — `4.0.1`.
- `primeflex` — `2.0.0`.
- `primeicons` — `4.1.0`.
- `primeng` — `11.2.0`.
- `rxjs` — `6.5.5`.
- `tslib` — `2.0.3`.
- `zone.js` — `0.10.3`.

### Desenvolvimento e testes

- `@angular-devkit/build-angular` — `0.1100.4`.
- `@angular-eslint/builder` — `0.8.0-beta.5`.
- `@angular-eslint/eslint-plugin` — `0.8.0-beta.5`.
- `@angular-eslint/eslint-plugin-template` — `0.8.0-beta.5`.
- `@angular-eslint/schematics` — `0.8.0-beta.5`.
- `@angular-eslint/template-parser` — `0.8.0-beta.5`.
- `@angular/cli` — `11.0.4`.
- `@angular/compiler-cli` — `11.0.4`.
- `@types/chart.js` — `2.9.35`.
- `@types/jasmine` — `3.6.2`.
- `@types/jasminewd2` — `2.0.8`.
- `@types/node` — `17.0.45`.
- `@typescript-eslint/eslint-plugin` — `4.3.0`.
- `@typescript-eslint/parser` — `4.3.0`.
- `codelyzer` — `6.0.1`.
- `eslint` — `7.15.0`.
- `eslint-plugin-import` — `2.22.1`.
- `eslint-plugin-jsdoc` — `30.7.6`.
- `eslint-plugin-prefer-arrow` — `1.2.2`.
- `jasmine-core` — `3.6.0`.
- `jasmine-spec-reporter` — `5.0.2`.
- `karma` — `5.1.1`.
- `karma-chrome-launcher` — `3.1.0`.
- `karma-coverage-istanbul-reporter` — `3.0.3`.
- `karma-jasmine` — `4.0.1`.
- `karma-jasmine-html-reporter` — `1.5.4`.
- `protractor` — `7.0.0`.
- `ts-node` — `8.3.0`.
- `typescript` — `4.0.5`.

## Estrutura de pastas e convenções

- `src/main.ts` — ponto de entrada. Carrega `./assets/config/app-config.json` antes do bootstrap, resolve o tema remoto/configurado e então inicializa o `AppModule`.
- `src/app/app.module.ts` — módulo raiz; registra módulos de navegador, tradução, configuração de requisições, cookies, Font Awesome e componentes globais.
- `src/app/app-routing.module.ts` — rotas principais. Usa `RouterModule.forRoot` com `useHash: true`, `relativeLinkResolution: 'legacy'` e `onSameUrlNavigation: 'reload'`.
- `src/app/core/` — componentes e serviços estruturais da aplicação, como menus, template, breadcrumb, avatar e rodapé.
- `src/app/shared/` — componentes, serviços, interfaces, tokens, pipes, guards e interceptor reutilizáveis entre módulos.
- `src/app/modules/` — funcionalidades de negócio organizadas em módulos de feature, como `plan`, `workpack`, `workpack-model`, `office`, `organization`, `person`, `report`, `report-model`, `risk`, `stakeholder`, `strategy`, `filter-dataview` e `universal-search`.
- `src/app/translation/` — carregamento e inicialização de traduções.
- `src/environments/` — variantes `environment.ts`, `environment.test.ts` e `environment.prod.ts`; o build usa file replacements para `test` e `production`.
- `src/assets/` — assets estáticos, configurações runtime, traduções, imagens, SVGs, fontes e temas. Este projeto é Angular 11 e usa `src/assets`; a convenção `public/` de versões Angular mais novas não se aplica aqui.
- `src/themes/` e `src/Icomoon/` — tokens/overrides SCSS e recursos do conjunto de ícones.
- `e2e/` — configuração TypeScript e Protractor para testes end-to-end legados.
- `angular.json` — aplicação única `open-pmo-angular`, `sourceRoot` `src`, prefixo de componentes `app`, saída `dist/open-pmo-angular` e analytics desabilitado.

### Rotas, autenticação e carregamento

- `home` e `login` são rotas diretamente carregadas; as principais áreas autenticadas usam lazy loading (`loadChildren`).
- As rotas autenticadas usam `AuthGuard`, que consulta `AuthService` e redireciona para `/login` quando a sessão não é válida.
- O `HttpRequestInterceptor` injeta `Authorization: Bearer ...` quando há access token, envia `withCredentials: true`, normaliza respostas da API e trata erros de autenticação.
- Não defina manualmente `Content-Type` em requisições com `FormData`; o navegador precisa gerar o boundary multipart. Preserve o comportamento do interceptor e dos serviços de upload.
- O `APP_CONFIG` é fornecido em runtime a partir de `assets/config/app-config.json`; endpoints da API, provedor de autenticação, textos de login e tema devem continuar configuráveis.
- Ao alterar uma rota, verifique o hash URL (`/#/...`), o `AuthGuard`, links internos e o proxy para a API no contexto `/openpmo`.

### Componentes, serviços e estilo

- Mantenha funcionalidades de negócio no módulo de feature correspondente e reutilização transversal em `shared`/`core`.
- Antes de criar uma tela, componente ou padrão visual novo, procure telas estruturais equivalentes e componentes existentes. Reutilize-os e adapte-os ao contexto da funcionalidade; crie algo novo somente quando o padrão existente não atender ao requisito, explicando a limitação concreta.
- Siga o padrão Angular existente: componente com `.ts`, template `.html`, estilo `.scss` e teste `.spec.ts` quando aplicável.
- Use nomes de componentes com prefixo `app` e kebab-case; diretivas usam prefixo `app` e camelCase, conforme `.eslintrc.json`.
- Preserve traduções em `src/assets/i18n` e use `@ngx-translate` em vez de strings fixas quando o fluxo já for internacionalizado.
- Preserve os temas e tokens existentes; alterações visuais devem considerar PrimeNG, PrimeFlex, Font Awesome, Icomoon e os overrides globais.

## Comandos principais

Execute a partir da raiz do frontend:

```powershell
# Instalação reprodutível a partir do lockfile
npm ci

# Servidor de desenvolvimento com HMR
npm start

# Build padrão/desenvolvimento
npm run build
npm run build:dev

# Build com configuração de teste
npm run build:test

# Build otimizado de produção
npm run build:prod

# Testes unitários Karma/Jasmine (abre o Chrome e fica observando alterações)
npm test

# Lint Angular ESLint
npm run lint
```

O script `test` está configurado para Chrome, `autoWatch: true` e `singleRun: false`. Para uma execução não interativa em ambiente de validação, a CLI Angular aceita, por exemplo, `npx ng test --watch=false --browsers=ChromeHeadless`, desde que o launcher/headless disponível no ambiente esteja configurado. O E2E usa Protractor e exige a aplicação em `http://localhost:4200/`; não há script npm dedicado para ele no `package.json`, portanto execute a configuração existente somente quando esse fluxo for solicitado e o backend/proxy estiverem disponíveis.

## Validação antes de concluir uma mudança

1. Consulte o `llms.txt`/GitBook para o fluxo de negócio afetado.
2. Confirme a rota, guard, serviço, contrato da API, traduções e configuração runtime envolvidos.
3. Execute `npm run lint` e os testes mais próximos; para mudanças de build/produção, execute também `npm run build:prod`.
4. Para uploads ou autenticação, verifique o request efetivo, os cookies/credenciais e os redirecionamentos; não valide somente pela ausência de erro no clique.
5. Diferencie falhas de ambiente (Node/npm/Chrome/backend/proxy) de falhas do código e informe exatamente quais verificações foram realizadas.

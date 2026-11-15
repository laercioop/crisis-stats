# Orientações para agentes

## Projeto

Site estático em português: **Estatísticas da Crise na Igreja**. Usa HTML, CSS e JavaScript sem dependências de execução. Publicado no GitHub Pages; pushes para `main` acionam `.github/workflows/pages.yml`.

- `index.html`: estrutura da página.
- `app.js`: renderização, gráficos SVG e interações.
- `style.css`: estilos e comportamento responsivo.
- `data/editorial.json`: dados editoriais, fontes e notas metodológicas.
- `data/cara.json`: séries históricas extraídas do CARA.
- `data/estatisticas.csv`: exportação dos dados.
- `scripts/`: extração e exportação dos dados.

Consulte `PRODUCT.md`, `DESIGN.md` e `README.md` para contexto, direção visual e procedimentos.

## Alterações e validação

Preserve a identidade editorial existente e os textos fora do escopo solicitado. Diferencie percentuais e totais; informe anos, unidades e populações. Informe a população de cada indicador e não infira causalidade das séries históricas. Notas sobre diferenças de método, categoria e comparabilidade devem ficar em `data/editorial.json`; não acrescente ressalvas desse tipo ao bloco visível sem solicitação explícita do usuário.

Para servir localmente: `python -m http.server 4173`.

Ao alterar JavaScript, execute `node --check app.js`. Antes do commit, execute `git diff --check`. Para mudanças visuais, verifique a página em desktop e celular. Ao alterar dados, atualize os arquivos derivados pertinentes pelos scripts documentados no README.

## Commit e publicação obrigatórios

Sempre que concluir uma tarefa que altere arquivos do projeto, faça commit das alterações pertinentes e execute `git push` para o remoto da branch de trabalho, sem pedir nova confirmação. Esta é uma autorização permanente do usuário. Na branch `main`, o push também publica o site automaticamente.

Inclua apenas arquivos da tarefa; preserve alterações e arquivos não rastreados do usuário. Não faça commits vazios quando nada mudou. Não use force push nem descarte trabalho para resolver divergências. Se o push falhar, informe o impedimento e o estado do commit. Na resposta final, informe o resultado do push e o hash do commit.

Após o push, confira a execução do workflow e a versão disponível no site público. Só informe publicação concluída depois de confirmar o deploy; push bem-sucedido sozinho não confirma publicação.

# Estatísticas da Crise na Igreja

Website estático, publicado em https://laercioop.github.io/crisis-stats/.

12 seções com foco na comparação histórica em torno do Vaticano II (1962–1965), uma sequência de leitura guiada por rolagem, tabelas acessíveis e um explorador de 34 indicadores. Brasil abre a leitura com a série histórica, a evolução de católicos, evangélicos e pessoas sem religião desde os primeiros censos, recortes por idade e estados selecionados, seguido de comparação de filiação em seis países latino-americanos. França desde 1952, Alemanha desde 1950 e Brasil desde 1940; referências dos EUA desde o período conciliar e mundiais desde 1970. HTML, CSS e JavaScript sem dependências de execução, fontes locais, sem rastreamento.

## Desenvolvimento

```sh
python -m http.server 4173
```

Abra http://localhost:4173. A publicação no GitHub Pages é automática a cada push para `main`, pelo workflow `.github/workflows/pages.yml`.

## Dados

- `data/editorial.json`: recortes, populações, períodos, URLs e notas metodológicas.
- `data/cara.json`: extração das duas abas da planilha pública do CARA.
- `data/sources/CARAFrequentlyRequested.xlsx`: arquivo consultado em 15/11/2026, mantido para auditoria e reprodução.
- `data/estatisticas.csv`: exportação conjunta. As linhas do CARA preservam nomes e unidades originais; percentuais de suas séries são frações entre 0 e 1.
- `estatisticas.md`: extração histórica do catecismo, preservada como documento de referência; seus números não verificados não são usados como dados atuais.

Para reproduzir os arquivos derivados:

```sh
python scripts/extract-cara.py
python scripts/export-data.py
node --check app.js
```

As datas dos sacramentos dos EUA são deslocadas em um ano: a coluna do diretório registra celebrações do ano anterior. Valores mundiais e autodeclarações censitárias não usam a mesma definição de católico. As notas completas ficam junto às fontes no site.

O período conciliar aparece como faixa cronológica nos gráficos que o abrangem. A comparação é descritiva: não isola causas. O ano inicial de cada série é explícito. Notas metodológicas completas ficam em `data/editorial.json`, preservando a leitura visual da página. O gráfico histórico brasileiro une a série FGV/IBGE de 1940–2000 ao Censo 2010 (64,6%, todas as idades) e ao Censo 2022 (56,7%, 10 anos ou mais), com a mudança de universo explícita. O gráfico de filiação religiosa apresenta católicos desde 1872, evangélicos desde 1890 e pessoas sem religião desde 1940, até 2022. Usa todas as idades até 2010 e pessoas de 10 anos ou mais em 2022, com a diferença de universo explícita. Categorias ausentes não são preenchidas com zero. A tabela acessível e a exportação CSV incluem a série.

O bloco francês inclui também o IFOP/OFC de fevereiro de 2025: 5% dos franceses de 18 anos ou mais declaram missa todos os domingos ou mais (relatório, p. 13). Esse recorte aparece separado da série 1952–2006, com categoria e método distintos; não prolonga as curvas históricas nem fundamenta uma variação direta entre 2006 e 2025.

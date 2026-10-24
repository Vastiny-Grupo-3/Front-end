# Vastiny — plano de etapas

Roteiro de desenvolvimento, uma etapa por vez. Ao concluir uma etapa, marque-a aqui como concluída **no mesmo commit** da etapa.

Para pedir uma etapa ao Claude Code, basta escrever: `Faça a Etapa N de docs/etapas.md`.

## Progresso

| Etapa | Descrição | Situação | Commit |
| --- | --- | --- | --- |
| 1 | Arquivo CLAUDE.md | Concluída | `docs: especificação, wireframes e CLAUDE.md` |
| 2 | Leitura e plano | Concluída no Replit (sem commit) | — |
| 3 | Tokens e estilos globais | Concluída | `feat: tokens de design e estilos globais` |
| 4 | Componentes base | Concluída | `feat: componentes base` |
| 5 | Estrutura da aplicação, menu e rotas | Concluída | `feat: estrutura da aplicação, menu lateral e rotas` |
| 6 | Dados mockados e contextos | Concluída | `feat: dados mockados e contextos de carrinho e estoque` |
| 7 | Login (TL18) | Concluída | `feat: tela de login` |
| 8 | Catálogo e filtros (TL01 e TL17) | Concluída | `feat: catálogo e modal de filtros` |
| 9 | Carrinho (TL02, TL03 e TL19) | Concluída | `feat: carrinho, modal do carrinho e compra finalizada` |
| 10 | Clientes (TL04 e TL05) | Concluída | `feat: clientes e modais de cliente` |
| 11 | Histórico (TL06 a TL11) | Concluída | `feat: histórico com seis abas` |
| 12 | Dashboard (TL12) | Concluída | `feat: dashboard` |
| 13 | Entrada e Saída (TL13 e TL14) | Concluída | `feat: entrada e saída de estoque` |
| 14 | Configurações (TL15, TL16 e TL20) | Concluída | `feat: configurações, cadastro de conta e categorias` |
| 15 | Revisão de acessibilidade | Concluída | `fix: ajustes de acessibilidade` |
| 16 | Revisão visual contra os wireframes | Concluída | `fix: alinhamento com wireframes e especificação` |
| 17 | Entrega | Concluída | `docs: README e build final` |
| 18 | Filtros por quantidade em estoque (mínimo e máximo) | Concluída | `feat: filtros por quantidade em estoque` |
| 19 | Dashboard de Vendas (lucro, Top 10, layout em telas médias, selecionar todas) | Concluída | `feat: dashboard de vendas` |
| 20 | Faixas de estoque por categoria e por produto | Concluída | `feat: faixas de estoque por categoria e por produto` |
| 21 | Dashboard de Estoque (rosca, filtros e faixa) | Concluída | `feat: dashboard de estoque` |
| 22 | Modelagem de dados (MySQL) | Concluída | `docs: modelagem de dados` |
| 23 | Revisão da modelagem de dados | Concluída | `docs: revisão da modelagem de dados` |

## Observações

- `lucide-react` (Etapa 4) e `react-router-dom` (Etapa 5) já estão instalados.
- Login (Etapa 7): `entrar` no AuthContext é assíncrona e devolve `{ ok, motivo }`. Desde a Etapa 14 o login confere as contas de `src/data/contas.js` (a conta de teste está nesse arquivo); o erro de conexão só aparece quando o back-end existir.
- `PasswordField` (mostrar/ocultar senha) fica disponível para as senhas da Etapa 14.
- Dados (Etapa 6): ficam em memória; recarregar a página volta aos mocks de `src/data/`. As regras estão em funções puras em `src/utils/carrinho.js` e `src/utils/estoque.js`; os contextos só guardam o estado.
- Produto guarda `categoriaId` (e não o nome) para que renomear uma categoria atualize os produtos; os registros do histórico guardam o nome da época.
- O `estado` do estoque é calculado no front (Etapa 20) por `comEstoqueCalculado` em `src/utils/estoque.js`: o `StockContext` entrega os produtos com `faixa`, `faixaOrigem` e `estado`, que se atualizam sozinhos após entradas, saídas, vendas e edição de faixas. Os mocks não têm mais `estado` nem `estoqueMinimo`; têm `faixaPropria` (null = usa a faixa da categoria).
- Lucro da venda = soma de (quantidade × lucro por unidade) − descontos dos itens.
- Carrinho (Etapa 9): o modal TL02 fica no AppShell e abre pelo ícone do carrinho de qualquer `PageHeader` com `carrinho` e por "Alterar carrinho". A pesquisa do cabeçalho da TL03 filtra os itens do carrinho pelo nome. O título do TL02 é só para leitores de tela (o wireframe não mostra título).
- Modal: a prop `focoAoFechar` define para onde vai o foco quando o botão que abriu o modal deixa de existir (ex.: linha excluída em Clientes).
- Histórico (Etapa 11): as seis abas são configuradas em `src/pages/Historico/abasHistorico.js` e usam um único `HistoryTable`. Os painéis de detalhes não têm título visível (como nos wireframes); o título existe só para leitores de tela. Ids de transação e de cliente com 3 dígitos ("001") e ids de produto e de cadastro com 4 ("0001"), como nos wireframes.
- Dashboard (Etapa 12): cálculos em `src/utils/dashboard.js`. Período padrão: da primeira venda até hoje. "Produtos ativos" = produtos cadastrados (nas categorias filtradas); a rosca conta produtos por estado. "Produtos mais Vendidos" mostrava os 6 primeiros, como no wireframe (desde a Etapa 19 é o Top 10). O filtro de categoria vale para indicadores e painéis de vendas; os de estoque mostram todos os produtos.
- Datas do Filtro Temporal usam o campo de data nativo do navegador (com calendário próprio); o calendário mensal sempre aberto do wireframe não foi reproduzido.
- Paleta dos gráficos: o validador de cores aponta `cor-grafico-4` (#C25100) e `cor-grafico-5` (#DE350B) como difíceis de distinguir (daltonismo protan e até visão normal). O gráfico compensa com o nome da categoria e o valor em cada barra, mas vale a equipe revisar essas cores.
- Entrada e Saída (Etapa 13): `ProductBrowser` (filtros + etiquetas + grade) é usado por Catálogo, Entrada e Saída; `StockMovementModal` faz "Adicionar Quantidade" e "Diminuir Quantidade". Os modais "Novo Produto" e "Editar Produto" têm "Cancelar" à esquerda (anatomia padrão do Modal), embora o wireframe só mostre o botão principal. A imagem do produto fica em memória como data URL até existir back-end.
- Stepper: nos limites os botões usam `aria-disabled` (e não `disabled`) para não perder o foco do teclado.
- Configurações (Etapa 14): regras de conta em `src/utils/contas.js`. Contas e sessão ficam no sessionStorage (somem ao fechar a aba). Excluir conta remove só a conta e o acesso dela; textos da TL15/TL20 ajustados (ver CLAUDE.md). "Informe o nome de usuário." foi criado porque a especificação não define mensagem para o nome vazio.
- Acessibilidade (Etapa 15): auditoria automática (contraste, rótulos, nomes, títulos, tabelas, ids, alvos de 44 px e reflow em 320 px) em 13 telas e 21 modais, mais revisão manual de teclado e foco. "Excluir do Carrinho" e a lixeira não pedem confirmação porque a ação é reversível (o produto pode ser adicionado de novo).
- Entrega (Etapa 17): página temporária `/componentes` removida; `vite.config.js` silencia só o aviso `"use client"` vindo de `react-router` e `lucide-react` em `node_modules` (diretiva de Server Components, sem efeito aqui). O build sai sem avisos. README com instalação, estrutura, tokens, rotas e o que falta ligar ao back-end.
- Os filtros (`src/utils/filtros.js`, `FilterModal`, `FilterChips`) já aceitam as opções da Entrada e da Saída (`mostrarReposicao`: "Precisam de reposição" = estado Ruim ou Crítico).
- `status` do StockContext é sempre "pronto" com os mocks; os estados carregando e erro das telas aparecem quando o back-end alimentar esse valor.


## Revisão 3 (Etapas 18 a 22)

Pedidos novos depois que o time (Leonardo Tomas) reformulou o visual (versões 3 e 4). Decisões confirmadas:

- **Estado calculado pelas faixas:** o estado de cada produto (Crítico, Ruim, Médio, Bom) sai da quantidade e da faixa efetiva (a do produto, se ele tiver faixa própria; senão a da categoria). No banco não é coluna, é consulta. Isso substitui a regra antiga "o estado vem pronto do banco".
- **Semântica das faixas:** "Estoque mínimo para Bom = 8" quer dizer quantidade ≥ 8 é Bom; ≥ Médio é Médio; ≥ Ruim é Ruim; abaixo disso é Crítico. A ordem `bom ≥ médio ≥ ruim ≥ crítico ≥ 0` é validada.
- **Coluna "Mínimo" do Dashboard** vira **"Faixa de estoque"** (limites e se é da categoria ou própria); o indicador "Abaixo do mínimo" vira **"Precisam de reposição"** (Ruim + Crítico).
- **Faixa própria por produto** é feita no modal Novo Produto / Editar Produto (Etapa 20). Na Etapa 20 também já entraram a coluna "Faixa de estoque" e o indicador "Precisam de reposição" no Dashboard. Divergências da especificação (TL12, TL20, decisão 16, lacuna 2): o estado deixou de ser dado pronto e o "Estoque abaixo do mínimo" virou "Precisam de reposição".
- **Banco de dados:** MySQL.
- **Dashboard de Vendas (Etapa 19):** novo indicador "Lucro no período" (soma do lucro dos itens vendidos, respeitando o filtro de categoria); a tabela passa a ser o "Top 10 Produtos mais Vendidos" (`MAXIMO_PRODUTOS = 10`, com rolagem interna); `CheckboxGroup` com "Selecionar todas as opções" (marcada, desmarcada ou indeterminada) no filtro de categoria. Em telas de até 1023 px os painéis se empilham e a página volta a rolar (antes a tabela ficava por cima do gráfico: o grid tinha uma única linha de altura fixa e a casca estava presa em `100vh`); em telas maiores cada painel tem altura mínima de `--altura-minima-painel`.
- **Dashboard de Estoque (Etapa 21):** o centro da rosca ("Total Produto") é um botão (`aoEscolherTodos`, `aria-pressed` quando todos os estados estão ativos) que volta a mostrar todos os estados na tabela; o modal "Filtrar estoque" mostra Estado primeiro e Categoria depois, ambos com "Selecionar todas as opções" (`CheckboxGroup`). A coluna "Faixa de estoque" e o indicador "Precisam de reposição" já vieram na Etapa 20.
- **Modelagem de dados (Etapa 22):** `docs/modelagem-dados.md` (diagrama, tabelas, integridade, mapeamento front → banco, consultas do Dashboard e pontos em aberto) e `docs/banco/schema.sql` (MySQL 8.0.16+). O script não foi executado em um MySQL neste ambiente; rodar em um servidor antes de adotar.
- **Revisão da modelagem (Etapa 23):** `categoria` ganhou `data_cadastro` e `data_alteracao` (só no banco); `data_cadastro` do cliente saiu de `cliente_versao` e ficou em `cliente`; o carrinho passou a ser uma `venda` com `status` ABERTA/FINALIZADA, com preço e lucro unitário gravados ao entrar no carrinho; os totais de venda e de item deixaram de ser colunas e saem das views `vw_venda_resumo` e `vw_item_venda`; o Mermaid agora lista todas as FKs e as quatro faixas do produto.
- **Filtros de quantidade (Etapa 18):** os campos "Quantidade mínima" e "Quantidade máxima" ficam na seção Estoque do modal de filtros (Catálogo, Entrada e Saída) e não colidem com o antigo `estoqueMinimo` do produto.

## Resultado da revisão visual (Etapa 16)

Textos: todos os textos entre aspas das seções "Copy" da especificação foram procurados automaticamente no código. Só o texto da TL15 sobre excluir conta não aparece, por decisão da equipe (ver CLAUDE.md).

Corrigido nesta etapa:

| Tela | Divergência | Correção |
| --- | --- | --- |
| TL04 | Colunas fora da proporção da especificação (Nome 5, Telefone 3, Qtd. Compras 2, Ações 2) | Larguras de coluna aplicadas (prop `largura` na DataTable) |
| TL12 | Centro da rosca com "Total Produto" sem os dois-pontos da copy "Total Produto: [quantidade]" | Texto corrigido |
| TL17 (e demais modais) | Em `bp-base` o rodapé rolava junto com o conteúdo; a especificação pede tela cheia com rodapé fixo | Rodapé fixo no fim da tela em `bp-base` |

Mantido de propósito (diferença em relação ao wireframe ou à especificação):

| Tela | Diferença | Motivo |
| --- | --- | --- |
| TL02 | "Trocar Carrinho" é uma lista suspensa (o wireframe mostra um botão) | Mostra o carrinho atual e permite trocar sem um passo extra; mesmo rótulo |
| TL02, TL06–TL11 | Títulos dos modais só para leitores de tela | Os wireframes não mostram título |
| TL02, TL17 | "X" e Esc voltam à tela que abriu o modal (a especificação diz TL01) | Regra confirmada no CLAUDE.md |
| TL04 | Título "Todos os clientes" (wireframe: "Todos Clientes") | Especificação corrigiu (decisão 11) |
| TL12 | Datas com o campo de data nativo, sem o calendário mensal sempre aberto | Componente nativo, acessível e com calendário próprio |
| TL13 | "Cancelar" nos modais Novo Produto e Editar Produto | Anatomia padrão do Modal; sem ele não há como fechar com o mouse |
| TL15, TL20 | Textos de excluir conta sem "e seus dados" | Decisão da equipe: só a conta e o acesso são removidos |
| TL16 | Título "Cadastrar nova conta" (wireframe: "Dados da nova conta") e botão "X" | Especificação (decisão 11 e layout da TL16) |
| TL05, TL13, TL15, TL16 | Estado "salvando" (botão em carregando) não aparece | Com os mocks as operações são instantâneas; o Button já tem o estado `carregando` para o back-end |

---

## Etapa 1 — Arquivo CLAUDE.md

Criar `CLAUDE.md` na raiz com as regras fixas do projeto (o Claude Code lê esse arquivo em toda sessão).

## Etapa 2 — Leitura e plano

Leia o arquivo CLAUDE.md e o arquivo docs/vastiny-design-spec-v2.md por inteiro. Depois olhe todos os wireframes em docs/wireframes/.

Não escreva código ainda. Entregue:

1. Um resumo de 10 linhas do que será construído.
2. A estrutura de pastas que você pretende criar.
3. A lista de rotas (uma por tela, TL01 a TL15 e TL18) e quais telas são modais.
4. Dúvidas ou inconsistências encontradas na especificação.

Sem commit.

## Etapa 3 — Tokens e estilos globais

Crie a base de estilos do projeto seguindo a seção "Design Tokens" da especificação:

- `src/styles/tokens.css`: todas as variáveis CSS em `:root` (cores, incluindo cor-primaria, cor-estado-medio, cor-aba-* e cor-grafico-*; tipografia texto-h1 a texto-link; espaçamento; raio; sombras; breakpoints como comentário).
- `src/styles/global.css`: reset leve, fonte Inter com fallback system-ui, cor de fundo cor-fundo, cor de texto cor-texto, estilo de foco visível usando sombra-foco, classe utilitária .sr-only e link "Pular para o conteúdo principal".
- Importe os dois arquivos em `src/main.jsx`.
- Remova o CSS e o conteúdo de exemplo do template do Vite.

Ao terminar, rode o projeto e confirme que compilou sem erros.

## Etapa 4 — Componentes base

Crie os componentes reutilizáveis descritos na seção "Componentes" da especificação, cada um em `src/components/NomeDoComponente/` com seu arquivo .jsx e .css, usando apenas variáveis CSS dos tokens:

1. Button (variantes primário, secundário, destrutivo, ícone; estados hover, foco, ativo, desabilitado, carregando)
2. TextField, TextArea e SearchField (com label, texto de ajuda e mensagem de erro ligada por aria-describedby)
3. MoneyPercentField (campo de desconto duplo R$ e %, vinculados)
4. Stepper (quantidade com − e +, e variante -1/valor/+1)
5. Modal (foco preso, Esc fecha, aria-modal, retorno do foco; tamanhos pequeno, médio e grande)
6. ConfirmModal (usa o Modal)
7. Toast (sucesso, erro, informação)
8. DataTable (variantes de tabela, linhas viram cartões em tela estreita) e EmptyState
9. StatusBadge (Crítico, Ruim, Médio, Bom)
10. StatCard (indicador)
11. Tabs (abas do Histórico com cor própria por aba)
12. ProductCard (variantes Catálogo, Entrada e Saída)

Crie também uma página temporária /componentes que mostre todos os componentes e estados para conferência visual. Use ícones do lucide-react conforme a tabela "Ícones" da especificação.

Confira a página /componentes no navegador.

## Etapa 5 — Estrutura da aplicação, menu e rotas

- react-router-dom com as rotas: /login (TL18), / (Catálogo TL01), /carrinho (TL03), /clientes (TL04), /historico (TL06 com abas TL07 a TL11 como sub-rotas), /dashboard (TL12), /entrada (TL13), /saida (TL14), /configuracoes (TL15).
- Componente AppShell com a Navegação lateral exatamente como na especificação (saudação "Bem-vindo!" + nome do usuário, Catálogo, Clientes, Histórico, grupo "Operações" com Entrada e Saída, Dashboard, Configurações, e Sair no rodapé), com item ativo usando aria-current="page".
- Componente PageHeader (título, pesquisa, ícone do carrinho, ação principal).
- Autenticação simulada em `src/context/AuthContext.jsx`: login com qualquer e-mail e senha preenchidos; "Sair" volta para /login; rotas protegidas redirecionam para /login.
- Páginas vazias com apenas o título de cada tela por enquanto.

Use os tokens e componentes já criados.

## Etapa 6 — Dados mockados e contextos

- `src/data/`: produtos (id, código, nome, categoria, imagem, valorCompra, valorVenda, quantidade, estoqueMinimo, estado em "Crítico" | "Ruim" | "Médio" | "Bom"), categorias, clientes, vendas (com itens registrados no momento da venda: preço e lucro na época), entradas, saídas, cadastros de produtos e cadastros de clientes. Dados realistas de auto elétrica (buzinas, chicotes, soquetes, acessórios), em quantidade suficiente para preencher as telas (pelo menos 12 produtos, 6 clientes, 10 vendas).
- `src/context/CartContext.jsx`: vários carrinhos, carrinho atual, adicionar e remover produto, alterar quantidade (sem passar do estoque), desconto por item em R$ e % vinculados (sem valor negativo), subtotal, descontos e total final, criar, trocar e excluir carrinho, finalizar compra (registra venda com cliente opcional, atualiza estoque e cria o registro no histórico).
- `src/context/StockContext.jsx`: produtos, categorias e clientes com ações de cadastrar, editar, excluir, registrar entrada e registrar saída (cada uma gerando o registro correspondente com quantidade antes e depois). Lucro = valor de venda − valor de compra.

Não criar telas agora. Escrever funções puras e simples de testar.

## Etapa 7 — Login (TL18)

Implemente a tela TL18 Login conforme a seção "TL18 — Login" da especificação: cartão central, campos E-mail e Senha (com mostrar/ocultar senha), botão "Entrar", mensagens de erro e validações com os textos exatos da especificação. Ao entrar, ir para o Catálogo. Conecte ao AuthContext.

## Etapa 8 — Catálogo e filtros (TL01 e TL17)

Seguir as seções correspondentes da especificação e o wireframe `docs/wireframes/wireframe-TL01-catalogo.png`:

- Cabeçalho com título, pesquisa por nome (placeholder "Pesquisar produtos") e ícone do carrinho (por enquanto, apenas um botão).
- Faixa de resumo do carrinho (Carrinho Atual, Valor Total, Quantidade de Produtos, link "Alterar carrinho") ligada ao CartContext.
- Botão "Filtros" que abre o modal TL17 (Categoria, Preço, Estoque, Carrinho, Ordenar por) e etiquetas de filtros ativos.
- Grade de ProductCard (3 por linha) com botão "Adicionar ao Carrinho" / "Excluir do Carrinho"; desabilitar quando o estoque for 0.
- Estados: carregando (esqueleto), vazio, erro.

## Etapa 9 — Carrinho (TL02, TL03 e TL19)

Seguir a especificação e os wireframes `wireframe-TL02-modal_carrinho.png` e `wireframe-TL03-carrinho.png`:

- O ícone do carrinho (em qualquer tela que o tenha) e o link "Alterar carrinho" abrem sempre o modal TL02, que tem o botão "Ir para Carrinho" para abrir a tela inteira.
- Tabela de itens com Stepper de quantidade (limitado ao estoque), campo de desconto duplo R$ e %, total do item e lixeira.
- Resumo: Subtotal, Descontos (somente leitura, em R$ e %) e Total Final, respeitando as regras da especificação.
- Seletor "Trocar carrinho" e botão "+" para criar carrinho.
- Na TL03: lista suspensa "Cliente" (padrão "Sem Cliente"), botões "Excluir Carrinho" (com modal de confirmação), "Continuar comprando" e "Finalizar Compra", que abre o modal TL19.
- Ligar o ícone do carrinho também ao Catálogo (TL01).

## Etapa 10 — Clientes (TL04 e TL05)

Seguir a especificação e os wireframes `wireframe-TL04-cliente.png` e `wireframe-TL05-modais_cliente.png`:

- Lista com Nome, Telefone, Qtd. Compras e ações Detalhes (ícone olho), Editar (lápis) e Excluir (lixeira), todas com nome acessível.
- Botão "Cadastrar Novo Cliente".
- Quatro modais: cadastrar, editar, detalhes e confirmação de exclusão, com os textos e validações da especificação (Nome e Telefone obrigatórios).
- Estados: carregando, vazio, erro.

## Etapa 11 — Histórico (TL06 a TL11)

Seguir a especificação e os wireframes `wireframe-TL06` a `wireframe-TL11`:

- PageHeader com pesquisa que filtra a aba ativa por nome, id ou transação, e abas com a cor própria de cada uma.
- Tabelas com as colunas exatas de cada aba e o botão "…" que abre o painel de detalhes (com "X").
- Vendas: mostrar "Sem Cliente" quando for o caso; detalhes com produtos, preço e lucro na época.
- Clientes: totais por cliente e vendas detalhadas.
- Entradas e Saídas: quantidades antes e depois; Saídas com justificativa nos detalhes.
- Cadastro de Produtos e Cadastro de Clientes.
- Estados: carregando, vazio, erro.

Reaproveitar um único componente de tabela de histórico para as seis abas.

## Etapa 12 — Dashboard (TL12)

Seguir a especificação e o wireframe `wireframe-TL12-dashboard.png`:

- Indicadores: Vendas no período, Faturamento do período, Preço médio das vendas, Produtos ativos.
- Modal "Filtro Temporal" com Data Início e Data Fim (validar que a inicial não seja posterior à final) e texto "[n] dia(s) filtrado(s)".
- Filtro por categoria (funil) com caixas de seleção, aplicado a indicadores, gráfico e tabela.
- Gráfico de barras "Categorias mais vendidas" e gráfico de rosca "Níveis de Estoque Atual", feitos em SVG próprio (sem biblioteca), com valores visíveis, padrão/forma além da cor e tabela equivalente acessível.
- Tabela "Produtos mais Vendidos" e tabela "Estoque" com ordenação por coluna (aria-sort) e StatusBadge.
- Estados: carregando, sem dados no período, filtros aplicados, erro.

## Etapa 13 — Entrada e Saída (TL13 e TL14)

Seguir a especificação e os wireframes `wireframe-TL13-entrada_e_modais.png` e `wireframe-TL14-saida_e_modal.png`:

- Entrada: pesquisa, botão "Filtros" (modal TL17), botão "Cadastrar Novo Produto", cards com "Editar" e "Adicionar Qtd.". Modais: Novo Produto (Imagem, Código, Nome, Categoria, Valor de Compra, Valor de Venda, Quantidade, Lucro calculado), Adicionar Quantidade (Quantidade Atual, Quantidade Final, controle -1/valor/+1) e Editar Produto.
- Saída: pesquisa, botão "Filtros", cards com "Dar Baixa" e modal Diminuir Quantidade com Justificativa obrigatória, sem permitir quantidade acima do estoque.
- Cada operação deve gerar o registro correspondente no Histórico e atualizar os cards.

## Etapa 14 — Configurações (TL15, TL16 e TL20)

Seguir a especificação e os arquivos `wireframe-TL15-configuracoes.svg` e `wireframe-TL16-modal_cadastroConta.png`:

- Cartão "Dados da conta" com Nome de usuário, E-mail da conta, Senha atual, Nova senha, "Salvar alterações" e o botão "Cadastrar nova conta" no cabeçalho do cartão.
- Cartão "Categorias de produtos" com tabela, "+ Nova categoria", editar e excluir (bloquear exclusão quando houver produtos associados, com o aviso da especificação).
- Cartão "Ações da conta" com "Sair da conta" e "Excluir conta" (modal com confirmação por senha).
- Modal TL16 com os campos, validações e textos exatos; ao cadastrar, fechar o modal e mostrar o toast "Conta cadastrada com sucesso.".

## Etapa 15 — Revisão de acessibilidade

Auditoria do projeto inteiro usando a seção "Acessibilidade" da especificação como checklist. Verificar, tela por tela: contraste dos pares de cores permitidos, ordem de foco, foco visível, rótulos de todos os campos, nomes acessíveis dos botões de ícone, hierarquia de títulos (um h1 por tela), modais (foco preso, Esc, retorno do foco), tabelas (th scope, caption, aria-sort), alternativas textuais dos gráficos, alvos de 44×44 px e navegação completa só com teclado.

Listar o que está em desacordo, corrigir tudo e entregar um resumo do que mudou.

## Etapa 16 — Revisão visual contra os wireframes

Comparar cada tela implementada com seu wireframe em `docs/wireframes/` e com a seção da tela na especificação. Para cada uma das telas TL01 a TL20, listar diferenças de layout, textos (devem ser exatamente os da especificação), estados faltando (carregando, vazio, erro) e fluxos de navegação que não levam ao destino correto. Corrigir o que for divergência e mostrar a lista final do que mudou.

## Etapa 17 — Entrega

Criar um README.md na raiz com: descrição do projeto, como instalar e rodar (npm install, npm run dev, npm run build), estrutura de pastas, como trocar os tokens de design, lista de telas e rotas, e o que ainda está mockado e precisa ser ligado ao back-end. Depois rodar `npm run build` e corrigir qualquer erro ou aviso.

Ao final: `git push`.

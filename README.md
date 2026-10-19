# Vastiny — Front-end

Sistema web de controle de estoque e vendas para auto elétricas. Reúne catálogo e carrinho (vendas), clientes, histórico com seis abas, dashboard, entrada e saída de estoque, configurações e cadastro de contas.

Todas as contas têm as mesmas permissões e compartilham os mesmos dados da empresa. Excluir uma conta remove apenas a conta e o acesso dela; estoque, clientes e vendas continuam.

- **Especificação de design** (fonte da verdade): [`docs/vastiny-design-spec-v2.md`](docs/vastiny-design-spec-v2.md)
- **Wireframes:** [`docs/wireframes/`](docs/wireframes/)
- **Plano de etapas e decisões tomadas durante o desenvolvimento:** [`docs/etapas.md`](docs/etapas.md)
- **Regras do projeto** (lidas pelo Claude Code em toda sessão): [`CLAUDE.md`](CLAUDE.md)

## Tecnologias

- React 19 com JavaScript (sem TypeScript) e CSS puro, um arquivo `.css` por componente
- [Vite](https://vite.dev/) para desenvolvimento e build
- `react-router-dom` (rotas) e `lucide-react` (ícones) — as únicas dependências além do React
- Gráficos do Dashboard em SVG próprio, sem biblioteca
- Acessibilidade WCAG 2.1 AA

## Como instalar e rodar

Pré-requisito: [Node.js](https://nodejs.org/) 20.19 ou superior (ou 22.12+).

```bash
npm install
```

```bash
npm run dev
```

Abre o servidor de desenvolvimento em http://localhost:5173.

```bash
npm run build
```

Gera a versão de produção em `dist/`. Para conferir essa versão localmente:

```bash
npm run preview
```

### Como entrar

O login confere as contas mockadas de [`src/data/contas.js`](src/data/contas.js). A conta de teste (e-mail e senha) está descrita no comentário do próprio arquivo. Novas contas podem ser cadastradas em **Configurações → Cadastrar nova conta**.

## Estrutura de pastas

```
src/
├── components/   Componentes reutilizáveis (um por pasta, com .jsx e .css)
├── context/      Estado global: AuthContext, StockContext, CartContext, ToastContext
├── data/         Dados mockados (produtos, categorias, clientes, vendas, movimentações, cadastros, contas)
├── pages/        Uma pasta por tela, com os modais específicos dela
├── styles/       tokens.css (design tokens) e global.css (reset, foco, utilitários)
├── utils/        Regras de negócio em funções puras (carrinho, estoque, filtros, dashboard, contas, formatadores)
├── App.jsx       Rotas
└── main.jsx      Providers e estilos globais
docs/             Especificação de design, wireframes e plano de etapas
```

As regras (totais do carrinho, lucro, validações, filtros, indicadores do Dashboard) ficam em `src/utils/` como funções puras. Os contextos só guardam o estado e chamam essas funções, o que facilita ligar o back-end depois sem mexer nas telas.

## Como trocar os tokens de design

Todos os valores visuais estão em [`src/styles/tokens.css`](src/styles/tokens.css), como variáveis CSS em `:root`. Os componentes usam apenas essas variáveis, então mudar um token muda o sistema inteiro.

| Grupo | Exemplos | Observação |
| --- | --- | --- |
| Cores | `--cor-primaria`, `--cor-texto`, `--cor-erro`, `--cor-aba-vendas`, `--cor-grafico-1` | Mantenha os contrastes da seção "Design Tokens" da especificação |
| Tipografia | `--fonte-familia`, `--texto-h1`, `--texto-corpo` | Atalho `font` (peso, tamanho/altura de linha, família) |
| Espaçamento | `--espaco-4` … `--espaco-48` | Escala de 4 px |
| Raio | `--raio-8`, `--raio-12`, `--raio-16`, `--raio-total` | |
| Sombras e foco | `--sombra-modal`, `--sombra-foco` | O foco visível usa `--sombra-foco` em todo controle |
| Tamanhos | `--alvo-toque` (44 px), `--largura-menu`, `--modal-pequeno` … `--modal-grande` | |

Exemplo: para trocar a cor principal, altere só `--cor-primaria` (e `--cor-primaria-hover`). Os breakpoints (768, 1024 e 1440 px) estão como comentário no arquivo, porque variáveis CSS não funcionam dentro de `@media`.

Ao trocar cores, confira o contraste (texto normal ≥ 4,5:1; componentes e texto grande ≥ 3:1). O par `--cor-grafico-4` / `--cor-grafico-5` é difícil de distinguir para pessoas com daltonismo; veja a observação em [`docs/etapas.md`](docs/etapas.md).

## Telas e rotas

| Tela | Rota | Tipo |
| --- | --- | --- |
| TL18 Login | `/login` | Página pública |
| TL01 Catálogo | `/` | Página |
| TL02 Modal do Carrinho | — | Modal (ícone do carrinho ou "Alterar carrinho") |
| TL03 Carrinho | `/carrinho` | Página |
| TL19 Compra Finalizada | — | Modal (TL03, "Finalizar Compra") |
| TL04 Clientes | `/clientes` | Página |
| TL05 Modais de Cliente | — | Modais (cadastrar, editar, detalhes, excluir) |
| TL06 Histórico de Vendas | `/historico` | Página (aba) |
| TL07 Histórico de Clientes | `/historico/clientes` | Página (aba) |
| TL08 Histórico de Entradas | `/historico/entrada` | Página (aba) |
| TL09 Histórico de Saídas | `/historico/saida` | Página (aba) |
| TL10 Histórico de Cadastro de Produtos | `/historico/cadastro-produtos` | Página (aba) |
| TL11 Histórico de Cadastro de Clientes | `/historico/cadastro-clientes` | Página (aba) |
| TL12 Dashboard | `/dashboard` | Página (com modais "Filtro Temporal" e "Categoria") |
| TL13 Entrada | `/entrada` | Página (modais Novo Produto, Editar Produto, Adicionar Quantidade) |
| TL14 Saída | `/saida` | Página (modal Diminuir Quantidade) |
| TL15 Configurações | `/configuracoes` | Página |
| TL16 Cadastro de Conta | — | Modal (TL15, "Cadastrar nova conta") |
| TL17 Filtros | — | Modal (Catálogo, Entrada e Saída) |
| TL20 Categoria e Conta | — | Modais (TL15) |

Todas as rotas, exceto `/login`, exigem login. Endereços desconhecidos levam ao Catálogo.

## O que ainda está mockado (ligar ao back-end)

| O quê | Onde está hoje | O que o back-end precisa fazer |
| --- | --- | --- |
| Produtos, categorias, clientes, vendas, entradas, saídas e cadastros | `src/data/` em memória, via `StockContext` | Fornecer e gravar os dados; recarregar a página hoje volta aos mocks |
| Carrinhos abertos | Memória, via `CartContext` | Decidir se os carrinhos ficam no servidor |
| Contas e login | `src/data/contas.js` e `sessionStorage`, via `AuthContext` | Autenticar, guardar só o hash da senha e criar a sessão; `entrar` já é assíncrona e devolve `{ ok, motivo }` |
| Estado do estoque ("Crítico", "Ruim", "Médio", "Bom") | Campo `estado` fixo nos mocks | Calcular pelos critérios de cada categoria e enviar pronto; o front só exibe. Produtos novos ficam sem estado até lá |
| Carregando e erro das telas | `status` do `StockContext` (sempre `"pronto"`) e `recarregar` vazio | Alimentar `status` (`"carregando"`, `"pronto"`, `"erro"`) e implementar `recarregar` ("Tentar novamente") |
| Imagens dos produtos | Data URL em memória | Upload e armazenamento das imagens |
| Erro de conexão no login | Tratado na tela, nunca acontece com os mocks | Rejeitar a promessa de `entrar` em falha de rede |
| Regras de senha | `src/utils/contas.js` | Validar também no servidor ("requisitos de segurança definidos pelo sistema") |

## Licença

Veja [`LICENSE`](LICENSE).

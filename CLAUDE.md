# Vastiny — regras do projeto

Sistema web de controle de estoque e vendas para auto elétricas.

## Fonte da verdade

- Especificação de design: `docs/vastiny-design-spec-v2.md` (tokens, componentes, telas, fluxos, acessibilidade e decisões).
- Wireframes: `docs/wireframes/` (guia de layout; a especificação prevalece quando houver diferença).
- Plano de etapas e progresso: `docs/etapas.md`. Trabalhar uma etapa por vez e, ao concluir, marcá-la como concluída na tabela de progresso no mesmo commit da etapa.

## Escopo

- Este projeto cobre o sistema Vastiny; o site institucional é desenvolvido à parte.
- Todas as contas têm as mesmas permissões: podem acessar e executar as mesmas funcionalidades.
- Todas as contas compartilham os mesmos dados da empresa.
- Excluir uma conta remove apenas o acesso daquela conta. Os dados compartilhados de estoque, clientes e vendas são preservados.

## Stack

- React 19.2.7, JavaScript (sem TypeScript) e CSS puro.
- Dependências permitidas: `react-router-dom` e `lucide-react`. Não adicionar outras sem perguntar.
- Gráficos do Dashboard: SVG/CSS próprios, sem biblioteca.
- Chamadas à API com `fetch` nativo (sem axios ou outra biblioteca). O modo API liga com `VITE_API_URL`; sem ela o site usa os mocks. O token JWT fica no `sessionStorage` e vai em `Authorization: Bearer`.
- O back-end (repositório `Back-end`) é feito sem IA, por exigência da faculdade: não alterar esse repositório; o que ele precisa fica em `docs/contrato-api.md`.

## Comandos

- `npm run dev`: servidor de desenvolvimento (Vite).
- `npm run build`: build de produção. Rodar ao fim de cada etapa e corrigir erros antes do commit.

## Regras

- Todos os textos da interface em português do Brasil, exatamente como na especificação. Nunca usar lorem ipsum.
- Tokens da especificação viram variáveis CSS em `:root` (por exemplo, `--cor-primaria`, `--espaco-16`). Nunca usar valores soltos de cor, espaçamento ou raio nos componentes.
- Foco em desktop 1440×900, com adaptação responsiva básica.
- Acessibilidade WCAG 2.1 AA: HTML semântico, rótulo em todo campo, foco visível, navegação por teclado, alvos de toque de 44×44 px e modais com foco preso e fechamento por Esc.
- Dados: usar mocks em `src/data/` até existir backend. O `estado` do estoque é calculado (`comEstoqueCalculado`, em `src/utils/estoque.js`), nunca escrito nos dados: quantidade ≥ Bom é Bom; ≥ Médio é Médio; ≥ Ruim é Ruim; abaixo disso é Crítico. A faixa efetiva é a do produto (`faixaPropria`) ou, se for null, a da categoria (`criterios`).
- Estrutura: `src/styles/`, `src/components/`, `src/pages/`, `src/data/`, `src/context/`.
- Um commit por etapa, com mensagem em português no formato `feat: ...`.
- Em dúvida sobre a especificação, perguntar antes de inventar.

## Comportamento confirmado

- Os modais TL02 (Carrinho) e TL17 (Filtros) devem retornar à tela que os abriu quando forem fechados ou cancelados.
- Senhas: exigir preenchimento, mínimo de 8 caracteres e pelo menos uma letra e um número. A confirmação deve corresponder à senha. Não acrescentar outras regras de composição sem perguntar.
- Excluir conta remove a conta e, com ela, o acesso daquela conta; os dados da empresa ficam. Por isso os textos da TL15 ("Sair encerra sua sessão. Excluir conta remove seu acesso.") e da TL20 ("Tem certeza que deseja excluir sua conta? Você perderá o acesso. Esta ação não pode ser desfeita.") não dizem que os dados são removidos, diferente da especificação.
- O login confere as contas de `src/data/contas.js` (a conta de teste está nesse arquivo); qualquer e-mail ou senha fora delas mostra o erro de credenciais.
- As referências a RF01–RF39 não incluem todos os critérios completos. Usar as descrições de tela e regras presentes na especificação; não inventar comportamentos adicionais.

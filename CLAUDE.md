# Vastiny — regras do projeto

Sistema web de controle de estoque e vendas para auto elétricas.

## Fonte da verdade

- Especificação de design: `docs/vastiny-design-spec-v2.md` (tokens, componentes, telas, fluxos, acessibilidade e decisões).
- Wireframes: `docs/wireframes/` (guia de layout; a especificação prevalece quando houver diferença).

## Escopo

- Este projeto cobre o sistema Vastiny; o site institucional é desenvolvido à parte.
- Todas as contas têm as mesmas permissões: podem acessar e executar as mesmas funcionalidades.
- Todas as contas compartilham os mesmos dados da empresa.
- Excluir uma conta remove apenas o acesso daquela conta. Os dados compartilhados de estoque, clientes e vendas são preservados.

## Stack

- React 19.2.7, JavaScript (sem TypeScript) e CSS puro.
- Dependências permitidas: `react-router-dom` e `lucide-react`. Não adicionar outras sem perguntar.
- Gráficos do Dashboard: SVG/CSS próprios, sem biblioteca.

## Regras

- Todos os textos da interface em português do Brasil, exatamente como na especificação. Nunca usar lorem ipsum.
- Tokens da especificação viram variáveis CSS em `:root` (por exemplo, `--cor-primaria`, `--espaco-16`). Nunca usar valores soltos de cor, espaçamento ou raio nos componentes.
- Foco em desktop 1440×900, com adaptação responsiva básica.
- Acessibilidade WCAG 2.1 AA: HTML semântico, rótulo em todo campo, foco visível, navegação por teclado, alvos de toque de 44×44 px e modais com foco preso e fechamento por Esc.
- Dados: usar mocks em `src/data/` até existir backend. Critérios e estado do estoque vêm prontos nos dados (campo `estado`).
- Estrutura: `src/styles/`, `src/components/`, `src/pages/`, `src/data/`, `src/context/`.
- Um commit por etapa, com mensagem em português no formato `feat: ...`.
- Em dúvida sobre a especificação, perguntar antes de inventar.

## Comportamento confirmado

- Os modais TL02 (Carrinho) e TL17 (Filtros) devem retornar à tela que os abriu quando forem fechados ou cancelados.
- Senhas: exigir preenchimento, mínimo de 8 caracteres e pelo menos uma letra e um número. A confirmação deve corresponder à senha. Não acrescentar outras regras de composição sem perguntar.
- As referências a RF01–RF39 não incluem todos os critérios completos. Usar as descrições de tela e regras presentes na especificação; não inventar comportamentos adicionais.

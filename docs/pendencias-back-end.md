# O que falta no back-end para ligar o site

Lista para o grupo dividir o trabalho. Baseada no back da `main` depois dos 3 PRs (clientes e usuários, JWT, dashboard) e no que o site precisa (`docs/modelagem-dados.md` e `docs/contrato-api.md`). Os nomes de campos e rotas abaixo são o que o site já espera; mudando, avisem o front.

Legenda: **[feito]** já existe, **[ajustar]** existe mas precisa mudar, **[falta]** não existe.

## 1. Como está hoje

| Área | Estado |
| --- | --- |
| Login com JWT (`POST /auth/login`), filtro, CORS, BCrypt | **[feito]** |
| `/clientes` (CRUD), com `descricao` e `dataCadastro` na entidade | **[feito]**, com ajustes (item 4) |
| `/usuarios` (CRUD por id) | **[ajustar]** (item 1 e 4) |
| `/dashboard?inicio=&fim=` (vendas, categorias, top produtos, estoque) | **[ajustar]** (item 3 e 4) |
| Categorias, produtos, estoque, vendas e carrinho, histórico | entidades existem, **sem rotas** |

## 2. Decisões que o grupo precisa tomar antes de codar

Estas mudam entidades e consultas; combinem primeiro.

1. **Carrinho.** Decidido no site: o carrinho é uma venda com `status` `ABERTA`; ao finalizar vira `FINALIZADA`. Isso substitui as entidades `Carrinho` e `ItemCarrinho`. O preço e o lucro unitário ficam gravados quando o item entra no carrinho (para atualizar o preço, tira-se o item e coloca de novo).
2. **Totais da venda não são colunas.** Valor total, subtotal, descontos e lucro saem da soma dos itens (view ou consulta). Hoje `Venda.valorTotal` e `Venda.valorLucro` existem e **a consulta do dashboard usa essas colunas**: ao remover, a consulta precisa somar os itens.
3. **O que são `custo`, `custoAE` e `custoFinal` em `ValorPeca`?** O site só tem **valor de compra** e **valor de venda** (o lucro é a diferença). Definam qual campo vira o valor de compra e se o histórico de valores por peça será mantido ou simplificado (um par de valores na própria `Peca`).
4. **`codigo1` a `codigo4`.** O site usa **um** código por produto (único). Os outros três continuam? Se sim, para quê?
5. **Imagem do produto.** Hoje `Peca.foto` é texto. Upload de arquivo (e onde guardar) ou só um endereço?
6. **Número da venda.** O site mostra o id formatado (`001`). `Venda.numeroVenda` continua? Se sim, quem gera e quando?
7. **Filtros e pesquisa.** O site filtra no navegador (nome, preço, quantidade, categoria, estado). Pode continuar assim por enquanto; filtro no servidor só se a lista ficar grande.

## 3. Segurança e contas (primeira fase)

- [ ] `GET`, `PUT` e `DELETE /usuarios/me` (id vem do token; senha errada = `400`, nunca `401`; `DELETE` remove só a conta). Detalhes em `docs/contrato-api.md`.
- [ ] Remover `PUT /usuarios/{id}` e `DELETE /usuarios/{id}` (hoje qualquer conta logada altera ou apaga outra) e rever o `GET /usuarios`.
- [ ] Tirar o `permitAll` de `POST /usuarios` depois de criar a primeira conta.
- [ ] `jwt.expiracao-minutos` de `1` para `120`.
- [ ] Senha nova com a regra do site: mínimo 8 caracteres, com letra e número (`@Pattern`), também no `PUT`.
- [ ] Excluir a conta não pode apagar nem bloquear vendas e movimentações (ver `usuario` nas entidades, item 5).

## 4. Entidades: o que mudar

| Entidade | Hoje | O que precisa |
| --- | --- | --- |
| `Usuario` | ok | nada |
| `Cliente` | tem `descricao` e `dataCadastro` | conferir se `dataCadastro` é preenchida ao criar; nova entidade **`ClienteVersao`** (histórico de alterações: nome, telefone, descrição, data da alteração; a primeira versão é o cadastro); ao excluir cliente, as vendas ficam (`Venda.cliente` vira `NULL`, com `clienteNome` gravado) |
| `Categoria` | `nivelBom/Medio/Ruim/Critico` | `nome` único; `dataCadastro` e `dataAlteracao` (só no banco); validar `bom ≥ médio ≥ ruim ≥ crítico ≥ 0`; não excluir com produtos (resposta `409`) |
| `Peca` (produto) | descrição, foto, qtdEstoque, 4 códigos | valor de compra e de venda (ver decisão 3); código único; `qtdEstoque` nunca negativa; **faixa própria** opcional (`usaFaixaCategoria` + 4 faixas, nulas quando herda, em ordem); `ativo` (desativar em vez de apagar quem tem histórico) |
| `ValorPeca` | custo, custoAE, custoFinal, precoVenda | decidir (decisão 3) |
| `Venda` | numeroVenda, dataHora, valorTotal, valorLucro, cliente, usuario (obrigatório) | `status`, `dataCriacao`, `dataFinalizacao` (nula enquanto aberta); `clienteNome`; remover `valorTotal` e `valorLucro` (decisão 2); `usuario` opcional (`SET NULL`) |
| `ItemVenda` | quantidade, precoUnitario, custoUnitario | `desconto`; foto da época: código, nome, categoria (id e nome); uma linha por produto na venda (`UNIQUE venda+peça`); `desconto ≤ quantidade × preço` |
| `Carrinho`, `ItemCarrinho` | existem | remover, se a decisão 1 for mantida |
| `MovimentacaoEstoque` | tipo (texto), quantidade, justificativa, dataHora, peça, usuário obrigatório | tipo como `ENTRADA`/`SAIDA` (enum); `quantidadeAntes` e `quantidadeDepois`; nome do produto e da categoria da época; justificativa obrigatória na saída; `usuario` opcional |
| **Nova: `ProdutoCadastro`** | não existe | histórico de cadastro do produto (nome, categoria, quantidade inicial, valor, lucro, data), para a aba "Cadastro de Produtos" |

O estado do estoque (Crítico, Ruim, Médio, Bom) **não é coluna**: sai da quantidade e da faixa efetiva (a do produto, se for própria; senão a da categoria). A consulta `PecaRepository.estoqueResumo` hoje só olha a categoria: precisa considerar a faixa própria.

## 5. Rotas que faltam

Tudo exige `Authorization: Bearer`. Erros no formato do contrato (item 7).

### Categorias (Configurações) [falta]

| Rota | Observação |
| --- | --- |
| `GET /categorias` | devolve `{ id, nome, criterios: { bom, medio, ruim, critico } }` |
| `POST /categorias`, `PUT /categorias/{id}` | valida a ordem das faixas e o nome único |
| `DELETE /categorias/{id}` | `409` se tiver produtos |

### Produtos (Catálogo, Entrada, Saída) [falta]

| Rota | Observação |
| --- | --- |
| `GET /produtos` | cada produto com `codigo`, `nome`, `categoriaId`, `imagem`, `valorCompra`, `valorVenda`, `quantidade`, `faixa`, `faixaOrigem` (`categoria` ou `propria`), `estado` |
| `POST /produtos` | cria e registra o `ProdutoCadastro` |
| `PUT /produtos/{id}` | inclui trocar entre faixa da categoria e faixa própria |
| `DELETE /produtos/{id}` | ou desativar (`ativo = false`) |
| `POST /produtos/{id}/entradas` `{ quantidade }` | soma ao estoque e grava a movimentação |
| `POST /produtos/{id}/saidas` `{ quantidade, justificativa }` | não deixa o estoque ficar negativo; justificativa obrigatória |

Entrada, saída e finalizar venda: **dentro de transação**, travando a linha do produto (`SELECT ... FOR UPDATE`), para dois pedidos juntos não deixarem a quantidade negativa.

### Carrinho e vendas [falta]

| Rota | Observação |
| --- | --- |
| `GET /vendas?status=ABERTA` | os carrinhos abertos (o site permite vários) |
| `POST /vendas` | cria um carrinho (`ABERTA`) |
| `PUT /vendas/{id}` | muda o cliente (opcional) |
| `POST /vendas/{id}/itens` `{ produtoId }` | grava o preço e o lucro unitário da época; recusa produto sem estoque ou repetido |
| `PUT /vendas/{id}/itens/{produtoId}` `{ quantidade?, desconto? }` | quantidade de 1 até o estoque; desconto de 0 até o valor da linha |
| `DELETE /vendas/{id}/itens/{produtoId}` e `DELETE /vendas/{id}` | só com a venda aberta |
| `POST /vendas/{id}/finalizar` | confere o estoque, baixa as quantidades e passa a `FINALIZADA`, tudo na mesma transação |
| `GET /vendas?status=FINALIZADA` e `GET /vendas/{id}` | itens e totais calculados |

Venda finalizada não muda mais (regra do serviço ou trigger).

### Histórico [falta]

| Aba do site | Rota sugerida |
| --- | --- |
| Vendas | `GET /vendas?status=FINALIZADA` |
| Clientes | `GET /historico/clientes` (por cliente: quantidade de vendas, valor total, lucro) |
| Entrada e Saída | `GET /movimentacoes?tipo=ENTRADA` e `?tipo=SAIDA` |
| Cadastro de Produtos | `GET /produtos/cadastros` |
| Cadastro de Clientes (alterações) | `GET /clientes/versoes` |

## 6. Rotas existentes para ajustar

- **`/clientes`:** responder `{ id, nome, telefone, descricao, dataCadastro }`; criar a primeira `ClienteVersao` ao cadastrar e uma nova a cada alteração real; definir a exclusão de cliente com venda (venda fica, `fkCliente` nulo).
- **`GET /dashboard`:** hoje só recebe `inicio` e `fim`. O site também filtra por **categorias** (parâmetro novo). As **categorias mais vendidas** vêm limitadas a 5 (`PageRequest.of(0, 5)`) e o site mostra todas, com rolagem. Faltam os números do estoque que o site mostra: **produtos ativos** e **custo em estoque** (soma de valor de compra × quantidade). O resumo de estoque precisa considerar a faixa própria. O período usa `dataHora` da venda: passará a ser `dataFinalizacao` e só vendas `FINALIZADA`.
- **`/auth/login`:** já bate com o contrato. Manter `{ token, usuario: { id, nome, email } }`.

## 7. Itens transversais

- [ ] **Tratador de erros** (`@RestControllerAdvice`): validação `400 { "erros": { "campo": "mensagem" } }`; e-mail repetido ou conflito `409`; não encontrado `404 { "erro": "..." }`; sem token `401`.
- [ ] Mensagens de validação em português.
- [ ] Datas em ISO (`2026-10-25` e `2026-10-25T14:30:00`); valores em `BigDecimal` com 2 casas; fuso `America/Sao_Paulo`.
- [ ] **Banco:** hoje `ddl-auto=update`. Para o grupo todo ter o mesmo banco, usar o `docs/banco/schema.sql` (ou Flyway) e passar para `validate`.
- [ ] **Dados de exemplo:** o `data.sql` atual (290 linhas) precisa bater com as entidades novas. Incluir uma conta de teste e, se possível, os mesmos dados do site (`src/data/` do front) para comparar as telas.
- [ ] Swagger com autenticação por token, para testar as rotas protegidas.
- [ ] CORS de produção (endereço real do site) e HTTPS.
- [ ] Testes mínimos: login, rota sem token, entrada e saída sem estoque negativo, finalizar venda.
- [ ] `README` do back (variáveis do `.env`, como rodar) e `.gitignore` sem `target/` e `.idea/`.

## 8. Ordem sugerida

1. **Base segura:** `/usuarios/me`, tratador de erros, ajustes de `/clientes`, remover rotas abertas (item 3).
2. **Cadastros:** entidades de `Categoria` e `Peca`, `GET`/`POST`/`PUT`/`DELETE` de categorias e produtos, estado calculado.
3. **Estoque:** entrada, saída e histórico de movimentações.
4. **Vendas:** venda `ABERTA`, itens, finalizar, histórico de vendas.
5. **Relatórios:** dashboard ajustado, histórico de clientes, cadastros.
6. **Fechamento:** dados de exemplo, testes, CORS de produção.

Em cada fase o front liga a tela correspondente à rota nova e remove o mock daquela parte. Quem fizer a rota avisa o formato exato de entrada e saída.

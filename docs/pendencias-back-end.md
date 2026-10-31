# O que falta no back-end para ligar o site

Lista para o grupo dividir o trabalho. Baseada no back da `main` depois dos 3 PRs (clientes e usuários, JWT, dashboard) e no que o site precisa (`docs/modelagem-dados.md` e `docs/contrato-api.md`). O **passo a passo de cada fase, com rotas, JSON e consultas**, está em [`docs/planejamento-back-end.md`](planejamento-back-end.md). Os nomes de campos e rotas são o que o site espera; mudando, avisem o front.

Legenda: **[feito]** já existe, **[ajustar]** existe mas precisa mudar, **[falta]** não existe.

## 1. Como está hoje

| Área | Estado |
| --- | --- |
| Login com JWT (`POST /auth/login`), filtro, CORS, BCrypt | **[feito]** |
| `/clientes` (CRUD), com `descricao` e `dataCadastro` na entidade | **[feito]**, com ajustes (item 6) |
| `/usuarios` (CRUD por id) | **[ajustar]** (item 3 e 6) |
| `/dashboard?inicio=&fim=` (vendas, categorias, top produtos, estoque) | **[ajustar]** (item 6) |
| Categorias, produtos, estoque, vendas e carrinho, histórico | entidades existem, **sem rotas** |

## 2. Decisões tomadas

| # | Tema | Decisão |
| --- | --- | --- |
| 1 | Carrinho | O carrinho é uma venda com `status` `ABERTA`; ao finalizar vira `FINALIZADA`. Substitui `Carrinho` e `ItemCarrinho`. O preço e o custo ficam gravados quando o item entra no carrinho; para mudar o preço, tira-se o item e coloca-se de novo. |
| 2 | Totais | Subtotal, descontos, valor total e lucro (da venda e do item) são **somas dos itens**, não colunas. Mudanças necessárias em `planejamento-back-end.md`, fase 4. |
| 3 | Preços | `custo` = o que a empresa pagou; `custoAE` = preço de venda para empresa/auto elétrica; `custoFinal` = preço de venda para pessoa física. O **preço da venda depende do tipo do cliente**. Os valores viram colunas da `Peca` (`valorCompra`, `precoEmpresa`, `precoConsumidor`); `ValorPeca` e `precoVenda` saem; sem histórico de preços por peça (o histórico fica em cada `ItemVenda`). |
| 4 | Códigos | Até 4 códigos por produto, em `codigo1` a `codigo4` (o primeiro é obrigatório). Todos únicos, e o serviço confere repetição entre colunas e entre produtos. A busca procura nos 4. A API expõe `codigos: []`. |
| 5 | Imagem | O arquivo fica no servidor e o banco guarda o endereço relativo. Upload por `POST /imagens` (multipart), que devolve a URL. |
| 6 | Número da venda | Sequencial, atribuído ao finalizar (carrinho aberto não tem número). |
| 7 | Filtros e pesquisa | Continuam no navegador por enquanto. |

## 3. Segurança e contas (primeira fase)

- [ ] `GET`, `PUT` e `DELETE /usuarios/me` (id vem do token; senha errada = `400`, nunca `401`; `DELETE` remove só a conta). Detalhes em `docs/contrato-api.md`.
- [ ] Remover `PUT /usuarios/{id}` e `DELETE /usuarios/{id}` (hoje qualquer conta logada altera ou apaga outra) e rever o `GET /usuarios`.
- [ ] Tirar o `permitAll` de `POST /usuarios` depois de criar a primeira conta.
- [ ] `jwt.expiracao-minutos` de `1` para `120`.
- [ ] Senha nova com a regra do site: mínimo 8 caracteres, com letra e número (`@Pattern`), também no `PUT`.
- [ ] Excluir a conta não pode apagar nem bloquear vendas e movimentações (`usuario` opcional nas entidades, item 4).

## 4. Entidades: o que mudar

| Entidade | Hoje | O que precisa |
| --- | --- | --- |
| `Usuario` | ok | nada |
| `Cliente` | tem `descricao` e `dataCadastro` | **`tipo`** (`PESSOA_FISICA` ou `EMPRESA`, padrão `PESSOA_FISICA`); conferir se `dataCadastro` é preenchida ao criar; nova entidade **`ClienteVersao`** (histórico de alterações: nome, telefone, descrição, tipo, data da alteração; a primeira versão é o cadastro); ao excluir cliente, as vendas ficam (`Venda.cliente` vira `NULL`, com `clienteNome` gravado) |
| `Categoria` | `nivelBom/Medio/Ruim/Critico` | `nome` único; `dataCadastro` e `dataAlteracao` (só no banco); validar `bom ≥ médio ≥ ruim ≥ crítico ≥ 0`; não excluir com produtos (resposta `409`) |
| `Peca` (produto) | `descricao`, `foto`, `qtdEstoque`, `codigo1` a `codigo4` | `descricao` vira **`nome`**; **`valorCompra`**, **`precoEmpresa`**, **`precoConsumidor`** (vindos de `ValorPeca`); `codigo1` obrigatório e os 4 únicos; `foto` guarda o endereço relativo da imagem; `qtdEstoque` nunca negativa; **faixa própria** opcional (`usaFaixaCategoria` + 4 faixas, nulas quando herda, em ordem); `ativo`; `dataCadastro` |
| `ValorPeca` | custo, custoAE, custoFinal, precoVenda | **remover** (valores passam para `Peca`) |
| `Venda` | numeroVenda, dataHora, valorTotal, valorLucro, cliente, usuario (obrigatório) | `status` (`ABERTA`/`FINALIZADA`), `dataCriacao`, `dataFinalizacao` (nula enquanto aberta); `numeroVenda` só ao finalizar (único); `clienteNome`; **remover `valorTotal` e `valorLucro`**; `usuario` opcional (`SET NULL`) |
| `ItemVenda` | quantidade, precoUnitario, custoUnitario | `tipoPreco`; `desconto`; foto da época: código, nome, categoria (id e nome); uma linha por produto na venda (`UNIQUE venda+peça`); `desconto ≤ quantidade × preço` |
| `Carrinho`, `ItemCarrinho` | existem | **remover** (o carrinho é `Venda` `ABERTA`) |
| `MovimentacaoEstoque` | tipo (texto), quantidade, justificativa, dataHora, peça, usuário obrigatório | tipo como `ENTRADA`/`SAIDA` (enum); `quantidadeAntes` e `quantidadeDepois`; nome do produto e da categoria da época; justificativa obrigatória na saída; `usuario` opcional |
| **Nova: `ProdutoCadastro`** | não existe | histórico de cadastro do produto (nome, categoria, quantidade inicial, preço ao consumidor, lucro, data), para a aba "Cadastro de Produtos" |
| **Nova: `SequenciaVenda`** | não existe | contador do número da venda (uma linha só) |

O estado do estoque (Crítico, Ruim, Médio, Bom) **não é coluna**: sai da quantidade e da faixa efetiva (a do produto, se for própria; senão a da categoria). A consulta `PecaRepository.estoqueResumo` hoje só olha a categoria: precisa considerar a faixa própria.

## 5. Rotas que faltam

Tudo exige `Authorization: Bearer`, menos `GET /uploads/**` (imagens). Erros no formato do contrato (item 7). Corpos e respostas completos em `planejamento-back-end.md`.

### Categorias (Configurações) [falta]

| Rota | Observação |
| --- | --- |
| `GET /categorias` | devolve `{ id, nome, criterios: { bom, medio, ruim, critico } }` |
| `POST /categorias`, `PUT /categorias/{id}` | valida a ordem das faixas e o nome único |
| `DELETE /categorias/{id}` | `409` se tiver produtos |

### Produtos (Catálogo, Entrada, Saída) e imagens [falta]

| Rota | Observação |
| --- | --- |
| `GET /produtos` | cada produto com `codigos`, `nome`, `categoriaId`, `imagem`, `valorCompra`, `precoEmpresa`, `precoConsumidor`, `quantidade`, `faixa`, `faixaOrigem` (`categoria` ou `propria`), `estado` |
| `POST /produtos` | cria e registra o `ProdutoCadastro` |
| `PUT /produtos/{id}` | inclui trocar entre faixa da categoria e faixa própria |
| `DELETE /produtos/{id}` | ou desativar (`ativo = false`) |
| `POST /produtos/{id}/entradas` `{ quantidade }` | soma ao estoque e grava a movimentação |
| `POST /produtos/{id}/saidas` `{ quantidade, justificativa }` | não deixa o estoque ficar negativo; justificativa obrigatória |
| `POST /imagens` (multipart) | recebe o arquivo (jpg, png ou webp, até 2 MB) e devolve `{ url }` |
| `GET /uploads/**` | serve os arquivos; leitura pública |

Entrada, saída e finalizar venda: **dentro de transação**, travando a linha do produto (`SELECT ... FOR UPDATE`), para dois pedidos juntos não deixarem a quantidade negativa.

### Carrinho e vendas [falta]

| Rota | Observação |
| --- | --- |
| `GET /vendas?status=ABERTA` | os carrinhos abertos (o site permite vários) |
| `POST /vendas` | cria um carrinho (`ABERTA`) |
| `PUT /vendas/{id}` | muda o cliente (opcional); **não** reprecifica os itens já no carrinho |
| `POST /vendas/{id}/itens` `{ produtoId }` | grava preço (pelo tipo do cliente da venda), custo e tipo de preço da época; recusa produto sem estoque ou repetido |
| `PUT /vendas/{id}/itens/{produtoId}` `{ quantidade?, desconto? }` | quantidade de 1 até o estoque; desconto de 0 até o valor da linha |
| `DELETE /vendas/{id}/itens/{produtoId}` e `DELETE /vendas/{id}` | só com a venda aberta |
| `POST /vendas/{id}/finalizar` | confere o estoque, baixa as quantidades, atribui o `numeroVenda` e passa a `FINALIZADA`, tudo na mesma transação |
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

- **`/clientes`:** responder `{ id, nome, telefone, descricao, tipo, dataCadastro }`; criar a primeira `ClienteVersao` ao cadastrar e uma nova a cada alteração real; definir a exclusão de cliente com venda (venda fica, `fkCliente` nulo).
- **`GET /dashboard`:** hoje só recebe `inicio` e `fim`. O site também filtra por **categorias** (parâmetro novo). As **categorias mais vendidas** vêm limitadas a 5 (`PageRequest.of(0, 5)`) e o site mostra todas, com rolagem. Faltam os números do estoque que o site mostra: **produtos ativos** e **custo em estoque** (soma de `valorCompra × quantidade`). O resumo de estoque precisa considerar a faixa própria. Como os totais deixam de ser colunas, as **três consultas** de vendas passam a somar `ItemVenda` (só `FINALIZADA`, período em `dataFinalizacao`, descontando o desconto): ver `planejamento-back-end.md`, fase 4 e 5.
- **`/auth/login`:** já bate com o contrato. Manter `{ token, usuario: { id, nome, email } }`.

## 7. Itens transversais

- [ ] **Tratador de erros** (`@RestControllerAdvice`): validação `400 { "erros": { "campo": "mensagem" } }`; e-mail repetido ou conflito `409`; não encontrado `404 { "erro": "..." }`; sem token `401`.
- [ ] Mensagens de validação em português.
- [ ] Datas em ISO (`2026-10-25` e `2026-10-25T14:30:00`); valores em `BigDecimal` com 2 casas; fuso `America/Sao_Paulo`.
- [ ] **Banco:** hoje `ddl-auto=update`. Para o grupo todo ter o mesmo banco, usar o `docs/banco/schema.sql` (ou Flyway) e passar para `validate`.
- [ ] **Dados de exemplo:** o `data.sql` atual (290 linhas) precisa bater com as entidades novas. Incluir uma conta de teste e, se possível, os mesmos dados do site (`src/data/` do front) para comparar as telas.
- [ ] Swagger com autenticação por token, para testar as rotas protegidas.
- [ ] CORS de produção (endereço real do site) e HTTPS.
- [ ] Testes mínimos: login, rota sem token, entrada e saída sem estoque negativo, finalizar venda, número da venda sem repetir.
- [ ] `README` do back (variáveis do `.env`, como rodar) e `.gitignore` sem `target/`, `.idea/` e a pasta de uploads.

## 8. Ordem sugerida

1. **Base segura:** `/usuarios/me`, tratador de erros, ajustes de `/clientes`, remover rotas abertas (item 3).
2. **Cadastros:** `Categoria` e `Peca` novas, rotas de categorias, produtos e imagens, estado calculado.
3. **Estoque:** entrada, saída e histórico de movimentações.
4. **Vendas:** venda `ABERTA`, itens, finalizar com número sequencial, histórico de vendas, totais derivados.
5. **Relatórios:** dashboard ajustado, histórico de clientes, cadastros.
6. **Fechamento:** dados de exemplo, testes, CORS de produção.

Em cada fase o front liga a tela correspondente à rota nova e remove o mock daquela parte. Quem fizer a rota avisa o formato exato de entrada e saída.

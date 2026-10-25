# Modelagem de dados (MySQL)

Modelo do banco para o front atual (Etapas 1 a 21). O script completo está em [`docs/banco/schema.sql`](banco/schema.sql) (MySQL 8.0.16 ou superior, por causa das restrições `CHECK`). O que **não** existe hoje no front aparece marcado como **novo**.

## Decisões principais

1. **O estado do estoque não é coluna.** Crítico, Ruim, Médio e Bom saem da quantidade e da faixa efetiva do produto. Guardar o estado criaria um dado que fica velho a cada venda, entrada, saída ou edição de faixa. No banco ele sai da view `vw_produto_estoque`.
2. **Faixa por categoria, com exceção por produto.** A categoria tem as 4 faixas. O produto herda (`usa_faixa_categoria = 1`, faixas `NULL`) ou tem as suas (`usa_faixa_categoria = 0`, 4 faixas obrigatórias). Editar a faixa da categoria muda só quem herda.
3. **Venda é uma foto.** `item_venda` guarda preço, lucro unitário, código, nome e categoria da época. Mudar o preço, o nome ou a categoria de um produto depois não altera o histórico nem o Dashboard de vendas.
4. **Excluir conta remove só o acesso.** `venda.conta_id` e `movimentacao_estoque.conta_id` viram `NULL` (`ON DELETE SET NULL`); os dados da empresa ficam.
5. **O carrinho é uma venda `ABERTA`.** Ao finalizar, a mesma linha vira `FINALIZADA` e entra no Histórico e no Dashboard (todas as consultas filtram `status = 'FINALIZADA'`). O preço e o lucro unitário são gravados quando o item entra no carrinho; para atualizar o preço, tira-se o item e coloca-se de novo. O estoque só baixa na finalização, em transação.
6. **Totais são derivados, não colunas.** Subtotal, descontos, valor total, lucro e quantidade de produtos da venda, e valor da linha, total e lucro do item, saem de `item_venda` pelas views `vw_venda_resumo` e `vw_item_venda`. Guardar esses totais criaria um segundo valor que poderia discordar da soma dos itens. O JOIN e a soma ficam na API (o front não consulta o banco); o front já calcula igual em `montarVenda`.
7. **Dinheiro em `DECIMAL(10,2)`**, nunca `FLOAT`. Datas em `DATE` onde o front só mostra o dia (cadastros, movimentações); `DATETIME` na venda, para ordenar as vendas do mesmo dia.

## Diagrama

```mermaid
erDiagram
  conta ||--o{ venda : registra
  conta ||--o{ movimentacao_estoque : registra
  categoria ||--o{ produto : classifica
  categoria ||--o{ item_venda : "categoria da epoca"
  produto ||--o{ item_venda : vendido_em
  produto ||--o{ movimentacao_estoque : movimenta
  produto ||--o{ produto_cadastro : cadastrado_como
  cliente ||--o{ venda : compra
  cliente ||--o{ cliente_versao : historico
  venda ||--|{ item_venda : contem

  conta {
    int id PK
    varchar nome
    varchar email UK
    varchar senha_hash
    datetime criado_em
  }
  categoria {
    int id PK
    varchar nome UK
    int faixa_bom
    int faixa_medio
    int faixa_ruim
    int faixa_critico
    datetime data_cadastro
    datetime data_alteracao
  }
  produto {
    int id PK
    varchar codigo UK
    varchar nome
    int categoria_id FK
    varchar imagem_url
    decimal valor_compra
    decimal valor_venda
    int quantidade
    bool usa_faixa_categoria
    int faixa_bom "NULL se herda"
    int faixa_medio "NULL se herda"
    int faixa_ruim "NULL se herda"
    int faixa_critico "NULL se herda"
    bool ativo "novo"
  }
  cliente {
    int id PK
    varchar nome
    varchar telefone
    varchar descricao
    date data_cadastro
  }
  cliente_versao {
    int id PK
    int cliente_id FK
    varchar nome
    varchar telefone
    varchar descricao
    date data_alteracao
  }
  venda {
    int id PK
    enum status "ABERTA ou FINALIZADA"
    int cliente_id FK "NULL"
    varchar cliente_nome
    int conta_id FK "NULL, novo"
    datetime data_criacao
    datetime data_finalizacao "NULL se aberta"
  }
  item_venda {
    int id PK
    int venda_id FK
    int produto_id FK "NULL"
    int categoria_id FK "NULL"
    varchar categoria_nome
    int quantidade
    decimal preco_unitario
    decimal lucro_unitario
    decimal desconto
  }
  movimentacao_estoque {
    int id PK
    int produto_id FK "NULL"
    int conta_id FK "NULL, novo"
    enum tipo "ENTRADA ou SAIDA"
    int quantidade
    int quantidade_antes
    int quantidade_depois
    varchar justificativa
    date data
  }
  produto_cadastro {
    int id PK
    int produto_id FK "NULL"
    int quantidade_inicial
    decimal valor
    decimal lucro
    date data
  }
```

## Tabelas

| Tabela | Para que serve | Observações |
| --- | --- | --- |
| `conta` | Contas de acesso | `email` único; só `senha_hash` (hoje a senha do mock é texto, só por ser mock). Todas as contas têm as mesmas permissões |
| `categoria` | Categorias e a faixa padrão | `nome` único; `CHECK bom ≥ médio ≥ ruim ≥ crítico`; não pode ser excluída com produtos (`RESTRICT`); `data_cadastro` e `data_alteracao` só no banco (o front não mostra) |
| `produto` | Catálogo e quantidade atual | `codigo` único; `quantidade` sem sinal; `CHECK` da faixa própria; **sem coluna `estado`** |
| `cliente` | Dados atuais do cliente | `data_cadastro` fica aqui, uma vez só |
| `cliente_versao` | Aba "Alteração de Clientes" | Uma linha por versão; a primeira é o cadastro (`data_alteracao = cliente.data_cadastro`) |
| `venda` | Carrinho (`ABERTA`) e venda feita (`FINALIZADA`) | `cliente_id` opcional; `data_finalizacao` só quando finalizada (`CHECK`); **sem colunas de total** |
| `item_venda` | Linhas da venda ou do carrinho | Preço e lucro unitário da época; `UNIQUE (venda_id, produto_id)` (uma linha por produto, como no carrinho); **sem colunas calculadas** |
| `movimentacao_estoque` | Entradas e saídas (Histórico) | Venda **não** entra aqui (como no front); `CHECK` das quantidades e justificativa obrigatória na saída |
| `produto_cadastro` | Aba "Cadastro de Produtos" | Dados do produto como estavam no cadastro |

Views: `vw_produto_estoque` (faixa efetiva e estado), `vw_item_venda` (valor da linha, total e lucro) e `vw_venda_resumo` (subtotal, descontos, valor total, lucro e quantidade de produtos). O estado do estoque, os totais da venda e os percentuais do Dashboard são calculados, não guardados.

## Regras de integridade

| Regra do sistema | Como o banco garante |
| --- | --- |
| Quantidade nunca negativa | `quantidade INT UNSIGNED` e atualização dentro de transação com `SELECT ... FOR UPDATE` (exemplo no fim do `schema.sql`) |
| Faixa em ordem (`bom ≥ médio ≥ ruim ≥ crítico`) | `CHECK` em `categoria` e em `produto` |
| Produto herda **ou** tem faixa própria | `CHECK ck_produto_faixa` (herda = faixas `NULL`; própria = as 4 preenchidas) |
| Não excluir categoria com produtos | `FOREIGN KEY ... ON DELETE RESTRICT` |
| Saída exige justificativa | `CHECK ck_movimentacao_justificativa` |
| Saldo antes/depois coerente | `CHECK ck_movimentacao_quantidade` |
| Histórico não muda quando o produto muda | Colunas de nome, categoria, preço e lucro copiadas em `item_venda`, `movimentacao_estoque` e `produto_cadastro` |
| Carrinho aberto ou venda finalizada, nunca os dois | `status` + `CHECK ck_venda_status` (`data_finalizacao` só quando `FINALIZADA`) |
| Venda finalizada não muda | Regra da API (ou trigger): item só é incluído, alterado ou removido com a venda `ABERTA`. Um `CHECK` não alcança outra tabela |
| Um produto por linha do carrinho | `UNIQUE (venda_id, produto_id)` |
| Excluir cliente ou produto não apaga vendas | `ON DELETE SET NULL` nas chaves de `venda` e `item_venda`, com os nomes gravados |
| Excluir conta só tira o acesso | `conta_id` das vendas e movimentações com `ON DELETE SET NULL` |

## Do front para o banco

| No front | No banco |
| --- | --- |
| `produto.categoriaId` | `produto.categoria_id` |
| `produto.faixaPropria` (`null` ou `{ bom, medio, ruim, critico }`) | `usa_faixa_categoria` + `faixa_bom/medio/ruim/critico` |
| `categoria.criterios` | `categoria.faixa_bom/medio/ruim/critico` |
| `produto.faixa`, `faixaOrigem`, `estado` (calculados por `comEstoqueCalculado`) | colunas `faixa_*`, `faixa_origem` e `estado` da view `vw_produto_estoque` |
| `produto.imagem` (data URL) | `produto.imagem_url` (arquivo no storage) |
| `venda.valor`, `subtotal`, `descontos`, `lucro`, `quantidadeProdutos` | `vw_venda_resumo` (`valor_total`, `subtotal`, `descontos`, `lucro`, `quantidade_produtos`) |
| `venda.data` | `venda.data_finalizacao` (venda feita) |
| carrinho (`CartContext`) | `venda` com `status = 'ABERTA'` e seus `item_venda` |
| `venda.itens[]` | `item_venda` (`precoUnitario` → `preco_unitario`, `lucroUnitario` → `lucro_unitario`); `valorLinha`, `total` e `lucro` do item vêm de `vw_item_venda` |
| `entradas[]` e `saidas[]` | `movimentacao_estoque` com `tipo = 'ENTRADA'` ou `'SAIDA'` |
| `cadastrosProdutos[]` | `produto_cadastro` |
| `cadastrosClientes[]` | `cliente_versao`; `dataCadastro` vem de `cliente.data_cadastro` |

## Consultas do Dashboard

Rosca e tabela de estoque (a rosca é a contagem por estado; "Precisam de reposição" é Ruim + Crítico):

```sql
SELECT estado, COUNT(*) AS quantidade
FROM vw_produto_estoque
GROUP BY estado;

SELECT COUNT(*) AS precisam_de_reposicao
FROM vw_produto_estoque
WHERE estado IN ('Ruim', 'Crítico');
```

Indicadores de vendas no período (`:inicio`, `:fim`; com filtro de categoria, soma só os itens dessas categorias). Só vendas finalizadas:

```sql
SELECT COUNT(DISTINCT venda_id)                    AS vendas,
       SUM(total)                                  AS faturamento,
       SUM(lucro)                                  AS lucro,
       SUM(total) / NULLIF(SUM(quantidade), 0)     AS preco_medio
FROM vw_item_venda
WHERE status = 'FINALIZADA'
  AND DATE(data_finalizacao) BETWEEN :inicio AND :fim
  AND categoria_id IN (:categorias);
```

Top 10 produtos mais vendidos:

```sql
SELECT codigo, nome, SUM(quantidade) AS quantidade, SUM(total) AS faturamento
FROM vw_item_venda
WHERE status = 'FINALIZADA'
  AND DATE(data_finalizacao) BETWEEN :inicio AND :fim
  AND categoria_id IN (:categorias)
GROUP BY codigo, nome
ORDER BY quantidade DESC
LIMIT 10;
```

Os índices `ix_venda_status_data`, `uq_item_venda_produto` (que também cobre `venda_id`) e `ix_item_venda_categoria` sustentam essas consultas.

## Pontos em aberto (para o time decidir)

1. **Excluir produto com histórico.** O schema já aceita (`SET NULL` + nomes gravados), mas a coluna **nova** `produto.ativo` permite desativar em vez de apagar. A view só lista produtos ativos.
2. **Excluir cliente.** As vendas ficam (`cliente_nome` gravado). As versões em `cliente_versao` são apagadas junto (`CASCADE`); se o time quiser guardar o histórico de clientes excluídos, trocar para `SET NULL` e gravar o nome.
3. **Quem registrou** (`conta_id`, **novo**): o front não mostra, mas dá auditoria sem custo. Pode ser removido se não for desejado.
4. **Imagens:** guardar o arquivo em storage e só o endereço no banco.
5. **Hora das movimentações:** o front usa só a data. Trocar `DATE` por `DATETIME` se o time quiser a hora.
6. **Imutabilidade da venda finalizada:** fica na API. Se o time preferir garantir no banco, criar triggers que recusam `INSERT`, `UPDATE` ou `DELETE` em `item_venda` quando a venda não está `ABERTA`.
7. **Carrinhos abertos antigos:** definir se um carrinho abandonado expira (por exemplo, apagar `ABERTA` sem item depois de N dias).
8. **Cálculo do estado:** pode ficar na view (acima) ou continuar no front com `comEstoqueCalculado`. Com view, as regras ficam em um só lugar para qualquer outro cliente do banco.
9. **Validação:** o script não foi executado em um servidor MySQL neste ambiente (não havia um instalado). Rodar em um MySQL 8.0.16+ antes de adotar.

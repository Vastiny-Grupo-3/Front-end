# Planejamento do back-end, fase por fase

Guia para o grupo implementar o back-end. A lista do que falta e as decisões tomadas estão em [`pendencias-back-end.md`](pendencias-back-end.md); o modelo do banco, em [`modelagem-dados.md`](modelagem-dados.md) e [`banco/schema.sql`](banco/schema.sql); login e contas, em [`contrato-api.md`](contrato-api.md).

Cada fase termina com rotas testadas pelo Swagger ou `curl`; só depois o front liga a tela correspondente. Quem terminar uma rota avisa o formato real de entrada e saída.

## Convenções para todas as rotas

- JSON com campos em `camelCase`; datas em ISO (`2026-10-25` e `2026-10-25T14:30:00`); dinheiro como número com 2 casas (`BigDecimal`, arredondamento `HALF_UP`).
- Tudo exige `Authorization: Bearer <token>`, menos `POST /auth/login` e `GET /uploads/**`.
- Erros: validação `400 { "erros": { "campo": "mensagem" } }`; conflito (nome ou código repetido, regra violada) `409` com o mesmo formato; não encontrado `404 { "erro": "mensagem" }`; sem token ou token vencido `401`. Senha errada em operação da conta é `400`, nunca `401`.
- Operações que mexem em quantidade (entrada, saída, finalizar venda) usam `@Transactional` e travam a linha do produto (`@Lock(PESSIMISTIC_WRITE)` no repository), para duas chamadas ao mesmo tempo não deixarem o estoque negativo.
- Entidades mantêm os nomes atuais (`Peca`, `Venda`...); o JSON usa o vocabulário do site (`produtos`, `nome`, `codigos`). O mapeamento é feito nos DTOs e mappers.

---

## Fase 1: base segura

Objetivo: contas seguras e erros no formato que o site entende.

1. **`/usuarios/me`** (`GET`, `PUT`, `DELETE`): o id vem de `authentication.getPrincipal()`, nunca do corpo. Regras no `contrato-api.md`.
2. **Remover** `PUT /usuarios/{id}` e `DELETE /usuarios/{id}`; rever `GET /usuarios` (não devolver senha; considerar remover).
3. **`@RestControllerAdvice`**: converte `MethodArgumentNotValidException` em `400 { erros }` (campo → mensagem em português), as exceções do projeto em `404`/`409`/`401`, e qualquer outra em `500` sem expor detalhe.
4. **Cliente:** adicionar `tipo` (`PESSOA_FISICA`/`EMPRESA`, padrão `PESSOA_FISICA`; validar o valor), garantir `dataCadastro` preenchida no serviço, e criar a entidade `ClienteVersao` (cliente, nome, telefone, descrição, tipo, `dataAlteracao`): uma versão ao cadastrar e outra a cada alteração em que algum campo mudou de fato. Rota `GET /clientes/versoes` (veja a fase 5).
5. **Exclusão de cliente com venda:** `Venda.cliente` opcional (`@ManyToOne` sem `optional = false`); ao excluir, as vendas ficam com `cliente` nulo e `clienteNome` gravado.
6. Limpeza: tirar o `permitAll` de `POST /usuarios`; `jwt.expiracao-minutos=120`; senha nova com `@Size(min = 8)` e `@Pattern` (letra e número).

**Teste:** os cinco `curl` do `contrato-api.md`; cadastrar cliente (cria versão); editar sem mudar nada (não cria versão); excluir cliente.

---

## Fase 2: cadastros (categorias, produtos, imagens)

### 2.1 Categorias

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `GET /categorias` | | `200 [ { id, nome, criterios: { bom, medio, ruim, critico } } ]` |
| `POST /categorias` | `{ nome, criterios }` | `201 { id, nome, criterios }` |
| `PUT /categorias/{id}` | `{ nome, criterios }` | `200 { ... }` |
| `DELETE /categorias/{id}` | | `204`; `409` se houver produtos |

Regras: `nome` único sem diferenciar maiúsculas; faixas inteiras com `bom ≥ medio ≥ ruim ≥ critico ≥ 0` (erros por campo); `Categoria` ganha `dataCadastro` e `dataAlteracao` (só no banco; `@CreationTimestamp` e `@UpdateTimestamp`). Os campos atuais `nivelBom/Medio/Ruim/Critico` ficam; o DTO traduz para `criterios`.

### 2.2 `Peca` (produto) nova

| Campo atual | Campo novo | Observação |
| --- | --- | --- |
| `descricao` | `nome` | renomear |
| `codigo1` a `codigo4` | iguais | `codigo1` obrigatório; os 4 únicos; sem repetir entre si |
| `foto` | `foto` | passa a guardar o endereço relativo (`/uploads/produtos/<uuid>.jpg`) |
| `qtdEstoque` | iguais | nunca negativa |
| (de `ValorPeca.custo`) | `valorCompra` | o que a empresa pagou |
| (de `ValorPeca.custoAE`) | `precoEmpresa` | venda para empresa/auto elétrica |
| (de `ValorPeca.custoFinal`) | `precoConsumidor` | venda para pessoa física e sem cliente |
| (novo) | `usaFaixaCategoria` + `faixaBom/Medio/Ruim/Critico` | faixa própria; nulas quando herda; todas ou nenhuma, em ordem |
| (novo) | `ativo`, `dataCadastro` | desativar em vez de apagar quem tem histórico |

**Migração:** `ddl-auto=update` não remove tabela nem coluna. Para sair de `ValorPeca`, apague a tabela `valor_peca` e a coluna `preco_venda`, ou recrie o banco (de preferência com o `schema.sql`) e carregue os dados de exemplo.

### 2.3 Produtos

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `GET /produtos` | | `200 [ produto ]` (só ativos) |
| `POST /produtos` | produto sem `id` | `201 produto`; grava o `ProdutoCadastro` |
| `PUT /produtos/{id}` | produto | `200 produto` |
| `DELETE /produtos/{id}` | | `204` (apaga ou desativa, conforme combinado) |

Formato do produto (entrada e saída):

```json
{
  "id": 7,
  "codigos": ["SQ-H7", "H7-UNIV"],
  "nome": "Soquete Lâmpada H7",
  "categoriaId": 3,
  "imagem": "/uploads/produtos/3f2a....jpg",
  "valorCompra": 6.00,
  "precoEmpresa": 9.50,
  "precoConsumidor": 12.50,
  "quantidade": 25,
  "faixaPropria": null,
  "faixa": { "bom": 15, "medio": 10, "ruim": 5, "critico": 0 },
  "faixaOrigem": "categoria",
  "estado": "Bom"
}
```

- Na entrada, `faixaPropria` é `null` (herda) ou `{ bom, medio, ruim, critico }`. `faixa`, `faixaOrigem` e `estado` só saem na resposta.
- `codigos` tem de 1 a 4 itens sem repetir; o serviço procura cada código nas **4 colunas** de **todos** os outros produtos e responde `409 { erros: { codigos: "Este código já está em uso." } }`.
- **Estado:** `quantidade ≥ bom` → Bom; `≥ medio` → Médio; `≥ ruim` → Ruim; senão Crítico, usando a faixa efetiva (a própria, se existir; senão a da categoria). Calcule em um método do serviço (nunca grave o estado).
- `quantidade` só entra na criação; depois muda por entrada, saída e venda.

### 2.4 Imagens

1. `POST /imagens` (multipart, campo `arquivo`) → `201 { "url": "/uploads/produtos/<uuid>.jpg" }`.
2. Validar: tipo `image/jpeg`, `image/png` ou `image/webp` (conferir também a extensão); máximo 2 MB (`spring.servlet.multipart.max-file-size=2MB` e `max-request-size=3MB`). Erro `400 { erros: { arquivo: "..." } }`.
3. Salvar em uma pasta configurada por variável de ambiente (`UPLOADS_DIR`), com nome `UUID + extensão`; nunca usar o nome enviado pelo usuário.
4. Servir a pasta em `/uploads/**` (um `WebMvcConfigurer` com `addResourceHandlers` apontando para `file:`), com `permitAll` na `SecurityConfig` para `GET /uploads/**`: a tag `<img>` do navegador não manda o token, e o nome aleatório já impede adivinhar.
5. O produto guarda só a URL; ao trocar a imagem, apagar o arquivo antigo (opcional).
6. Colocar a pasta de uploads no `.gitignore`. Em produção, trocar a pasta por armazenamento de objetos (S3, Azure Blob ou Cloudinary) atrás de uma interface (`ArmazenamentoImagem`), sem mudar a rota nem o formato.

**Teste:** categoria com faixa inválida (400); excluir categoria com produto (409); produto com código repetido na 3ª coluna de outro (409); produto com faixa própria e estado correto; upload de arquivo de 3 MB e de um `.pdf` (400); abrir a URL da imagem no navegador sem token.

---

## Fase 3: estoque

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `POST /produtos/{id}/entradas` | `{ quantidade }` | `200 produto` (já com o estado novo) |
| `POST /produtos/{id}/saidas` | `{ quantidade, justificativa }` | `200 produto` |
| `GET /movimentacoes?tipo=ENTRADA` (ou `SAIDA`) | | `200 [ movimentacao ]` |

`MovimentacaoEstoque` nova: `tipo` (enum `ENTRADA`/`SAIDA`), `quantidade`, `quantidadeAntes`, `quantidadeDepois`, `justificativa`, `nomeProduto` e `categoriaNome` da época, `dataHora`, `peca` (opcional), `usuario` (opcional, `SET NULL`).

Regras: quantidade inteira maior que zero (`400`); saída maior que o estoque `409 { erros: { quantidade: "..." } }`; justificativa obrigatória na saída; tudo em uma transação com a linha do produto travada.

Movimentação na resposta:

```json
{ "id": 1, "produtoId": 9, "nome": "Soquete Pingo T10", "categoria": "Soquetes",
  "quantidadeAntes": 26, "quantidadeDepois": 56, "quantidade": 30,
  "justificativa": null, "data": "2026-09-25" }
```

**Teste:** duas saídas ao mesmo tempo no mesmo produto sem estoque suficiente para as duas (só uma passa); saída sem justificativa; entrada muda o estado.

---

## Fase 4: vendas e carrinho

### 4.1 Entidades

- `Venda`: `status`, `dataCriacao`, `dataFinalizacao` (nula enquanto aberta), `numeroVenda` (único, nulo enquanto aberta), `cliente` (opcional), `clienteNome`, `usuario` (opcional). **Remover** `valorTotal`, `valorLucro` e `dataHora`.
- `ItemVenda`: `venda`, `peca` (opcional, `SET NULL`), `codigo` (principal da época), `nome`, `categoria` + `categoriaNome` da época, `quantidade`, `tipoPreco` (`PESSOA_FISICA`/`EMPRESA`), `precoUnitario`, `custoUnitario`, `desconto`. `UNIQUE (venda, peca)`.
- **Remover** `Carrinho` e `ItemCarrinho` (e os repositories deles).
- **Nova** `SequenciaVenda` (uma linha, `ultimoNumero`).

### 4.2 Rotas

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `GET /vendas?status=ABERTA` | | `200 [ venda ]` (carrinhos) |
| `POST /vendas` | `{ clienteId? }` | `201 venda` |
| `PUT /vendas/{id}` | `{ clienteId }` (ou `null`) | `200 venda`; só `ABERTA` |
| `POST /vendas/{id}/itens` | `{ produtoId }` | `201 venda` |
| `PUT /vendas/{id}/itens/{produtoId}` | `{ quantidade?, desconto? }` | `200 venda` |
| `DELETE /vendas/{id}/itens/{produtoId}` | | `200 venda` |
| `DELETE /vendas/{id}` | | `204`; só `ABERTA` |
| `POST /vendas/{id}/finalizar` | | `200 venda` (já `FINALIZADA`, com `numeroVenda`) |
| `GET /vendas?status=FINALIZADA` | | `200 [ venda ]` |
| `GET /vendas/{id}` | | `200 venda` |

Formato da venda (os totais são **calculados** na resposta, não ficam no banco):

```json
{
  "id": 11, "numero": 11, "status": "FINALIZADA",
  "data": "2026-10-17T14:30:00",
  "clienteId": 6, "clienteNome": "Roberto Lima",
  "itens": [
    { "produtoId": 10, "codigo": "LP-H4", "nome": "Lâmpada H4", "categoriaId": 4, "categoria": "Lâmpadas",
      "quantidade": 1, "tipoPreco": "PESSOA_FISICA",
      "precoUnitario": 19.90, "custoUnitario": 11.00, "lucroUnitario": 8.90,
      "desconto": 0.00, "valorLinha": 19.90, "total": 19.90, "lucro": 8.90 }
  ],
  "subtotal": 19.90, "descontos": 0.00, "valor": 19.90, "lucro": 8.90, "quantidadeProdutos": 1
}
```

Em carrinho aberto `numero` e `data` vêm `null`; o nome "Carrinho 001" o site monta a partir do `id`.

### 4.3 Regras

- **Preço pelo tipo do cliente, na hora de adicionar o item:** se a venda tem cliente `EMPRESA`, `precoUnitario = precoEmpresa` e `tipoPreco = EMPRESA`; senão (pessoa física ou sem cliente), `precoConsumidor` e `PESSOA_FISICA`. `custoUnitario = valorCompra`. Grava na hora, no `ItemVenda`.
- **Trocar o cliente do carrinho não reprecifica os itens.** Para aplicar o outro preço, tira-se o item e coloca de novo (mesma regra de "atualizar um valor").
- Adicionar item: produto ativo, com estoque, ainda fora do carrinho (`409` caso contrário).
- Alterar item: `1 ≤ quantidade ≤ estoque atual`; `0 ≤ desconto ≤ quantidade × preço`; se a quantidade cair e o desconto passar do valor da linha, reduzir o desconto ao valor da linha.
- Só mexe em venda `ABERTA`; venda `FINALIZADA` responde `409` a qualquer alteração.
- **Finalizar** (uma transação): venda aberta e com pelo menos um item; travar os produtos dos itens; conferir estoque de todos (`409` listando o que falta); baixar as quantidades; atribuir o número (4.5); gravar `clienteNome` e `dataFinalizacao`; trocar o status. Não gera `MovimentacaoEstoque` (venda não entra no histórico de movimentações).

### 4.4 Totais derivados: o que alterar

Fórmulas (as mesmas de `montarVenda` do site, 2 casas, `HALF_UP`):

| Valor | Cálculo |
| --- | --- |
| `valorLinha` | `quantidade × precoUnitario` |
| `total` do item | `valorLinha − desconto` |
| `lucroUnitario` | `precoUnitario − custoUnitario` |
| `lucro` do item | `quantidade × (precoUnitario − custoUnitario) − desconto` |
| `subtotal` | soma de `valorLinha` |
| `descontos` | soma de `desconto` |
| `valor` (total da venda) | `subtotal − descontos` |
| `lucro` da venda | soma do `lucro` dos itens |
| `quantidadeProdutos` | soma de `quantidade` |

O que mudar no código:

1. **Entidade `Venda`:** apagar `valorTotal`, `valorLucro`. Apagar a coluna antiga no banco (ou recriar o banco).
2. **Novo `VendaMapper`** (como o `ClienteMapper`): recebe `Venda` com os itens e devolve o DTO acima calculando tudo em `BigDecimal`. Carregar os itens junto (`JOIN FETCH` no repository ou `@EntityGraph`) para não fazer uma consulta por venda.
3. **`VendaRepository.resumo`:** hoje soma `v.valorTotal` e `v.valorLucro`; **sai do `VendaRepository` e vira consulta no `ItemVendaRepository`** (a soma agora é sobre os itens). Ela deve: partir de `ItemVenda i` com `i.venda v`; filtrar `v.status = FINALIZADA` e `v.dataFinalizacao` entre início (inclusive) e fim (exclusivo); calcular `COUNT(DISTINCT v.id)` (vendas), `SUM(i.quantidade * i.precoUnitario - i.desconto)` (faturamento) e `SUM(i.quantidade * (i.precoUnitario - i.custoUnitario) - i.desconto)` (lucro); aceitar categorias opcionais (`i.categoria.id IN :categorias`). Preço médio = faturamento ÷ vendas (já feito no `DashboardMapper.toKpi`).
4. **`ItemVendaRepository.categorias`:** acrescentar o filtro de `FINALIZADA` e `dataFinalizacao`; somar `quantidade × precoUnitario − desconto`; agrupar por `i.categoriaNome` (nome da época); tirar o limite de 5 (`Pageable`), pois o site mostra todas.
5. **`ItemVendaRepository.topProdutos`:** mesmo filtro; agrupar por `i.codigo` e `i.nome` (da época); `faturado` com desconto e `lucro` com desconto; manter o limite de 10.
6. **`DashboardService`:** o período passa a ser sobre `dataFinalizacao`; receber `categorias` opcional e repassar às consultas; `inicio` continua inclusivo e `fim + 1 dia` exclusivo (já feito).
7. **`DashboardMapper` e DTOs:** continuam, só trocando a origem dos números.
8. **Conferir:** para um mesmo conjunto de vendas, o total do `GET /vendas/{id}` somado deve bater com o faturamento do dashboard.

### 4.5 Número sequencial da venda

1. Tabela `sequencia_venda` com uma linha (`id = 1`, `ultimo_numero = 0`), criada com o banco.
2. Na transação de **finalizar**: ler a linha com `@Lock(PESSIMISTIC_WRITE)` (outra finalização espera), somar 1 ao `ultimoNumero`, gravar na venda como `numeroVenda`.
3. `UNIQUE (numero_venda)` na venda como segunda proteção. Vários `NULL` (carrinhos abertos) são permitidos.
4. Se a transação falhar, o número não é consumido (o contador volta junto com a transação). Venda finalizada não é excluída, então não há buracos.
5. Alternativa mais simples (com o mesmo `UNIQUE`): `MAX(numeroVenda) + 1` dentro da mesma transação, travando a tabela de vendas; é mais fácil, mas bloqueia mais.

**Teste:** carrinho com cliente empresa e outro sem cliente (preços diferentes); trocar o cliente e ver que os itens não mudam; finalizar duas vendas ao mesmo tempo (números 1 e 2, sem repetir); finalizar sem estoque (409 e nada baixa); alterar venda finalizada (409); dashboard bate com as vendas.

---

## Fase 5: histórico e dashboard

### Histórico

| Aba do site | Rota | Resposta |
| --- | --- | --- |
| Vendas | `GET /vendas?status=FINALIZADA` | lista de vendas (fase 4) |
| Clientes | `GET /historico/clientes` | `[ { clienteId, nome, quantidadeVendas, valorTotal, lucroTotal } ]`, só clientes que já compraram, calculado sobre os itens das vendas finalizadas |
| Entrada e Saída | `GET /movimentacoes?tipo=...` | fase 3 |
| Cadastro de Produtos | `GET /produtos/cadastros` | `[ { id, produtoId, nome, categoria, quantidadeInicial, valor, lucro, data } ]` |
| Cadastro de Clientes | `GET /clientes/versoes` | `[ { id, clienteId, nome, telefone, descricao, tipo, dataCadastro, data } ]` (`dataCadastro` vem do cliente; `data` é a `dataAlteracao` da versão) |

`ProdutoCadastro` é gravado ao criar o produto: nome, categoria (nome), quantidade inicial, `valor` (preço ao consumidor) e `lucro` (consumidor − compra), `data`. Não muda depois.

### Dashboard (`GET /dashboard`)

Parâmetros: `inicio`, `fim` (datas ISO) e `categorias` (lista opcional de ids; vazio = todas).

- **Vendas (aba Vendas):** `kpis` (vendas, faturamento, lucro, preço médio), `categorias` (todas, ordenadas por faturamento) e `topProdutos` (10), como na fase 4.4. Todos filtrados por categoria; período em `dataFinalizacao`.
- **Estoque (aba Estoque):** não depende de período nem de categorias. Devolver: `niveis` (contagem de produtos em Bom, Médio, Ruim e Crítico), `precisamDeReposicao` (Ruim + Crítico), `produtosAtivos` e `custoEmEstoque` (`Σ valorCompra × quantidade` dos ativos). O estado considera a **faixa própria** quando existir (`COALESCE` da própria com a da categoria, ou `CASE` por `usaFaixaCategoria`). A tabela de produtos do dashboard usa `GET /produtos`.

**Teste:** período sem vendas devolve zeros (sem erro); produto com faixa própria muda o nível em relação à categoria; filtro por uma categoria muda KPIs, categorias e top 10.

---

## Fase 6: fechamento

- `data.sql` ou `schema.sql` mais dados de exemplo (inclua uma conta de teste e, se possível, os dados de `src/data/` do site).
- `ddl-auto=validate` com o `schema.sql` como fonte do banco.
- Swagger com esquema `bearer`.
- Testes: login, rota sem token, entrada e saída sem estoque negativo, finalizar venda e número da venda sem repetir, estado do estoque com faixa própria.
- CORS com o endereço real do site e HTTPS em produção.
- `README` do back: variáveis do `.env` (`DB_DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `UPLOADS_DIR`), como rodar e como testar.

## Como o site entra em cada fase

Terminada uma fase, o front liga a API da área correspondente (um serviço e uma etapa por área) e remove o mock dessa parte. Enquanto isso o site continua funcionando com os dados de exemplo, e só login, contas e clientes usam a API (`VITE_API_URL`).

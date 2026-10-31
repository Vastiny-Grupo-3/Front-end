-- Vastiny: esquema do banco de dados (MySQL 8.0.16 ou superior, por causa das restrições CHECK).
-- Modelagem e justificativas: docs/modelagem-dados.md
--
-- Regras que o banco garante:
--   * excluir uma conta remove só o acesso dela; vendas e movimentações ficam (conta_id vira NULL);
--   * o estado do estoque (Crítico, Ruim, Médio, Bom) NÃO é coluna: sai da view vw_produto_estoque;
--   * venda e item de venda guardam preço, custo e nomes da época (histórico não muda se o produto mudar);
--   * o preço de venda depende do tipo do cliente (empresa ou pessoa física) e é gravado ao entrar no carrinho;
--   * totais de venda e de item NÃO são colunas: saem das views vw_item_venda e vw_venda_resumo.

CREATE DATABASE IF NOT EXISTS vastiny
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE vastiny;

-- ---------------------------------------------------------------------------
-- Contas de acesso
-- ---------------------------------------------------------------------------
CREATE TABLE conta (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(254) NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,           -- nunca a senha em texto (hash bcrypt ou argon2)
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conta_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Categorias e faixa de estoque da categoria
-- Cada faixa_* é a quantidade MÍNIMA para o nível: quantidade >= faixa_bom é Bom,
-- >= faixa_medio é Médio, >= faixa_ruim é Ruim, abaixo disso é Crítico.
-- ---------------------------------------------------------------------------
CREATE TABLE categoria (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome           VARCHAR(80)  NOT NULL,
  faixa_bom      INT UNSIGNED NOT NULL,
  faixa_medio    INT UNSIGNED NOT NULL,
  faixa_ruim     INT UNSIGNED NOT NULL,
  faixa_critico  INT UNSIGNED NOT NULL,
  data_cadastro  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,                              -- só no banco
  data_alteracao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- só no banco
  PRIMARY KEY (id),
  UNIQUE KEY uq_categoria_nome (nome),
  CONSTRAINT ck_categoria_faixa CHECK (
    faixa_bom >= faixa_medio AND faixa_medio >= faixa_ruim AND faixa_ruim >= faixa_critico
  )
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Produtos
-- usa_faixa_categoria = 1: herda a faixa da categoria (faixa_* ficam NULL).
-- usa_faixa_categoria = 0: tem faixa própria (as quatro faixa_* são obrigatórias e em ordem).
-- Até 4 códigos: codigo_1 é o principal (obrigatório); cada código é único. O banco não compara
-- colunas diferentes entre si: o serviço confere se um código já existe em qualquer das 4 colunas.
-- Preços: valor_compra = o que a empresa pagou; preco_empresa = venda para empresa/auto elétrica;
-- preco_consumidor = venda para pessoa física (e para venda sem cliente).
-- ---------------------------------------------------------------------------
CREATE TABLE produto (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  codigo_1             VARCHAR(30)   NOT NULL,
  codigo_2             VARCHAR(30)   NULL,
  codigo_3             VARCHAR(30)   NULL,
  codigo_4             VARCHAR(30)   NULL,
  nome                 VARCHAR(150)  NOT NULL,
  categoria_id         INT UNSIGNED  NOT NULL,
  imagem_url           VARCHAR(500)  NULL,               -- endereço relativo (/uploads/produtos/<uuid>.jpg); o arquivo fica no servidor
  valor_compra         DECIMAL(10,2) NOT NULL,
  preco_empresa        DECIMAL(10,2) NOT NULL,
  preco_consumidor     DECIMAL(10,2) NOT NULL,
  quantidade           INT UNSIGNED  NOT NULL DEFAULT 0, -- o UNSIGNED impede quantidade negativa
  usa_faixa_categoria  TINYINT(1)    NOT NULL DEFAULT 1,
  faixa_bom            INT UNSIGNED  NULL,
  faixa_medio          INT UNSIGNED  NULL,
  faixa_ruim           INT UNSIGNED  NULL,
  faixa_critico        INT UNSIGNED  NULL,
  ativo                TINYINT(1)    NOT NULL DEFAULT 1, -- NOVO: desativar em vez de apagar quem tem histórico
  criado_em            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produto_codigo_1 (codigo_1),
  UNIQUE KEY uq_produto_codigo_2 (codigo_2),
  UNIQUE KEY uq_produto_codigo_3 (codigo_3),
  UNIQUE KEY uq_produto_codigo_4 (codigo_4),
  KEY ix_produto_categoria (categoria_id),
  CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,                -- categoria com produtos não pode ser excluída
  CONSTRAINT ck_produto_valores CHECK (valor_compra >= 0 AND preco_empresa >= 0 AND preco_consumidor >= 0),
  CONSTRAINT ck_produto_faixa CHECK (
    (usa_faixa_categoria = 1
      AND faixa_bom IS NULL AND faixa_medio IS NULL AND faixa_ruim IS NULL AND faixa_critico IS NULL)
    OR
    (usa_faixa_categoria = 0
      AND faixa_bom IS NOT NULL AND faixa_medio IS NOT NULL
      AND faixa_ruim IS NOT NULL AND faixa_critico IS NOT NULL
      AND faixa_bom >= faixa_medio AND faixa_medio >= faixa_ruim AND faixa_ruim >= faixa_critico)
  )
) ENGINE=InnoDB;

-- Faixa efetiva e estado calculado. É daqui que saem a rosca, a tabela de estoque e o
-- indicador "Precisam de reposição" (estado Ruim ou Crítico) do Dashboard.
CREATE VIEW vw_produto_estoque AS
SELECT
  p.id,
  p.codigo_1 AS codigo,
  p.nome,
  p.categoria_id,
  c.nome AS categoria_nome,
  p.quantidade,
  p.valor_compra,
  p.preco_empresa,
  p.preco_consumidor,
  IF(p.usa_faixa_categoria = 1, 'categoria', 'propria') AS faixa_origem,
  IF(p.usa_faixa_categoria = 1, c.faixa_bom,     p.faixa_bom)     AS faixa_bom,
  IF(p.usa_faixa_categoria = 1, c.faixa_medio,   p.faixa_medio)   AS faixa_medio,
  IF(p.usa_faixa_categoria = 1, c.faixa_ruim,    p.faixa_ruim)    AS faixa_ruim,
  IF(p.usa_faixa_categoria = 1, c.faixa_critico, p.faixa_critico) AS faixa_critico,
  CASE
    WHEN p.quantidade >= IF(p.usa_faixa_categoria = 1, c.faixa_bom,   p.faixa_bom)   THEN 'Bom'
    WHEN p.quantidade >= IF(p.usa_faixa_categoria = 1, c.faixa_medio, p.faixa_medio) THEN 'Médio'
    WHEN p.quantidade >= IF(p.usa_faixa_categoria = 1, c.faixa_ruim,  p.faixa_ruim)  THEN 'Ruim'
    ELSE 'Crítico'
  END AS estado
FROM produto p
JOIN categoria c ON c.id = p.categoria_id
WHERE p.ativo = 1;

-- ---------------------------------------------------------------------------
-- Clientes e histórico de alterações (aba "Alteração de Clientes")
-- ---------------------------------------------------------------------------
CREATE TABLE cliente (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(120) NOT NULL,
  telefone   VARCHAR(20)  NULL,
  descricao  VARCHAR(500) NOT NULL DEFAULT '',
  tipo       ENUM('PESSOA_FISICA', 'EMPRESA') NOT NULL DEFAULT 'PESSOA_FISICA',  -- define o preço da venda
  data_cadastro DATE      NOT NULL,             -- uma vez só; as versões abaixo não repetem esta data
  PRIMARY KEY (id),
  KEY ix_cliente_nome (nome)
) ENGINE=InnoDB;

-- Uma linha por versão (a primeira é o cadastro). Mostra os dados como estavam na data.
CREATE TABLE cliente_versao (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id      INT UNSIGNED NOT NULL,
  nome            VARCHAR(120) NOT NULL,
  telefone        VARCHAR(20)  NULL,
  descricao       VARCHAR(500) NOT NULL DEFAULT '',
  tipo            ENUM('PESSOA_FISICA', 'EMPRESA') NOT NULL DEFAULT 'PESSOA_FISICA',
  data_alteracao  DATE         NOT NULL,        -- na primeira versão é igual a cliente.data_cadastro
  PRIMARY KEY (id),
  KEY ix_cliente_versao_cliente (cliente_id, data_alteracao),
  CONSTRAINT fk_cliente_versao_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Vendas e carrinho: o carrinho é uma venda com status ABERTA; ao finalizar vira FINALIZADA
-- e entra no Histórico e no Dashboard. Os totais NÃO são colunas: saem das views abaixo.
-- ---------------------------------------------------------------------------
-- numero_venda: sequencial, atribuído só ao finalizar (carrinho aberto fica NULL); o próximo número
-- sai da tabela sequencia_venda, dentro da transação de finalizar. Vários NULL são permitidos no UNIQUE.
CREATE TABLE venda (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero_venda     INT UNSIGNED NULL,
  status           ENUM('ABERTA', 'FINALIZADA') NOT NULL DEFAULT 'ABERTA',
  cliente_id       INT UNSIGNED NULL,       -- venda sem cliente é permitida
  cliente_nome     VARCHAR(120) NULL,       -- nome da época; gravado ao finalizar
  conta_id         INT UNSIGNED NULL,       -- NOVO: quem registrou
  data_criacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_finalizacao DATETIME     NULL,       -- NULL enquanto estiver aberta
  PRIMARY KEY (id),
  UNIQUE KEY uq_venda_numero (numero_venda),
  KEY ix_venda_status_data (status, data_finalizacao),
  KEY ix_venda_cliente (cliente_id),
  CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id) ON DELETE SET NULL,
  CONSTRAINT fk_venda_conta   FOREIGN KEY (conta_id)   REFERENCES conta (id)   ON DELETE SET NULL,
  CONSTRAINT ck_venda_status CHECK (
    (status = 'ABERTA' AND data_finalizacao IS NULL AND numero_venda IS NULL)
    OR (status = 'FINALIZADA' AND data_finalizacao IS NOT NULL AND numero_venda IS NOT NULL)
  )
) ENGINE=InnoDB;

-- Contador do número da venda: uma única linha, lida com bloqueio (SELECT ... FOR UPDATE) ao finalizar.
CREATE TABLE sequencia_venda (
  id            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  ultimo_numero INT UNSIGNED     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT ck_sequencia_venda_unica CHECK (id = 1)
) ENGINE=InnoDB;
INSERT INTO sequencia_venda (id, ultimo_numero) VALUES (1, 0);

-- Preço, custo e tipo de preço são gravados ao colocar o item no carrinho (preço da época).
-- tipo_preco = EMPRESA se o cliente da venda é empresa; PESSOA_FISICA para pessoa física ou sem cliente.
-- Trocar o cliente depois não reprecifica os itens.
-- Para atualizar o preço, remove-se o item e coloca-se de novo. Só muda com a venda ABERTA
-- (regra do back-end; um CHECK não enxerga outra tabela).
CREATE TABLE item_venda (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venda_id        INT UNSIGNED  NOT NULL,
  produto_id      INT UNSIGNED  NULL,
  codigo          VARCHAR(30)   NOT NULL,       -- código principal (codigo_1) da época
  nome            VARCHAR(150)  NOT NULL,
  categoria_id    INT UNSIGNED  NULL,           -- categoria da época (o produto pode mudar de categoria)
  categoria_nome  VARCHAR(80)   NOT NULL,
  quantidade      INT UNSIGNED  NOT NULL,
  tipo_preco      ENUM('PESSOA_FISICA', 'EMPRESA') NOT NULL,
  preco_unitario  DECIMAL(10,2) NOT NULL,
  custo_unitario  DECIMAL(10,2) NOT NULL,       -- valor de compra da época; o lucro sai de preço − custo
  desconto        DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_item_venda_produto (venda_id, produto_id),  -- uma linha por produto, como no carrinho
  KEY ix_item_venda_produto (produto_id),
  KEY ix_item_venda_categoria (categoria_id),
  CONSTRAINT fk_item_venda_venda     FOREIGN KEY (venda_id)     REFERENCES venda (id)     ON DELETE CASCADE,
  CONSTRAINT fk_item_venda_produto   FOREIGN KEY (produto_id)   REFERENCES produto (id)   ON DELETE SET NULL,
  CONSTRAINT fk_item_venda_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id) ON DELETE SET NULL,
  CONSTRAINT ck_item_venda_valores CHECK (
    quantidade > 0 AND preco_unitario >= 0 AND desconto >= 0
    AND desconto <= quantidade * preco_unitario
  )
) ENGINE=InnoDB;

-- Valores de cada linha, calculados.
CREATE VIEW vw_item_venda AS
SELECT
  i.*,
  v.status,
  v.data_finalizacao,
  i.quantidade * i.preco_unitario                      AS valor_linha,
  i.quantidade * i.preco_unitario - i.desconto         AS total,
  i.quantidade * (i.preco_unitario - i.custo_unitario) - i.desconto  AS lucro
FROM item_venda i
JOIN venda v ON v.id = i.venda_id;

-- Totais de cada venda: subtotal, descontos, valor total, lucro e quantidade de produtos.
CREATE VIEW vw_venda_resumo AS
SELECT
  v.id,
  v.numero_venda,
  v.status,
  v.cliente_id,
  v.cliente_nome,
  v.conta_id,
  v.data_criacao,
  v.data_finalizacao,
  COALESCE(SUM(i.quantidade * i.preco_unitario), 0)                     AS subtotal,
  COALESCE(SUM(i.desconto), 0)                                          AS descontos,
  COALESCE(SUM(i.quantidade * i.preco_unitario - i.desconto), 0)        AS valor_total,
  COALESCE(SUM(i.quantidade * (i.preco_unitario - i.custo_unitario) - i.desconto), 0) AS lucro,
  COALESCE(SUM(i.quantidade), 0)                                        AS quantidade_produtos
FROM venda v
LEFT JOIN item_venda i ON i.venda_id = v.id
GROUP BY v.id;

-- ---------------------------------------------------------------------------
-- Entradas e saídas de estoque (venda não entra aqui: ela tem item_venda)
-- ---------------------------------------------------------------------------
CREATE TABLE movimentacao_estoque (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id        INT UNSIGNED NULL,
  tipo              ENUM('ENTRADA', 'SAIDA') NOT NULL,
  quantidade        INT UNSIGNED NOT NULL,
  quantidade_antes  INT UNSIGNED NOT NULL,
  quantidade_depois INT UNSIGNED NOT NULL,
  justificativa     VARCHAR(500) NULL,          -- obrigatória na saída
  nome_produto      VARCHAR(150) NOT NULL,      -- nome da época
  categoria_nome    VARCHAR(80)  NOT NULL,      -- categoria da época
  conta_id          INT UNSIGNED NULL,          -- NOVO: quem registrou
  data              DATE         NOT NULL,
  PRIMARY KEY (id),
  KEY ix_movimentacao_produto (produto_id, data),
  KEY ix_movimentacao_data (data),
  CONSTRAINT fk_movimentacao_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE SET NULL,
  CONSTRAINT fk_movimentacao_conta   FOREIGN KEY (conta_id)   REFERENCES conta (id)   ON DELETE SET NULL,
  CONSTRAINT ck_movimentacao_quantidade CHECK (
    quantidade > 0
    AND ((tipo = 'ENTRADA' AND quantidade_depois = quantidade_antes + quantidade)
      OR (tipo = 'SAIDA'   AND quantidade_depois = quantidade_antes - quantidade))
  ),
  CONSTRAINT ck_movimentacao_justificativa CHECK (
    tipo = 'ENTRADA' OR (justificativa IS NOT NULL AND CHAR_LENGTH(TRIM(justificativa)) > 0)
  )
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Histórico "Cadastro de Produtos": os dados como estavam no cadastro
-- ---------------------------------------------------------------------------
CREATE TABLE produto_cadastro (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  produto_id          INT UNSIGNED  NULL,
  nome                VARCHAR(150)  NOT NULL,
  categoria_nome      VARCHAR(80)   NOT NULL,
  quantidade_inicial  INT UNSIGNED  NOT NULL,
  valor               DECIMAL(10,2) NOT NULL,   -- preço ao consumidor na época
  lucro               DECIMAL(10,2) NOT NULL,   -- lucro unitário (preço ao consumidor − compra) na época
  data                DATE          NOT NULL,
  PRIMARY KEY (id),
  KEY ix_produto_cadastro_produto (produto_id),
  CONSTRAINT fk_produto_cadastro_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Exemplo: carrinho aberto, item com preço da época e finalização sem deixar o estoque negativo.
-- ---------------------------------------------------------------------------
-- INSERT INTO venda (cliente_id, cliente_nome) VALUES (1, 'Eduardo Ribeiro');          -- carrinho (ABERTA)
-- INSERT INTO item_venda (venda_id, produto_id, codigo, nome, categoria_id, categoria_nome,
--                         quantidade, tipo_preco, preco_unitario, custo_unitario)
--   SELECT LAST_INSERT_ID(), p.id, p.codigo_1, p.nome, p.categoria_id, c.nome,
--          1, cl.tipo,
--          IF(cl.tipo = 'EMPRESA', p.preco_empresa, p.preco_consumidor), p.valor_compra
--   FROM produto p JOIN categoria c ON c.id = p.categoria_id
--   JOIN cliente cl ON cl.id = 1 WHERE p.id = 7;                                         -- preço da época
--
-- START TRANSACTION;                                                                   -- finalizar
--   SELECT id, quantidade FROM produto WHERE id IN (SELECT produto_id FROM item_venda WHERE venda_id = :venda) FOR UPDATE;
--   -- se alguma quantidade for menor que a pedida: ROLLBACK e avisar o usuário
--   UPDATE produto p JOIN item_venda i ON i.produto_id = p.id AND i.venda_id = :venda
--      SET p.quantidade = p.quantidade - i.quantidade;
--   SELECT ultimo_numero FROM sequencia_venda WHERE id = 1 FOR UPDATE;                  -- trava o contador
--   UPDATE sequencia_venda SET ultimo_numero = ultimo_numero + 1 WHERE id = 1;
--   UPDATE venda SET status = 'FINALIZADA', data_finalizacao = NOW(),
--          numero_venda = (SELECT ultimo_numero FROM sequencia_venda WHERE id = 1)
--     WHERE id = :venda;
-- COMMIT;

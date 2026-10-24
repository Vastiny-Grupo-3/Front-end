-- Vastiny: esquema do banco de dados (MySQL 8.0.16 ou superior, por causa das restrições CHECK).
-- Modelagem e justificativas: docs/modelagem-dados.md
--
-- Regras que o banco garante:
--   * excluir uma conta remove só o acesso dela; vendas e movimentações ficam (conta_id vira NULL);
--   * o estado do estoque (Crítico, Ruim, Médio, Bom) NÃO é coluna: sai da view vw_produto_estoque;
--   * venda e item de venda guardam preço, lucro e nomes da época (histórico não muda se o produto mudar).

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
-- ---------------------------------------------------------------------------
CREATE TABLE produto (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  codigo               VARCHAR(30)   NOT NULL,
  nome                 VARCHAR(150)  NOT NULL,
  categoria_id         INT UNSIGNED  NOT NULL,
  imagem_url           VARCHAR(500)  NULL,               -- arquivo no storage; hoje o front guarda data URL
  valor_compra         DECIMAL(10,2) NOT NULL,
  valor_venda          DECIMAL(10,2) NOT NULL,
  quantidade           INT UNSIGNED  NOT NULL DEFAULT 0, -- o UNSIGNED impede quantidade negativa
  usa_faixa_categoria  TINYINT(1)    NOT NULL DEFAULT 1,
  faixa_bom            INT UNSIGNED  NULL,
  faixa_medio          INT UNSIGNED  NULL,
  faixa_ruim           INT UNSIGNED  NULL,
  faixa_critico        INT UNSIGNED  NULL,
  ativo                TINYINT(1)    NOT NULL DEFAULT 1, -- NOVO: desativar em vez de apagar quem tem histórico
  criado_em            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produto_codigo (codigo),
  KEY ix_produto_categoria (categoria_id),
  CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,                -- categoria com produtos não pode ser excluída
  CONSTRAINT ck_produto_valores CHECK (valor_compra >= 0 AND valor_venda >= 0),
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
  p.codigo,
  p.nome,
  p.categoria_id,
  c.nome AS categoria_nome,
  p.quantidade,
  p.valor_compra,
  p.valor_venda,
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
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  data_cadastro   DATE         NOT NULL,        -- data em que o cliente foi cadastrado
  data_alteracao  DATE         NOT NULL,        -- igual a data_cadastro na primeira versão
  PRIMARY KEY (id),
  KEY ix_cliente_versao_cliente (cliente_id, data_alteracao),
  CONSTRAINT fk_cliente_versao_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Vendas (imutáveis depois de registradas)
-- ---------------------------------------------------------------------------
CREATE TABLE venda (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  data                DATE          NOT NULL,
  cliente_id          INT UNSIGNED  NULL,       -- venda sem cliente é permitida
  cliente_nome        VARCHAR(120)  NULL,       -- nome da época; sobrevive à exclusão do cliente
  conta_id            INT UNSIGNED  NULL,       -- NOVO: quem registrou
  subtotal            DECIMAL(10,2) NOT NULL,
  descontos           DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total         DECIMAL(10,2) NOT NULL,
  lucro               DECIMAL(10,2) NOT NULL,
  quantidade_produtos INT UNSIGNED  NOT NULL,
  PRIMARY KEY (id),
  KEY ix_venda_data (data),
  KEY ix_venda_cliente (cliente_id),
  CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id) ON DELETE SET NULL,
  CONSTRAINT fk_venda_conta   FOREIGN KEY (conta_id)   REFERENCES conta (id)   ON DELETE SET NULL,
  CONSTRAINT ck_venda_totais CHECK (
    descontos >= 0 AND subtotal >= 0 AND valor_total = subtotal - descontos
  )
) ENGINE=InnoDB;

-- "Foto" da linha no momento da venda: preço, lucro, código e nomes da época.
CREATE TABLE item_venda (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venda_id        INT UNSIGNED  NOT NULL,
  produto_id      INT UNSIGNED  NULL,
  codigo          VARCHAR(30)   NOT NULL,
  nome            VARCHAR(150)  NOT NULL,
  categoria_id    INT UNSIGNED  NULL,
  categoria_nome  VARCHAR(80)   NOT NULL,
  quantidade      INT UNSIGNED  NOT NULL,
  preco_unitario  DECIMAL(10,2) NOT NULL,
  lucro_unitario  DECIMAL(10,2) NOT NULL,       -- pode ser negativo (vender abaixo do custo)
  desconto        DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_linha     DECIMAL(10,2) NOT NULL,       -- quantidade × preco_unitario
  total           DECIMAL(10,2) NOT NULL,       -- valor_linha − desconto
  lucro           DECIMAL(10,2) NOT NULL,       -- quantidade × lucro_unitario − desconto
  PRIMARY KEY (id),
  KEY ix_item_venda_venda (venda_id),
  KEY ix_item_venda_produto (produto_id),
  KEY ix_item_venda_categoria (categoria_id),
  CONSTRAINT fk_item_venda_venda     FOREIGN KEY (venda_id)     REFERENCES venda (id)     ON DELETE CASCADE,
  CONSTRAINT fk_item_venda_produto   FOREIGN KEY (produto_id)   REFERENCES produto (id)   ON DELETE SET NULL,
  CONSTRAINT fk_item_venda_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id) ON DELETE SET NULL,
  CONSTRAINT ck_item_venda_valores CHECK (
    quantidade > 0 AND desconto >= 0 AND desconto <= valor_linha AND total = valor_linha - desconto
  )
) ENGINE=InnoDB;

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
  valor               DECIMAL(10,2) NOT NULL,   -- valor de venda na época
  lucro               DECIMAL(10,2) NOT NULL,   -- lucro unitário na época
  data                DATE          NOT NULL,
  PRIMARY KEY (id),
  KEY ix_produto_cadastro_produto (produto_id),
  CONSTRAINT fk_produto_cadastro_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Exemplo de venda dentro de uma transação, sem deixar o estoque ficar negativo.
-- Trava as linhas dos produtos antes de conferir a quantidade.
-- ---------------------------------------------------------------------------
-- START TRANSACTION;
--   SELECT id, quantidade FROM produto WHERE id IN (7, 4) FOR UPDATE;
--   -- se alguma quantidade for menor que a pedida: ROLLBACK e avisar o usuário
--   INSERT INTO venda (data, cliente_id, cliente_nome, subtotal, descontos, valor_total, lucro, quantidade_produtos)
--     VALUES (CURDATE(), 1, 'Eduardo Ribeiro', 100.00, 0.00, 100.00, 35.00, 2);
--   INSERT INTO item_venda (venda_id, produto_id, codigo, nome, categoria_id, categoria_nome, quantidade,
--                           preco_unitario, lucro_unitario, desconto, valor_linha, total, lucro)
--     VALUES (LAST_INSERT_ID(), 7, 'SQ-001', 'Soquete Lâmpada H7', 3, 'Soquetes', 2, 50.00, 17.50, 0, 100.00, 100.00, 35.00);
--   UPDATE produto SET quantidade = quantidade - 2 WHERE id = 7;
-- COMMIT;

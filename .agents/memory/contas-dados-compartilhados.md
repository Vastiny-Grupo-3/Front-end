---
name: Dados compartilhados entre contas
description: Regra de compartilhamento de dados entre contas no Vastiny.
---

Todas as contas da empresa acessam os mesmos dados de estoque, clientes e vendas; não separar esses dados por conta individual.

**Why:** o usuário confirmou que todas as contas compartilham os dados da empresa e que excluir uma conta remove apenas o acesso dela, preservando os dados.

**How to apply:** considerar essa regra ao definir autenticação, persistência, criação e exclusão de contas. Remover uma conta não deve apagar os dados compartilhados de estoque, clientes ou vendas.

# Contrato da API e plano do back-end

Documento para quem implementa o back-end (repositório `Back-end`, Spring Boot). O front já está pronto para falar com a API deste contrato; o que não existir no back continua funcionando com dados de exemplo (mocks).

- **Modo mock (padrão):** sem a variável `VITE_API_URL`, o site usa os dados de `src/data/` e as contas de `src/data/contas.js`.
- **Modo API:** com `VITE_API_URL` (veja `.env.example`), o login, as contas e os clientes passam a usar a API. Produtos, categorias, vendas, estoque e histórico continuam nos mocks até existirem as rotas.

## O que foi validado no back-end atual

Leitura do código de `vastiny-projeto-corrigido` (não foi executado: não havia MySQL no ambiente de análise).

| # | Achado | Onde | Por que importa |
| --- | --- | --- | --- |
| 1 | Não há login, Spring Security, JWT nem CORS | `pom.xml`, `Controller/` | Sem isso o site não consegue autenticar nem chamar a API pelo navegador |
| 2 | Todos os endpoints estão abertos | `/clientes`, `/usuarios` | Qualquer pessoa lista, cria e apaga contas |
| 3 | Senha gravada em texto puro | `UsuarioService.criar` e `atualizar` | Precisa de hash (BCrypt) |
| 4 | `@Min(6)` aplicado a uma `String` | `UsuarioRequestDto.senha` | `@Min` vale para números; em texto o Bean Validation tende a falhar na hora (erro 500 no `POST /usuarios`). A regra do site é: mínimo de 8 caracteres, com pelo menos uma letra e um número |
| 5 | A resposta de usuário não traz o `id` | `UsuarioResponseDto` | O front precisa do `id` da conta |
| 6 | E-mail sem restrição de unicidade | `Usuario` | Duas contas com o mesmo e-mail |
| 7 | `PUT /usuarios/{id}` regrava a senha recebida sem conferir a atual | `UsuarioService.atualizar` | Qualquer chamada troca a senha de qualquer conta |
| 8 | Senha do MySQL (`root`) escrita e commitada em `application.properties`; comentário com acentos quebrados (arquivo fora de UTF-8) | `application.properties` | Segredo no Git. Trocar a senha e usar variável de ambiente |
| 9 | `Cliente` não tem `descricao` nem `data_cadastro` | `Cliente`, DTOs | O site usa os dois |
| 10 | Excluir cliente que já tem venda deve falhar pela chave estrangeira | `Venda.fkCliente` | Pelas regras do site, a venda continua e o cliente some |
| 11 | Existem entidades sem API: `Categoria`, `Peca`, `ValorPeca`, `Venda`, `ItemVenda`, `Carrinho`, `ItemCarrinho`, `MovimentacaoEstoque` | `entity/` | O site precisa de rotas para produtos, categorias, vendas, estoque e histórico |
| 12 | As entidades divergem de `docs/modelagem-dados.md` (por exemplo: faixa própria do produto, carrinho como venda `ABERTA`, totais calculados) | `entity/` | Alinhar antes de criar as rotas |

## Plano do back-end, na ordem

1. **Segredos fora do Git.** Troque a senha do MySQL e leia usuário, senha e o segredo do JWT de variáveis de ambiente (`${DB_PASSWORD}`, `${JWT_SECRET}` em `application.properties`). Salve o arquivo em UTF-8. O segredo do JWT precisa ter pelo menos 32 caracteres aleatórios.
2. **Corrigir usuário.** Troque `@Min(6)` por `@Size(min = 8)` mais `@Pattern` exigindo ao menos uma letra e um número. Inclua `id` na resposta. Torne o e-mail único (restrição no banco e checagem no serviço, com resposta `409`).
3. **Hash de senha.** Declare um bean `PasswordEncoder` (BCrypt) e use-o ao criar a conta e ao trocar a senha. Contas já criadas com senha em texto precisam ser recriadas.
4. **Dependências.** No `pom.xml`: `spring-boot-starter-security` e uma biblioteca de JWT à sua escolha (por exemplo, o resource server do próprio Spring ou o `jjwt`).
5. **Segurança sem estado.** Configure um `SecurityFilterChain` com sessão `STATELESS`, CSRF desligado (a API usa `Authorization`, não cookie), `POST /auth/login` liberado e todo o resto autenticado. Crie o filtro que lê `Authorization: Bearer <token>`, valida assinatura e validade e coloca o usuário no contexto. Sem token ou token inválido: `401`.
6. **Login.** `POST /auth/login` confere e-mail e senha com o `PasswordEncoder` e devolve o token (formato abaixo). Credencial errada: `401`, sem dizer se foi o e-mail ou a senha.
7. **CORS.** Libere a origem do site (`http://localhost:5173` e `http://localhost:5174` no desenvolvimento; o endereço real em produção), com os métodos `GET`, `POST`, `PUT`, `DELETE` e `OPTIONS`, e os cabeçalhos `Authorization` e `Content-Type`. O CORS precisa estar ligado também no `SecurityFilterChain`, senão o pré-voo (`OPTIONS`) leva `401`.
8. **Erros.** Um `@RestControllerAdvice` que devolva o formato do contrato (abaixo) para validação, e-mail repetido e "não encontrado".
9. **Contas do próprio usuário.** Rotas `/usuarios/me` (formato abaixo). O `id` vem do token, nunca do corpo.
10. **Cliente.** Acrescente `descricao` e `data_cadastro` (data de criação, preenchida pelo serviço). Defina o que acontece ao excluir cliente com venda: `fkCliente` pode virar `NULL` (a venda guarda o nome do cliente) ou a exclusão ser bloqueada com `409`.
11. **Demais rotas** (produto, categoria, venda e carrinho, estoque, histórico), depois de alinhar as entidades à modelagem. O front será ligado a cada uma em uma etapa própria.

## Contrato esperado pelo front

Todas as rotas, menos `POST /auth/login`, exigem `Authorization: Bearer <token>`. Corpo e resposta em JSON.

### Login

`POST /auth/login`

```json
{ "email": "cleber@autoeletrica.test", "senha": "vastiny2026" }
```

Resposta `200`:

```json
{ "token": "<jwt>", "usuario": { "id": 1, "nome": "Cleber", "email": "cleber@autoeletrica.test" } }
```

Credenciais inválidas: `401`.

### Token (JWT)

- Assinatura HS256 (ou equivalente) com o segredo vindo de variável de ambiente.
- Claims: `sub` = id da conta, `email`, `iat` e `exp`. O front lê só o `exp` (em segundos) para saber se o login expirou; sugestão de validade: 2 horas.
- Não há refresh token por enquanto: ao expirar (ou `401`), o front limpa a sessão e volta ao login.

### Contas

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `GET /usuarios/me` | | `200 { id, nome, email }` |
| `PUT /usuarios/me` | `{ nome, email, senhaAtual?, novaSenha? }` | `200 { id, nome, email }`. `novaSenha` exige `senhaAtual` correta (`400 { erros: { senhaAtual } }`) |
| `DELETE /usuarios/me` | `{ senhaAtual }` | `204`. Senha atual errada: `400 { erros: { senhaAtual } }` (não use `401`, que o site trata como sessão vencida). Remove só a conta; estoque, clientes e vendas ficam (as vendas e movimentações da conta ficam com a conta em branco) |
| `POST /usuarios` | `{ nome, email, senha }` | `201 { id, nome, email }` |

Regra de senha (a mesma do site): obrigatória, mínimo de 8 caracteres, com pelo menos uma letra e um número. A confirmação é conferida só no site.

### Clientes

| Rota | Corpo | Resposta |
| --- | --- | --- |
| `GET /clientes` | | `200 [ { id, nome, telefone, descricao, dataCadastro } ]` |
| `GET /clientes/{id}` | | `200 { ... }` ou `404` |
| `POST /clientes` | `{ nome, telefone, descricao }` | `201 { ... }` |
| `PUT /clientes/{id}` | `{ nome, telefone, descricao }` | `200 { ... }` |
| `DELETE /clientes/{id}` | | `204` |

O site já envia `descricao`. Se o back ainda não a guardar, o site a mantém só em memória até recarregar a página.

### Erros

| Situação | Status | Corpo |
| --- | --- | --- |
| Validação | `400` | `{ "erros": { "campo": "mensagem" } }` |
| E-mail já em uso | `409` | `{ "erros": { "email": "Este e-mail já está em uso." } }` |
| Sem token, token inválido ou expirado, credencial errada | `401` | qualquer corpo |
| Não encontrado | `404` | `{ "erro": "Cliente não encontrado" }` |

## O que o site ainda não consegue ligar

- **Descrição e histórico de alterações do cliente:** a descrição é enviada, mas não volta enquanto o back não a guardar. A aba "Alteração de Clientes" precisa de uma tabela de versões (`cliente_versao`, em `docs/modelagem-dados.md`); no modo API ela começa vazia.
- **"Esqueceu sua senha?":** hoje o site gera o código no próprio navegador, o que não é seguro com back real. No modo API o link some. Para ligar, o back precisa de `POST /auth/esqueci-senha` (envia código ou link por e-mail) e `POST /auth/redefinir-senha` (valida o código no servidor e troca a senha).
- **Compras do cliente:** vendas, produtos, categorias, estoque e histórico seguem nos mocks. A coluna "Qtd. Compras" dos clientes da API fica zerada até existirem vendas na API.

## Roteiro de teste do back (curl)

Com o back no ar em `http://localhost:8080` (troque `<token>` pelo valor devolvido no login):

```bash
# 1. login correto devolve 200 e um token; senha errada devolve 401
curl -i -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{"email":"cleber@autoeletrica.test","senha":"vastiny2026"}'

# 2. rota protegida sem token deve devolver 401
curl -i http://localhost:8080/clientes

# 3. com o token deve devolver 200
curl -i http://localhost:8080/clientes -H "Authorization: Bearer <token>"

# 4. pré-voo do CORS: deve devolver 200 com Access-Control-Allow-Origin
curl -i -X OPTIONS http://localhost:8080/clientes -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization"

# 5. senha fraca no cadastro deve devolver 400 com erros.senha
curl -i -X POST http://localhost:8080/usuarios -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"nome":"Teste","email":"t@t.com","senha":"123"}'
```

Para ligar o site: copie `.env.example` para `.env`, ajuste `VITE_API_URL`, reinicie o `npm run dev` e entre com uma conta que exista no banco.

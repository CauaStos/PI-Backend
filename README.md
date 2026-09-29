# PI Backend

API do OnStage: Express + MongoDB. Gerencia comandas, pedidos, produtos,
funcionários e a fila de músicas.

O front-end fica no repositório [PI-Front](https://github.com/CauaStos/PI-Front).

## Requisitos

- Node.js 22.12+ e npm 10.x
- MongoDB 7.x
- Docker e Docker Compose v2 (opcional, só pro caminho do Docker)

Express, Mongoose, Better Auth e o resto das dependências vêm pelo npm.

## Variáveis de ambiente

Antes de rodar, copie o arquivo de exemplo:

```bash
cp .env.example .env
```

| Variável | Utilidade |
| --- | --- |
| `PORT` | Porta da API. O padrão é `3000`. |
| `MONGO_URI` | URL do Mongo. O exemplo usa `mongodb://localhost:27017/onstage` pra rodar local. |
| `BETTER_AUTH_SECRET` | Secret da autenticação. Coloque um valor aleatório com pelo menos 32 caracteres, não use o do exemplo. |
| `BETTER_AUTH_URL` | URL da API usada no login. Por padrão, `http://localhost:3000` no modo local. |
| `FRONTEND_ORIGIN` | URL do front que pode acessar a API. Por padrão, `http://localhost:5173` no modo local. |
| `JWT_ISSUER` | Issuer esperado no JWT. Se vazio, usa `BETTER_AUTH_URL`. |
| `JWT_AUDIENCE` | Audience esperado no JWT. Se vazio, usa `BETTER_AUTH_URL`. |
| `AUTH_PASSWORD_RESET_CONSOLE_URL` | Se `true`, imprime o link de redefinição no console. Só vale fora de produção. |
| `NODE_ENV` | `production` desliga logs de reset e é setado automaticamente no Docker. |
| `BOOTSTRAP_ADMIN_NAME` | Nome do primeiro admin. Se não preencher, fica `Administrador`. |
| `BOOTSTRAP_ADMIN_EMAIL` | Email que você vai usar no primeiro login. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Senha do primeiro admin. Coloque uma com no mínimo 8 caracteres. |

As variáveis `BOOTSTRAP_ADMIN_*` são pro primeiro usuário. Se for usar o Compose, já deixa o email e a senha no `.env`: ele pede os dois mesmo quando você só vai subir a API.

## Como rodar

```bash
npm ci
npm run build --workspace @pi/contracts
npm run dev
```

Com o Mongo rodando e o `.env` pronto, esses comandos instalam as dependências do lockfile, compilam o `@pi/contracts` e sobem a API. Esse pacote já fica no repo do back, não precisa baixar outro projeto.

Ou, se for usar Docker, deixa o `.env` pronto e roda:

```bash
docker compose up -d --build
```

A API sobe em `http://localhost:3000` e as rotas ficam em `/api/v1`.

O Compose sobe o MongoDB 7 na porta `27017` e a API na `3000`, já com a conexão entre eles configurada. Ele também inicia o replica set sozinho. O Mongo precisa do replica set habilitado pra usar transações entre documentos. Ele tem apenas um membro, então não conta como backup.

## Deploy privado na tailnet (Tailscale Serve)

Deploy de uma origem só na porta `3001`. O Compose sobe `mongo`, `api`
(interna, `3000`) e `web` (nginx na `3001`). O `web` serve o `dist` do PI-Front e
faz proxy de `/api` e `/socket.io` para a `api`; o Tailscale Serve termina o
HTTPS do tailnet em `http://127.0.0.1:3001` (somente tailnet, sem Funnel).

1. Build do front (mesma origem; sem `VITE_API_URL` o padrão é `/api/v1`):

   ```bash
   cd ../pi-front && npm ci && npm run build
   ```

2. No `.env` do back, aponte as duas URLs para a origem pública e suba:

   ```bash
   BETTER_AUTH_URL=https://<host>.<tailnet>.ts.net
   FRONTEND_ORIGIN=https://<host>.<tailnet>.ts.net
   docker compose up -d --build
   ```

3. Exponha a `3001` no tailnet:

   ```bash
   tailscale serve --bg 3001
   tailscale serve status
   ```

Com `BETTER_AUTH_URL` e `FRONTEND_ORIGIN` iguais (a origem HTTPS do Serve), o
cookie de sessão, o CORS, o redirect do reset e o `iss`/`aud` do JWT ficam
coerentes. O serviço roda com `NODE_ENV=development` e
`AUTH_PASSWORD_RESET_CONSOLE_URL=true`, então o link de reset sai no
`docker compose logs -f api` (não há SMTP).


## Dados de demonstração

O seed é opcional. **Ele apaga os pedidos, comandas, produtos e funcionários que já estão no banco** e preenche com dados de demonstração. Rode apenas num banco de teste e antes de criar o admin.

Com o Mongo rodando, o `.env` pronto e as dependências instaladas:

```bash
npm run seed
```

ou, com docker:

```bash
docker compose run --rm seed
```

O script cria funcionários, produtos e comandas com pedidos para explorar as telas. Esses funcionários não vêm com senha. Para entrar no app, só seguir o próximo passo.

## Primeiro usuário

Preenchidas as variáveis `BOOTSTRAP_ADMIN_*` e com o Mongo rodando, é só executar:

```bash
npm run bootstrap-admin
```

ou, com docker:

```bash
docker compose run --rm bootstrap-admin
```

O primeiro admin é criado por esse script, porque o cadastro público (`/api/auth/sign-up/email`) cria apenas funcionários com papel `garcom`. Depois é só abrir `http://localhost:5173` e logar com o email e a senha que você colocou no `.env`.

Se o admin já existe, pode rodar de novo que ele não duplica a conta. Não use esse script pra trocar a senha, porque ele não faz isso.

## Autenticação

O login é feito pelo Better Auth em `/api/auth/*`. O contrato com o front é o
padrão da lib:

1. **Cadastro** (`POST /api/auth/sign-up/email`): público, valida e normaliza o
   email (trim + minúsculas) e cria um `Employee` com papel `garcom` vinculado
   (`authUserId`). Papel nunca vem do cliente: `employeeRole` e `role` têm
   `input: false`. Email duplicado responde `409`.
2. **Login** (`POST /api/auth/sign-in/email`): cria a sessão em cookie.
3. **Token JWT** (`GET /api/auth/token`): com a sessão do cookie, devolve
   `{ token }` assinado pelo plugin jwt (`iss`/`aud` = `BETTER_AUTH_URL` por
   padrão, exp de 15 min). O payload inclui `sub` (id do usuário) e
   `sessionId`.
4. **Rotas REST**: tudo em `/api/v1` exige
   `Authorization: Bearer <token>`. O middleware valida assinatura, expiração,
   issuer e audience, confere se a sessão ainda está ativa e busca o
   `Employee` por `sub`. **Cookie não serve como fallback** nessas rotas.
5. **Redefinição de senha** (`POST /api/auth/request-password-reset` e
   `POST /api/auth/reset-password`): métodos padrão do client. Sem SMTP. Para
   ver o link no console em desenvolvimento, use
   `AUTH_PASSWORD_RESET_CONSOLE_URL=true`; em produção nada é logado. O reset
   revoga todas as sessões do usuário (`revokeSessionsOnPasswordReset`).

O cookie de sessão continua existindo para refresh do token e para o handshake
do socket.io (que autentica por cookie). Logout e reset invalidam o JWT porque
a sessão deixa de existir no banco.

### Contrato com o front

Use o client padrão do Better Auth com o plugin jwt. O `authClient` já manda o
cookie de sessão (`credentials: "include"`), então login, `token()` e logout
funcionam sem header extra.

```ts
import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  plugins: [jwtClient()],
})
```

| Ação | Método do client | Rota | Autenticação |
| --- | --- | --- | --- |
| Cadastro | `authClient.signUp.email({ name, email, password })` | `POST /api/auth/sign-up/email` | pública |
| Login | `authClient.signIn.email({ email, password })` | `POST /api/auth/sign-in/email` | pública |
| Access token | `authClient.token()` | `GET /api/auth/token` | cookie de sessão |
| Pedir reset | `authClient.requestPasswordReset({ email })` | `POST /api/auth/request-password-reset` | pública |
| Trocar senha | `authClient.resetPassword({ newPassword, token })` | `POST /api/auth/reset-password` | pública |
| Logout | `authClient.signOut()` | `POST /api/auth/sign-out` | cookie de sessão |

Respostas padrão da lib: cadastro devolve `{ token, user }`; login devolve
`{ redirect, token, url, user }`; `token()` devolve `{ token }`; reset e logout
devolvem `{ status: true }` e `{ success: true }`. Todos chegam embrulhados em
`{ data, error }` pelo client.

Depois do login, pegue o JWT com `authClient.token()` e mande só o Bearer nas
rotas de dados: `Authorization: Bearer ${data.token}`. O cookie não é aceito em
`/api/v1`; ele serve apenas para refresh e para o socket.io. Como o token expira
em 15 minutos e o reset/logout apagam a sessão, trate `401` chamando `token()`
de novo (sessão ainda válida) e, se falhar, refaça o login.

## Scripts úteis

```bash
npm run dev           
npm start              
npm run seed          
npm run bootstrap-admin
npm test              
npm run typecheck      
```

## Swagger e teste rápido

Com a API rodando, abre `http://localhost:3000/api-docs/`. Se mudou a porta do back, muda no endereço também. Os schemas de resposta vêm do Zod, que fica no `@pi/contracts`.

As rotas de dados exigem `Authorization: Bearer <jwt>`. Sem token válido, você
vai tomar `401`. O Swagger marca todas as rotas com o esquema `bearerAuth`.
Depois de rodar o seed e o bootstrap, loga no front, abre uma comanda e adiciona
um pedido pra conferir o fluxo.

Pra rodar os testes do back:

```bash
npm run build --workspace @pi/contracts
npm run typecheck
npm test
```

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

O app não tem tela de cadastro, então o primeiro admin é criado por esse script. Depois é só abrir `http://localhost:5173` e logar com o email e a senha que você colocou no `.env`.

Se o admin já existe, pode rodar de novo que ele não duplica a conta. Não use esse script pra trocar a senha, porque ele não faz isso.

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

As rotas de dados exigem login. Sem sessão, você vai tomar `401`. Depois de rodar o seed e o bootstrap, loga no front, abre uma comanda e adiciona um pedido pra conferir o fluxo.

Pra rodar os testes do back:

```bash
npm run build --workspace @pi/contracts
npm run typecheck
npm test
```

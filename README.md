# PI Backend

API do OnStage: Express + MongoDB. Gerencia comandas, pedidos, produtos,
funcionários e a fila de músicas.

## Requisitos

- Node.js 22+
- MongoDB 

ou Docker pra subir tudo direto.

## Para rodar

```bash
npm install
cp .env.example .env
npm run dev
```

ou, com docker:

```bash
docker compose up -d
```

A API sobe em `http://localhost:3000` e as rotas ficam em `/api/v1`.

O healthcheck inicia o replica set sozinho na primeira subida, não precisa fazer nada.


## Dados de demonstração

```bash
npm run seed
```

ou, com docker:

```bash
docker compose run --rm seed
```


## Primeiro usuário

Para criar o primeiro usuário, é só rodar 

```bash
npm run bootstrap-admin
```

ou, com docker:

```bash
docker compose run --rm bootstrap-admin
```

O app não tem cadastro. Então o primeiro admin tem que ser criado usando o script de bootstrap. O script vai puxar as seguintes configurações do `.env`:

```bash
BETTER_AUTH_SECRET=um-secret-longo
BOOTSTRAP_ADMIN_NAME=Administrador
BOOTSTRAP_ADMIN_EMAIL=admin@exemplo.com
BOOTSTRAP_ADMIN_PASSWORD=senha-de-pelo-menos-8-chars
```

Depois de rodar, é só logar no front com o email e senha.

## Scripts úteis

```bash
npm run dev           
npm start              
npm run seed          
npm run bootstrap-admin
npm test              
npm run typecheck      
```

A doc da API (swagger) fica em `/api-docs`. Os schemas de resposta são gerados direto do schemas do zod (`@pi/contracts`), então ele nunca dessincroniza.

# PI Backend

API em Express com MongoDB.

## Requisitos

- Node.js 22 ou superior
- Uma instancia do MongoDB local ou hospedada

## Rodando localmente

```bash
npm install
cp .env.example .env
npm run dev
```

A API inicia em `http://localhost:3000` por padrao e as rotas ficam em
`/api/v1`.

## Scripts

```bash
npm run dev        # inicia com recarregamento automatico
npm start          # inicia a API
npm run seed       # popula o banco com dados de demonstracao
npm run typecheck  # verifica os tipos TypeScript
```

Configure `PORT` e `MONGO_URI` no `.env`. Veja os valores de exemplo em
`.env.example`.

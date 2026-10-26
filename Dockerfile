FROM node:22-alpine
WORKDIR /app

# Os package.json dos workspaces precisam existir antes do `npm ci`, senao o
# npm nao resolve `packages/contracts` e o install quebra.
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/
RUN npm ci

COPY . .
# O src importa @pi/contracts (dist/index.d.ts), entao contratos primeiro.
RUN npm run build --workspace @pi/contracts
RUN npm run build

# Producao depois do build: nunca loga URLs de reset e nao quebra o tsc.
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm", "start"]

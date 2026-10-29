# Orça — Organizador Financeiro

Um organizador financeiro para controlar entradas, saídas, saldo e despesas do dia a dia.

## O que o projeto faz

- cadastro e login de usuários
- autenticação com JWT
- criptografia de senha com bcrypt
- criação, listagem e exclusão de receitas e despesas
- cálculo de saldo e movimentações por usuário
- API REST com Fastify
- interface em Next.js

## Stack

- Backend: Node.js, Fastify, Prisma, PostgreSQL, Zod, bcrypt
- Frontend: Next.js, React, TypeScript
- Autenticação: JWT
- Testes: Vitest

## Estrutura do projeto

```bash
orca-organizador-financeiro/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   ├── src/
│   │   ├── test/
│   │   └── .env.example
│   └── web/
├── docker-compose.yml
├── package.json
├── README.md
├── insomnia.json
└── scripts/
```

## Como rodar localmente

### 1. Clone o projeto

```bash
git clone https://github.com/fabiolinsdev/Orca-Organizador-Financeiro.git
cd Orca-Organizador-Financeiro
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

Copie o arquivo de exemplo:

```bash
cp apps/api/.env.example apps/api/.env
```

Depois, ajuste o valor do `JWT_SECRET` para uma chave forte, com pelo menos 32 caracteres.

### 4. Suba o banco de dados

```bash
npm run db:up
```

### 5. Gere e aplique as migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. Rode a aplicação

```bash
npm run dev
```

A API vai ficar em:

- http://localhost:3333

O frontend em:

- http://localhost:3000

## Endpoints principais

### Autenticação

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/recovery`

### Movimentações

- `GET /transactions`
- `POST /transactions`
- `DELETE /transactions/:id`

Este projeto foi pensado como uma aplicação prática para aprender e consolidar conceitos de desenvolvimento full stack. Eu usei Node.js, Fastify, Prisma e Next.js para montar uma solução simples, funcional e próxima do que um sistema real de controle financeiro precisa. O foco está em organizar entradas e saídas, manter o saldo em dia e praticar autenticação, validação e integração entre frontend e backend de forma realista.

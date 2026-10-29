# Orça — Organizador Financeiro

Um projeto pessoal feito para aprender, testar ideias e construir algo útil para controlar finanças no dia a dia. A ideia aqui é simples: registrar entradas e saídas, acompanhar o saldo e deixar o processo de organização financeira mais claro.

Eu criei esse projeto como uma forma de praticar backend, autenticação, banco de dados, API REST e também um pouco de front-end em Next.js. É um projeto de estudo, com foco em aprender na prática e deixar as coisas funcionando de verdade.

## O que o projeto faz

- cadastro e login de usuários
- autenticação com JWT
- criptografia de senha com bcrypt
- criação, listagem e exclusão de receitas/despesas
- cálculo de saldo e movimentações por usuário
- API REST com Fastify
- front-end em Next.js

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

## Segurança

Esse projeto foi ajustado para evitar um problema sério de autenticação com JWT.

Antes, a aplicação usava um segredo fraco e opcional, o que permitia que um token pudesse ser forjado caso o valor padrão fosse usado. Agora:

- a aplicação exige um `JWT_SECRET` com pelo menos 32 caracteres
- o token é gerado e validado usando o plugin oficial do Fastify para JWT
- a sessão expira em 12 horas
- as rotas protegidas validam o token antes de liberar acesso

Isso deixa o processo de autenticação bem mais seguro e mais próximo do que seria usado em um projeto real.

## Dicas de estudo

Esse projeto foi pensado para servir como base de aprendizado em:

- arquitetura de APIs REST
- autenticação e autorização
- uso de banco de dados com Prisma
- validação de dados com Zod
- estrutura de monorepo com apps separados
- segurança em aplicações web

Se você está começando, vale a pena estudar cada camada separadamente:

1. API e rotas
2. banco de dados e Prisma
3. autenticação e JWT
4. frontend e integração com a API
5. boas práticas de segurança

## Observação

Este é um projeto de estudo, então o foco está em aprender na prática e melhorar a qualidade do código ao longo do tempo. Qualquer sugestão, melhoria ou correção é bem-vinda.

## Autor

Fábio Lins

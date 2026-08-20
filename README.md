# Orça — Organizador Financeiro

Um organizador financeiro, para auxiliar nos gastos e ajudar no controle do que esta entrando de saldo e saindo, marcando o que foi gasto e com o que foi gasto, atualizando toda vez que for consumido saldo.. feito com **Next.js (App Router) + TypeScript** no frontend e **Node.js + Fastify + PostgreSQL + Prisma** no backend.

## Regras de negócio

- Cadastro web com aceite obrigatório dos Termos de Uso.
- Senha: mínimo de 6 caracteres, uma maiúscula, um número e um caractere especial; há botão para mostrar/ocultar o texto.
- Senha criptografada com Bcrypt; sessão por JWT.
- Depois de 3 falhas, a 4ª tentativa bloqueia a conta e dispara a recuperação (registrada no log do backend; conecte um provedor SMTP para entrega real).
- CRUD de receitas e despesas, totalizadores e saldo.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js, Fastify, PostgreSQL, Prisma, Bcrypt, JWT, Zod e Vitest |
| Frontend | Next.js App Router e TypeScript |

## Executar no VS Code

1. Instale Docker e Docker Compose.
2. Na raiz do projeto, rode `npm install`.
3. Copie `apps/api/.env.example` para `apps/api/.env` e altere o `JWT_SECRET`.
4. Rode `npm run db:up` para iniciar o PostgreSQL em container.
5. Rode `npm run db:generate` e `npm run db:migrate` para criar as tabelas.
6. Rode `npm run dev`.
7. Acesse `http://localhost:3000`. A API estará em `http://localhost:3333/health`.

### Inicializar com um único comando

Depois que as dependências estiverem instaladas (`npm install`), você pode iniciar a API e o servidor estático e abrir o navegador com:

```bash
npm start
```

O `npm start` na raiz executa a API (`apps/api`) e o servidor estático em `static_orca`, além de tentar abrir o navegador e importar a collection `insomnia.json` no Insomnia (se o aplicativo estiver instalado).

## Qualidade e segurança

Os payloads são validados por Zod; as rotas de movimentação precisam de JWT; o backend permite CORS somente para a origem do frontend configurada. Rode `npm test` para os testes Vitest.

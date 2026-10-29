import Fastify from 'fastify';
import cors from '@fastify/cors';
import bcrypt from 'bcrypt';
import jwt from '@fastify/jwt';
import { PrismaClient, TransactionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET deve existir e conter pelo menos 32 caracteres.');
  }

  return secret;
};

const passwordSchema = z
  .string()
  .min(6)
  .regex(/[A-Z]/, 'A senha precisa de uma letra maiúscula.')
  .regex(/\d/, 'A senha precisa de um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha precisa de um caractere especial.');

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const transactionSchema = z.object({
  description: z.string().min(1).max(120),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1).max(50),
  transactionDate: z.string().date(),
});

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  });

  await app.register(jwt, {
    secret: getJwtSecret(),
  });

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const auth = (request.headers?.authorization || '').toString();
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

      if (!token) {
        throw new Error('No token');
      }

      const payload = await request.jwtVerify();
      request.user = { sub: payload.sub, email: payload.email };
    } catch {
      return reply.code(401).send({ error: 'Sessão inválida ou expirada.' });
    }
  });

  const error = (reply: any, issue: unknown) =>
    reply.code(400).send({
      error: issue instanceof z.ZodError ? issue.issues[0].message : 'Dados inválidos.',
    });

  const publicUser = (u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'orca-api',
  }));

  app.get('/transactions', {
    preHandler: (app as any).authenticate,
  }, async (request: any) =>
    prisma.transaction.findMany({
      where: { userId: request.user.sub },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    })
  );

  app.post('/auth/register', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: passwordSchema,
      acceptedTerms: z.literal(true),
    });

    const parsed = schema.safeParse(request.body);

    if (!parsed.success) {
      return error(reply, parsed.error);
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name.trim(),
          email: parsed.data.email.toLowerCase(),
          passwordHash: await bcrypt.hash(parsed.data.password, 12),
        },
      });

      const token = await app.jwt.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '12h' },
      );

      return reply.code(201).send({
        user: publicUser(user),
        token,
      });
    } catch (e: any) {
      return reply.code(e.code === 'P2002' ? 409 : 500).send({
        error: e.code === 'P2002'
          ? 'Já existe uma conta com este e-mail.'
          : 'Não foi possível criar a conta.',
      });
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);

    if (!parsed.success) {
      return error(reply, parsed.error);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user) {
      return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
    }

    if (user.lockedAt) {
      return reply.code(423).send({
        error: 'Conta bloqueada. Enviamos um e-mail para recuperação de senha.',
        locked: true,
      });
    }

    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      const attempts = user.failedAttempts + 1;

      if (attempts >= 4) {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: attempts, lockedAt: new Date() },
        });

        app.log.info(`[E-MAIL SIMULADO] recuperação de senha para ${user.email}`);

        return reply.code(423).send({
          error: 'Conta bloqueada após 4 tentativas. Enviamos um e-mail para recuperação de senha.',
          locked: true,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts },
      });

      return reply.code(401).send({
        error: `E-mail ou senha incorretos. Tentativa ${attempts} de 4.`,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0 },
    });

    return {
      user: publicUser(user),
      token: await app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '12h' }),
    };
  });

  app.post('/auth/recovery', async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body);

    if (!parsed.success) {
      return error(reply, parsed.error);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (user) {
      app.log.info(`[E-MAIL SIMULADO] recuperação de senha para ${user.email}`);
    }

    return {
      message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
    };
  });

  app.post('/transactions', {
    preHandler: (app as any).authenticate,
  }, async (request: any, reply) => {
    const parsed = transactionSchema.safeParse(request.body);

    if (!parsed.success) {
      return error(reply, parsed.error);
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...parsed.data,
        transactionDate: new Date(parsed.data.transactionDate),
        userId: request.user.sub,
        type: parsed.data.type as TransactionType,
      },
    });

    return reply.code(201).send(transaction);
  });

  app.delete('/transactions/:id', {
    preHandler: (app as any).authenticate,
  }, async (request: any, reply) => {
    const item = await prisma.transaction.findFirst({
      where: { id: request.params.id, userId: request.user.sub },
    });

    if (!item) {
      return reply.code(404).send({ error: 'Movimentação não encontrada.' });
    }

    await prisma.transaction.delete({
      where: { id: item.id },
    });

    return reply.code(204).send();
  });

  await app.ready();

  console.log('========== ROTAS REGISTRADAS ==========');
  console.log(app.printRoutes());
  console.log('========================================');

  return app;
};

'use client';

import { FormEvent, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

type User = {
  id: string;
  name: string;
  email: string;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  transactionDate: string;
};

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);

export default function Home() {
  const [isRegister, setRegister] = useState(false);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Transaction[]>([]);
  const [recovery, setRecovery] = useState(false);

  const api = async (path: string, opts: RequestInit = {}) => {
    const response = await fetch(API + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw Error(data?.error || 'Erro na comunicação');
    }

    return data;
  };

  const load = async () => {
    const response = await api('/transactions');
    setItems(response);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('orca-token');
    const savedUser = localStorage.getItem('orca-user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token) {
      load().catch((error) => setMessage(error.message));
    }
  }, [token]);

  const auth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            acceptedTerms: formData.get('terms') === 'on',
          }
        : {
            email: formData.get('email'),
            password: formData.get('password'),
          };

      const data = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('orca-token', data.token);
      localStorage.setItem('orca-user', JSON.stringify(data.user));
      setMessage('');
    } catch (error: any) {
      setMessage(error.message);

      if (error.message.includes('bloqueada')) {
        setRecovery(true);
      }
    }
  };

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      await api('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          description: formData.get('description'),
          amount: Number(formData.get('amount')),
          type: formData.get('type'),
          category: formData.get('category'),
          transactionDate: formData.get('transactionDate'),
        }),
      });

      event.currentTarget.reset();
      load();
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const remove = async (id: string) => {
    await api(`/transactions/${id}`, {
      method: 'DELETE',
    });

    load();
  };

  const totalIncome = items
    .filter((item) => item.type === 'INCOME')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpense = items
    .filter((item) => item.type === 'EXPENSE')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <main className="shell">
      <aside>
        <div>
          <div className="logo">ORÇA</div>
          <h1>Organize suas finanças com clareza.</h1>
          <p>
            Acompanhe receitas, despesas, saldo e metas em uma interface simples e
            objetiva.
          </p>
        </div>
      </aside>

      {!user ? (
        <section className="auth">
          <b>CONTROLE</b>
          <h2>{isRegister ? 'Crie sua conta' : 'Acesse sua conta'}</h2>
          <p>
            {isRegister
              ? 'Cadastre-se para começar a controlar seu dinheiro.'
              : 'Entre com seu e-mail e senha para continuar.'}
          </p>

          <form onSubmit={auth}>
            {isRegister && (
              <label>
                Nome
                <input type="text" name="name" placeholder="Seu nome" required />
              </label>
            )}

            <label>
              E-mail
              <input type="email" name="email" placeholder="seu@email.com" required />
            </label>

            <label>
              Senha
              <div className="password">
                <input
                  type={show ? 'text' : 'password'}
                  name="password"
                  placeholder="Sua senha"
                  required
                />
                <button type="button" onClick={() => setShow((current) => !current)}>
                  {show ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>

            {isRegister && (
              <label className="terms">
                <input type="checkbox" name="terms" />
                Aceito os termos de uso.
              </label>
            )}

            <button type="submit">
              {isRegister ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div className="error">{message}</div>

          {recovery && (
            <button type="button" className="link" onClick={() => setRecovery(false)}>
              Recuperar acesso
            </button>
          )}

          <button
            type="button"
            className="link"
            onClick={() => {
              setRegister((current) => !current);
              setMessage('');
              setRecovery(false);
            }}
          >
            {isRegister ? 'Já tenho conta' : 'Criar uma conta'}
          </button>
        </section>
      ) : (
        <section className="dashboard">
          <header>
            <div>
              <b>PAINEL</b>
              <h1>Olá, {user.name}</h1>
            </div>
            <button
              type="button"
              className="link"
              onClick={() => {
                setUser(null);
                setToken('');
                setItems([]);
                localStorage.removeItem('orca-token');
                localStorage.removeItem('orca-user');
              }}
            >
              Sair
            </button>
          </header>

          <div className="cards">
            <article>
              <span>Receitas</span>
              <strong className="green">{money(totalIncome)}</strong>
            </article>
            <article>
              <span>Despesas</span>
              <strong className="red">{money(totalExpense)}</strong>
            </article>
            <article>
              <span>Saldo</span>
              <strong className={balance >= 0 ? 'green' : 'red'}>{money(balance)}</strong>
            </article>
          </div>

          <form onSubmit={add}>
            <label>
              Descrição
              <input type="text" name="description" placeholder="Ex: salário" required />
            </label>

            <label>
              Valor
              <input type="number" name="amount" step="0.01" min="0.01" required />
            </label>

            <label>
              Tipo
              <select name="type" defaultValue="INCOME">
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </select>
            </label>

            <label>
              Categoria
              <input type="text" name="category" placeholder="Ex: Alimentação" required />
            </label>

            <label>
              Data
              <input type="date" name="transactionDate" required />
            </label>

            <button type="submit">Adicionar movimentação</button>
          </form>

          <div className="error">{message}</div>

          <div className="list">
            {items.map((item) => (
              <div key={item.id} className="item">
                <div>
                  <strong>{item.description}</strong>
                  <span>
                    {item.category} • {new Date(item.transactionDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className={item.type === 'INCOME' ? 'green' : 'red'}>
                  {item.type === 'INCOME' ? '+' : '-'}
                  {money(Number(item.amount))}
                </div>
                <button type="button" className="link danger" onClick={() => remove(item.id)}>
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

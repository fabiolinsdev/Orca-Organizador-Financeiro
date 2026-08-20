const API = 'http://localhost:3333';

type User = { id: string; name: string; email: string };

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('orca-token') || '';
  const headers = Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {});
  const res = await fetch(API + path, Object.assign({ headers }, opts));
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Erro na comunicação');
  return data;
}

function LoginRegister() {
  const [isRegister, setIsRegister] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const f = new FormData(form);
    try {
      if (isRegister) {
        const body = {
          name: f.get('name'),
          email: f.get('email'),
          password: f.get('password'),
          acceptedTerms: f.get('terms') === 'on',
        };
        const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(body) });
        localStorage.setItem('orca-token', data.token);
        localStorage.setItem('orca-user', JSON.stringify(data.user));
        renderApp();
      } else {
        const body = { email: f.get('email'), password: f.get('password') };
        const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(body) });
        localStorage.setItem('orca-token', data.token);
        localStorage.setItem('orca-user', JSON.stringify(data.user));
        renderApp();
      }
    } catch (err: any) {
      setMsg(err.message || String(err));
    }
  }

  return (
    <section className="auth">
      <b>CONTROLE</b>
      <h2>{isRegister ? 'Crie sua conta' : 'Acesse sua conta'}</h2>
      <p>{isRegister ? 'Cadastre-se para começar a controlar seu dinheiro.' : 'Entre com seu e-mail e senha para continuar.'}</p>
      <form onSubmit={submit}>
        {isRegister && (
          <label>
            Nome
            <input name="name" type="text" required />
          </label>
        )}

        <label>
          E-mail
          <input name="email" type="email" required />
        </label>

        <label>
          Senha
          <div className="password">
            <input name="password" type={showPass ? 'text' : 'password'} required />
            <button type="button" onClick={() => setShowPass((s) => !s)}>{showPass ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </label>

        {isRegister && (
          <label className="terms">
            <input name="terms" type="checkbox" /> Aceito os termos de uso.
          </label>
        )}

        <button type="submit">{isRegister ? 'Cadastrar' : 'Entrar'}</button>
      </form>
      <div className="error">{msg}</div>
      <button className="link" onClick={() => { setIsRegister((v) => !v); setMsg(''); }}>{isRegister ? 'Já tenho conta' : 'Criar uma conta'}</button>
    </section>
  );
}

function Dashboard() {
  const [user, setUser] = React.useState<User | null>(() => JSON.parse(localStorage.getItem('orca-user') || 'null'));
  const [items, setItems] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    try {
      const resp = await api('/transactions');
      setItems(resp);
    } catch (e: any) { setMsg(e.message); }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    try {
      await api('/transactions', { method: 'POST', body: JSON.stringify({ description: f.get('description'), amount: Number(f.get('amount')), type: f.get('type'), category: f.get('category'), transactionDate: f.get('transactionDate') }) });
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err: any) { setMsg(err.message); }
  }

  async function remove(id: string) { await api('/transactions/' + id, { method: 'DELETE' }); load(); }

  const income = items.filter((i) => i.type === 'INCOME').reduce((s, i) => s + Number(i.amount), 0);
  const expense = items.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <section className="dashboard">
      <header>
        <div><b>PAINEL</b><h1>Olá, {user?.name}</h1></div>
        <button className="link" onClick={() => { localStorage.removeItem('orca-token'); localStorage.removeItem('orca-user'); renderApp(); }}>Sair</button>
      </header>

      <div className="cards">
        <article><span>Receitas</span><strong className="green">{money(income)}</strong></article>
        <article><span>Despesas</span><strong className="red">{money(expense)}</strong></article>
        <article><span>Saldo</span><strong className={income - expense >= 0 ? 'green' : 'red'}>{money(income - expense)}</strong></article>
      </div>

      <form onSubmit={add}>
        <label>Descrição<input name="description" required /></label>
        <label>Valor<input name="amount" type="number" step="0.01" min="0.01" required /></label>
        <label>Tipo<select name="type" defaultValue="INCOME"><option value="INCOME">Receita</option><option value="EXPENSE">Despesa</option></select></label>
        <label>Categoria<input name="category" required /></label>
        <label>Data<input name="transactionDate" type="date" required /></label>
        <button type="submit">Adicionar movimentação</button>
      </form>

      <div className="error">{msg}</div>

      <div className="list">{items.map((it: any) => (
        <div key={it.id} className="item">
          <div><strong>{it.description}</strong><span>{it.category} • {new Date(it.transactionDate).toLocaleDateString()}</span></div>
          <div className={it.type === 'INCOME' ? 'green' : 'red'}>{it.type === 'INCOME' ? '+' : '-'}{money(Number(it.amount))}</div>
          <button className="link danger" onClick={() => remove(it.id)}>Excluir</button>
        </div>
      ))}</div>
    </section>
  );
}

function App() {
  const token = localStorage.getItem('orca-token');
  return token ? React.createElement(Dashboard) : React.createElement(LoginRegister);
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root-react')!).render(React.createElement(App));
}

renderApp();

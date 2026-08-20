// Runtime single-file app using React.createElement (no JSX)
const API = 'http://localhost:3333';

const money = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

async function api(path, opts = {}) {
  const token = localStorage.getItem('orca-token') || '';
  const headers = Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {});
  const res = await fetch(API + path, Object.assign({ headers }, opts));
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Erro na comunicação');
  return data;
}

const h = React.createElement;

function LoginRegister() {
  const [isRegister, setIsRegister] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      if (isRegister) {
        const body = { name: f.get('name'), email: f.get('email'), password: f.get('password'), acceptedTerms: f.get('terms') === 'on' };
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
    } catch (err) { setMsg(err.message || String(err)); }
  }

  return h('section', { className: 'auth' },
    h('b', null, 'CONTROLE'),
    h('h2', null, isRegister ? 'Crie sua conta' : 'Acesse sua conta'),
    h('p', null, isRegister ? 'Cadastre-se para começar a controlar seu dinheiro.' : 'Entre com seu e-mail e senha para continuar.'),
    h('form', { onSubmit: submit },
      isRegister && h('label', null, 'Nome', h('input', { name: 'name', type: 'text', required: true })),
      h('label', null, 'E-mail', h('input', { name: 'email', type: 'email', required: true })),
      h('label', null, 'Senha', h('div', { className: 'password' }, h('input', { name: 'password', type: showPass ? 'text' : 'password', required: true }), h('button', { type: 'button', onClick: () => setShowPass((s) => !s) }, showPass ? 'Ocultar' : 'Mostrar'))),
      isRegister && h('label', { className: 'terms' }, h('input', { name: 'terms', type: 'checkbox' }), ' Aceito os termos de uso.'),
      h('button', { type: 'submit' }, isRegister ? 'Cadastrar' : 'Entrar')
    ),
    h('div', { className: 'error' }, msg),
    h('button', { className: isRegister ? 'link' : 'link highlight', onClick: () => { setIsRegister((v) => !v); setMsg(''); } }, isRegister ? 'Já tenho conta' : 'Criar uma conta')
  );
}

function Dashboard() {
  const [user] = React.useState(() => JSON.parse(localStorage.getItem('orca-user') || 'null'));
  const [items, setItems] = React.useState([]);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => { if (user) load(); }, [user]);

  async function load() { try { const resp = await api('/transactions'); setItems(resp || []); } catch (e) { setMsg(e.message || String(e)); } }

  async function add(e) { e.preventDefault(); const f = new FormData(e.target); try { await api('/transactions', { method: 'POST', body: JSON.stringify({ description: f.get('description'), amount: Number(f.get('amount')), type: f.get('type'), category: f.get('category'), transactionDate: f.get('transactionDate') }) }); e.target.reset(); load(); } catch (err) { setMsg(err.message || String(err)); } }

  async function remove(id) { await api('/transactions/' + id, { method: 'DELETE' }); load(); }

  const income = items.filter((i) => i.type === 'INCOME').reduce((s, i) => s + Number(i.amount), 0);
  const expense = items.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + Number(i.amount), 0);

  return h('section', { className: 'dashboard' },
    h('header', null, h('div', null, h('b', null, 'PAINEL'), h('h1', null, 'Olá, ' + (user && user.name))), h('button', { className: 'link', onClick: () => { localStorage.removeItem('orca-token'); localStorage.removeItem('orca-user'); renderApp(); } }, 'Sair')),
    h('div', { className: 'cards' }, h('article', null, h('span', null, 'Receitas'), h('strong', { className: 'green' }, money(income))), h('article', null, h('span', null, 'Despesas'), h('strong', { className: 'red' }, money(expense))), h('article', null, h('span', null, 'Saldo'), h('strong', { className: income - expense >= 0 ? 'green' : 'red' }, money(income - expense)))),
    h('form', { onSubmit: add }, h('label', null, 'Descrição', h('input', { name: 'description', required: true })), h('label', null, 'Valor', h('input', { name: 'amount', type: 'number', step: '0.01', min: '0.01', required: true })), h('label', null, 'Tipo', h('select', { name: 'type', defaultValue: 'INCOME' }, h('option', { value: 'INCOME' }, 'Receita'), h('option', { value: 'EXPENSE' }, 'Despesa'))), h('label', null, 'Categoria', h('input', { name: 'category', required: true })), h('label', null, 'Data', h('input', { name: 'transactionDate', type: 'date', required: true })), h('button', { type: 'submit' }, 'Adicionar movimentação')),
    h('div', { className: 'error' }, msg),
    h('div', { className: 'list' }, items.map((it) => h('div', { key: it.id, className: 'item' }, h('div', null, h('strong', null, it.description), h('span', null, it.category + ' • ' + new Date(it.transactionDate).toLocaleDateString())), h('div', { className: it.type === 'INCOME' ? 'green' : 'red' }, (it.type === 'INCOME' ? '+' : '-') + money(Number(it.amount))), h('button', { className: 'link danger', onClick: () => remove(it.id) }, 'Excluir'))))
  );
}

function App() { const token = localStorage.getItem('orca-token'); return token ? h(Dashboard) : h(LoginRegister); }

function renderApp() {
  let target = document.getElementById('root-react');
  const placeholder = document.getElementById('root');
  if (placeholder) {
    const parent = placeholder.parentNode;
    const newRoot = document.createElement('div');
    newRoot.id = 'root-react';
    parent.replaceChild(newRoot, placeholder);
    target = newRoot;
  }
  ReactDOM.createRoot(target).render(h(App));
}

renderApp();

import { promises as fs } from 'fs';
import path from 'path';

function parseArgs(): Record<string,string> {
  const args = process.argv.slice(2);
  const out: Record<string,string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i+1] && !args[i+1].startsWith('--') ? args[++i] : 'true';
      out[k] = v;
    }
  }
  return out;
}

async function main() {
  const argv = parseArgs();
  const name = argv.name || 'Maria Silva';
  const email = argv.email || 'maria@example.com';
  const password = argv.password || 'Orca@2026';
  const baseUrl = argv.base_url || 'http://localhost:3333';

  const body = { name, email, password, acceptedTerms: true };

  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Request failed', res.status, json);
      process.exitCode = 2;
      return;
    }

    const token = json.token;
    if (!token) {
      console.error('No token returned:', json);
      process.exitCode = 3;
      return;
    }

    const insomniaPath = path.resolve(process.cwd(), 'insomnia.json');
    const file = await fs.readFile(insomniaPath, 'utf8');
    const data = JSON.parse(file);
    let updated = false;
    for (const r of data.resources || []) {
      if (r._type === 'environment' && r.name === 'Base Environment') {
        r.data = r.data || {};
        r.data.token = token;
        updated = true;
      }
    }

    if (!updated) {
      data.resources = data.resources || [];
      data.resources.push({
        _id: 'env_orca',
        parentId: null,
        modified: 0,
        created: 0,
        name: 'Base Environment',
        data: { base_url: baseUrl, token },
        _type: 'environment',
      });
    }

    await fs.writeFile(insomniaPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Token saved to insomnia.json Base Environment');
    console.log('token:', token);
  } catch (e: any) {
    console.error('Error:', e?.message || e);
    process.exitCode = 1;
  }
}

main();

#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const email = process.argv[2] || 'maria@example.com';
  const password = process.argv[3] || 'Orca@2026';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3333';

  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Login falhou', res.status, json);
      process.exitCode = 2;
      return;
    }

    const token = json.token;
    if (!token) {
      console.error('Nenhum token retornado', json);
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
    console.log('Token salvo em insomnia.json');
    console.log(token);
  } catch (e) {
    console.error('Erro:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
}

main();

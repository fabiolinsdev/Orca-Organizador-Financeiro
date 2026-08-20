const fs = require('fs');
const path = require('path');

const inPath = path.resolve(__dirname, '..', 'static_orca', 'app.tsx');
const outPath = path.resolve(__dirname, '..', 'static_orca', 'app.jsx');

let src = fs.readFileSync(inPath, 'utf8');

// 1) Remove `type ... = { ... };` blocks
src = src.replace(/type\s+\w+\s*=\s*{[\s\S]*?};?/g, '');

// 2) Remove ' as Type' casts
src = src.replace(/\s+as\s+[A-Za-z0-9_<>\[\]\s|]+/g, '');

// 3) Replace React.useState<...> and useState<...>
src = src.replace(/React\.useState<[^>]+>/g, 'React.useState');
src = src.replace(/useState<[^>]+>/g, 'useState');

// 4) Remove parameter type annotations inside parentheses: (a: string, b: number) -> (a, b)
src = src.replace(/\(([^)]*)\)/g, (m, inner) => {
  const parts = inner.split(',').map(p => p.replace(/\s*([A-Za-z0-9_\$]+)\s*:\s*[^,=)]+/, (pm, name) => name).trim ? pTrim(p) : p);
  function pTrim(s) { return s.trim().replace(/\s*([A-Za-z0-9_\$]+)\s*:\s*[^,=)]+/, '$1'); }
  try { return '(' + inner.split(',').map(s => s.replace(/\s*([A-Za-z0-9_\$]+)\s*:\s*[^,=)]+/, '$1').trim()).join(', ') + ')'; } catch (e) { return m; }
});

// 5) Remove return type annotations: ) : Type => )
src = src.replace(/\)\s*:\s*[A-Za-z0-9_<>\[\]\s|?]+/g, ')');

// 6) Remove remaining simple `: type` annotations (e.g. const x: number = ...) but avoid object literals
src = src.replace(/(:\s*(number|string|any|boolean|RequestInit|React\.FormEvent|JSX\.Element|unknown|\w+\[\]))/g, '');

// 7) Remove non-exported TS-only angle generics in variable declarations like useState<User | null>
src = src.replace(/<\s*[^>]+\s*>/g, '');

// 8) Tidy up accidental double commas or spacing
src = src.replace(/,\s*,/g, ',');

fs.writeFileSync(outPath, src, 'utf8');
console.log('Wrote', outPath);

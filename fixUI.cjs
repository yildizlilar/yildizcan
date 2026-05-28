
const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

c = c.replace(/<span className=\{\`text-\[11px\] font-bold px-3 py-1 rounded-lg \$\{[^}]+\}\`\}>\s*\{course\.difficulty\}\s*<\/span>/g, '');
c = c.replace(/<span className=\{\`text-\[11px\] font-bold px-3 py-1 rounded-lg \$\{[^}]+\}\`\}>\s*\{difficulty\}\s*<\/span>/g, '');
c = c.replace(/<span className=\{\`text-\[10px\] font-bold px-2 py-1 rounded-full \$\{[^}]+\}\`\}>\s*\{prof\.tag\}\s*<\/span>/g, '');
c = c.replace(/<span className=\{\`text-\[10px\] font-bold px-2 py-1 rounded-full \$\{[^}]+\}\`\}>\s*\{tag\}\s*<\/span>/g, '');

fs.writeFileSync('src/App.tsx', c);

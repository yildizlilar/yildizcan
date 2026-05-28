const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

c = c.replace(/<div className="pt-4">\s*<div className="relative flex py-2 items-center">[\s\S]*?<\/svg>\s*Google ile \{authTab === 'login' \? 'Giriş Yap' : 'Kayıt Ol'\}\s*<\/button>\s*<\/div>\s*/, '');

fs.writeFileSync('src/App.tsx', c);

const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /if \(authTab === 'login'\) \{\s*userEmail = authUsername\.includes\('@'\) \? authUsername : `\$\{authUsername\}@std\.yildiz\.edu\.tr`;\s*await signInWithEmailAndPassword\(auth, userEmail, authPassword\);\s*setAuthRole\('student'\);\s*setActiveScreen\('home'\);\s*showToast\('Giriş Başarılı!'\);\s*\} else \{/;

const newLogic = `if (authTab === 'login') {
                    userEmail = authUsername.includes('@') ? authUsername : \`\${authUsername}@std.yildiz.edu.tr\`;
                    await signInWithEmailAndPassword(auth, userEmail, authPassword);
                    const userRole = (userEmail.toLowerCase() === 'admin@std.yildiz.edu.tr' || userEmail.toLowerCase() === 'muhammedensarozketen@gmail.com') ? 'admin' : 'student';
                    setAuthRole(userRole);
                    setActiveScreen('home');
                    showToast('Giriş Başarılı!');
                  } else {`;
                  
c = c.replace(regex, newLogic);
fs.writeFileSync('src/App.tsx', c);

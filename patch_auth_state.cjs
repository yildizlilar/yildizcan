const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const oldImports = `import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';`;

const newImports = `import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut
} from 'firebase/auth';`;

c = c.replace(oldImports, newImports);

const authEffect = `  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthRole('student');
      } else if (authRole === 'student') {
        setAuthRole('guest');
      }
    });
    return () => unsubscribe();
  }, [authRole]);

  useEffect(() => {
    localStorage.setItem('ytu_iibf_courses', JSON.stringify(courses));\n`;

c = c.replace(/  useEffect\(\(\) => \{\n    localStorage\.setItem\('ytu_iibf_courses', JSON\.stringify\(courses\)\);\n/, authEffect);

const profileDisplayName = `{currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yıldız Öğrencisi'}`;
const profileEmail = `{currentUser ? currentUser.email : INITIAL_USER.email}`;

// Replace names and emails
c = c.replace(/>Ahmet Yılmaz</g, `>{currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yıldız Öğrencisi'}<`);
c = c.replace(/"Ahmet Yılmaz /g, `"{currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yıldız Öğrencisi'} `);
c = c.replace(/'Ahmet Yılmaz /g, `'{currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yıldız Öğrencisi'} `);

c = c.replace(/\{INITIAL_USER\.email\}/g, profileEmail);

c = c.replace(/setAuthRole\('guest'\);\n\s*setActiveScreen\('home'\);\n\s*showToast\('Hızlı çıkış başarılı\.'\);/, 
  `signOut(auth).then(() => {
                setAuthRole('guest');
                setActiveScreen('home');
                showToast('Hızlı çıkış başarılı.');
              }).catch(() => showToast('Çıkış yapılamadı, lütfen tekrar deneyin.', 'error'));`);

c = c.replace(/setAuthRole\('guest'\); setActiveScreen\('home'\); showToast\('Çıkış yapıldı\.'\);/g, 
  `signOut(auth).then(() => { setAuthRole('guest'); setActiveScreen('home'); showToast('Çıkış yapıldı.'); })`);

fs.writeFileSync('src/App.tsx', c);

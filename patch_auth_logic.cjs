const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const oldAuthForm = `<form onSubmit={(e) => {
                e.preventDefault();
                setAuthRole('student');
                setActiveScreen('profile');
                showToast(authTab === 'login' ? 'Giriş Başarılı!' : 'Kayıt Başarılı! Hoş Geldiniz.');
              }} className="space-y-4">`;

const newAuthForm = `<form onSubmit={async (e) => {
                e.preventDefault();
                setAuthError('');
                setAuthLoading(true);
                
                try {
                  const userEmail = \`\${authEmailPrefix}@std.yildiz.edu.tr\`;

                  if (authTab === 'login') {
                    await signInWithEmailAndPassword(auth, userEmail, authPassword);
                    setAuthRole('student');
                    setActiveScreen('home');
                    showToast('Giriş Başarılı!');
                  } else {
                    const userCred = await createUserWithEmailAndPassword(auth, userEmail, authPassword);
                    if (userCred.user && authUsername) {
                      await updateProfile(userCred.user, { displayName: authUsername });
                    }
                    setAuthRole('student');
                    setActiveScreen('home');
                    showToast('Kayıt Başarılı! Hoş Geldiniz.');
                  }
                } catch (error: any) {
                  console.error("Auth error:", error);
                  let errorMsg = 'Kimlik doğrulama işlemi sırasında bir hata oluştu.';
                  if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMsg = 'E-posta adresi veya şifre hatalı.';
                  } else if (error.code === 'auth/email-already-in-use') {
                    errorMsg = 'Bu e-posta adresi ile zaten kayıt olunmuş.';
                  } else if (error.code === 'auth/weak-password') {
                    errorMsg = 'Şifre çok zayıf. En az 6 karakterli bir şifre belirleyin.';
                  } else if (error.code === 'auth/invalid-email') {
                    errorMsg = 'Geçersiz e-posta formatı.';
                  }
                  setAuthError(errorMsg);
                } finally {
                  setAuthLoading(false);
                }
                
              }} className="space-y-4">
                
                {authError && (
                  <div className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}`;

c = c.replace(oldAuthForm, newAuthForm);

const oldLoginBtn = `{authTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>`;

const newLoginBtn = `{authLoading ? 'Lütfen Bekleyin...' : (authTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
                  </button>`;
c = c.replace(oldLoginBtn, newLoginBtn);

fs.writeFileSync('src/App.tsx', c);

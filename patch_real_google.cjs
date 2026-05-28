const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3\.5 rounded-xl transition-all shadow-md active:scale-\[0\.98\]">\s*\{authLoading \? 'Lütfen Bekleyin\.\.\.' : \(authTab === 'login' \? 'Giriş Yap' : 'Kayıt Ol'\)\}\s*<\/button>\s*<\/div>\s*<\/form>/;

const googleLogic = `<button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]">
                    {authLoading ? 'Lütfen Bekleyin...' : (authTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
                  </button>
                </div>
                <div className="pt-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-text-muted text-xs font-bold">VEYA</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                  <button type="button" onClick={async () => {
                     setAuthError('');
                     setAuthLoading(true);
                     try {
                       const provider = new GoogleAuthProvider();
                       const result = await signInWithPopup(auth, provider);
                       const user = result.user;
                       // if their email is the specific one, set role as admin!
                       const userRole = user.email === 'Muhammedensarozketen@gmail.com' ? 'admin' : 'student';
                       try {
                         await setDoc(doc(db, 'users', user.uid), {
                            email: user.email,
                            name: user.displayName || 'İsimsiz',
                            role: userRole,
                            joinDate: new Date().toLocaleDateString('tr-TR'),
                            totalUploads: 0
                         }, { merge: true });
                       } catch(err) {} 
                       setAuthRole(userRole);
                       setActiveScreen('home');
                       showToast('Google ile Giriş Başarılı!');
                     } catch(err: any) {
                       console.error(err);
                       setAuthError('Google girişi sırasında hata: ' + (err.message || ''));
                     } finally {
                       setAuthLoading(false);
                     }
                  }} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-800 hover:border-primary hover:text-primary font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] mt-2">
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Google ile {authTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>
                </div>
              </form>`;

if(regex.test(c)) {
  c = c.replace(regex, googleLogic);
  fs.writeFileSync('src/App.tsx', c);
} else {
  console.log("NOT FOUND ERROR");
}


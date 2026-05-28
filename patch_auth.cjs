const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const authScreenStr = `
        {/* ==================== SCREEN: AUTH ("Giriş / Kayıt") ==================== */}
        {activeScreen === 'auth' && (
          <div className="animate-fade-in flex flex-col items-center justify-center pt-8 md:pt-16 max-w-md mx-auto w-full">
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 w-full relative">
            
              <button 
                onClick={() => setActiveScreen('home')}
                className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors"
                title="Kapat"
              >
                <X size={20} />
              </button>

              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-2">
                  <Lock size={28} />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button 
                  onClick={() => setAuthTab('login')}
                  className={\`flex-1 pb-3 text-sm font-bold transition-all relative \${authTab === 'login' ? 'text-primary' : 'text-text-muted hover:text-primary'}\`}
                >
                  Giriş Yap
                  {authTab === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                </button>
                <button 
                  onClick={() => setAuthTab('register')}
                  className={\`flex-1 pb-3 text-sm font-bold transition-all relative \${authTab === 'register' ? 'text-primary' : 'text-text-muted hover:text-primary'}\`}
                >
                  Kayıt Ol
                  {authTab === 'register' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setAuthRole('student');
                setActiveScreen('profile');
                showToast(authTab === 'login' ? 'Giriş Başarılı!' : 'Kayıt Başarılı! Hoş Geldiniz.');
              }} className="space-y-4">
                
                <div>
                  <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">E-posta</label>
                  <div className="flex items-stretch">
                    <input 
                      type="text"
                      required
                      placeholder="g201200000"
                      value={authEmailPrefix}
                      onChange={(e) => setAuthEmailPrefix(e.target.value)}
                      className="flex-1 w-full min-w-0 bg-background-gray border border-gray-200 focus:border-primary px-3 py-3 text-sm rounded-l-xl outline-none transition-colors"
                    />
                    <div className="bg-gray-100 border border-l-0 border-gray-200 px-3 flex items-center justify-center rounded-r-xl text-primary font-bold text-xs select-none">
                      @std.yildiz.edu.tr
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">Şifre</label>
                  <input 
                    type="password"
                    required
                    placeholder="········"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]">
                    {authTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
`;

c = c.replace(/\s*\{\/\* ==================== SCREEN 1: HOME PAGE ==================== \*\/\}/, '\n' + authScreenStr + '\n\n        {/* ==================== SCREEN 1: HOME PAGE ==================== */}');

fs.writeFileSync('src/App.tsx', c);

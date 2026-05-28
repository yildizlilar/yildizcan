const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const accountsListStr = `                {selectedAdminTab === 'accounts' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-display font-extrabold text-sm text-primary uppercase tracking-wider">
                         Sistemdeki Hesaplar
                       </h3>
                       <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
                         {MOCK_ACCOUNTS.length} Hesap
                       </span>
                    </div>
                    <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                      {MOCK_ACCOUNTS.map(acc => (
                        <div
                          key={acc.id}
                          onClick={() => setActiveAccount(acc)}
                          className={\`group p-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md border-2 text-left space-y-2 \${
                            activeAccount?.id === acc.id 
                                ? 'border-primary bg-primary/2' 
                                : 'border-gray-100 hover:border-gray-200'
                          }\`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-primary">{acc.name}</span>
                            <span className={\`text-[10px] px-2 py-0.5 rounded font-bold \${acc.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}\`}>
                              {acc.role === 'admin' ? 'Yönetici' : 'Öğrenci'}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">{acc.email}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
`;

c = c.replace(/\{\/\* Right main display page: Details editor and validations \*\/\}/, accountsListStr + '              {/* Right main display page: Details editor and validations */}');

const accountsDetailStr = `              {selectedAdminTab === 'accounts' && activeAccount && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-scale-up p-8 text-center space-y-6">
                  <div className="w-24 h-24 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <User size={48} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-extrabold text-primary">{activeAccount.name}</h2>
                    <p className="text-sm font-semibold text-text-muted">{activeAccount.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Hesap Türü</span>
                      <span className="font-bold text-primary text-sm">{activeAccount.role === 'admin' ? 'Yönetici' : 'Öğrenci'}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Katılım Tarihi</span>
                      <span className="font-bold text-primary text-sm">{activeAccount.joinDate}</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Toplam Paylaşım</span>
                      <span className="font-bold text-primary text-sm">{activeAccount.totalUploads} Çan</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Hesap Durumu</span>
                        <span className="font-bold text-emerald-600 text-sm">Aktif</span>
                      </div>
                      <button onClick={() => showToast('Bu özellik henüz aktif değil', 'error')} className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded hover:bg-rose-100 transition-colors">Yasakla</button>
                    </div>
                  </div>
                </div>
              )}
              {selectedAdminTab === 'accounts' && !activeAccount && (
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center animate-fade-in flex flex-col items-center mt-4">
                    <User size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-sm font-bold text-text-muted">Ayrıntıları görmek için bir hesap seçin.</h3>
                 </div>
              )}
`;

c = c.replace(/<section className="lg:col-span-8">\n/, '<section className="lg:col-span-8">\n' + accountsDetailStr);

fs.writeFileSync('src/App.tsx', c);

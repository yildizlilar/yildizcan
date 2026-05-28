const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

c = c.replace(/<span className=\"font-bold text-sm text-primary\">\{acc\.name\}<\/span>\s*\{\s*selectedAdminTab === 'accounts'/g, 
  `<span className="font-bold text-sm text-primary">{acc.name}</span>
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
              {/* Right main display page: Details editor and validations */}
              <section className="lg:col-span-8">
                                     {selectedAdminTab === 'accounts'`);

fs.writeFileSync('src/App.tsx', c);

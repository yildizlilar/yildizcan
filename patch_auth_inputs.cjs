const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const oldInputs = `                {authTab === 'register' && (
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">E-posta</label>
                    <div className="flex items-stretch">
                      <input 
                        type="text"
                        required={authTab === 'register'}
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
                )}

                <div>
                  <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">Kullanıcı Adı</label>
                  <input 
                    type="text"
                    required
                    placeholder="Kullanıcı Adınız"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none transition-colors"
                  />
                </div>`;

const newInputs = `                {authTab === 'register' && (
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">E-posta</label>
                    <div className="flex items-stretch">
                      <input 
                        type="text"
                        required={authTab === 'register'}
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
                )}

                <div>
                  <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">Kullanıcı Adı</label>
                  <input 
                    type="text"
                    required
                    placeholder={authTab === 'login' ? "Kullanıcı Adınız (g201200000)" : "Kendinize özgü Kullanıcı Adı"}
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none transition-colors"
                  />
                </div>`;

c = c.replace(oldInputs, newInputs);

const oldLogic = `try {
                  const userEmail = \`\${authEmailPrefix}@std.yildiz.edu.tr\`;

                  if (authTab === 'login') {
                    await signInWithEmailAndPassword(auth, userEmail, authPassword);`;

const newLogic = `try {
                  let userEmail = '';
                  
                  if (authTab === 'login') {
                    userEmail = authUsername.includes('@') ? authUsername : \`\${authUsername}@std.yildiz.edu.tr\`;
                    await signInWithEmailAndPassword(auth, userEmail, authPassword);`;

const oldLogicRegister = `                  } else {
                    const userCred = await createUserWithEmailAndPassword(auth, userEmail, authPassword);`;

const newLogicRegister = `                  } else {
                    userEmail = \`\${authEmailPrefix}@std.yildiz.edu.tr\`;
                    const userCred = await createUserWithEmailAndPassword(auth, userEmail, authPassword);`;

c = c.replace(oldLogic, newLogic);
c = c.replace(oldLogicRegister, newLogicRegister);

// Ensure the form still works correctly:
fs.writeFileSync('src/App.tsx', c);

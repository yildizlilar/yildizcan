const fs = require('fs');

const blockDirect = `                {selectedAdminTab === 'direct' && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-scale-up">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-primary">Doğrudan Çan Eğrisi Ekle</h3>
                        <p className="text-[11px] text-text-muted">Manuel olarak verileri girin ve doğrudan yayına alın.</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={handleAdminDirectSubmit} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-98">
                          Veriyi Yayına Al
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Ders Adı</label>
                        <input type="text" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={adminDirectForm.courseTitle} onChange={(e) => setAdminDirectForm(prev => ({...prev, courseTitle: e.target.value}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Öğretim Üyesi</label>
                        <input type="text" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={adminDirectForm.professorName} onChange={(e) => setAdminDirectForm(prev => ({...prev, professorName: e.target.value}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Ders Kodu</label>
                        <input type="text" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={adminDirectForm.courseCode} onChange={(e) => setAdminDirectForm(prev => ({...prev, courseCode: e.target.value}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Dönem</label>
                        <select 
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                          value={adminDirectForm.term} 
                          onChange={(e) => setAdminDirectForm(prev => ({...prev, term: e.target.value}))}
                        >
                          <option value="2024-2025 Güz">2024-2025 Güz</option>
                          <option value="2024-2025 Bahar">2024-2025 Bahar</option>
                          <option value="2025-2026 Güz">2025-2026 Güz</option>
                          <option value="2025-2026 Bahar">2025-2026 Bahar</option>
                          <option value="2023-2024 Güz">2023-2024 Güz</option>
                          <option value="2023-2024 Bahar">2023-2024 Bahar</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Sınıf Ortalaması</label>
                        <input type="number" step="0.01" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={adminDirectForm.averageBell} onChange={(e) => setAdminDirectForm(prev => ({...prev, averageBell: parseFloat(e.target.value) || 0}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Standart Sapma</label>
                        <input type="number" step="0.01" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={adminDirectForm.stdDev} onChange={(e) => setAdminDirectForm(prev => ({...prev, stdDev: parseFloat(e.target.value) || 0}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Hocanın Ana Bölümü</label>
                        <select className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" value={adminDirectForm.profMainDept} onChange={(e) => setAdminDirectForm(prev => ({...prev, profMainDept: e.target.value}))}>
                          <option value="İktisat">İktisat</option>
                          <option value="İşletme">İşletme</option>
                          <option value="SBUİ">SBUİ</option>
                          <option value="ÜMS">ÜMS</option>
                          <option value="ÜSS">ÜSS</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Çan Türü</label>
                        <select className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" value={adminDirectForm.bellType} onChange={(e) => setAdminDirectForm(prev => ({...prev, bellType: e.target.value as any}))}>
                          <option value="mutlak">Mutlak</option>
                          <option value="bağıl">Bağıl</option>
                          <option value="değiştirilmiş bağıl">Değiştirilmiş Bağıl</option>
                          <option value="manuel">Manuel</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Hocanın Yoklama Durumu</label>
                        <select 
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                          value={adminDirectForm.attendanceStatus} 
                          onChange={(e) => setAdminDirectForm(prev => ({...prev, attendanceStatus: e.target.value as any}))}
                        >
                          <option value="none">Yoklama almıyor</option>
                          <option value="not_failing">Yoklama alıyor ama bırakmıyor</option>
                          <option value="failing">Yoklamadan bırakıyor</option>
                          <option value="bonus">Yoklamadan ek puan veriyor</option>
                          <option value="quiz">Quiz yapıyor</option>
                        </select>
                      </div>

                      {/* Course Departments & Class year selections */}
                      <div className="col-span-2 pt-2 border-t border-gray-100 mt-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-2">
                          Dersin Bölümleri &amp; Sınıf Eşleştirmeleri (Biri ya da birkaçı seçilebilir)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                          {DEPARTMENTS_CONFIG.map((dept) => {
                            const isSelected = adminDirectForm.mappings?.some(m => m.dept === dept.key) ?? false;
                            const currentYear = adminDirectForm.mappings?.find(m => m.dept === dept.key)?.year ?? (dept.hasYear ? 1 : 'none');

                            return (
                              <div 
                                key={dept.key} 
                                className={\`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all \${
                                  isSelected 
                                    ? 'bg-white border-primary border-2 shadow-sm' 
                                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                                }\`}
                              >
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                                  let updated;
                                  if (isSelected) {
                                    updated = (adminDirectForm.mappings || []).filter(m => m.dept !== dept.key);
                                  } else {
                                    updated = [...(adminDirectForm.mappings || []), { dept: dept.key, year: dept.hasYear ? 1 : 'none' }];
                                  }
                                  setAdminDirectForm(prev => ({ ...prev, mappings: updated as any }));
                                }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    readOnly
                                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                  />
                                  <span className={\`text-xs font-bold \${isSelected ? 'text-primary' : 'text-slate-600'}\`}>
                                    {dept.label}
                                  </span>
                                </div>

                                {isSelected && dept.hasYear && (
                                  <div className="flex items-center gap-2 ml-6 md:ml-0">
                                    <span className="text-[10px] font-bold text-text-muted">SINIF:</span>
                                    <select
                                      value={currentYear}
                                      onChange={(e) => {
                                        const val = e.target.value === 'sec' ? 'sec' : parseInt(e.target.value);
                                        const updated = (adminDirectForm.mappings || []).map(m => 
                                          m.dept === dept.key ? { ...m, year: val } : m
                                        );
                                        setAdminDirectForm(prev => ({ ...prev, mappings: updated as any }));
                                      }}
                                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-primary outline-none focus:border-primary cursor-pointer"
                                    >
                                      {dept.years.map(y => (
                                        <option key={y.value} value={y.value}>{y.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="pt-2 col-span-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-2">
                          Çan Notları Alt Sınırları & Harf Sayıları
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'F0'].map((grade) => (
                            <div key={grade} className="bg-gray-50 p-1.5 border border-gray-200 rounded text-center mb-2">
                              <span className="text-[9px] font-extrabold text-[#3e5e95] block leading-none mb-1">{grade}</span>
                              {grade !== 'F0' && (
                                <input 
                                  type="number"
                                  placeholder="alt sınır"
                                  title="Kesme Notu Alt Sınırı"
                                  value={adminDirectForm.gradeThresholds?.[grade as keyof typeof adminDirectForm.gradeThresholds] ?? ''}
                                  onChange={(e) => setAdminDirectForm(prev => ({ ...prev, gradeThresholds: { ...prev.gradeThresholds, [grade]: parseInt(e.target.value) || 0 } }))}
                                  className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded p-[2px] mb-1 text-primary outline-none focus:border-secondary transition-colors"
                                />
                              )}
                              <input 
                                type="number"
                                title="Öğrenci Sayısı"
                                placeholder="sayı"
                                value={adminDirectForm.gradesDistribution?.[grade as keyof typeof adminDirectForm.gradesDistribution] ?? 0}
                                onChange={(e) => setAdminDirectForm(prev => ({ ...prev, gradesDistribution: { ...prev.gradesDistribution, [grade]: parseInt(e.target.value) || 0 } }))}
                                className="w-full text-center text-xs font-bold leading-none bg-transparent border-none p-0 focus:ring-0 mt-1 placeholder:font-normal placeholder:opacity-50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}`;

const blockActive = blockDirect.replace(/'direct'/g, "'active'").replace(/adminDirectForm/g, "activeAdminForm").replace(/setAdminDirectForm/g, "setActiveAdminForm").replace(/handleAdminDirectSubmit/g, "handleActiveUpdateSubmit").replace(/Doğrudan Çan Eğrisi Ekle/g, "Onaylı Dersi Güncelle").replace(/Manuel olarak verileri girin ve doğrudan yayına alın./g, "Yayındaki dersin verilerini düzenleyin.").replace(/Veriyi Yayına Al/g, "Şu anki Veriyi Güncelle");

const combined = blockDirect + "\n" + blockActive;

const fileContent = fs.readFileSync('src/App.tsx', 'utf-8');
const linesArr = fileContent.split('\n');

linesArr.splice(2407, 2, combined); 

fs.writeFileSync('src/App.tsx', linesArr.join('\n'));

const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

c = c.replace(/<button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition-all shadow-md">\s*Giriş Yap\s*<\/button>\s*<div className="pt-4">[\s\S]*?<\/button>\s*<\/div>\s*<\/form>/, `<button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition-all shadow-md">
                    Giriş Yap
                  </button>
                </div>
              </form>`);

fs.writeFileSync('src/App.tsx', c);

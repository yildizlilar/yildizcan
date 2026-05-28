const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /role: "student",\s*joinDate: new Date\(\)\.toLocaleDateString\('tr-TR'\),\s*totalUploads: 0\s*\}\);\s*\} catch\(err\) \{\s*console\.error\("Failed to write to firestore", err\);\s*\}\s*setAuthRole\('student'\);/;

const newLogic = `role: "student",
                         joinDate: new Date().toLocaleDateString('tr-TR'),
                         totalUploads: 0
                      });
                    } catch(err) {
                      console.error("Failed to write to firestore", err);
                    }

                    const userRole = (userEmail.toLowerCase() === 'admin@std.yildiz.edu.tr' || userEmail.toLowerCase() === 'muhammedensarozketen@gmail.com') ? 'admin' : 'student';
                    setAuthRole(userRole);`;
                  
c = c.replace(regex, newLogic);
fs.writeFileSync('src/App.tsx', c);

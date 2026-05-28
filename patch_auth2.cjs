const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

const oldAuthLogic = `                  } else {
                    userEmail = \`\${authEmailPrefix}@std.yildiz.edu.tr\`;
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
                  }`;

const newAuthLogic = `                  } else {
                    userEmail = \`\${authEmailPrefix}@std.yildiz.edu.tr\`;
                    const userCred = await createUserWithEmailAndPassword(auth, userEmail, authPassword);
                    if (userCred.user && authUsername) {
                      await updateProfile(userCred.user, { displayName: authUsername });
                    }
                    
                    try {
                      await setDoc(doc(db, "users", userCred.user.uid), {
                         email: userEmail,
                         name: authUsername || "İsimsiz",
                         role: "student",
                         joinDate: new Date().toLocaleDateString('tr-TR'),
                         totalUploads: 0
                      });
                    } catch(err) {
                      console.error("Failed to write to firestore", err);
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
                  } else if (error.code === 'auth/operation-not-allowed') {
                    errorMsg = 'E-posta/Şifre ile giriş Firebase üzerinden devre dışı bırakılmış. Firebase Console\\'dan aktifleştirin.';
                  }`;

c = c.replace(oldAuthLogic, newAuthLogic);
if (!c.includes("E-posta/Şifre ile giriş Firebase üzerinden devre dışı bırakılmış")) {
  console.log("Failed to patch auth logic");
}

fs.writeFileSync('src/App.tsx', c);

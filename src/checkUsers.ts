import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
async function run() {
  const s = await getDocs(collection(db, "users"));
  s.forEach(d => console.log(d.id, d.data()));
  console.log('---');
  const c = await getDocs(collection(db, "courses"));
  c.forEach(d => console.log("course:", d.id, "uploadedBy:", d.data().uploadedBy));
  process.exit(0);
}
run();

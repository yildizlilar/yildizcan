const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf-8');

c = c.replace(/const \[activeAccount, setActiveAccount\] = useState<any>\(null\);/, 
  `const [activeAccount, setActiveAccount] = useState<any>(null);
  const [systemAccounts, setSystemAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (authRole === 'admin' && selectedAdminTab === 'accounts') {
       const fetchAccounts = async () => {
         try {
           const snap = await getDocs(collection(db, "users"));
           const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
           setSystemAccounts(users);
         } catch(err) {
           console.error("Failed to fetch users", err);
         }
       };
       fetchAccounts();
    }
  }, [authRole, selectedAdminTab]);`);

c = c.replace(/MOCK_ACCOUNTS/g, 'systemAccounts');

fs.writeFileSync('src/App.tsx', c);

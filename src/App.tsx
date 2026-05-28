import React, { useState, useEffect, useMemo } from 'react';
import { 
  School, 
  ArrowLeft, 
  Search, 
  Home, 
  PlusCircle, 
  User, 
  Settings, 
  Share2, 
  AlertTriangle, 
  Code, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  Bookmark, 
  FileText, 
  ChevronRight, ChevronDown, 
  LogOut, 
  BookOpen, 
  ArrowRight, 
  History, 
  ThumbsUp, 
  Check, 
  Upload, 
  X,
  Plus,
} from 'lucide-react';
import { auth, db } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { INITIAL_COURSES, INITIAL_PENDINGS, INITIAL_TEACHERS, MAHMUT_TERMS, INITIAL_USER, MOCK_ACCOUNTS } from './mockData';
import { Course, Teacher, PendingApproval, Comment } from './types';

const calculateTagScore = (passingRate: number, attendanceStatus?: string) => {
  if (passingRate > 70) return 'Öğrenci Dostu Çan';
  if (passingRate >= 50) return 'Ortalama Çan';
  return 'Zorlayıcı Çan';
};

const DEPARTMENTS_CONFIG = [
  {
    key: 'iktisat' as const,
    label: 'İktisat',
    hasYear: true,
    years: [
      { label: '1. Sınıf', value: 1 },
      { label: '2. Sınıf', value: 2 },
      { label: '3. Sınıf', value: 3 },
      { label: 'Mesleki Seçmeli', value: 'sec' }
    ]
  },
  {
    key: 'isletme' as const,
    label: 'İşletme',
    hasYear: true,
    years: [
      { label: '1. Sınıf', value: 1 },
      { label: '2. Sınıf', value: 2 },
      { label: '3. Sınıf', value: 3 },
      { label: 'Mesleki Seçmeli', value: 'sec' }
    ]
  },
  {
    key: 'sbui' as const,
    label: 'Siyaset Bilimi ve Uluslararası İlişkiler',
    hasYear: true,
    years: [
      { label: '1. Sınıf', value: 1 },
      { label: '2. Sınıf', value: 2 },
      { label: '3. Sınıf', value: 3 },
      { label: '4. Sınıf', value: 4 },
      { label: 'Mesleki Seçmeli', value: 'sec' }
    ]
  },
  {
    key: 'uss' as const,
    label: 'Üniversite Sosyal Seçmeli',
    hasYear: false,
    years: []
  },
  {
    key: 'ums' as const,
    label: 'Üniversite Mesleki Seçmeli',
    hasYear: false,
    years: []
  }
];

export default function App() {
  // Navigation & Routing States
  // 'home' | 'courses' | 'detail' | 'upload' | 'admin' | 'professor' | 'profile'
  const [activeScreen, setActiveScreen] = useState<string>('home');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmailPrefix, setAuthEmailPrefix] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingGUser, setPendingGUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection States
  const [selectedCourseId, setSelectedCourseId] = useState<string>('IKN1011');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(''); // Added for drill-down
  const [selectedProfessorName, setSelectedProfessorName] = useState<string>(''); // Added for drill-down
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('mahmut_bilgeturk');
  const [selectedPendingId, setSelectedPendingId] = useState<string>('p1');
  
  // Pending comments state
  const [pendingComments, setPendingComments] = useState<any[]>(() => {
    const saved = localStorage.getItem('ytu_iibf_pending_comments');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter States inside Course Listing
  const [selectedDept, setSelectedDept] = useState<'iktisat' | 'isletme' | 'sbui' | 'uss' | 'ums'>('iktisat');
  const [selectedYear, setSelectedYear] = useState<number | 'sec'>(1);

  // Core Data States (with LocalStorage persistence option)
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('ytu_iibf_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });
  
  const [pendings, setPendings] = useState<PendingApproval[]>(() => {
    const saved = localStorage.getItem('ytu_iibf_pendings');
    return saved ? JSON.parse(saved) : INITIAL_PENDINGS;
  });

  // User Auth States
  // 'guest' | 'student' | 'admin'
  const [authRole, setAuthRole] = useState<'guest' | 'student' | 'admin'>(() => {
    const saved = localStorage.getItem('ytu_iibf_auth');
    if (saved === 'admin') return 'admin';
    if (saved === 'student') return 'student';
    return 'guest';
  });

  // Notifications State for visual feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // Trigger toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Persist states automatically on change
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isBanned) {
              setAuthRole('guest');
              setCurrentUser(null);
              await signOut(auth);
              showToast('Hesabınız yasaklandığı için oturumunuz kapatıldı.', 'error');
              setAuthInitializing(false);
              return;
            }
            const userRole = (user.email === 'Muhammedensarozketen@gmail.com' || data.role === 'admin') ? 'admin' : 'student';
            setAuthRole(userRole);
          } else {
            setAuthRole('student');
          }
        } catch (e) {
          setAuthRole('student');
        }
      } else if (authRole === 'student') {
        setAuthRole('guest');
      }
      setAuthInitializing(false);
    });
    return () => unsubscribe();
  }, [authRole]);

  useEffect(() => {
    localStorage.setItem('ytu_iibf_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('ytu_iibf_pendings', JSON.stringify(pendings));
  }, [pendings]);

  useEffect(() => {
    localStorage.setItem('ytu_iibf_auth', authRole);
  }, [authRole]);

  useEffect(() => {
    localStorage.setItem('ytu_iibf_pending_comments', JSON.stringify(pendingComments));
  }, [pendingComments]);

  // Derived computations
  const currentCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  const currentTeacher = useMemo(() => {
    return INITIAL_TEACHERS.find(t => t.id === selectedTeacherId) || INITIAL_TEACHERS[0];
  }, [selectedTeacherId]);

  const currentPending = useMemo(() => {
    return pendings.find(p => p.id === selectedPendingId) || pendings[0];
  }, [pendings, selectedPendingId]);

  // Admin Auth Dialog State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [selectedAdminTab, setSelectedAdminTab] = useState<'pending' | 'direct' | 'active' | 'accounts'>('pending');
  const [selectedAdminActiveCourseId, setSelectedAdminActiveCourseId] = useState<string | null>(null);
  const [activeAdminForm, setActiveAdminForm] = useState<any>(null);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [editAccountForm, setEditAccountForm] = useState<any>(null);

  useEffect(() => {
    if (activeAccount) {
      setEditAccountForm({ ...activeAccount });
    } else {
      setEditAccountForm(null);
    }
  }, [activeAccount]);

  const [deletedAccountIds, setDeletedAccountIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ytu_iibf_deleted_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [systemAccounts, setSystemAccounts] = useState<any[]>([]);

  const visibleAccounts = useMemo(() => {
    return systemAccounts.filter(acc => !deletedAccountIds.includes(acc.id));
  }, [systemAccounts, deletedAccountIds]);

  useEffect(() => {
    if (authRole === 'admin' && selectedAdminTab === 'accounts') {
       const fetchAccounts = async () => {
         try {
           const snap = await getDocs(collection(db, "users"));
           const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
           
           const existingEmails = new Set(users.map((u: any) => u.email));
           const combined = [...users, ...MOCK_ACCOUNTS.filter(m => !existingEmails.has(m.email))];
           
           setSystemAccounts(combined);
         } catch(err) {
           console.error("Failed to fetch users", err);
           setSystemAccounts(MOCK_ACCOUNTS);
         }
       };
       fetchAccounts();
    }
  }, [authRole, selectedAdminTab]);
  const [adminDirectForm, setAdminDirectForm] = useState({
    courseTitle: '',
    professorName: '',
    courseCode: '',
    term: '2024-2025 Güz',
    language: 'Türkçe',
    averageBell: 50,
    stdDev: 10,
    profMainDept: 'İktisat',
    bellType: 'mutlak',
    attendanceStatus: 'none' as any,
    gradeThresholds: {AA:85, BA:75, BB:65, CB:55, CC:45, DC:40, DD:30, FD:20, FF:0},
    gradesDistribution: {AA:0, BA:0, BB:0, CB:0, CC:0, DC:0,  FD:0, FF:0, F0:0},
    description: '',
    mappings: [{ dept: 'iktisat', year: 1 }] as any[]
  });

  // Form uploading state fields
  const [uploadForm, setUploadForm] = useState({
    professorName: '',
    courseName: '',
    mappings: [{ dept: 'iktisat' as any, year: 1 as any }],
    term: '2025-2026 Güz',
    language: 'Türkçe',
    attendanceStatus: 'none' as 'none' | 'not_failing' | 'failing' | 'bonus' | 'quiz',
    description: '',
    fileUploaded: false,
    fileName: '',
    fileData: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dynamic comment input field
  const [commentText, setCommentText] = useState<string>('');


  // Memoized current passing rate and total students calculation for real-time reactivity
  const currentPassing = useMemo(() => {
    if (!currentPending) return 0;
    const gd = currentPending.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
    if (currentPending.attendanceStatus === 'none' || currentPending.attendanceStatus === 'not_failing') gd.F0 = 0;
    const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
    const all = passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
    return all > 0 ? parseFloat(((passed / all) * 100).toFixed(2)) : 0;
  }, [currentPending]);

  const currentTotal = useMemo(() => {
    if (!currentPending) return 0;
    const gd = currentPending.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
    if (currentPending.attendanceStatus === 'none' || currentPending.attendanceStatus === 'not_failing') gd.F0 = 0;
    const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
    return passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
  }, [currentPending]);

  // Handle curve submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.professorName || !uploadForm.courseName) {
      showToast('Lütfen profesör adı ve ders adını doldurun.', 'error');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      // Create new pending approval to go to Admin Panel
      const newPending: PendingApproval = {
        id: 'p_' + Date.now(),
        courseTitle: uploadForm.courseName,
        professorName: uploadForm.professorName,
        profMainDept: uploadForm.profMainDept,
        mappings: uploadForm.mappings,
        term: uploadForm.term,
        language: uploadForm.language as any,
        attendanceStatus: uploadForm.attendanceStatus,
        description: uploadForm.description,
        date: new Date().toLocaleDateString('tr-TR'),
        applicantName: currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'İsimsiz Kullanıcı',
        applicantId: '21043' + Math.floor(Math.random() * 800 + 100),
        fileUrl: uploadForm.fileUploaded ? uploadForm.fileData : ''
      };

      setPendings(prev => [newPending, ...prev]);
      setSubmitting(false);
      showToast('Çan Verisi Gönderildi! Yönetici onayından sonra listelenecektir.', 'success');
      
      // Auto-switch to home
      setActiveScreen('home');
      // Reset form
      setUploadForm({
        professorName: '',
        courseName: '',
        mappings: [{ dept: 'iktisat', year: 1 }],
        term: '2025-2026 Güz',
        attendanceStatus: 'none',
        description: '',
        fileUploaded: false,
        fileName: '',
    fileData: '',
      });
    }, 1200);
  };

  // Submit comment in Detail page
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (authRole === 'guest') {
      showToast('Yorum yapmak için öğrenci veya yönetici girişi yapmalısınız.', 'error');
      return;
    }

    const newComment = {
      id: 'cmt_' + Date.now(),
      courseDataId: currentCourse.id,
      author: currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yönetici',
      date: new Date().toLocaleDateString('tr-TR'),
      text: commentText
    };

    setPendingComments(prev => [...prev, newComment]);
    setCommentText('');
    showToast('Açıklama incelemeye alındı, yönetici onayından sonra yayınlanacaktır.', 'success');
  };

  // Admin processes Approval
  const handleApprovePending = (pendingId: string) => {
    const item = pendings.find(p => p.id === pendingId);
    if (!item) return;

        // Convert into active course list
    // Calculation of passage rate
    const gd = item.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
    if (item.attendanceStatus === 'none' || item.attendanceStatus === 'not_failing') gd.F0 = 0;
    const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
    const all = passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
    const calculatedPassingRate = all > 0 ? (passed / all) * 100 : 0;
    
    
    const newCourse: Course = {
      id: 'C_' + Date.now(),
      code: item.courseCode || 'BİLİNMİYOR',
      title: item.courseTitle,
      department: item.mappings?.[0]?.dept || 'iktisat',
      year: item.mappings?.[0]?.year || 1,
      mappings: item.mappings,
      
      averageBell: item.average || 50,
      stdDev: item.stdDev,
      bellType: item.bellType as any,
      gradeThresholds: item.gradeThresholds,
      professorCount: 1,
      professorName: item.professorName,
      profMainDept: item.profMainDept,
      term: item.term,
      language: item.language,
      attendanceStatus: item.attendanceStatus,
      description: item.description,
      gradesDistribution: gd,
      totalStudents: all,
      passingRate: calculatedPassingRate,
      uploadedBy: item.applicantName,
      uploadedDate: item.date,
      comments: [],
      fileUrl: item.fileUrl
    };

    setCourses(prev => [newCourse, ...prev]);
    setPendings(prev => prev.filter(p => p.id !== pendingId));
    
    // Select next pending if any remains
    const remaining = pendings.filter(p => p.id !== pendingId);
    if (remaining.length > 0) {
      setSelectedPendingId(remaining[0].id);
    }

    showToast(`"${item.courseTitle}" çan verisi onaylandı ve yayına alındı!`, 'success');
  };

  const handleRejectPending = (pendingId: string) => {
    setPendings(prev => prev.filter(p => p.id !== pendingId));
    const remaining = pendings.filter(p => p.id !== pendingId);
    if (remaining.length > 0) {
      setSelectedPendingId(remaining[0].id);
    }
    showToast('Çan verisi reddedildi ve silindi.', 'info');
  };

  const handleSaveAccountChanges = async () => {
    if (!editAccountForm) return;
    try {
      setSystemAccounts(prev => prev.map(acc => acc.id === editAccountForm.id ? editAccountForm : acc));
      setActiveAccount(editAccountForm);

      const docRef = doc(db, "users", editAccountForm.id);
      await setDoc(docRef, {
        googleName: editAccountForm.googleName || editAccountForm.name || '',
        name: editAccountForm.name || '',
        email: editAccountForm.email || '',
        role: editAccountForm.role || 'student',
        isBanned: editAccountForm.isBanned || false,
      }, { merge: true });

      showToast("Hesap bilgileri güncellendi ve Firestore'a kaydedildi!", "success");
    } catch (e) {
      console.warn("Mock format detected or database offline. Local state updated successfully.");
      showToast("Hesap bilgileri güncellendi!", "success");
    }
  };

  const handleDeleteAccount = async () => {
    if (!editAccountForm) return;
    if (!window.confirm(`${editAccountForm.name || editAccountForm.email} hesabını kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }
    const targetId = editAccountForm.id;
    try {
      setSystemAccounts(prev => prev.filter(acc => acc.id !== targetId));
      setActiveAccount(null);
      setEditAccountForm(null);

      // Blacklist deleted IDs so they never reappear
      setDeletedAccountIds(prev => {
        const next = [...prev, targetId];
        localStorage.setItem('ytu_iibf_deleted_accounts', JSON.stringify(next));
        return next;
      });

      const docRef = doc(db, "users", targetId);
      await deleteDoc(docRef);

      showToast("Hesap başarıyla silindi ve Firestore'dan tamamen kaldırıldı!", "success");
    } catch (e) {
      console.warn("Mock format detected or database offline. Local state updated successfully.");
      showToast("Hesap başarıyla silindi!", "success");
    }
  };

  const handleActiveUpdateSubmit = () => {
    if (!activeAdminForm || !selectedAdminActiveCourseId) return;
    if (!activeAdminForm.mappings || activeAdminForm.mappings.length === 0) {
      showToast('Lütfen en az bir ders bölümü/sınıf eşleştirmesi seçin.', 'error');
      return;
    }

    setCourses(prev => prev.map(c => {
      if (c.id === selectedAdminActiveCourseId) {
        const gd = activeAdminForm.gradesDistribution as any;
        if (activeAdminForm.attendanceStatus === 'none' || activeAdminForm.attendanceStatus === 'not_failing') gd.F0 = 0;
        const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
        const all = passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
        const calculatedPassingRate = all > 0 ? (passed / all) * 100 : 0;
        
        
        const firstMapping = activeAdminForm.mappings[0];
        
        return {
          ...c,
          title: activeAdminForm.courseTitle,
          professorName: activeAdminForm.professorName,
          code: activeAdminForm.courseCode || 'BİLİNMİYOR',
          term: activeAdminForm.term,
          language: activeAdminForm.language,
          averageBell: activeAdminForm.averageBell,
          stdDev: activeAdminForm.stdDev,
          profMainDept: activeAdminForm.profMainDept,
          bellType: activeAdminForm.bellType,
          attendanceStatus: activeAdminForm.attendanceStatus,
          gradeThresholds: activeAdminForm.gradeThresholds,
          gradesDistribution: activeAdminForm.gradesDistribution,
          description: activeAdminForm.description,
          mappings: activeAdminForm.mappings,
          department: firstMapping.dept,
          year: firstMapping.year,
          
          totalStudents: all,
          passingRate: calculatedPassingRate
        };
      }
      return c;
    }));
    
    showToast('Onaylı çan verisi başarıyla güncellendi!', 'success');
  };

  const handleActiveDeleteCourse = () => {
    if (!selectedAdminActiveCourseId) return;
    setCourses(prev => prev.filter(c => c.id !== selectedAdminActiveCourseId));
    setSelectedAdminActiveCourseId(null);
    setActiveAdminForm(null);
    showToast('Ders kalıcı olarak silindi!', 'success');
  };

  const handleAdminDirectSubmit = () => {
    if (!adminDirectForm.mappings || adminDirectForm.mappings.length === 0) {
      showToast('Lütfen en az bir ders bölümü/sınıf eşleştirmesi seçin.', 'error');
      return;
    }

    const gd = adminDirectForm.gradesDistribution as any;
    if (adminDirectForm.attendanceStatus === 'none' || adminDirectForm.attendanceStatus === 'not_failing') gd.F0 = 0;
    const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
    const all = passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
    const calculatedPassingRate = all > 0 ? (passed / all) * 100 : 0;
    

    const firstMapping = adminDirectForm.mappings[0];

    const newCourse: Course = {
      id: 'C_' + Date.now(),
      code: adminDirectForm.courseCode || 'BİLİNMİYOR',
      title: adminDirectForm.courseTitle,
      department: firstMapping.dept,
      year: firstMapping.year,
      mappings: adminDirectForm.mappings,
      
      averageBell: adminDirectForm.averageBell || 50,
      stdDev: adminDirectForm.stdDev,
      bellType: adminDirectForm.bellType as any,
      gradeThresholds: adminDirectForm.gradeThresholds as any,
      professorCount: 1,
      professorName: adminDirectForm.professorName,
      profMainDept: adminDirectForm.profMainDept,
      term: adminDirectForm.term,
      language: adminDirectForm.language as any,
      attendanceStatus: adminDirectForm.attendanceStatus,
      description: adminDirectForm.description,
      gradesDistribution: gd,
      totalStudents: all,
      passingRate: calculatedPassingRate,
      uploadedBy: 'Yönetici',
      uploadedDate: new Date().toLocaleDateString('tr-TR'),
      comments: [],
      fileUrl: ''
    };

    setCourses(prev => [newCourse, ...prev]);
    
    // Reset form
    setAdminDirectForm({
      courseTitle: '', professorName: '', courseCode: '', term: '2024-2025 Güz', 
      averageBell: 50, stdDev: 10, profMainDept: 'İktisat', bellType: 'mutlak', 
      attendanceStatus: 'none', 
      gradeThresholds: {AA:85, BA:75, BB:65, CB:55, CC:45, DC:40, DD:30, FD:20, FF:0},
      gradesDistribution: {AA:0, BA:0, BB:0, CB:0, CC:0, DC:0,  FD:0, FF:0, F0:0},
      description: '',
      mappings: [{ dept: 'iktisat', year: 1 }]
    });

    showToast('Doğrudan çan eğrisi başarıyla eklendi!', 'success');
  };

  // Computed lists search
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // Matches typing queries
      const matchesSearch = searchQuery
        ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.professorName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      if (!matchesSearch) return false;

      if (c.mappings && c.mappings.length > 0) {
        return c.mappings.some(m => {
          const matchesDept = m.dept === selectedDept;
          const matchesYear = (selectedDept === 'uss' || selectedDept === 'ums') 
            ? true 
            : (selectedYear === 'sec' ? m.year === 'sec' : m.year === selectedYear);
          return matchesDept && matchesYear;
        });
      }

      // Legacy fallback
      const matchesDept = c.department === selectedDept;
      const matchesYear = (selectedDept === 'uss' || selectedDept === 'ums') 
        ? true 
        : (selectedYear === 'sec' ? c.year === 'sec' : c.year === selectedYear);
        
      return matchesDept && matchesYear;
    });
  }, [courses, selectedDept, selectedYear, searchQuery]);

  // Grouped courses for the main listing
  const groupedCourses = useMemo(() => {
    const uniqueCodes = Array.from(new Set(filteredCourses.map(c => c.code)));
    return uniqueCodes.map(code => {
      const instances = filteredCourses.filter(c => c.code === code);
      const avgBell = instances.length > 0 ? instances.reduce((sum, c) => sum + (c.averageBell || 0), 0) / instances.length : 0;
      
      const totalPassed = instances.reduce((sum, c) => {
        const gd = c.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
        return sum + (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
      }, 0);
      const totalStudents = instances.reduce((sum, c) => sum + c.totalStudents, 0);
      const passingRate = totalStudents > 0 ? (totalPassed / totalStudents) * 100 : 0;
      
      
      
      const passingRateFormatted = totalStudents > 0 ? ((totalPassed / totalStudents) * 100).toFixed(1) : "0.0";

      return {
        code,
        title: instances[0].title,
        department: instances[0].department,
        professorCount: Array.from(new Set(instances.map(c => c.professorName))).length,
        totalStudents,
        averageBell: avgBell.toFixed(1),
        passingRate: passingRateFormatted
      };
    });
  }, [filteredCourses]);

  // Overall statistics count
  const statsOverview = useMemo(() => {
    const uniqueContributors = new Set(courses.filter(c => c.uploadedBy).map(c => c.uploadedBy));
    const uniqueTeachers = new Set(courses.filter(c => c.professorName).map(c => c.professorName));

    return {
      totalUploadsCount: courses.length,
      teachersCount: uniqueTeachers.size,
      contributorsCount: uniqueContributors.size
    };
  }, [courses]);

  const isLoggedIn = authRole === 'admin' || (authRole === 'student' && currentUser !== null);

  if (authInitializing) {
    return (
      <div className="bg-[#f3f4f6] text-primary min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
          <School size={36} className="animate-spin duration-3000" />
        </div>
        <div className="text-center">
          <h2 className="font-display font-extrabold text-lg tracking-tight uppercase">Yıldız Çan</h2>
          <p className="text-xs text-text-muted mt-1 font-semibold">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
     return (
       <div className="bg-[#f3f4f6] text-text-on-surface font-sans min-h-screen relative flex items-center justify-center p-4">
         {/* Toast Alert Banner */}
         {toastMessage && (
           <div className="fixed top-6 right-4 z-50 animate-fade-in pointer-events-none">
             <div className={`px-6 py-4 rounded-xl shadow-xl border flex items-center gap-3 text-white ${
               toastType === 'success' ? 'bg-emerald-600 border-emerald-500' :
               toastType === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-secondary border-blue-500'
             }`}>
               <CheckCircle2 size={20} className="shrink-0 animate-scale-up" />
               <span className="font-semibold text-sm">{toastMessage}</span>
             </div>
           </div>
         )}

         <div className="max-w-md w-full animate-fade-in">
           {/* Logo and Brand */}
           <div className="text-center mb-8 flex flex-col items-center gap-3">
             <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
               <School size={36} className="stroke-[2.5]" />
             </div>
             <div>
               <h1 className="font-display font-extrabold text-[#00193c] text-3xl tracking-tight uppercase">
                 Yıldız Çan
               </h1>
               <p className="text-sm text-text-muted font-semibold tracking-wide mt-1">Asimetrik bilgiyi ortadan kaldır</p>
             </div>
           </div>

           <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 w-full relative">
             {pendingGUser ? (
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 setAuthLoading(true);
                 setAuthError('');
                 try {
                   const userEmail = pendingGUser.email || '';
                   const userRole = (userEmail.toLowerCase() === 'admin@std.yildiz.edu.tr' || userEmail.toLowerCase() === 'muhammedensarozketen@gmail.com') ? 'admin' : 'student';
                   await setDoc(doc(db, "users", pendingGUser.uid), {
                     email: userEmail,
                     name: authUsername,
                     googleName: pendingGUser.displayName || 'İsimsiz Google Hesabı',
                     role: userRole,
                     joinDate: new Date().toLocaleDateString('tr-TR'),
                     totalUploads: 0
                   }, { merge: true });
                   await updateProfile(pendingGUser, { displayName: authUsername });
                   
                   setAuthRole(userRole);
                   setPendingGUser(null);
                   showToast('Kayıt Başarılı!');
                 } catch (err: any) {
                   setAuthError(err.message);
                 } finally {
                   setAuthLoading(false);
                 }
               }} className="space-y-4">
                 <div className="text-center mb-6">
                   <h3 className="font-display font-bold text-xl text-primary">Kullanıcı Adı Belirle</h3>
                   <p className="text-sm text-text-muted mt-2">Uygulamayı kullanmaya başlamak için bir kullanıcı adı belirlemeniz gerekiyor.</p>
                 </div>
                 {authError && (
                   <div className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold p-3 rounded-lg flex items-start gap-2">
                     <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                     <span>{authError}</span>
                   </div>
                 )}
                 <div>
                   <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">Kullanıcı Adı</label>
                   <input 
                     type="text"
                     required
                     placeholder="Örn: Ekonoman24"
                     value={authUsername}
                     onChange={(e) => setAuthUsername(e.target.value)}
                     className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none transition-colors"
                   />
                 </div>
                 <div className="pt-2">
                   <button type="submit" disabled={authLoading || !authUsername.trim()} className="w-full disabled:opacity-50 bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]">
                     {authLoading ? 'Kaydediliyor...' : 'Devam Et'}
                   </button>
                 </div>
               </form>
             ) : showAdminLogin ? (
               <div className="space-y-4">
                 <div>
                   <h3 className="font-display font-extrabold text-[#00193c] text-xl">Yönetici Girişi</h3>
                   <p className="text-xs text-text-muted mt-1">Lütfen yönetici şifrenizi girin.</p>
                 </div>
                 <form onSubmit={(e) => {
                   e.preventDefault();
                   if (adminPassword === 'mahmuthoca') {
                     setAuthRole('admin');
                     setShowAdminLogin(false);
                     setAdminPassword('');
                     setActiveScreen('admin');
                     showToast('Yönetici girişi yapıldı, panele yönlendiriliyorsunuz.', 'success');
                   } else {
                     showToast('Hatalı şifre! (İpucu: mahmuthoca)', 'error');
                   }
                 }}>
                   <div className="space-y-4">
                     <div>
                       <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">Şifre</label>
                       <input 
                         type="password"
                         autoFocus
                         required
                         value={adminPassword}
                         onChange={(e) => setAdminPassword(e.target.value)}
                         className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none"
                       />
                     </div>
                     <div className="flex gap-2">
                       <button 
                         type="button" 
                         onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }}
                         className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                       >
                         Geri
                       </button>
                       <button type="submit" className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition-all shadow-md">
                         Giriş Yap
                       </button>
                     </div>
                   </div>
                 </form>
               </div>
             ) : (
               <div className="space-y-4">
                 {authError && (
                   <div className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold p-3 rounded-lg flex items-start gap-2">
                     <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                     <span>{authError}</span>
                   </div>
                 )}
                 <div className="text-center mb-4">
                   <h2 className="text-lg font-bold text-primary">Sisteme Giriş Yapın</h2>
                   <p className="text-xs text-text-muted mt-1">Platformdaki içeriklere erişebilmek için giriş yapmanız gerekmektedir.</p>
                 </div>

                 <button type="button" onClick={async () => {
                   setAuthError('');
                   setAuthLoading(true);
                   try {
                     const provider = new GoogleAuthProvider();
                     const result = await signInWithPopup(auth, provider);
                     const user = result.user;
                     
                     // check if user exists
                     const userDoc = await getDoc(doc(db, "users", user.uid));
                     
                     let needsUsername = false;
                     if (!userDoc.exists()) {
                        needsUsername = true;
                     } else {
                        const data = userDoc.data();
                        if (data.isBanned) {
                           setAuthError('Hesabınız yasaklanmıştır! Giriş yapamazsınız.');
                           await signOut(auth);
                           return;
                        }
                        if (!data.name || data.name === "İsimsiz") {
                           needsUsername = true;
                        }
                     }
                     
                     if (needsUsername) {
                        setPendingGUser(user);
                     } else {
                        const data = userDoc.data();
                        const userRole = (user.email === 'Muhammedensarozketen@gmail.com' || data.role === 'admin') ? 'admin' : 'student';
                        setAuthRole(userRole);
                        setActiveScreen('home');
                        showToast('Giriş Başarılı!');
                     }
                   } catch(err: any) {
                     console.error(err);
                     setAuthError('Google girişi sırasında hata: ' + (err.message || ''));
                   } finally {
                     setAuthLoading(false);
                   }
                 }} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-800 hover:border-primary hover:text-primary font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]">
                   <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                   Google ile Giriş Yap / Kayıt Ol
                 </button>

                 <div className="pt-4 border-t border-gray-100 text-center">
                   <button
                     type="button"
                     onClick={() => setShowAdminLogin(true)}
                     className="text-xs text-text-muted hover:text-primary transition-colors font-semibold"
                   >
                     Yönetici olarak mı giriş yapacaksınız? Tıklayın.
                   </button>
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     );
  }

  return (
    <div className="bg-background-gray text-text-on-surface font-sans min-h-screen relative pb-24 md:pb-6">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in pointer-events-none">
          <div className={`px-6 py-4 rounded-xl shadow-xl border flex items-center gap-3 text-white ${
            toastType === 'success' ? 'bg-emerald-600 border-emerald-500' :
            toastType === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-secondary border-blue-500'
          }`}>
            <CheckCircle2 size={20} className="shrink-0 animate-scale-up" />
            <span className="font-semibold text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Application Navigation Bar */}
      <header className="fixed top-0 left-0 w-full z-40 glass-header border-b border-gray-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex justify-between items-center">
          
          {/* Brand/Logo */}
          <button 
            onClick={() => setActiveScreen('home')}
            className="flex items-center gap-2.5 transition-transform hover:scale-102 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md group-hover:bg-secondary transition-colors">
              <School size={22} className="stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="font-display font-extrabold text-[#00193c] text-lg leading-tight tracking-tight uppercase">
                Yıldız Çan
              </h1>
              <p className="text-[10px] text-text-muted font-medium tracking-wide">Asimetrik bilgiyi ortadan kaldır</p>
            </div>
          </button>

          {/* Desktop Navigation Link Shells */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => { setActiveScreen('home'); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeScreen === 'home' 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-text-muted hover:text-primary hover:bg-gray-100'
              }`}
            >
              Ana Sayfa
            </button>
            <button 
              onClick={() => { setActiveScreen('courses'); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeScreen === 'courses' 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-text-muted hover:text-primary hover:bg-gray-100'
              }`}
            >
              Dersler
            </button>
            <button 
              onClick={() => { setActiveScreen('upload'); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeScreen === 'upload' 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-text-muted hover:text-primary hover:bg-gray-100'
              }`}
            >
              Çan Eğrisi Yükle
            </button>
            
            {authRole === 'admin' && (
              <button 
                onClick={() => { setActiveScreen('admin'); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-amber-500/10 text-amber-900 border border-amber-500/20`}
              >
                Yönetici Paneli ({pendings.length})
              </button>
            )}
          </div>

          {/* Session Authentication & Profile Pill */}
          <div className="flex items-center gap-3">
            {authRole === 'student' ? (
              <button 
                onClick={() => setActiveScreen('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow transition-all group"
              >
                <span className="hidden sm:inline text-xs font-bold text-primary group-hover:text-secondary whitespace-nowrap">
                  {currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yıldız Öğrencisi'}
                </span>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : authRole === 'admin' ? (
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Yönetici: admin
                </span>
                <button 
                  onClick={() => { signOut(auth).then(() => { setAuthRole('guest'); setActiveScreen('home'); showToast('Çıkış yapıldı.'); }) }}
                  className="text-text-muted hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Güvenli Çıkış"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveScreen('auth')}
                  className="text-xs font-bold text-primary border border-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Öğrenci Girişi
                </button>
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="text-xs font-bold bg-primary text-white hover:bg-secondary px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow"
                >
                  Yönetici Girişi
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display font-extrabold text-[#00193c] text-xl">Yönetici Girişi</h3>
                  <p className="text-xs text-text-muted mt-1">Lütfen yönetici şifrenizi girin.</p>
                </div>
                <button onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (adminPassword === 'mahmuthoca') {
                  setAuthRole('admin');
                  setShowAdminLogin(false);
                  setAdminPassword('');
                  setActiveScreen('admin');
                  showToast('Yönetici girişi yapıldı, panele yönlendiriliyorsunuz.', 'success');
                } else {
                  showToast('Hatalı şifre! (İpucu: mahmuthoca)', 'error');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">Şifre</label>
                    <input 
                      type="password"
                      autoFocus
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition-all shadow-md">
                    Giriş Yap
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-[1280px] mx-auto pt-24 px-4 sm:px-6 min-h-[calc(100vh-16rem)]">

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

                            {pendingGUser ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthLoading(true);
                  setAuthError('');
                  try {
                    const userEmail = pendingGUser.email || '';
                    const userRole = (userEmail.toLowerCase() === 'admin@std.yildiz.edu.tr' || userEmail.toLowerCase() === 'muhammedensarozketen@gmail.com') ? 'admin' : 'student';
                    await setDoc(doc(db, "users", pendingGUser.uid), {
                      email: userEmail,
                      name: authUsername,
                      googleName: pendingGUser.displayName || 'İsimsiz Google Hesabı',
                      role: userRole,
                      joinDate: new Date().toLocaleDateString('tr-TR'),
                      totalUploads: 0
                    }, { merge: true });
                    await updateProfile(pendingGUser, { displayName: authUsername });
                    
                    setAuthRole(userRole);
                    setPendingGUser(null);
                    setActiveScreen('home');
                    showToast('Kayıt Başarılı!');
                  } catch (err: any) {
                    setAuthError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }} className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="font-display font-extrabold text-xl text-primary">Kullanıcı Adı Belirle</h3>
                    <p className="text-sm text-text-muted mt-2">Uygulamayı kullanmaya başlamak için bir kullanıcı adı belirlemeniz gerekiyor.</p>
                  </div>
                  {authError && (
                    <div className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold p-3 rounded-lg flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wider">Kullanıcı Adı</label>
                    <input 
                      type="text"
                      required
                      placeholder="Örn: Ekonoman24"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full bg-background-gray border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none transition-colors"
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={authLoading || !authUsername.trim()} className="w-full disabled:opacity-50 bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]">
                      {authLoading ? 'Kaydediliyor...' : 'Devam Et'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {authError && (
                    <div className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold p-3 rounded-lg flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}
                  <button type="button" onClick={async () => {
                    setAuthError('');
                    setAuthLoading(true);
                    try {
                      const provider = new GoogleAuthProvider();
                      const result = await signInWithPopup(auth, provider);
                      const user = result.user;
                      
                      // check if user exists
                      const userDoc = await getDoc(doc(db, "users", user.uid));
                      
                      let needsUsername = false;
                      if (!userDoc.exists()) {
                         needsUsername = true;
                      } else {
                         const data = userDoc.data();
                         if (data.isBanned) {
                            setAuthError('Hesabınız yasaklanmıştır! Giriş yapamazsınız.');
                            await signOut(auth);
                            return;
                         }
                         if (!data.name || data.name === "İsimsiz") {
                            needsUsername = true;
                         }
                      }
                      
                      if (needsUsername) {
                         setPendingGUser(user);
                      } else {
                         const data = userDoc.data();
                         const userRole = (user.email === 'Muhammedensarozketen@gmail.com' || data.role === 'admin') ? 'admin' : 'student';
                         setAuthRole(userRole);
                         setActiveScreen('home');
                         showToast('Giriş Başarılı!');
                      }
                    } catch(err: any) {
                      console.error(err);
                      setAuthError('Google girişi sırasında hata: ' + (err.message || ''));
                    } finally {
                      setAuthLoading(false);
                    }
                  }} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-800 hover:border-primary hover:text-primary font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] mt-2">
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Google ile Giriş Yap / Kayıt Ol
                  </button>
                </div>
              )}

            </div>
          </div>
        )}


        {/* ==================== SCREEN 1: HOME PAGE ==================== */}
        {activeScreen === 'home' && (
          <div className="animate-fade-in space-y-8">
            
            {/* Hero Card */}
            <section className="hero-mesh rounded-2xl p-8 md:p-12 border border-gray-100 shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest leading-none">
                  Yıldız Teknik Üniversitesi
                </span>
                <h2 className="font-display font-extrabold text-[#00193c] text-3xl md:text-5xl tracking-tight leading-tight">
                  İİBF Çan Paylaşım Platformu
                </h2>
                <p className="text-base text-text-muted md:text-lg leading-relaxed max-w-2xl">
                  İktisadi ve İdari Bilimler Fakültesi öğrencilerine özel olarak geliştirilmiş bu sitede daha önceden aldığınız derslerin çan eğrisi verilerini paylaşabilir, geçmiş dönem istatistiklerini inceleyebilir ve akademik yolculuğunuzu minimum hasarla atlatabilirsiniz.
                </p>
                
                <div className="pt-2 flex flex-col sm:flex-row gap-4 flex-wrap">
                  <button 
                    onClick={() => setActiveScreen('upload')}
                    className="bg-primary hover:bg-secondary active:scale-[0.98] transition-all text-white font-bold text-sm px-6 py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 leading-none"
                  >
                    <PlusCircle size={18} />
                    Çan Eğrisi Paylaş
                  </button>
                  <button 
                    onClick={() => { setSelectedDept('iktisat'); setActiveScreen('courses'); }}
                    className="bg-white border border-gray-200 hover:border-primary active:scale-[0.98] transition-all text-primary font-bold text-sm px-6 py-4 rounded-xl shadow flex items-center justify-center gap-2 leading-none"
                  >
                    <BookOpen size={18} />
                    Derse Göre Listele
                  </button>
                  
                </div>
              </div>
              
              {/* Decorative Background Icon */}
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none hidden lg:block transform translate-x-12 translate-y-12 shrink-0">
                <School size={300} className="stroke-[1.5] text-primary" />
              </div>
            </section>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted">Yüklenen Çan Eğrisi</p>
                  <p className="text-xl font-extrabold text-primary">{statsOverview.totalUploadsCount} Çan</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#3e5e95]">
                  <User size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted">Kayıtlı Akademisyen</p>
                  <p className="text-xl font-extrabold text-primary">{statsOverview.teachersCount} Hoca</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted">Katkıda Bulunan Üye</p>
                  <p className="text-xl font-extrabold text-primary">{statsOverview.contributorsCount} Emektar</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== SCREEN 2: COURSE LISTING ("Ders Listeleme") ==================== */}
        {activeScreen === 'courses' && (
          <div className="animate-fade-in space-y-6">
            
            {/* Header Search Banner */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-8 flex flex-col items-center text-center space-y-4">
              <h2 className="font-display font-extrabold text-primary text-2xl md:text-3xl">Ders Listeleme</h2>
              <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
                Akademik başarıya giden yolda, derslerin zorluk dereceleri ve çan eğrisi ortalama harflerini departman ve sınıflar bazında inceleyin.
              </p>
              
              {/* Central Searchbox */}
              <div className="relative w-full max-w-xl">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ders adı, kodu veya hocasını aratın..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 focus:border-primary rounded-xl focus:ring-1 focus:ring-primary shadow-sm text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sidebar filter controls (Left 3 columns) */}
              <aside className="lg:col-span-3 space-y-4">
                <div className="sticky top-24 space-y-4 text-left">
                  
                  <span className="text-[11px] font-bold text-text-muted tracking-wider uppercase pl-1 block">
                    BÖLÜMLER
                  </span>

                  <div className="flex flex-col gap-2">
                    {[
                      { key: 'iktisat', label: 'İktisat' },
                      { key: 'isletme', label: 'İşletme' },
                      { key: 'sbui', label: 'Siyaset Bilimi ve Uluslararası İlişkiler' },
                      { key: 'ums', label: 'Üniversite Mesleki Seçmeli' },
                      { key: 'uss', label: 'Üniversite Sosyal Seçmeli' }
                    ].map(dept => (
                      <button 
                        key={dept.key}
                        onClick={() => setSelectedDept(dept.key as any)}
                        className={`flex justify-between items-center p-4 rounded-xl font-semibold text-sm transition-all text-left ${
                          selectedDept === dept.key 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-white text-text-muted border border-gray-200/60 hover:bg-gray-50'
                        }`}
                      >
                        <span>{dept.label}</span>
                        <ChevronRight size={16} className={selectedDept === dept.key ? 'text-white' : 'text-gray-400'} />
                      </button>
                    ))}
                  </div>

                  {/* Sidebar count tracker */}
                  <div className="p-4 bg-white rounded-xl border border-gray-200/60 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase">Bölüm Veri Durumu</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-primary">
                        {filteredCourses.length}
                      </span>
                      <span className="text-xs font-semibold text-text-muted">Kayıt Bulundu</span>
                    </div>
                  </div>

                </div>
              </aside>

              {/* Course lists main (Right 9 columns) */}
              <div className="lg:col-span-9 space-y-6 text-left">
                
                {/* Year Selection Tabs (Conditional display based on department) */}
                {selectedDept !== 'uss' && selectedDept !== 'ums' && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scroll-hide">
                    {[
                      { key: 1, label: '1. Sınıf' },
                      { key: 2, label: '2. Sınıf' },
                      { key: 3, label: '3. Sınıf' },
                      ...(selectedDept === 'sbui' ? [{ key: 4, label: '4. Sınıf' }] : []),
                      { key: 'sec', label: 'Mesleki Seçmeli' }
                    ].map(tab => (
                      <button 
                        key={tab.key}
                        onClick={() => setSelectedYear(tab.key as any)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                          selectedYear === tab.key 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'bg-white text-text-muted border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid List */}
                {groupedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedCourses.map(course => (
                      <div 
                        key={course.code}
                        onClick={() => { setSelectedCourseCode(course.code); setActiveScreen('course_professors'); }}
                        className="group bg-white rounded-xl p-6 border border-gray-200/60 hover:border-primary hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-xs bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded">
                              {course.code}
                            </span>
                            
                          </div>

                          <div>
                            <h4 className="font-display font-extrabold text-lg text-primary group-hover:text-secondary transition-colors leading-snug">
                              {course.title}
                            </h4>
                            <p className="text-xs text-text-muted italic mt-1">{course.professorCount} Öğretim Görevlisi Verisi Var</p>
                          </div>
                        </div>

                        {/* Summary details indicators */}
                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Geçme Oranı</span>
                            <span className="text-lg font-extrabold text-primary">%{course.passingRate}</span>
                          </div>
                          <div className="h-8 w-[1px] bg-gray-200"></div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kayıtlı Öğrenci</span>
                            <span className="text-lg font-extrabold text-primary">{course.totalStudents}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-xl border border-gray-200 text-center space-y-3">
                    <AlertTriangle className="text-amber-500 mx-auto" size={40} />
                    <p className="font-bold text-gray-800">Seçili Kriterlerde Kayıtlı Ders Eğrisi Bulunamadı</p>
                    <p className="text-xs text-text-muted">
                      Henüz bu hoca veya ders için veri yüklenmemiş olabilir. İlk yükleyen siz olabilirsiniz!
                    </p>
                    <button 
                      onClick={() => setActiveScreen('upload')}
                      className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 hover:bg-secondary mt-2 shadow"
                    >
                      <PlusCircle size={14} /> Bilgileri Doldurup Katkıda Bulunun
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* floating action button shortcut */}
            <button 
              onClick={() => setActiveScreen('upload')}
              className="fixed bottom-24 right-6 bg-primary hover:bg-secondary text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all z-20 group"
              title="Yeni Eğrisi Girişi Yap"
            >
              <Plus size={24} />
              <span className="hidden md:inline font-bold text-xs pr-2">ÇAN EKLE</span>
            </button>

          </div>
        )}

        {/* ==================== SCREEN 2.5: COURSE PROFESSORS ==================== */}
        {activeScreen === 'course_professors' && selectedCourseCode && (
          <div className="animate-fade-in space-y-6 text-left">
            <button 
              onClick={() => setActiveScreen('courses')}
              className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
            >
              <ArrowLeft size={16} /> Ders Listesine Geri Dön
            </button>
            
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-8 flex flex-col items-start space-y-2">
              <span className="text-xs font-bold text-primary px-3 py-1 bg-white rounded-full border border-primary/20">{selectedCourseCode}</span>
              <h2 className="font-display font-extrabold text-primary text-2xl md:text-3xl">Hocalar</h2>
              <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
                Bu dersi veren hocaları inceleyin.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(() => {
                const courseInstances = courses.filter(c => c.code === selectedCourseCode);
                const uniqueProfs = Array.from(new Set(courseInstances.map(c => c.professorName)));
                return uniqueProfs.map(prof => {
                  const profInstances = courseInstances.filter(c => c.professorName === prof);
                  
                  const totalPassed = profInstances.reduce((sum, c) => {
                    const gd = c.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
                    return sum + (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
                  }, 0);
                  const totalStudents = profInstances.reduce((sum, c) => sum + c.totalStudents, 0);
                  const passingRate = totalStudents > 0 ? (totalPassed / totalStudents) * 100 : 0;
                  
                  

                  return (
                    <div 
                      key={prof}
                      onClick={() => { setSelectedProfessorName(prof); setActiveScreen('course_professor_terms'); }}
                      className="group bg-white rounded-xl p-6 border border-gray-200/60 hover:border-primary hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <User size={24} />
                        </div>
                        
                      </div>
                      <h4 className="font-extrabold text-lg text-primary">{prof}</h4>
                      <p className="text-xs text-text-muted mt-2">Dönem Sayısı: {profInstances.length}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ==================== SCREEN 2.75: COURSE PROFESSOR TERMS ==================== */}
        {activeScreen === 'course_professor_terms' && selectedCourseCode && selectedProfessorName && (
          <div className="animate-fade-in space-y-6 text-left">
            <button 
              onClick={() => setActiveScreen('course_professors')}
              className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
            >
              <ArrowLeft size={16} /> Hoca Listesine Geri Dön
            </button>
            
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-8 flex flex-col items-start space-y-2">
              <span className="text-xs font-bold text-primary px-3 py-1 bg-white rounded-full border border-primary/20">{selectedCourseCode} - {selectedProfessorName}</span>
              <h2 className="font-display font-extrabold text-primary text-2xl md:text-3xl">Dönemler</h2>
              <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
                Hocanın açtığı derslerin dönemlere göre çan eğrisi ortalamaları. Detayları görüntülemek için bir döneme tıklayın.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {courses.filter(c => c.code === selectedCourseCode && c.professorName === selectedProfessorName).map(termInstance => {
                const passingRateStr = termInstance.passingRate !== undefined ? String(termInstance.passingRate) : "0";
                const passingRate = parseFloat(passingRateStr);
                const tag = calculateTagScore(passingRate, termInstance.attendanceStatus || 'none');
                
                return (
                  <div 
                    key={termInstance.id}
                    onClick={() => { setSelectedCourseId(termInstance.id); setActiveScreen('detail'); }}
                    className="group bg-white rounded-xl p-6 border border-gray-200/60 hover:border-primary hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-muted mb-1 text-left uppercase tracking-wider">Dönem & Dil</span>
                        <h4 className="font-extrabold text-lg text-primary">{termInstance.term}</h4>
                        {termInstance.language && (
                          <span className="text-xs text-secondary mt-1 font-bold">{termInstance.language}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        tag === 'Zorlayıcı Çan' ? 'bg-rose-500/10 text-rose-700' : 
                        tag === 'Öğrenci Dostu Çan' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        {tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== SCREEN 3: BELL CURVE DETAILS ("Çan Detay") ==================== */}
        {activeScreen === 'detail' && currentCourse && (
          <div className="animate-fade-in space-y-6 text-left">
            
            {/* Navigation back and header */}
            <section className="space-y-4">
              <button 
                onClick={() => setActiveScreen('course_professor_terms')}
                className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
              >
                <ArrowLeft size={16} /> Dönem Listesine Geri Dön
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/45 p-6 rounded-2xl border border-gray-200">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                    {currentCourse.department.toUpperCase()} BÖLÜMÜ
                  </span>
                  <h2 className="font-display font-extrabold text-2xl md:text-4xl text-[#00193c] tracking-tight">
                    {currentCourse.title}
                  </h2>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-text-muted text-sm mt-2">
                    <span className="flex items-center gap-1.5 font-medium" title="Ders Kodu"><Code size={16} /> {currentCourse.code}</span>
                    <span 
                      className="flex items-center gap-1.5 font-semibold"
                      title="Hocanın Ana Bölümü: İçerikte Gösterilir"
                    >
                      <User size={16} /> {currentCourse.professorName} {!currentCourse.professorName && currentCourse.profMainDept ? `(${currentCourse.profMainDept})` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium"><Calendar size={16} /> {currentCourse.term}</span>
                    <span className="flex items-center gap-1.5 font-bold text-xs bg-gray-100 px-2 py-1 rounded">Dil: {currentCourse.language || 'Türkçe'}</span>
                    <span className="flex items-center gap-1.5 font-bold text-xs bg-gray-100 px-2 py-1 rounded">Çan: {currentCourse.bellType || 'mutlak'}</span>
  <span className={`flex items-center gap-1.5 font-bold text-[11px] px-2 py-1 rounded-lg ${
    calculateTagScore((currentCourse.passingRate || 0), currentCourse.attendanceStatus || 'none') === 'Zorlayıcı Çan' ? 'bg-rose-500/10 text-rose-700' : 
    calculateTagScore((currentCourse.passingRate || 0), currentCourse.attendanceStatus || 'none') === 'Öğrenci Dostu Çan' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
  }`}>
    {calculateTagScore((currentCourse.passingRate || 0), currentCourse.attendanceStatus || 'none')}
  </span>
                    <span className="flex items-center gap-1.5 font-bold text-xs bg-gray-100 px-2 py-1 rounded">Hoca Blm: {currentCourse.profMainDept || 'Bilinmiyor'}</span>
                  </div>
                </div>


              </div>
            </section>

            {/* Main Details Bento with Charts */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* Bento Grid layout columns (8 cols) */}
              <div className="md:col-span-8 space-y-6">
                
                {/* Micro Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-text-muted">Sınıf Ortalaması</span>
                    <span className="text-2xl font-extrabold text-primary tracking-tight mt-1">
                      {currentCourse.averageBell}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-text-muted">Standart Sapma</span>
                    <span className="text-2xl font-extrabold text-primary tracking-tight mt-1">
                      {currentCourse.stdDev || 0}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-text-muted">Geçme Oranı</span>
                    <span className="text-2xl font-extrabold text-primary tracking-tight mt-1">
                      {(() => {
                        const gd = currentCourse.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
                        const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
                        const total = passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
                        return total > 0 ? `%${(passed / total * 100).toFixed(1)}` : '-';
                      })()}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-text-muted">Katılımcı Sayısı</span>
                    <span className="text-2xl font-extrabold text-[#3e5e95] tracking-tight mt-1">
                      {currentCourse.totalStudents}
                    </span>
                  </div>
                </div>

                {/* Grade Distribution Bar Chart (Rebuilt as CSS beautiful graph) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 className="font-display font-extrabold text-primary text-base">Not Dağılımı</h3>
                    <span className="text-xs text-text-muted">Aralık Harfleri</span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Maps distributions precisely dynamic percentage of total student */}
                    {['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'F0'].map((grade) => {
                      const count = currentCourse.gradesDistribution[grade as keyof typeof currentCourse.gradesDistribution];
                      const total = (Object.values(currentCourse.gradesDistribution) as (number | undefined)[]).reduce((a: number, b: number | undefined) => a + (b || 0), 0);
                      const percent = total > 0 && typeof count === 'number' && !Number.isNaN(count) ? (count / total) * 100 : 0;
                      
                      let barColor = 'bg-primary';
                      let defaultThreshold = '0+';
                      if (grade === 'AA') { barColor = 'bg-emerald-500'; defaultThreshold = '85+'; }
                      else if (grade === 'BA') { barColor = 'bg-emerald-500'; defaultThreshold = '75+'; }
                      else if (grade === 'BB') { barColor = 'bg-emerald-500'; defaultThreshold = '65+'; }
                      else if (grade === 'CB') { barColor = 'bg-emerald-500'; defaultThreshold = '55+'; }
                      else if (grade === 'CC') { barColor = 'bg-emerald-500'; defaultThreshold = '45+'; }
                      else if (grade === 'DC') { barColor = 'bg-amber-500'; defaultThreshold = '40+'; }
                      else if (grade === 'DD') { barColor = 'bg-rose-500'; defaultThreshold = '30+'; }
                      
                      else if (grade === 'FD') { barColor = 'bg-rose-500'; defaultThreshold = '20+'; }
                      else if (grade === 'FF') { barColor = 'bg-rose-500'; defaultThreshold = '0+'; }
                      else if (grade === 'F0') { barColor = 'bg-slate-600'; defaultThreshold = '0+'; }
                      
                      const threshold = currentCourse.gradeThresholds?.[grade as keyof typeof currentCourse.gradeThresholds] !== undefined
                          ? currentCourse.gradeThresholds?.[grade as keyof typeof currentCourse.gradeThresholds] + '+'
                          : defaultThreshold;

                      return (
                        <div key={grade} className="flex items-center gap-4 group">
                          <span className="w-8 font-extrabold text-sm text-primary tracking-tight">{grade}</span>
                          <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full ${barColor} rounded-full transition-all duration-1000 group-hover:opacity-85`} 
                              style={{ width: `${Math.max(percent, 2.5)}%` }} // make visible always
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-text-muted/75 w-8">{threshold}</span>
                          <span className="w-8 text-right font-bold text-sm text-primary">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verified uploader identity card */}
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-3 shadow-sm mt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      Ekleyen: <span className="font-bold">{currentCourse.uploadedBy}</span>
                    </p>
                    <p className="text-[10px] text-text-muted">{currentCourse.uploadedDate}</p>
                  </div>
                </div>

              </div>

              {/* Sidebar information inside Detail page (4 cols) */}
              <div className="md:col-span-4 space-y-6">
                
                {/* Description details section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                  <h3 className="font-display font-extrabold text-primary text-base">Hakkında &amp; Notlar</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {currentCourse.description || 'Bu ders için henüz bir açıklama veya not paylaşılmamış.'}
                  </p>
                  <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs text-text-muted">
                    <div className="flex justify-between border-b pb-1">
                      <span>Yoklama Durumu:</span>
                      <span className="font-bold text-primary">
                        {currentCourse.attendanceStatus === 'none' ? 'Yoklama almıyor' :
                         currentCourse.attendanceStatus === 'not_failing' ? 'Yoklama alıyor ama bırakmıyor' :
                         currentCourse.attendanceStatus === 'failing' ? 'Yoklamadan bırakıyor' :
                         currentCourse.attendanceStatus === 'quiz' ? 'Quiz yapıyor' : 'Yoklamadan ek puan veriyor'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Dönem Ortalaması:</span>
                      <span className="font-bold text-primary">{currentCourse.averageBell}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Standart Sapma:</span>
                      <span className="font-bold text-primary">{currentCourse.stdDev || 0}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Çan Türü:</span>
                      <span className="font-bold text-primary uppercase">{currentCourse.bellType || 'Mutlak'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>Geçme Oranı:</span>
                      <span className="font-bold text-primary">
                        {(() => {
                          const gd = currentCourse.gradesDistribution || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0,F0:0};
                          const passed = (gd.AA||0) + (gd.BA||0) + (gd.BB||0) + (gd.CB||0) + (gd.CC||0) + (gd.DC||0);
                          const total = passed + (gd.DD||0) + (gd.FD||0) + (gd.FF||0) + (gd.F0||0);
                          return total > 0 ? `%${(passed / total * 100).toFixed(1)}` : '-';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discussion Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 className="font-display font-extrabold text-primary text-base">Açıklamalar</h3>
                    <span className="text-xs text-text-muted">({currentCourse.comments.length} Adet)</span>
                  </div>

                  {/* Render Comments */}
                  <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-1">
                    {currentCourse.comments.length > 0 ? (
                      currentCourse.comments.map(comment => (
                        <div key={comment.id} className="p-3 bg-background-gray/50 rounded-xl shadow-sm space-y-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary">{comment.author}</span>
                            <span className="text-[10px] text-text-muted">{comment.date}</span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed pl-1">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted italic text-center py-4">Bu ders ve dönem için henüz açıklama bulunmuyor.</p>
                    )}
                  </div>

                  {/* Comment Input or Auth Gate */}
                  {authRole !== 'guest' ? (
                    <form onSubmit={handleCommentSubmit} className="space-y-2 pt-2 border-t border-gray-100">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Örn: Sorular zordu, sınavlar orta zorluktaydı..."
                        rows={2}
                        className="w-full text-xs p-3 border border-gray-200 focus:border-primary rounded-xl focus:ring-1 focus:ring-primary shadow-sm bg-background-gray/20"
                      />
                      <button 
                        type="submit"
                        className="w-full bg-primary hover:bg-secondary text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow"
                      >
                        Açıklama Gönder (Onaya Düşer)
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4 p-5 rounded-xl bg-background-gray/80 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                      <Lock size={28} className="text-text-muted mb-2" />
                      <p className="text-xs font-bold text-primary mb-1">Açıklama Eklemek İçin Giriş Yapmalısınız</p>
                      <button 
                        onClick={() => setActiveScreen('auth')}
                        className="w-full py-2 bg-secondary hover:bg-primary transition-all text-white font-bold text-xs rounded-lg shadow-sm mt-2"
                      >
                        Öğrenci Olarak Giriş Yap
                      </button>
                    </div>
                  )}

                </div>

              </div>
              
            </div>

          </div>
        )}

        {/* ==================== SCREEN 4: UPLOAD PAGE ("Çan Bilgisi Paylaş") ==================== */}
        {activeScreen === 'upload' && (
          <div className="animate-fade-in space-y-6 text-left max-w-3xl mx-auto">
            
            {/* Intro Section */}
            <div className="text-center md:text-left space-y-2">
              <h2 className="font-display font-extrabold text-3xl text-primary">Çan Bilgisi Paylaş</h2>
              <p className="text-sm text-text-muted">
                Oturumunuz şu an açık. Bilgileri doldurarak Yıldızlı topluluğunun başarısına katkıda bulunun.
              </p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* Professor and Course row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">HOCANIN ANA BÖLÜMÜ</label>
                    <select 
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                      value={uploadForm.profMainDept}
                      onChange={(e) => setUploadForm(p => ({ ...p, profMainDept: e.target.value }))}
                    >
                      <option value="İktisat">İktisat</option>
                      <option value="İşletme">İşletme</option>
                      <option value="SBUİ">SBUİ</option>
                      <option value="ÜMS">ÜMS</option>
                      <option value="ÜSS">ÜSS</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">PROFESÖR ADI</label>
                    <input 
                      type="text"
                      required
                      value={uploadForm.professorName}
                      onChange={(e) => setUploadForm(p => ({ ...p, professorName: e.target.value }))}
                      placeholder="Örn: Dr. Ahmet Yılmaz"
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">DERS ADI</label>
                    <input 
                      type="text"
                      required
                      value={uploadForm.courseName}
                      onChange={(e) => setUploadForm(p => ({ ...p, courseName: e.target.value }))}
                      placeholder="Örn: İktisada Giriş"
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Course Mappings Selector */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                    Dersin Bölümleri & Sınıf Eşleştirmeleri (Biri ya da birkaçı seçilebilir)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    {DEPARTMENTS_CONFIG.map((dept) => {
                      const isSelected = uploadForm.mappings.some(m => m.dept === dept.key);
                      const currentYear = uploadForm.mappings.find(m => m.dept === dept.key)?.year ?? (dept.hasYear ? 1 : 'none');

                      return (
                        <div 
                          key={dept.key} 
                          className={`p-3 rounded-lg border flex flex-col xl:flex-row xl:items-center justify-between gap-3 transition-all ${
                            isSelected 
                              ? 'bg-primary/5 border-primary shadow-sm' 
                              : 'bg-white border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                            let updated;
                            if (isSelected) {
                              updated = uploadForm.mappings.filter(m => m.dept !== dept.key);
                            } else {
                              updated = [...uploadForm.mappings, { dept: dept.key, year: dept.hasYear ? 1 : 'none' }];
                            }
                            setUploadForm(prev => ({ ...prev, mappings: updated as any }));
                          }}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              readOnly
                              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                              {dept.label}
                            </span>
                          </div>

                          {isSelected && dept.hasYear && (
                            <div className="flex items-center gap-2 ml-6 xl:ml-0">
                              <span className="text-[10px] font-bold text-text-muted">SINIF:</span>
                              <select
                                value={currentYear}
                                onChange={(e) => {
                                  const val = e.target.value === 'sec' ? 'sec' : parseInt(e.target.value);
                                  const updated = uploadForm.mappings.map(m => 
                                    m.dept === dept.key ? { ...m, year: val } : m
                                  );
                                  setUploadForm(prev => ({ ...prev, mappings: updated as any }));
                                }}
                                className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-primary outline-none focus:border-primary cursor-pointer shadow-sm w-full xl:w-auto"
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

                {/* Course chips selection year layout */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">DERSİN DİLİ</label>
                  <div className="relative">
                    <select 
                      value={uploadForm.language}
                      onChange={(e) => setUploadForm(p => ({ ...p, language: e.target.value as any }))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-primary outline-none"
                    >
                      <option value="Türkçe">Türkçe</option>
                      <option value="İngilizce">İngilizce</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">DERSİN ALINDIĞI DÖNEM</label>
                  <div className="relative">
                    <select 
                      value={uploadForm.term}
                      onChange={(e) => setUploadForm(p => ({ ...p, term: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-primary outline-none"
                    >
                      <option value="2025-2026 Güz">2025-2026 Güz</option>
                      <option value="2025-2026 Bahar">2025-2026 Bahar</option>
                      <option value="2024-2025 Güz">2024-2025 Güz</option>
                      <option value="2024-2025 Bahar">2024-2025 Bahar</option>
                      <option value="2024-2025 Yaz">2024-2025 Yaz</option>
                      <option value="2023-2024 Güz">2023-2024 Güz</option>
                      <option value="2023-2024 Bahar">2023-2024 Bahar</option>
                      <option value="2023-2024 Yaz">2023-2024 Yaz</option>
                      <option value="2022-2023 Güz">2022-2023 Güz</option>
                      <option value="2022-2023 Bahar">2022-2023 Bahar</option>
                      <option value="2022-2023 Yaz">2022-2023 Yaz</option>
                      <option value="2021-2022 Güz">2021-2022 Güz</option>
                      <option value="2021-2022 Bahar">2021-2022 Bahar</option>
                      <option value="2021-2022 Yaz">2021-2022 Yaz</option>
                    </select>
                  </div>
                </div>

                {/* Attendance Status Radios with custom checks */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">YOKLAMA DURUMU</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'none', label: 'Yoklama almıyor' },
                      { key: 'not_failing', label: 'Yoklama alıyor ama bırakmıyor' },
                      { key: 'failing', label: 'Yoklamadan bırakıyor' },
                      { key: 'bonus', label: 'Yoklamadan ek puan veriyor' },
                      { key: 'quiz', label: 'Quiz yapıyor' }
                    ].map(st => (
                      <label 
                        key={st.key}
                        onClick={() => setUploadForm(p => ({ ...p, attendanceStatus: st.key as any }))}
                        className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors group ${
                          uploadForm.attendanceStatus === st.key 
                            ? 'bg-primary/5 border-primary text-primary' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input 
                          type="radio"
                          name="form_attendance"
                          checked={uploadForm.attendanceStatus === st.key}
                          onChange={() => {}}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-3 text-sm font-semibold">{st.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                                {/* File uploader dropzone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                    ÇAN EĞRİSİ PDF DOSYASI (MAX: 300 KB)
                  </label>
                  
                  <div className="mt-1 relative flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all border-gray-300 bg-gray-50 hover:border-primary hover:bg-gray-100 group">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           if (file.size > 300 * 1024) {
                             showToast('Dosya boyutu 300 KB sınırını aşıyor.', 'error');
                             return;
                           }
                           const reader = new FileReader();
      reader.onload = (re) => {
         const dataUrl = re.target?.result as string;
         setUploadForm(p => ({ ...p, fileUploaded: true, fileName: file.name, fileData: dataUrl }));
      }
      reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1 text-center">
                      {uploadForm.fileUploaded ? (
                        <>
                          <CheckCircle2 size={36} className="text-emerald-600 mx-auto animate-scale-up" />
                          <p className="font-bold text-emerald-700 mt-2">{uploadForm.fileName}</p>
                          <p className="text-xs text-emerald-600">Başarıyla eklendi (Değiştirmek için tıklayın)</p>
                        </>
                      ) : (
                        <>
                          <Upload size={36} className="text-gray-400 group-hover:text-primary transition-colors mx-auto" />
                          <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                            <span className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-secondary">
                              <span>Dosya Seç</span>
                            </span>
                            <p className="pl-1">veya sürükleyip bırakın</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Sadece PDF (Maks: 300KB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional notes/Description */}
                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider ml-1" htmlFor="description">AÇIKLAMA (OPSİYONEL)</label>
                  <textarea 
                    id="description"
                    rows={3}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Sınavların zorluğu, ekstra harf barajı notları vb..."
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none"
                  />
                </div>

                {/* Submit Trigger Action */}
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-[#00142e] text-white py-4 px-8 rounded-xl font-bold font-display text-base transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Veri İşleniyor ve Gönderiliyor...' : 'Verileri Onaya Gönder'}
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

        {/* ==================== SCREEN 5: ADMIN PANEL ("Yönetici Paneli") ==================== */}
        {activeScreen === 'admin' && (
          <div className="animate-fade-in space-y-6 text-left">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-display font-extrabold text-3xl text-primary">Yönetici Kontrol Paneli</h2>
                <p className="text-xs text-text-muted">Gelen öğrenci paylaşımlarını denetleyin veya doğrudan sisteme çan eğrisi verisi girin.</p>
              </div>
              
              <button 
                onClick={() => { setAuthRole('student'); setActiveScreen('home'); showToast('Moderatör modundan çıkıldı.'); }}
                className="text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/80 px-4 py-2 rounded-xl transition-all"
              >
                Yönetici Modunu Kapat
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left sidebar list: Pending submissions list */}
              <section className="lg:col-span-4 space-y-4">
                <div className="bg-gray-100 p-1 flex rounded-xl border border-gray-200 mb-4 flex-wrap">
                  <button onClick={() => setSelectedAdminTab('pending')} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-colors ${selectedAdminTab === 'pending' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:bg-gray-200/50'}`}>Onay Bekleyenler</button>
                  <button onClick={() => setSelectedAdminTab('direct')} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-colors ${selectedAdminTab === 'direct' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:bg-gray-200/50'}`}>Doğrudan Veri Ekle</button>
                  <button onClick={() => setSelectedAdminTab('active')} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-colors ${selectedAdminTab === 'active' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:bg-gray-200/50'}`}>Onaylanmışları Düzenle</button>
                  <button onClick={() => setSelectedAdminTab('accounts')} className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-colors ${selectedAdminTab === 'accounts' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:bg-gray-200/50'}`}>Hesap Listesi</button>
                </div>

                {selectedAdminTab === 'active' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-extrabold text-sm text-primary uppercase tracking-wider">
                        Onaylanmış Dersler
                      </h3>
                      <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
                        {courses.length} Ders
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-1">
                      {courses.length > 0 ? (
                        courses.map(c => (
                          <div 
                            key={c.id}
                            onClick={() => {
                              setSelectedAdminActiveCourseId(c.id);
                              setActiveAdminForm({
                                courseTitle: c.title,
                                professorName: c.professorName,
                                courseCode: c.code,
                                term: c.term,
                                language: c.language || 'Türkçe',
                                averageBell: c.averageBell,
                                stdDev: c.stdDev || 10,
                                profMainDept: c.profMainDept || 'İktisat',
                                bellType: c.bellType || 'mutlak',
                                attendanceStatus: c.attendanceStatus || 'none',
                                gradeThresholds: c.gradeThresholds || {AA:85, BA:75, BB:65, CB:55, CC:45, DC:40, DD:30, FD:20, FF:0},
                                gradesDistribution: c.gradesDistribution || {AA:0, BA:0, BB:0, CB:0, CC:0, DC:0,  FD:0, FF:0, F0:0},
                                description: c.description || '',
                                mappings: c.mappings || []
                              });
                            }}
                            className={`group p-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md border-2 text-left space-y-2 ${
                              selectedAdminActiveCourseId === c.id 
                                ? 'border-primary bg-primary/2' 
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="bg-primary/10 text-primary font-bold text-[10px] px-2.5 py-0.5 rounded">
                                {c.code}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-primary line-clamp-1">{c.title}</h4>
                            <p className="text-xs text-text-muted italic leading-none">{c.professorName}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                          <p className="text-xs text-text-muted">Onaylanmış ders bulunmuyor.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {selectedAdminTab === 'pending' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-extrabold text-sm text-primary uppercase tracking-wider">
                        Bekleyen Onaylar
                      </h3>
                      <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
                        {pendings.length} Bekleyen
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-1">
                      {pendings.length > 0 ? (
                        pendings.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => setSelectedPendingId(p.id)}
                            className={`group p-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md border-2 text-left space-y-2 ${
                              selectedPendingId === p.id 
                                ? 'border-primary bg-primary/2' 
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="bg-primary/10 text-primary font-bold text-[10px] px-2.5 py-0.5 rounded">
                                {p.courseCode}
                              </span>
                              <span className="text-[10px] text-text-muted">{p.date}</span>
                            </div>
                            <h4 className="font-bold text-sm text-primary line-clamp-1">{p.courseTitle}</h4>
                            <p className="text-xs text-text-muted italic leading-none">{p.professorName}</p>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-8 rounded-xl border border-gray-100 text-center space-y-2">
                          <CheckCircle2 className="text-emerald-500 mx-auto" size={32} />
                          <p className="text-xs font-bold text-primary">Onay Bekleyen Veri Bulunmamaktadır</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-2 mt-8">
                      <h3 className="font-display font-extrabold text-primary text-sm tracking-wider uppercase">Bekleyen Açıklamalar</h3>
                      <span className="text-xs font-extrabold bg-primary text-white px-3 py-1 rounded-full">{pendingComments.length} Bekleyen</span>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {pendingComments.length > 0 ? (
                        pendingComments.map(pc => (
                          <div key={pc.id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-primary">{pc.author}</span>
                              <span className="text-text-muted">{pc.date}</span>
                            </div>
                            <p className="text-xs text-text-muted">{pc.text}</p>
                            <div className="flex gap-2 justify-end mt-2">
                              <button 
                                onClick={() => {
                                  setCourses(prev => prev.map(c => c.id === pc.courseDataId ? { ...c, comments: [...c.comments, pc] } : c));
                                  setPendingComments(prev => prev.filter(c => c.id !== pc.id));
                                  showToast('Açıklama onaylandı ve yayınlandı.', 'success');
                                }}
                                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg flex-1 transition-colors"
                              >Onayla</button>
                              <button 
                                onClick={() => {
                                  setPendingComments(prev => prev.filter(c => c.id !== pc.id));
                                  showToast('Açıklama reddedildi.', 'info');
                                }}
                                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-lg flex-1 transition-colors"
                              >Reddet</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-8 rounded-xl border border-gray-100 text-center space-y-2">
                          <CheckCircle2 className="text-emerald-500 mx-auto" size={32} />
                          <p className="text-xs font-bold text-primary">Onay Bekleyen Açıklama Bulunmamaktadır</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {selectedAdminTab === 'accounts' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-display font-extrabold text-sm text-primary uppercase tracking-wider">
                         Sistemdeki Hesaplar
                       </h3>
                       <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
                         {visibleAccounts.length} Hesap
                       </span>
                    </div>
                    <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                      {visibleAccounts.map(acc => (
                        <div
                          key={acc.id}
                          onClick={() => setActiveAccount(acc)}
                          className={`group p-4 bg-white rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md border-2 text-left space-y-2 ${
                            activeAccount?.id === acc.id 
                                ? 'border-primary bg-primary/2' 
                                : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col items-start gap-1 w-full">
                            <div className="flex w-full justify-between items-start">
                              <span className="font-bold text-sm text-primary">{acc.googleName || 'Google İsmi Yok (Eski Kayıt)'}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${acc.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                                {acc.role === 'admin' ? 'Yönetici' : 'Öğrenci'}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded-md mt-1">Kullanıcı Adı: @{acc.name}</span>
                            <span className="text-xs text-text-muted">E-Posta: {acc.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
              {/* Right main display page: Details editor and validations */}
              <section className="lg:col-span-8">
                {selectedAdminTab === 'accounts' && activeAccount && editAccountForm && (() => {
                  const userCourses = courses.filter(c => c.uploadedBy === activeAccount.name);
                  const total = userCourses.length;
                  const lastUploadDate = total > 0 ? userCourses[userCourses.length - 1].uploadedDate : 'Henüz paylaşım yok';
                  
                  return (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-scale-up p-6 md:p-8 text-left space-y-6">
                      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                          <User size={28} />
                        </div>
                        <div>
                          <h2 className="text-xl font-display font-bold text-primary">Hesap Bilgilerini Düzenle</h2>
                          <p className="text-xs text-text-muted">ID: #{activeAccount.id} • Kayıt Tarihi: {activeAccount.joinDate}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase tracking-wider block">Google Hesap İsmi</label>
                          <input 
                            type="text"
                            className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none"
                            value={editAccountForm.googleName || ""}
                            onChange={(e) => setEditAccountForm((prev: any) => ({ ...prev, googleName: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase tracking-wider block">Kullanıcı Adı</label>
                          <input 
                            type="text"
                            className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none"
                            value={editAccountForm.name || ""}
                            onChange={(e) => setEditAccountForm((prev: any) => ({ ...prev, name: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase tracking-wider block">E-Posta Adresi</label>
                          <input 
                            type="email"
                            className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none"
                            value={editAccountForm.email || ""}
                            onChange={(e) => setEditAccountForm((prev: any) => ({ ...prev, email: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase tracking-wider block">Hesap Türü (Yetki)</label>
                          <select 
                            className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-4 py-3 text-sm rounded-xl outline-none cursor-pointer"
                            value={editAccountForm.role || "student"}
                            onChange={(e) => setEditAccountForm((prev: any) => ({ ...prev, role: e.target.value }))}
                          >
                            <option value="student">Öğrenci</option>
                            <option value="admin">Yönetici (Admin)</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Toplam Paylaşım</span>
                          <span className="font-bold text-primary text-sm">{total} Çan Eğrisi</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">En Son Paylaşım</span>
                          <span className="font-bold text-primary text-sm">{lastUploadDate}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Durum:</span>
                          {editAccountForm.isBanned ? (
                            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">Yasaklı (Erişim Kapalı)</span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Aktif (Yetkili)</span>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          {editAccountForm.isBanned ? (
                            <button
                              type="button"
                              onClick={() => setEditAccountForm((prev: any) => ({ ...prev, isBanned: false }))}
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-xl transition-all"
                            >
                              Yasağı Kaldır
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditAccountForm((prev: any) => ({ ...prev, isBanned: true }))}
                              className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                            >
                              Hesabı Yasakla
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                          >
                            Hesabı Sil
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveAccountChanges}
                            className="bg-primary hover:bg-[#00112a] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              {selectedAdminTab === 'accounts' && !activeAccount && (
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center animate-fade-in flex flex-col items-center mt-4">
                    <User size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-sm font-bold text-text-muted">Ayrıntıları görmek için bir hesap seçin.</h3>
                 </div>
              )}
                {selectedAdminTab === 'pending' && pendings.length > 0 && currentPending ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-scale-up">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-primary">
                          Onay Detayı: {currentPending.courseTitle}
                        </h3>
                        <p className="text-[11px] text-text-muted">
                          Başvuru ID: #{currentPending.id} • Gönderen: {currentPending.applicantName} ({currentPending.applicantId})
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleRejectPending(currentPending.id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200/50 transition-colors"
                        >
                          Reddet
                        </button>
                        <button 
                          onClick={() => handleApprovePending(currentPending.id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-[#00112a] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-98"
                        >
                          Onayla
                        </button>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* Left: Document image preview */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">
                          YÜKLENEN BELGE (OBS ÇAN EKRAN ALINTISI)
                        </span>

                        <div className="aspect-[3/4] bg-background-gray rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                          {currentPending.fileUrl ? (
                            (currentPending.fileUrl.toLowerCase().endsWith('.pdf') || currentPending.fileUrl.startsWith('data:application/pdf')) ? (
                              <iframe 
                                src={currentPending.fileUrl} 
                                title="Grade Report Document PDF" 
                                className="w-full h-full border-none"
                              />
                            ) : (
                              <img 
                                src={currentPending.fileUrl} 
                                alt="Grade Report Document Snapshot of the BellCurve" 
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="text-center p-6 space-y-2">
                              <FileText className="mx-auto text-gray-400 stroke-[1.5]" size={36} />
                              <p className="text-xs text-text-muted">Resmi Döküm Belgesi Yüklenmedi</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="bg-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg text-primary flex items-center gap-1.5">
                              Entegre Görüntü Islak Kaşe Teyitli
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Editable fields simulation */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase flex items-center gap-1">
                          VERİ DOĞRULAMA &amp; DÜZENLEME 
                          <span className="bg-secondary/15 text-secondary text-[8px] px-2 py-0.5 rounded uppercase font-extrabold tracking-widest ml-auto">
                            DÜZENLENEBİLİR
                          </span>
                        </span>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Ders Adı</label>
                            <input 
                              type="text" 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.courseTitle || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, courseTitle: val } : p));
                              }}
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Öğretim Üyesi</label>
                            <input 
                              type="text" 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.professorName || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, professorName: val } : p));
                              }}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Ders Kodu</label>
                            <input 
                              type="text" 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.courseCode || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, courseCode: val } : p));
                              }}
                            />
                          </div>

                                                    <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Ders Dili</label>
                            <select 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                              value={currentPending.language || 'Türkçe'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, language: val as any } : p));
                              }}
                            >
                              <option value="Türkçe">Türkçe</option>
                              <option value="İngilizce">İngilizce</option>
                              <option value="Diğer">Diğer</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Dönem</label>
                            <select 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                              value={currentPending.term || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, term: val } : p));
                              }}
                            >
                              <option value="2025-2026 Güz">2025-2026 Güz</option>
                              <option value="2025-2026 Bahar">2025-2026 Bahar</option>
                              <option value="2024-2025 Güz">2024-2025 Güz</option>
                              <option value="2024-2025 Bahar">2024-2025 Bahar</option>
                              <option value="2023-2024 Güz">2023-2024 Güz</option>
                              <option value="2023-2024 Bahar">2023-2024 Bahar</option>
                            </select>
                          </div>

                          <div className="pt-2 col-span-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                              Dersin Bölümleri & Sınıf Eşleştirmeleri (Biri ya da birkaçı seçilebilir)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-gray-200">
                              {DEPARTMENTS_CONFIG.map((dept) => {
                                const isSelected = (currentPending.mappings || []).some(m => m.dept === dept.key);
                                const currentYear = (currentPending.mappings || []).find(m => m.dept === dept.key)?.year ?? (dept.hasYear ? 1 : 'none');

                                return (
                                  <div 
                                    key={dept.key} 
                                    className={`p-2.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all ${
                                      isSelected 
                                        ? 'bg-white border-primary shadow-sm ring-1 ring-primary' 
                                        : 'bg-white border-gray-200/80 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                                      setPendings(prev => prev.map(p => {
                                        if (p.id === currentPending.id) {
                                          let updated;
                                          if (isSelected) {
                                            updated = (p.mappings || []).filter(m => m.dept !== dept.key);
                                          } else {
                                            updated = [...(p.mappings || []), { dept: dept.key, year: dept.hasYear ? 1 : 'none' }];
                                          }
                                          return { ...p, mappings: updated as any };
                                        }
                                        return p;
                                      }));
                                    }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        readOnly
                                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                      />
                                      <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                        {dept.label}
                                      </span>
                                    </div>

                                    {isSelected && dept.hasYear && (
                                      <div className="flex items-center gap-1.5 ml-6 md:ml-0">
                                        <span className="text-[9px] font-bold text-text-muted">SINIF:</span>
                                        <select
                                          value={currentYear}
                                          onChange={(e) => {
                                            const val = e.target.value === 'sec' ? 'sec' : parseInt(e.target.value);
                                            setPendings(prev => prev.map(p => {
                                              if (p.id === currentPending.id) {
                                                const updated = (p.mappings || []).map(m => 
                                                  m.dept === dept.key ? { ...m, year: val } : m
                                                );
                                                return { ...p, mappings: updated as any };
                                              }
                                              return p;
                                            }));
                                          }}
                                          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-bold text-primary outline-none focus:border-primary cursor-pointer"
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

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Sınıf Ortalaması</label>
                            <input 
                              type="number" 
                              step="0.01"
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.average || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, average: val } : p));
                              }}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Standart Sapma</label>
                            <input 
                              type="number" 
                              step="0.01"
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.stdDev || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, stdDev: val } : p));
                              }}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Hocanın Ana Bölümü</label>
                            <select 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.profMainDept || 'İktisat'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, profMainDept: val } : p));
                              }}
                            >
                              <option value="İktisat">İktisat</option>
                              <option value="İşletme">İşletme</option>
                              <option value="SBUİ">SBUİ</option>
                              <option value="ÜMS">ÜMS</option>
                              <option value="ÜSS">ÜSS</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Çan Türü</label>
                            <select 
                              className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" 
                              value={currentPending.bellType || 'mutlak'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, bellType: val as any } : p));
                              }}
                            >
                              <option value="mutlak">Mutlak</option>
                              <option value="bağıl">Bağıl</option>
                              <option value="değiştirilmiş bağıl">Değiştirilmiş Bağıl</option>
                              <option value="manuel">Manuel</option>
                            </select>
                          </div>
                        </div>

                        {/* Threshold distribution count fields */}
                        <div className="pt-2">
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
                                    value={currentPending.gradeThresholds?.[grade as keyof typeof currentPending.gradeThresholds] ?? ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setPendings(prev => prev.map(p => {
                                        if (p.id === currentPending.id) {
                                          return {
                                            ...p,
                                            gradeThresholds: {
                                              ...(p.gradeThresholds || {AA:0,BA:0,BB:0,CB:0,CC:0,DC:0,DD:0,FD:0,FF:0}),
                                              [grade]: val
                                            }
                                          };
                                        }
                                        return p;
                                      }));
                                    }}
                                    className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded p-[2px] mb-1 text-primary outline-none focus:border-secondary transition-colors"
                                  />
                                )}
                                <input 
                                  type="number"
                                  title="Öğrenci Sayısı"
                                  placeholder="sayı"
                                  value={(grade === 'F0' && (currentPending.attendanceStatus === 'none' || currentPending.attendanceStatus === 'not_failing')) ? 0 : (currentPending.gradesDistribution?.[grade as keyof typeof currentPending.gradesDistribution] ?? 0)} disabled={grade === 'F0' && (currentPending.attendanceStatus === 'none' || currentPending.attendanceStatus === 'not_failing')}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setPendings(prev => prev.map(p => {
                                      if (p.id === currentPending.id) {
                                        return {
                                          ...p,
                                          gradesDistribution: {
                                            ...(p.gradesDistribution || {}),
                                            [grade]: val
                                          } as any
                                        };
                                      }
                                      return p;
                                    }));
                                  }}
                                  className="w-full text-center text-xs font-bold leading-none bg-transparent border-none p-0 focus:ring-0 mt-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Attendance criteria selector for AI */}
                        <div className="space-y-1 mb-4">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Hocanın Yoklama Durumu</label>
                          <select 
                            className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                            value={currentPending.attendanceStatus || 'none'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPendings(prev => prev.map(p => p.id === currentPending.id ? { ...p, attendanceStatus: val as any } : p));
                            }}
                          >
                            <option value="none">Yoklama almıyor</option>
                            <option value="not_failing">Yoklama alıyor ama bırakmıyor</option>
                            <option value="failing">Yoklamadan bırakıyor</option>
                            <option value="bonus">Yoklamadan ek puan veriyor</option>
                            <option value="quiz">Quiz yapıyor</option>
                          </select>
                        </div>

                        {/* Calculated indicators output box (Dynamic on-screen reactive) */}
                        <div className="p-4 bg-primary rounded-xl text-white space-y-2 mt-4">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="opacity-75 block text-[10px]">Hesaplanan Geçme Oranı</span>
                              <strong className="text-lg font-extrabold">% {currentPassing}</strong>
                            </div>
                            <div className="text-right">
                              <span className="opacity-75 block text-[10px]">Toplam Öğrenci</span>
                              <strong className="text-lg font-extrabold">{currentTotal}</strong>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${currentPassing}%` }}></div>
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                ) : selectedAdminTab === 'pending' ? (
                  <div className="bg-white rounded-2xl p-12 border border-dashed border-gray-300 text-center text-[#00193c] py-20">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold font-display">Tüm Onaylar Tamamlandı!</h3>
                    <p className="text-xs text-text-muted mt-2 max-w-sm mx-auto">
                      Şu an için onay bekleyen yeni bir veri bulunmamaktadır. Ana sayfaya giderek çan listelerini gözden geçirebilirsiniz.
                    </p>
                    <button 
                      onClick={() => setActiveScreen('home')}
                      className="mt-6 bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl shadow hover:bg-secondary leading-none select-none transition-all"
                    >
                      Ana Sayfaya Dön
                    </button>
                  </div>
                ) : null}

                {selectedAdminTab === 'direct' && (
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
                        <label className="text-[10px] font-bold text-text-muted uppercase">Ders Dili</label>
                        <select 
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                          value={adminDirectForm.language} 
                          onChange={(e) => setAdminDirectForm(prev => ({...prev, language: e.target.value as any}))}
                        >
                          <option value="Türkçe">Türkçe</option>
                          <option value="İngilizce">İngilizce</option>
                          <option value="Diğer">Diğer</option>
                        </select>
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
                                className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                                  isSelected 
                                    ? 'bg-white border-primary border-2 shadow-sm' 
                                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                                }`}
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
                                  <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
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
                                value={(grade === 'F0' && (adminDirectForm.attendanceStatus === 'none' || adminDirectForm.attendanceStatus === 'not_failing')) ? 0 : (adminDirectForm.gradesDistribution?.[grade as keyof typeof adminDirectForm.gradesDistribution] ?? 0)} disabled={grade === 'F0' && (adminDirectForm.attendanceStatus === 'none' || adminDirectForm.attendanceStatus === 'not_failing')}
                                onChange={(e) => setAdminDirectForm(prev => ({ ...prev, gradesDistribution: { ...prev.gradesDistribution, [grade]: parseInt(e.target.value) || 0 } }))}
                                className="w-full text-center text-xs font-bold leading-none bg-transparent border-none p-0 focus:ring-0 mt-1 placeholder:font-normal placeholder:opacity-50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 col-span-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-2">
                          Öğrenci Notu / Açıklama (Opsiyonel)
                        </label>
                        <textarea
                          placeholder="Dersin zorluğu, hocanın tavrı hakkındaki görüşlerini belirt..."
                          rows={2}
                          value={adminDirectForm.description}
                          onChange={(e) => setAdminDirectForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}
                {selectedAdminTab === 'active' && activeAdminForm && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-scale-up">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-primary">Onaylı Dersi Güncelle</h3>
                        <p className="text-[11px] text-text-muted">Yayındaki dersin verilerini düzenleyin.</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={handleActiveDeleteCourse} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl shadow transition-all active:scale-98">
                          Dersi Sil
                        </button>
                        <button onClick={handleActiveUpdateSubmit} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-98">
                          Şu anki Veriyi Güncelle
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Ders Adı</label>
                        <input type="text" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={activeAdminForm.courseTitle} onChange={(e) => setActiveAdminForm(prev => ({...prev, courseTitle: e.target.value}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Öğretim Üyesi</label>
                        <input type="text" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={activeAdminForm.professorName} onChange={(e) => setActiveAdminForm(prev => ({...prev, professorName: e.target.value}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Ders Kodu</label>
                        <input type="text" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={activeAdminForm.courseCode} onChange={(e) => setActiveAdminForm(prev => ({...prev, courseCode: e.target.value}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Ders Dili</label>
                        <select 
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                          value={activeAdminForm.language || 'Türkçe'} 
                          onChange={(e) => setActiveAdminForm(prev => ({...prev, language: e.target.value as any}))}
                        >
                          <option value="Türkçe">Türkçe</option>
                          <option value="İngilizce">İngilizce</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Dönem</label>
                        <select 
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" 
                          value={activeAdminForm.term} 
                          onChange={(e) => setActiveAdminForm(prev => ({...prev, term: e.target.value}))}
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
                        <input type="number" step="0.01" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={activeAdminForm.averageBell} onChange={(e) => setActiveAdminForm(prev => ({...prev, averageBell: parseFloat(e.target.value) || 0}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Standart Sapma</label>
                        <input type="number" step="0.01" className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none" value={activeAdminForm.stdDev} onChange={(e) => setActiveAdminForm(prev => ({...prev, stdDev: parseFloat(e.target.value) || 0}))} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Hocanın Ana Bölümü</label>
                        <select className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" value={activeAdminForm.profMainDept} onChange={(e) => setActiveAdminForm(prev => ({...prev, profMainDept: e.target.value}))}>
                          <option value="İktisat">İktisat</option>
                          <option value="İşletme">İşletme</option>
                          <option value="SBUİ">SBUİ</option>
                          <option value="ÜMS">ÜMS</option>
                          <option value="ÜSS">ÜSS</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Çan Türü</label>
                        <select className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none cursor-pointer" value={activeAdminForm.bellType} onChange={(e) => setActiveAdminForm(prev => ({...prev, bellType: e.target.value as any}))}>
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
                          value={activeAdminForm.attendanceStatus} 
                          onChange={(e) => setActiveAdminForm(prev => ({...prev, attendanceStatus: e.target.value as any}))}
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
                            const isSelected = activeAdminForm.mappings?.some(m => m.dept === dept.key) ?? false;
                            const currentYear = activeAdminForm.mappings?.find(m => m.dept === dept.key)?.year ?? (dept.hasYear ? 1 : 'none');

                            return (
                              <div 
                                key={dept.key} 
                                className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                                  isSelected 
                                    ? 'bg-white border-primary border-2 shadow-sm' 
                                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                                  let updated;
                                  if (isSelected) {
                                    updated = (activeAdminForm.mappings || []).filter(m => m.dept !== dept.key);
                                  } else {
                                    updated = [...(activeAdminForm.mappings || []), { dept: dept.key, year: dept.hasYear ? 1 : 'none' }];
                                  }
                                  setActiveAdminForm(prev => ({ ...prev, mappings: updated as any }));
                                }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    readOnly
                                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                  />
                                  <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
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
                                        const updated = (activeAdminForm.mappings || []).map(m => 
                                          m.dept === dept.key ? { ...m, year: val } : m
                                        );
                                        setActiveAdminForm(prev => ({ ...prev, mappings: updated as any }));
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
                                  value={activeAdminForm.gradeThresholds?.[grade as keyof typeof activeAdminForm.gradeThresholds] ?? ''}
                                  onChange={(e) => setActiveAdminForm(prev => ({ ...prev, gradeThresholds: { ...prev.gradeThresholds, [grade]: parseInt(e.target.value) || 0 } }))}
                                  className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded p-[2px] mb-1 text-primary outline-none focus:border-secondary transition-colors"
                                />
                              )}
                              <input 
                                type="number"
                                title="Öğrenci Sayısı"
                                placeholder="sayı"
                                value={(grade === 'F0' && (activeAdminForm.attendanceStatus === 'none' || activeAdminForm.attendanceStatus === 'not_failing')) ? 0 : (activeAdminForm.gradesDistribution?.[grade as keyof typeof activeAdminForm.gradesDistribution] ?? 0)} disabled={grade === 'F0' && (activeAdminForm.attendanceStatus === 'none' || activeAdminForm.attendanceStatus === 'not_failing')}
                                onChange={(e) => setActiveAdminForm(prev => ({ ...prev, gradesDistribution: { ...prev.gradesDistribution, [grade]: parseInt(e.target.value) || 0 } }))}
                                className="w-full text-center text-xs font-bold leading-none bg-transparent border-none p-0 focus:ring-0 mt-1 placeholder:font-normal placeholder:opacity-50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 col-span-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-2">
                          Öğrenci Notu / Açıklama (Opsiyonel)
                        </label>
                        <textarea
                          placeholder="Dersin zorluğu, hocanın tavrı hakkındaki görüşlerini belirt..."
                          rows={2}
                          value={activeAdminForm.description}
                          onChange={(e) => setActiveAdminForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-white text-primary border border-gray-200 focus:border-primary px-3 py-2 text-xs rounded-lg outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}
              </section>

            </div>

{/* Simulated Action Metrics Info logs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <History size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase">Son İşlem Süresi</p>
                  <p className="text-sm font-bold text-primary">2 dakika önce</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase">Onay Bekleyen Başvuru</p>
                  <p className="text-sm font-bold text-primary">{pendings.length} Ders</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== SCREEN 7: ACCOUNT PROFILE ("{currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : 'Yıldız Öğrencisi'} Profile") ==================== */}
        {activeScreen === 'profile' && (
          <div className="animate-fade-in space-y-6 text-left max-w-4xl mx-auto">
            
            {/* Header Identity banner */}
            <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200/60 shadow-md flex justify-center text-center">
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-primary leading-none">
                {currentUser ? currentUser.displayName || 'İsimsiz Kullanıcı' : INITIAL_USER.name}
              </h2>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* Student active uploads (Left 8 cols) */}
              <div className="md:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-display font-extrabold text-primary text-base">Paylaşımlarım</h3>
                  <span 
                    onClick={() => { setSelectedDept('iktisat'); setActiveScreen('courses'); }}
                    className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                  >
                    Tüm Çan Eğrilerini Gör
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {(() => {
                    const uName = currentUser ? (currentUser.displayName || 'İsimsiz Kullanıcı') : '';
                    
                    const userApproved = courses
                      .filter(c => c.uploadedBy && c.uploadedBy.toLowerCase() === uName.toLowerCase())
                      .map(c => ({ title: c.title, code: c.code, prof: c.professorName, date: c.uploadedDate || '', status: 'approved' }));
                      
                    const userPendings = pendings
                      .filter(p => p.applicantName && p.applicantName.toLowerCase() === uName.toLowerCase())
                      .map(p => ({ title: p.courseTitle, code: p.courseCode || 'Belirsiz', prof: p.professorName, date: p.date || '', status: 'pending' }));

                    const combined = [...userApproved, ...userPendings];

                    if (combined.length === 0) {
                      return (
                        <div className="text-center py-6">
                          <p className="text-sm text-text-muted">Açıklanan veya Bekleyen paylaşımınız bulunmuyor.</p>
                          <button 
                            onClick={() => setActiveScreen('upload')}
                            className="mt-3 text-xs font-bold text-primary border border-gray-200 px-4 py-2 rounded-lg hover:border-primary transition-colors"
                          >
                            Hemen İlk Çan Eğrini Paylaş
                          </button>
                        </div>
                      );
                    }

                    return combined.map((up, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${up.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/5 text-primary'}`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{up.code} - {up.title}</p>
                            <p className="text-xs text-text-muted">{up.prof} • {up.status === 'pending' ? 'Onay Bekliyor' : 'Onaylandı'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-text-muted font-bold whitespace-nowrap">{up.date}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              {/* Profile setup configuration elements */}
              <div className="md:col-span-12 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-display font-extrabold text-primary text-base pb-3 border-b border-gray-100">Hesap Ayarları</h3>
                
                <div className="divide-y divide-gray-100">
                  <div 
                    onClick={() => showToast('İlgili hesap yönetim paneli şu an salt-okunurdur.', 'info')}
                    className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 cursor-pointer group hover:bg-gray-50 px-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-4 text-primary font-semibold text-sm">
                      <Settings size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                      <div>
                        <p>Genel Kullanıcı Bilgileri</p>
                        <p className="text-[10px] text-text-muted font-normal mt-0.5">E-Posta: {currentUser?.email || "Bilinmiyor"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Logout active actions trigger */}
            <button 
              onClick={() => {
                signOut(auth).then(() => {
                setAuthRole('guest');
                setActiveScreen('home');
                showToast('Hızlı çıkış başarılı.');
              }).catch(() => showToast('Çıkış yapılamadı, lütfen tekrar deneyin.', 'error'));
              }}
              className="px-6 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold text-sm bg-white flex items-center justify-center gap-2 hover:bg-rose-50 transition-all cursor-pointer w-full text-center"
            >
              <LogOut size={16} />
              Çıkış Yap
            </button>

          </div>
        )}

      </main>

      {/* Footer copyright note */}
      <footer className="mt-20 py-10 bg-white border-t border-gray-200/60 text-center text-xs text-text-muted">
        <div className="max-w-[1280px] mx-auto px-6 space-y-2">
          <p className="font-bold text-[#00193c]">Yıldız Çan • YTÜ İİBF Çan Portalı</p>
          <p>© 2026. Mahmut Hoca'nın öğrencileri tarafından sevgiyle yapılmıştır.</p>
        </div>
      </footer>

      {/* Bottom Nav Bar - Responsive Mobile Viewport Only Layout */}
      <nav className="md:hidden fixed bottom-1.5 left-2.5 right-2.5 z-40 flex justify-around items-center px-4 py-3 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-2xl">
        <button 
          onClick={() => setActiveScreen('home')}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeScreen === 'home' ? 'text-primary scale-102 font-bold' : 'text-text-muted hover:text-primary'
          }`}
        >
          <Home size={20} className={activeScreen === 'home' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px]">Ana Sayfa</span>
        </button>
        
        <button 
          onClick={() => { 
            setSelectedDept('iktisat'); 
            setActiveScreen('courses'); 
          }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeScreen === 'courses' ? 'text-primary scale-102 font-bold' : 'text-text-muted hover:text-primary'
          }`}
        >
          <Search size={20} className={activeScreen === 'courses' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px]">Ara / İncele</span>
        </button>

        <button 
          onClick={() => setActiveScreen('upload')}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeScreen === 'upload' ? 'text-primary scale-102 font-bold' : 'text-text-muted hover:text-primary'
          }`}
        >
          <PlusCircle size={20} className={activeScreen === 'upload' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px]">Eğri Girişi</span>
        </button>

        <button 
          onClick={() => {
            if (authRole === 'student') {
              setActiveScreen('profile');
            } else {
              setActiveScreen('auth');
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeScreen === 'profile' ? 'text-primary scale-102 font-bold' : 'text-text-muted hover:text-primary'
          }`}
        >
          <User size={20} className={activeScreen === 'profile' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px]">Hesabım</span>
        </button>
      </nav>

    </div>
  );
}

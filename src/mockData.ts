import { Course, Teacher, TermData, PendingApproval, User } from './types';

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 'mahmut_bilgeturk', name: 'Mahmut Bilgetürk', department: 'İktisat' },
  { id: 'ahmet_yilmaz', name: 'Prof. Dr. Ahmet Yılmaz', department: 'İktisat' },
  { id: 'selin_erdem', name: 'Doç. Dr. Selin Erdem', department: 'İşletme' },
  { id: 'cemal_ak', name: 'Dr. Öğr. Üyesi Cemal Ak', department: 'SBUİ' }
];

export const MAHMUT_TERMS: TermData[] = [
  { term: '2025-2026 Güz Dönemi', gradeLabel: 'İyi Çan', average: 64.5, passingGrade: 45.0 },
  { term: '2024-2025 Bahar Dönemi', gradeLabel: 'Vasat Çan', average: 52.1, passingGrade: 38.0 },
  { term: '2023-2024 Güz Dönemi', gradeLabel: 'Kötü Çan', average: 38.4, passingGrade: 35.0 }
];

export const INITIAL_USER: User = {
  name: 'Ahmet Yılmaz', googleName: 'Ahmet Yılmaz',
  studentClass: 'İktisat 3. Sınıf',
  role: 'student',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYPUtY9_Hxip_AJEHryBK78hDVkXlGnOIiZr7N9dUWy-EyLSohA-dNkV-z88xPf-6_sA0Isy2j0CXryVZoIH8VPVZ_fLsJ9FPjc49H-QEcg6feiwnsMNjwiBzFPO_ZJpDCarPoKxYgtfcmWkofij57Jxz5f8re9pTjOyAhA9ZV83nWG9sjiGrLyIf9nQsL4M_c93gSf-nBvMh6YMhqBl0Qm1EDjnSglvLZUJcsu4jiODLodQEtMYVxG8CW6zk_q9H6AfFO5nQWGDI',
  savedCourses: ['IKT1103', 'MAT1320', 'IKT2001'],
  uploadedCourses: ['IKT3121', 'IKT3001']
};

export const MOCK_ACCOUNTS = [
  { id: '1', email: 'g201200001@std.yildiz.edu.tr', name: 'Ahmet Yılmaz', googleName: 'Ahmet Yılmaz', role: 'student', joinDate: '12.10.2023', totalUploads: 2 },
  { id: '2', email: 'g210400012@std.yildiz.edu.tr', name: 'Ayşe Kaya', googleName: 'Ayşe Kaya', role: 'student', joinDate: '05.11.2023', totalUploads: 5 },
  { id: '3', email: 'g220300155@std.yildiz.edu.tr', name: 'Mehmet Demir', googleName: 'Mehmet Demir', role: 'student', joinDate: '20.01.2024', totalUploads: 0 },
  { id: '4', email: 'admin@std.yildiz.edu.tr', name: 'Admin', googleName: 'Yönetici', role: 'admin', joinDate: '01.09.2023', totalUploads: 14 }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'IKN1011', code: 'IKN1011', title: 'Mikro İktisada Giriş', department: 'iktisat', profMainDept: 'İktisat', year: 1, averageBell: 54.21, professorCount: 8, professorName: 'Prof. Dr. Ahmet Yılmaz', term: '2023-2024 Güz', attendanceStatus: 'not_failing', description: 'Dersin zorluğu...', gradesDistribution: { AA: 17, BA: 35, BB: 43, CB: 26, CC: 14, DC: 10, DD: 5, FD: 4, FF: 3, F0: 2 }, totalStudents: 159, uploadedBy: 'Squall', uploadedDate: '15 December 2023, 14:32', comments: [{ id: 'c1', author: 'Ekonoman2024', date: '2 gün önce', text: 'Sınavlar orta zorluktaydı' }], fileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdML1qDUhmXIesunGV8MkPagsgnddo4wyRI9OUHkDPuelxuoR474tZzy60KNcHeFcXZRvgIDTMyKQ1EkbEI4ASeNH-3NQWb1i1d9kjZVyvTtei90txZ9Uq0QZzOS66-R8rJe25w87DbZQjH2e9ngclQ913aM9k-ebbVI3P4VQO2swaPEWILK7IkBYKonUn5e5UOIYepa9sIAeJ_Mtxcu8tFcUl3gJ74C176mhpeVPMFd_hcta_fbgDfUmlAKaQoWDucLGNtMsxhL0'
  },
  {
    id: 'IKT1001', code: 'IKT1001', title: 'İktisada Giriş I', department: 'iktisat', profMainDept: 'İktisat', year: 1, averageBell: 32.40, professorCount: 8, professorName: 'Doç. Dr. Selin Erdem', term: '2024-2025 Güz', attendanceStatus: 'none', gradesDistribution: { AA: 8, BA: 12, BB: 15, CB: 34, CC: 45, DC: 18, DD: 5, FD: 12, FF: 10, F0: 4 }, totalStudents: 168, uploadedBy: 'yasar_temiz', uploadedDate: '12 January 2024, 11:15', comments: []
  },
  {
    id: 'IKT1103', code: 'IKT1103', title: 'Hukukun Temel Kavramları', department: 'iktisat', profMainDept: 'İktisat', year: 1, averageBell: 68.15, professorCount: 3, professorName: 'Dr. Öğr. Üyesi Cemal Ak', term: '2023-2024 Bahar', attendanceStatus: 'bonus', gradesDistribution: { AA: 30, BA: 42, BB: 28, CB: 21, CC: 15, DC: 8, DD: 5, FD: 2, FF: 2, F0: 1 }, totalStudents: 151, uploadedBy: 'hukukcu_eko', uploadedDate: '01 June 2024, 16:45', comments: [{ id: 'c2', author: 'LawLover', date: '3 hafta önce', text: 'Yoklamadan ek puan var' }]
  },
  {
    id: 'MAT1320', code: 'MAT1320', title: 'Genel Matematik', department: 'iktisat', profMainDept: 'İktisat', year: 1, averageBell: 45.00, professorCount: 12, professorName: 'Prof. Dr. Caner Mert', term: '2023-2024 Güz', attendanceStatus: 'none', gradesDistribution: { AA: 10, BA: 18, BB: 22, CB: 38, CC: 40, DC: 25, DD: 5, FD: 10, FF: 5, F0: 10 }, totalStudents: 190, uploadedBy: 'Squall', uploadedDate: '20 December 2023, 09:12', comments: []
  },
  {
    id: 'IKT2001', code: 'IKT2001', title: 'Mikroiktisat I', department: 'iktisat', profMainDept: 'İktisat', year: 2, averageBell: 28.90, professorCount: 5, professorName: 'Mahmut Bilgetürk', term: '2025-2026 Güz', attendanceStatus: 'failing', gradesDistribution: { AA: 6, BA: 11, BB: 15, CB: 22, CC: 31, DC: 19, DD: 5, FD: 15, FF: 13, F0: 8 }, totalStudents: 155, uploadedBy: 'ikt_isletme_can', uploadedDate: '22 October 2025, 18:02', comments: [{ id: 'cmt1', author: 'İktisat 3. Sınıf', date: '2 gün önce', text: 'Adaletli' }]
  },
  {
    id: 'IKT3121', code: 'IKT3121', title: 'Ekonometri I', department: 'iktisat', profMainDept: 'İktisat', year: 3, averageBell: 48.20, professorCount: 4, professorName: 'Prof. Dr. Ahmet Yılmaz', term: '2023-2024 Güz', attendanceStatus: 'not_failing', gradesDistribution: { AA: 5, BA: 12, BB: 18, CB: 32, CC: 28, DC: 14, DD: 5, FD: 6, FF: 4, F0: 2 }, totalStudents: 129, uploadedBy: 'Squall', uploadedDate: '12 Eki 2023', comments: []
  },
  {
    id: 'IKT3001', code: 'IKT3001', title: 'Mikro İktisat', department: 'iktisat', profMainDept: 'İktisat', year: 3, averageBell: 51.40, professorCount: 6, professorName: 'Prof. Dr. Ahmet Yılmaz', term: '2023-2024 Güz', attendanceStatus: 'not_failing', gradesDistribution: { AA: 11, BA: 16, BB: 25, CB: 30, CC: 20, DC: 15, DD: 5, FD: 5, FF: 3, F0: 3 }, totalStudents: 132, uploadedBy: 'Squall', uploadedDate: '05 Eki 2023', comments: []
  },
  {
    id: 'KAM2001', code: 'KAM2001', title: 'Kamu Ekonomisi', department: 'iktisat', profMainDept: 'İktisat', year: 2, mappings: [{ dept: 'iktisat', year: 2 }, { dept: 'sbui', year: 2 }], averageBell: 45.40, professorCount: 1, professorName: 'Prof. Dr. Caner Mert', term: '2023-2024 Bahar', attendanceStatus: 'none', gradesDistribution: { AA: 5, BA: 15, BB: 25, CB: 25, CC: 15, DC: 10, DD: 5, FD: 3, FF: 2, F0: 1 }, totalStudents: 103, uploadedBy: 'eko_ogrencisi', uploadedDate: '10 June 2024, 11:11', comments: []
  },
  {
    id: 'HUK2001', code: 'HUK2001', title: 'Ticaret Hukuku', department: 'isletme', profMainDept: 'İşletme', year: 2, mappings: [{ dept: 'isletme', year: 2 }, { dept: 'iktisat', year: 'sec' }, { dept: 'sbui', year: 'sec' }], averageBell: 35.80, professorCount: 1, professorName: 'Dr. Öğr. Üyesi Cemal Ak', term: '2024-2025 Güz', attendanceStatus: 'bonus', gradesDistribution: { AA: 2, BA: 8, BB: 15, CB: 20, CC: 30, DC: 15, DD: 5, FD: 6, FF: 4, F0: 5 }, totalStudents: 117, uploadedBy: 'hukuk_sever', uploadedDate: '05 January 2025, 14:00', comments: []
  }
];

export const INITIAL_PENDINGS: PendingApproval[] = [
  {
    id: 'p1',
    courseTitle: 'Uluslararası İktisat',
    professorName: 'Prof. Dr. Ahmet Yılmaz',
    mappings: [{ dept: 'iktisat', year: 3 }, { dept: 'sbui', year: 'sec' }],
    term: '2024-2025 Güz',
    attendanceStatus: 'not_failing',
    description: 'Hoca kitaptan işliyor, sınavlar kitaba paralel.',
    date: '12.10.2024',
    applicantName: 'Öğrenci A.',
    applicantId: '21043001',
    fileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdML1qDUhmXIesunGV8MkPagsgnddo4wyRI9OUHkDPuelxuoR474tZzy60KNcHeFcXZRvgIDTMyKQ1EkbEI4ASeNH-3NQWb1i1d9kjZVyvTtei90txZ9Uq0QZzOS66-R8rJe25w87DbZQjH2e9ngclQ913aM9k-ebbVI3P4VQO2swaPEWILK7IkBYKonUn5e5UOIYepa9sIAeJ_Mtxcu8tFcUl3gJ74C176mhpeVPMFd_hcta_fbgDfUmlAKaQoWDucLGNtMsxhL0'
  }
];

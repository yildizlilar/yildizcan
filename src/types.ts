export interface Comment {
  id: string;
  author: string;
  authorClass?: string;
  date: string;
  text: string;
}

export interface PendingComment {
  id: string;
  courseDataId: string; // references the specific term data (Course.id)
  text: string;
  author: string;
  date: string;
}

export interface Teacher {
  id: string;
  name: string;
   // e.g. ["ÖĞRENCİ DOSTU HOCA", "İKTİSAT BÖLÜMÜ"]
  department: string; // e.g. "İktisat"
}

export interface TermData {
  term: string;
  gradeLabel: 'İyi Çan' | 'Vasat Çan' | 'Kötü Çan';
  average: number;
  passingGrade: number;
}

export interface CourseMapping {
  dept: 'iktisat' | 'isletme' | 'sbui' | 'uss' | 'ums';
  year: 1 | 2 | 3 | 4 | 'sec' | 'none';
}

export interface GradeThresholds {
  AA: number;
  BA: number;
  BB: number;
  CB: number;
  CC: number;
  DC: number;
  DD: number;
  FD: number;
  FF: number;
}

export interface GradesDistribution {
  AA: number;
  BA: number;
  BB: number;
  CB: number;
  CC: number;
  DC: number;
  DD: number;
  FD: number;
  FF: number;
  F0: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department: 'iktisat' | 'isletme' | 'sbui' | 'uss' | 'ums';
  year: 1 | 2 | 3 | 4 | 'sec' | 'none'; // 'none' for USS/UMS
  mappings?: CourseMapping[];
  
  averageBell: number;
  stdDev?: number;
  bellType?: 'mutlak' | 'bağıl' | 'değiştirilmiş bağıl' | 'manuel';
  gradeThresholds?: GradeThresholds;
  professorCount: number;
  professorName: string;
  profMainDept?: string; // added back from mock
  term: string;
  language?: 'Türkçe' | 'İngilizce' | 'Diğer';
  attendanceStatus: 'none' | 'not_failing' | 'failing' | 'bonus' | 'quiz';
  description?: string;
  gradesDistribution: GradesDistribution;
  totalStudents: number;
  passingRate?: number;
  uploadedBy: string;
  uploadedDate: string;
  comments: Comment[];
  fileUrl?: string;
  smartLabels?: {
    courseLabel: string;
    courseReason: string;
    hocaLabel: string;
    hocaReason: string;
    bellLabel: string;
    bellReason: string;
  };
  analysisComments?: string;
}

export interface PendingApproval {
  id: string;
  courseTitle: string; // from user
  professorName: string; // from user
  mappings: CourseMapping[]; // from user
  term: string; // from user
  language?: 'Türkçe' | 'İngilizce' | 'Diğer'; // from user
  attendanceStatus: 'none' | 'not_failing' | 'failing' | 'bonus' | 'quiz'; // from user
  description?: string; // from user
  
  // These will be filled by admin:
  courseCode?: string;
  profMainDept?: string;
  average?: number;
  stdDev?: number;
  bellType?: 'mutlak' | 'bağıl' | 'değiştirilmiş bağıl' | 'manuel';
  gradeThresholds?: GradeThresholds;
  gradesDistribution?: GradesDistribution;
  
  passingRate?: number;
  totalStudents?: number;
  
  date: string;
  applicantName: string;
  applicantId: string;
  fileUrl: string;
}

export interface User {
  name: string;
  studentClass: string;
  role: 'student' | 'admin';
  avatarUrl?: string;
  savedCourses: string[]; // course IDs
  uploadedCourses: string[]; // course IDs
  googleName?: string;
}

export interface Report {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'bug' | 'request' | 'other';
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNote?: string;
}


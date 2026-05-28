import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to local/simulated AI logic.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini analysis
  app.post("/api/gemini/analyze", async (req, res) => {
    const { courseTitle, courseCode, department, average, stdDev, gradesDistribution, attendanceStatus } = req.body;

    // Standard local fallback calculations in case there's no API key or API fails
    const gd = gradesDistribution || { AA: 0, BA: 0, BB: 0, CB: 0, CC: 0, DC: 0, DD: 0, FD: 0, FF: 0, F0: 0 };
    const passingStudents = (gd.AA || 0) + (gd.BA || 0) + (gd.BB || 0) + (gd.CB || 0) + (gd.CC || 0) + (gd.DC || 0);
    const totalStudents = passingStudents + (gd.DD || 0) + (gd.FD || 0) + (gd.FF || 0) + (gd.F0 || 0);
    const calculatedPassingRate = totalStudents > 0 ? (passingStudents / totalStudents) * 100 : 0;
    const avgBell = parseFloat(average) || 0;

    // Simulated evaluation matching the prompt logic:
    let simulatedCourseLabel = "vasat ders";
    let simulatedCourseReason = "Orta zorlukta bir ders.";
    if (calculatedPassingRate >= 75 && avgBell >= 60) {
      simulatedCourseLabel = "kolay ders";
      simulatedCourseReason = "Geçme oranı ve sınıf ortalaması yüksek olduğu için kolay olarak nitelendirildi.";
    } else if (calculatedPassingRate <= 50 && avgBell <= 45) {
      simulatedCourseLabel = "zor ders";
      simulatedCourseReason = "Sınıf ortalaması ve geçme oranı oldukça düşük.";
    }

    let simulatedHocaLabel = "normal hoca";
    let simulatedHocaReason = "Kriterler çerçevesinde standart bir etki sunuyor.";
    const isSertAttendance = String(attendanceStatus).toLowerCase().includes("sert") || String(attendanceStatus).toLowerCase().includes("bırakıyor");
    const isEsnekAttendance = String(attendanceStatus).toLowerCase().includes("esnek") || String(attendanceStatus).toLowerCase().includes("alınmıyor");

    if (isSertAttendance && calculatedPassingRate <= 50) {
      simulatedHocaLabel = "zorlayıcı hoca";
      simulatedHocaReason = "Yoklama kuralları sert ve dersin geçme oranı düşük.";
    } else if (isEsnekAttendance && calculatedPassingRate > 70) {
      simulatedHocaLabel = "öğrenci dostu hoca";
      simulatedHocaReason = "Esnek yoklama kriterleri ve yüksek geçme oranına sahip.";
    }

    let simulatedBellLabel = "orta çan";
    let simulatedBellReason = "Not dağılımı dengeli.";
    if (avgBell < 50) {
      // Look at high or low grades to assess skewness
      const highGradesCount = (gd.AA || 0) + (gd.BA || 0) + (gd.BB || 0);
      const lowGradesCount = (gd.FD || 0) + (gd.FF || 0) + (gd.F0 || 0);
      if (highGradesCount > lowGradesCount) {
        simulatedBellLabel = "iyi çan";
        simulatedBellReason = "Ortalamanın 50'nin altında olmasına rağmen harf notu dağılımı sağa yatık (kolay geçiliyor).";
      } else {
        simulatedBellLabel = "kötü çan";
        simulatedBellReason = "Ortalama düşük ve geçilmesi zor, yığılma alt notlarda.";
      }
    }

    const fallbackResponse = {
      totalStudents,
      passingRate: parseFloat(calculatedPassingRate.toFixed(2)),
      smartLabels: {
        courseLabel: simulatedCourseLabel,
        courseReason: simulatedCourseReason,
        hocaLabel: simulatedHocaLabel,
        hocaReason: simulatedHocaReason,
        bellLabel: simulatedBellLabel,
        bellReason: simulatedBellReason
      },
      analysisComments: "Gemini API anahtarı ayarlanmadığı veya çağrı başarısız olduğu için hesaplamalar yerel akıllı kurallar ile yapılmıştır. Lütfen Settings > Secrets alanından GEMINI_API_KEY anahtarını teyit edin."
    };

    const client = getGeminiClient();
    if (!client) {
      return res.json(fallbackResponse);
    }

    try {
      const inputPayload = {
        onay_bekleyen_ders: courseTitle || "Bilinmiyor",
        ders_kodu: courseCode || "Bilinmiyor",
        bolum: department || "İİBF",
        hoca: req.body.professorName || "Bilinmiyor",
        ortalama: avgBell,
        sapma: parseFloat(stdDev) || 10,
        yoklama: attendanceStatus || "yoklama bilgisi girilmedi",
        harf_dagilimi: gd
      };

      const systemInstruction = 
        `Sen "YTÜ İİBF ÇAN" Yönetici Paneli Akıllı Veri Giriş Asistanısın. ` +
        `Görevin, yöneticinin PDF dosyasına bakarak manuel olarak girdiği harf notu sayılarını ve istatistikleri (Ortalama, Sapma vb.) analiz etmek, matematiksel kontrolleri yapmak ve sistemin ihtiyaç duyduğu "Akıllı Etiketleri" üretmektir.\n\n` +
        `Şu kurallara göre ÇIKTI üretmelisin:\n` +
        `1. TOPLAM ÖĞRENCİ HESABI: Girdi olarak verilen tüm harf notu sayılarını topla.\n` +
        `2. GEÇME ORANI HESABI: (AA+BA+BB+CB+CC+DC) alan toplam öğrenci sayısını, toplam mevcuda bölerek % formatında hesapla.\n` +
        `3. AKILLI ETİKETLEME (Dinamik):\n` +
        `   - DERS ETİKETİ: Geçme oranı %75+ ve ortalama 60+ ise "kolay ders"; geçme oranı %50- ve ortalama 45- ise "zor ders"; aradakiler "vasat ders".\n` +
        `   - HOCA ETİKETİ: Yoklama kuralı sertse (yoklamadan bırakıyor) ve geçme oranı %50- ise "zorlayıcı hoca"; yoklama esnekse ve geçme oranı yüksekse "öğrenci dostu hoca".\n` +
        `   - ÇAN ETİKETİ: Ortalamanın 50'nin altında olduğu durumlarda harf notu dağılımı sağa yatıksa (kolay geçiliyorsa) "iyi çan", aksi halde "kötü çan".\n\n` +
        `Çıktıyı sadece JSON formatında ver.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: 'user', parts: [{ text: JSON.stringify(inputPayload) }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalStudents: {
                type: Type.INTEGER,
                description: "Matematiksel olarak toplanmış toplam öğrenci sayısı."
              },
              passingRate: {
                type: Type.NUMBER,
                description: "Geçen öğrencilerin toplam öğrenciye yüzde oranı (0-100)."
              },
              smartLabels: {
                type: Type.OBJECT,
                properties: {
                  courseLabel: { type: Type.STRING, description: "'kolay ders', 'zor ders' veya 'vasat ders' seçeneklerinden biri." },
                  courseReason: { type: Type.STRING, description: "Ders etiketi atanma gerekçesi." },
                  hocaLabel: { type: Type.STRING, description: "'zorlayıcı hoca', 'öğrenci dostu hoca' veya 'normal hoca' seçeneklerinden biri." },
                  hocaReason: { type: Type.STRING, description: "Hoca etiketi atanma gerekçesi." },
                  bellLabel: { type: Type.STRING, description: "'iyi çan', 'kötü çan' veya 'orta çan' seçeneklerinden biri." },
                  bellReason: { type: Type.STRING, description: "Çan etiketi atanma gerekçesi." }
                },
                required: ["courseLabel", "courseReason", "hocaLabel", "hocaReason", "bellLabel", "bellReason"]
              },
              analysisComments: {
                type: Type.STRING,
                description: "Akıllı asistanın yöneticiye yönelik ders hakkında çıkardığı özet, notlar ve matematiksel kontrol teyidi."
              }
            },
            required: ["totalStudents", "passingRate", "smartLabels", "analysisComments"]
          }
        }
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(responseText.trim());
      
      return res.json({
        ...parsed,
        isAiResponse: true
      });

    } catch (error: any) {
      console.error("Gemini API Error in backend:", error);
      return res.json({
        ...fallbackResponse,
        analysisComments: `Gemini API çağrısı esnasında hata alındı: ${error?.message || "Bilinmeyen hata"}. Çevrimdışı kurallarla hesaplama yapıldı.`
      });
    }
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

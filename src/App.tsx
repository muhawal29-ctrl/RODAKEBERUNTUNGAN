import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  HelpCircle,
  Home,
  RotateCcw,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';

// ============================================================================
// TIPE DATA UTAMA
// ============================================================================
type KategoriId =
  | 'Pengertian'
  | 'Contoh Kasus'
  | 'Bedakan'
  | 'Akibat'
  | 'Sikap Islami';

type Halaman =
  | 'beranda'
  | 'petunjuk'
  | 'roda'
  | 'tantangan'
  | 'umpanBalik'
  | 'refleksi'
  | 'penutup';

type IdDalil = 'hujurat' | 'maidah' | 'hadis';

interface Soal {
  id: number;
  kategori: KategoriId;
  pertanyaan: string;
  pilihan: [string, string, string, string];
  jawabanBenar: number; // Indeks 0 = A, 1 = B, 2 = C, 3 = D
  pembahasan: string;
  idDalil: IdDalil;
}

interface DataDalil {
  id: IdDalil;
  judul: string;
  sumber: string;
  teksArab: string;
  arti: string;
  pesanAkhlak: string;
}

interface RiwayatRonde {
  ronde: number;
  kategori: KategoriId;
  pertanyaan: string;
  pilihanDipilih: number | null;
  jawabanBenar: number;
  benar: boolean;
  waktuHabis: boolean;
  poin: number;
  bonusKecepatan: number;
}

// ============================================================================
// KONFIGURASI SESI GAME
// ============================================================================
const TOTAL_RONDE = 10;
const WAKTU_PER_SOAL = 30; // detik
const POIN_BENAR = 10;
const BONUS_CEPAT = 5; // jika dijawab di bawah 10 detik
const BATAS_WAKTU_BONUS = 10; // detik terpakai < 10 (sisa waktu > 20)

// ============================================================================
// DATA KATEGORI RODA (5 SEGMEN)
// ============================================================================
const KATEGORI_RODA: {
  id: KategoriId;
  labelSingkat: string;
  warna: string;
  warnaTeks: string;
  ikon: string;
  deskripsi: string;
}[] = [
  {
    id: 'Pengertian',
    labelSingkat: 'Pengertian',
    warna: '#1B7F4B',
    warnaTeks: '#FFFFFF',
    ikon: '📖',
    deskripsi: 'Definisi perkelahian dan tawuran pelajar',
  },
  {
    id: 'Contoh Kasus',
    labelSingkat: 'Contoh Kasus',
    warna: '#F2B705',
    warnaTeks: '#18291F',
    ikon: '🧩',
    deskripsi: 'Identifikasi peristiwa di lingkungan pelajar',
  },
  {
    id: 'Bedakan',
    labelSingkat: 'Bedakan',
    warna: '#2E9E63',
    warnaTeks: '#FFFFFF',
    ikon: '⚖️',
    deskripsi: 'Perbedaan perkelahian biasa dan tawuran',
  },
  {
    id: 'Akibat',
    labelSingkat: 'Akibat',
    warna: '#145834',
    warnaTeks: '#FFFFFF',
    ikon: '🛡️',
    deskripsi: 'Dampak hukum, sekolah, sosial, dan agama',
  },
  {
    id: 'Sikap Islami',
    labelSingkat: 'Sikap Islami',
    warna: '#D99B04',
    warnaTeks: '#18291F',
    ikon: '🤝',
    deskripsi: 'Tabayyun, islah, menahan amarah, dan damai',
  },
];

// ============================================================================
// RUJUKAN DALIL AL-QUR'AN & HADIS
// ============================================================================
const DATA_DALIL: Record<IdDalil, DataDalil> = {
  hujurat: {
    id: 'hujurat',
    judul: 'Persaudaraan dan Islah (Mendamaikan Perselisihan)',
    sumber: 'QS. Al-Hujurat ayat 9–10',
    teksArab:
      'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ فَأَصْلِحُوا بَيْنَ أَخَوَيْكُمْ ۚ وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُرْحَمُونَ',
    arti: 'Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu (yang berselisih) dan bertakwalah kepada Allah agar kamu mendapat rahmat. (QS. Al-Hujurat: 10; merujuk juga ayat 9 tentang mendamaikan dua kelompok yang bertikai).',
    pesanAkhlak:
      'Pelajar Muslim berperan sebagai juru damai (muslih), bukan penyulut permusuhan.',
  },
  maidah: {
    id: 'maidah',
    judul: 'Menjaga Keselamatan Jiwa Manusia',
    sumber: 'QS. Al-Ma’idah ayat 32',
    teksArab:
      'مَن قَتَلَ نَفْسًا بِغَيْرِ نَفْسٍ أَوْ فَسَادٍ فِي الْأَرْضِ فَكَأَنَّمَا قَتَلَ النَّاسَ جَمِيعًا وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا',
    arti: 'Barangsiapa membunuh seseorang, bukan karena (orang itu) membunuh orang lain atau bukan karena berbuat kerusakan di bumi, maka seakan-akan dia telah membunuh semua manusia. Barangsiapa memelihara kehidupan seorang manusia, maka seakan-akan dia telah memelihara kehidupan semua manusia.',
    pesanAkhlak:
      'Setiap nyawa sangat berharga di sisi Allah; hindari tindakan yang membahayakan keselamatan diri dan orang lain.',
  },
  hadis: {
    id: 'hadis',
    judul: 'Ciri Muslim Sejati: Menjaga Lisan dan Tangan',
    sumber: 'HR. Bukhari dan Muslim',
    teksArab: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    arti: 'Seorang muslim adalah orang yang kaum muslimin lainnya selamat dari gangguan lisan dan tangannya.',
    pesanAkhlak:
      'Kekuatan sejati seorang pelajar SMK terletak pada kemampuan menahan lisan dari ejekan dan tangan dari kekerasan.',
  },
};

// ============================================================================
// === BANK SOAL (MUDAH DIEDIT GURU) ===
// Struktur setiap soal:
// { id, kategori, pertanyaan, pilihan: [A, B, C, D], jawabanBenar (0-3), pembahasan, idDalil }
// Pastikan setiap kategori memiliki minimal 4 soal agar sesi 10 ronde lancar.
// ============================================================================
const BANK_SOAL: Soal[] = [
  // -------------------- KATEGORI 1: PENGERTIAN (5 SOAL) --------------------
  {
    id: 1,
    kategori: 'Pengertian',
    pertanyaan:
      'Dalam materi PAI & Budi Pekerti, manakah pengertian yang paling tepat untuk "perkelahian" antarindividu atau kelompok kecil?',
    pilihan: [
      'Adu fisik atau pertengkaran antara dua orang atau kelompok kecil yang biasanya terjadi spontan karena masalah pribadi.',
      'Pertemuan resmi antarperwakilan kelas untuk menyelesaikan perbedaan pendapat di ruang OSIS.',
      'Aksi unjuk rasa pelajar di depan gedung pemerintahan untuk menyampaikan aspirasi pendidikan.',
      'Pertandingan olahraga bela diri antarsekolah yang diawasi wasit dan guru pendamping.',
    ],
    jawabanBenar: 0,
    pembahasan:
      'Perkelahian umumnya melibatkan dua orang atau kelompok kecil dan muncul secara spontan akibat persoalan pribadi seperti salah paham atau ejekan.',
    idDalil: 'hadis',
  },
  {
    id: 2,
    kategori: 'Pengertian',
    pertanyaan:
      'Apa yang dimaksud dengan "tawuran pelajar"?',
    pilihan: [
      'Debat sengit antaranggota tim dalam lomba cerdas cermat tingkat kabupaten.',
      'Perkelahian massal antarkelompok pelajar atau antarsekolah yang sering terencana, berulang, dan didorong solidaritas yang keliru.',
      'Perselisihan kecil antara dua sahabat karena berbeda pilihan ekstrakurikuler.',
      'Kegiatan kerja bakti bersama antara dua SMK di lingkungan masyarakat sekitar.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Tawuran pelajar bersifat massal, melibatkan kelompok atau antar-institusi sekolah, kerap direncanakan atau dipicu provokasi berulang atas nama solidaritas semu.',
    idDalil: 'hujurat',
  },
  {
    id: 3,
    kategori: 'Pengertian',
    pertanyaan:
      'Istilah "solidaritas yang keliru" dalam definisi tawuran pelajar merujuk pada sikap...',
    pilihan: [
      'Membantu teman yang kesulitan memahami pelajaran praktik di bengkel SMK.',
      'Membela teman atau kelompok secara membabi buta dalam permusuhan meskipun tindakan tersebut salah dan merugikan.',
      'Menggalang dana sosial untuk teman yang sedang dirawat di rumah sakit.',
      'Menjaga kekompakan kelas saat mengikuti upacara bendera setiap hari Senin.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Solidaritas dalam Islam adalah tolong-menolong dalam kebaikan dan takwa, bukan mendukung teman ketika berbuat zalim atau membalas dendam.',
    idDalil: 'hujurat',
  },
  {
    id: 4,
    kategori: 'Pengertian',
    pertanyaan:
      'Pernyataan berikut yang menggambarkan sifat umum terjadinya perkelahian biasa di sekolah adalah...',
    pilihan: [
      'Melibatkan puluhan pelajar dari dua sekolah berbeda dengan janji temu sebelumnya.',
      'Selalu dipicu oleh persaingan prestasi akademik antarjurusan.',
      'Terjadi secara spontan akibat emosi sesaat karena ejekan, salah paham, atau rebutan barang.',
      'Dilakukan secara terstruktur dengan pembagian tugas di media sosial.',
    ],
    jawabanBenar: 2,
    pembahasan:
      'Perkelahian biasa biasanya tidak direncanakan sebelumnya, melainkan dipicu reaksi emosional sesaat atas masalah pribadi.',
    idDalil: 'hadis',
  },
  {
    id: 5,
    kategori: 'Pengertian',
    pertanyaan:
      'Mengapa perkelahian maupun tawuran pelajar sama-sama dilarang dalam ajaran Islam?',
    pilihan: [
      'Karena hanya mengurangi waktu bermain gim di rumah.',
      'Karena keduanya menyakiti sesama, merusak persaudaraan, dan mengancam keselamatan jiwa.',
      'Karena pelajar SMK hanya boleh fokus pada nilai ujian teori saja.',
      'Karena peraturan lalu lintas tidak mengizinkan pelajar berjalan berkelompok.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Islam memuliakan keselamatan jiwa dan melarang Muslim menyakiti orang lain dengan lisan maupun tangan.',
    idDalil: 'maidah',
  },

  // -------------------- KATEGORI 2: CONTOH KASUS (5 SOAL) --------------------
  {
    id: 6,
    kategori: 'Contoh Kasus',
    pertanyaan:
      'Di kantin sekolah, Riko dan Bayu awalnya saling bercanda, lalu tersinggung karena ucapan masing-masing hingga saling dorong dan bertengkar. Peristiwa ini termasuk...',
    pilihan: [
      'Tawuran pelajar terencana',
      'Perkelahian antarindividu',
      'Musyawarah penyelesaian konflik',
      'Tabayyun antarpeserta didik',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Kejadian ini melibatkan dua orang saja dan dipicu secara spontan oleh salah paham pribadi, sehingga termasuk perkelahian.',
    idDalil: 'hadis',
  },
  {
    id: 7,
    kategori: 'Contoh Kasus',
    pertanyaan:
      'Sepulang sekolah, puluhan murid dari dua SMK berbeda berjanjian lewat pesan singkat untuk bertemu di jalan raya dan saling serang membawa atribut kelompok. Kasus ini termasuk...',
    pilihan: [
      'Perkelahian spontan antarpribadi',
      'Tawuran pelajar',
      'Silaturahmi antarsekolah',
      'Perselisihan ringan di dalam kelas',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Kasus tersebut melibatkan massa antarsekolah, terencana lewat pesan singkat, dan berpotensi membahayakan keselamatan umum—ciri khas tawuran pelajar.',
    idDalil: 'maidah',
  },
  {
    id: 8,
    kategori: 'Contoh Kasus',
    pertanyaan:
      'Dua siswa kelas XI berebut tempat parkir motor di halaman sekolah lalu beradu mulut dan nyaris saling pukul sebelum dilerai petugas keamanan. Peristiwa ini dikategorikan sebagai...',
    pilihan: [
      'Tawuran massal antarkelas',
      'Perkelahian karena masalah pribadi yang spontan',
      'Konflik budaya antarwilayah',
      'Kegiatan ekstrakurikuler',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Pelakunya hanya dua orang dengan pemicu langsung dan spontan (rebutan tempat parkir), bukan konflik massal antarkelompok.',
    idDalil: 'hadis',
  },
  {
    id: 9,
    kategori: 'Contoh Kasus',
    pertanyaan:
      'Sebuah akun anonim menyebar ejekan antarsekolah sehingga sekelompok alumni dan murid berencana membalas di titik kumpul tertentu akhir pekan nanti. Tindakan ini mengarah pada...',
    pilihan: [
      'Perkelahian spontan dua sahabat',
      'Forum diskusi lintas sekolah',
      'Tawuran pelajar yang dipicu provokasi dan dendam kelompok',
      'Proses islah yang sesuai syariat',
    ],
    jawabanBenar: 2,
    pembahasan:
      'Rencana balas dendam secara berkelompok akibat provokasi media sosial merupakan pola khas terjadinya tawuran pelajar.',
    idDalil: 'hujurat',
  },
  {
    id: 10,
    kategori: 'Contoh Kasus',
    pertanyaan:
      'Saat pertandingan futsal antarjurusan selesai, dua pemain saling bertengkar karena merasa dicurangi wasit, namun tidak melibatkan penonton atau kelompok lain. Kasus ini adalah...',
    pilihan: [
      'Perkelahian antardua individu',
      'Tawuran pelajar antarsekolah',
      'Bentuk solidaritas positif',
      'Pelaksanaan musyawarah mufakat',
    ],
    jawabanBenar: 0,
    pembahasan:
      'Pertikaian hanya terjadi antara dua pemain secara spontan akibat emosi saat pertandingan, sehingga termasuk perkelahian biasa.',
    idDalil: 'hadis',
  },

  // -------------------- KATEGORI 3: BEDAKAN (5 SOAL) --------------------
  {
    id: 11,
    kategori: 'Bedakan',
    pertanyaan:
      'Dilihat dari jumlah pelakunya, perbedaan utama antara perkelahian biasa dan tawuran pelajar adalah...',
    pilihan: [
      'Perkelahian melibatkan dua orang atau kelompok kecil, sedangkan tawuran melibatkan banyak orang secara massal.',
      'Perkelahian selalu dilakukan seluruh siswa satu sekolah, sedangkan tawuran hanya dua orang.',
      'Tidak ada perbedaan jumlah pelaku antara keduanya.',
      'Tawuran hanya terjadi di ruang kelas, sedangkan perkelahian di stadion.',
    ],
    jawabanBenar: 0,
    pembahasan:
      'Skala pelaku menjadi pembeda paling jelas: perkelahian berskala kecil (individu/kelompok kecil), sedangkan tawuran berskala massal.',
    idDalil: 'hujurat',
  },
  {
    id: 12,
    kategori: 'Bedakan',
    pertanyaan:
      'Bagaimana perbedaan pola perencanaan antara perkelahian biasa dan tawuran pelajar?',
    pilihan: [
      'Perkelahian biasanya direncanakan berbulan-bulan, sedangkan tawuran selalu tanpa sengaja.',
      'Perkelahian cenderung terjadi spontan saat itu juga, sedangkan tawuran sering direncanakan dan berulang.',
      'Keduanya selalu didahului rapat resmi bersama guru.',
      'Keduanya sama sekali tidak pernah melibatkan komunikasi sebelumnya.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Perkelahian biasa muncul mendadak karena emosi sesaat, sementara tawuran kerap memiliki perencanaan, titik kumpul, atau pola balasan berulang.',
    idDalil: 'maidah',
  },
  {
    id: 13,
    kategori: 'Bedakan',
    pertanyaan:
      'Dari sisi pemicu, apa yang paling membedakan tawuran pelajar dengan perkelahian biasa?',
    pilihan: [
      'Perkelahian dipicu nilai rapor, sedangkan tawuran dipicu jadwal piket kelas.',
      'Perkelahian dipicu masalah pribadi langsung, sedangkan tawuran sering dipicu gengsi kelompok, provokasi, dan solidaritas keliru.',
      'Perkelahian dipicu cuaca panas, sedangkan tawuran hanya dipicu kelaparan.',
      'Keduanya hanya dipicu oleh perbedaan jurusan di SMK.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Pada tawuran, banyak peserta ikut bertikai bukan karena kenal masalah pribadinya, melainkan terdorong gengsi kelompok dan solidaritas yang keliru.',
    idDalil: 'hujurat',
  },
  {
    id: 14,
    kategori: 'Bedakan',
    pertanyaan:
      'Mengapa tawuran pelajar sering kali lebih sulit dihentikan dibanding perkelahian dua orang?',
    pilihan: [
      'Karena tawuran selalu disetujui oleh orang tua murid.',
      'Karena tawuran menimbulkan dendam kolektif antarkelompok sehingga berpotensi berulang di kemudian hari.',
      'Karena perkelahian dua orang tidak memiliki aturan hukum.',
      'Karena tawuran hanya terjadi secara daring tanpa tatap muka.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Tawuran melibatkan identitas kelompok atau sekolah, sehingga menyisakan rasa permusuhan kolektif yang berulang jika tidak segera didamaikan.',
    idDalil: 'hujurat',
  },
  {
    id: 15,
    kategori: 'Bedakan',
    pertanyaan:
      'Manakah pasangan ciri yang TEPAT membedakan perkelahian biasa dan tawuran pelajar?',
    pilihan: [
      'Perkelahian: massal & terencana | Tawuran: dua orang & spontan.',
      'Perkelahian: pribadi & spontan | Tawuran: massal, solidaritas keliru & kerap berulang.',
      'Perkelahian: selalu berdampak ringan | Tawuran: tidak pernah merusak nama sekolah.',
      'Perkelahian: dianjurkan saat emosi | Tawuran: dilarang hanya pada hari sekolah.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Perkelahian berciri pribadi dan spontan, sedangkan tawuran berciri massal, dipicu solidaritas keliru, sering terencana, dan berulang.',
    idDalil: 'hadis',
  },

  // -------------------- KATEGORI 4: AKIBAT (5 SOAL) --------------------
  {
    id: 16,
    kategori: 'Akibat',
    pertanyaan:
      'Salah satu akibat paling fatal dari perkelahian dan tawuran pelajar terhadap keselamatan fisik adalah...',
    pilihan: [
      'Nilai praktik kejuruan otomatis naik.',
      'Terjadinya korban luka berat bahkan hilangnya nyawa manusia.',
      'Bertambahnya teman baru dari sekolah lain.',
      'Mendapatkan penghargaan kedisiplinan dari masyarakat.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Kekerasan fisik berisiko menimbulkan luka serius hingga kematian—hal yang sangat dikecam dalam QS. Al-Ma’idah ayat 32.',
    idDalil: 'maidah',
  },
  {
    id: 17,
    kategori: 'Akibat',
    pertanyaan:
      'Bagi masa depan pendidikan murid SMK, keterlibatan dalam tawuran pelajar dapat berakibat...',
    pilihan: [
      'Mendapat prioritas magang di industri besar.',
      'Terkena sanksi berat sekolah hingga putus sekolah dan kehilangan kesempatan meraih cita-cita.',
      'Dibebaskan dari ujian kompetensi keahlian.',
      'Menjadi ketua organisasi kesiswaan secara otomatis.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Pelajar yang terlibat tawuran terancam sanksi disiplin berat sampai dikeluarkan dari sekolah, yang menghambat peluang kerja maupun studi lanjut.',
    idDalil: 'maidah',
  },
  {
    id: 18,
    kategori: 'Akibat',
    pertanyaan:
      'Selain sanksi sekolah, dampak hukum dan sosial yang dapat menimpa pelaku perkelahian atau tawuran adalah...',
    pilihan: [
      'Mendapatkan sertifikat keahlian tambahan dari kepolisian.',
      'Diproses secara hukum pidana serta merusak nama baik diri sendiri, keluarga, dan sekolah.',
      'Dipercaya menjadi duta pariwisata daerah.',
      'Tidak ada konsekuensi hukum selama masih berstatus pelajar.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Tindakan kekerasan tetap dapat diproses sesuai hukum yang berlaku dan mencoreng kehormatan keluarga serta almamater sekolah.',
    idDalil: 'maidah',
  },
  {
    id: 19,
    kategori: 'Akibat',
    pertanyaan:
      'Apa dampak batin dan spiritual bagi seseorang yang membiarkan diri terlibat dalam pertikaian dan kekerasan?',
    pilihan: [
      'Hati menjadi tenang dan mudah berkonsentrasi dalam ibadah.',
      'Menanggung dosa, diliputi rasa cemas, dan hilangnya ketenangan hidup akibat dendam berkepanjangan.',
      'Meningkatkan kekhusyukan saat membaca Al-Qur’an.',
      'Menumbuhkan rasa aman di lingkungan tempat tinggal.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Permusuhan dan dendam menjauhkan ketenangan batin serta mendatangkan dosa karena menyakiti sesama hamba Allah.',
    idDalil: 'hadis',
  },
  {
    id: 20,
    kategori: 'Akibat',
    pertanyaan:
      'Dampak negatif tawuran pelajar bagi masyarakat umum di sekitar lokasi kejadian adalah...',
    pilihan: [
      'Meningkatkan omzet pedagang kaki lima secara sehat.',
      'Mengganggu ketertiban umum, merusak fasilitas bersama, dan menimbulkan ketakutan warga.',
      'Mempercepat arus lalu lintas pada jam pulang sekolah.',
      'Menjadi hiburan edukatif bagi anak-anak di lingkungan sekitar.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Tawuran mengganggu ketentraman warga, merusak fasilitas umum, dan bertentangan dengan ajaran Islam yang membawa rahmat dan keamanan.',
    idDalil: 'hujurat',
  },

  // -------------------- KATEGORI 5: SIKAP ISLAMI (5 SOAL) --------------------
  {
    id: 21,
    kategori: 'Sikap Islami',
    pertanyaan:
      'Saat menerima pesan berantai yang menyebut sekolah lain menghina sekolahmu, sikap Islami pertama yang wajib dilakukan adalah...',
    pilihan: [
      'Langsung meneruskan pesan tersebut ke semua grup agar teman-teman siap membalas.',
      'Melakukan tabayyun (mengecek kebenaran informasi) dan tidak mudah terpancing provokasi.',
      'Mengajak teman satu kelas berkumpul di gerbang sekolah sepulang jam belajar.',
      'Membalas dengan komentar kasar di media sosial agar tidak dianggap lemah.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Tabayyun adalah memeriksa kejelasan dan kebenaran berita sebelum bertindak agar tidak terjerumus pada fitnah dan permusuhan.',
    idDalil: 'hujurat',
  },
  {
    id: 22,
    kategori: 'Sikap Islami',
    pertanyaan:
      'Ketika teman sekelas mengajakmu ikut rombongan untuk "membalas" kelompok lain sepulang sekolah, tindakan paling tepat adalah...',
    pilihan: [
      'Ikut berangkat demi menjaga nama baik pertemanan.',
      'Menolak dengan tegas namun santun, menasihati teman agar tidak ikut, serta melapor ke guru BK atau wali kelas jika situasi berbahaya.',
      'Diam saja dan menonton dari pinggir jalan sambil merekam video.',
      'Menyuruh adik kelas untuk menggantikan posisi kita.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Menolak ajakan keburukan adalah bentuk keberanian moral, sedangkan melapor kepada guru atau orang tua membantu mencegah jatuhnya korban.',
    idDalil: 'maidah',
  },
  {
    id: 23,
    kategori: 'Sikap Islami',
    pertanyaan:
      'Dalam QS. Al-Hujurat ayat 9–10, ketika ada dua pihak sesama mukmin yang berselisih, sikap yang diperintahkan Allah adalah...',
    pilihan: [
      'Mendukung salah satu pihak yang paling akrab tanpa melihat kebenaran.',
      'Melakukan islah, yaitu berusaha mendamaikan keduanya dengan adil.',
      'Membiarkan perselisihan membesar agar cepat selesai dengan sendirinya.',
      'Menyebarkan kesalahan kedua pihak ke media sosial.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Allah menegaskan bahwa orang-orang beriman itu bersaudara, maka kewajiban kita adalah mendamaikan (islah) pihak yang berselisih dengan adil.',
    idDalil: 'hujurat',
  },
  {
    id: 24,
    kategori: 'Sikap Islami',
    pertanyaan:
      'Seorang teman tidak sengaja menyenggolmu di lorong sekolah lalu memicu rasa kesal. Sikap akhlak mulia yang diajarkan Islam adalah...',
    pilihan: [
      'Menahan amarah, mendengarkan penjelasannya, dan berlapang dada memaafkan.',
      'Membalas mendorongnya lebih keras agar ia belajar berhati-hati.',
      'Menunggu pulang sekolah untuk menyelesaikannya dengan adu fisik.',
      'Memusuhinya sepanjang semester dan mengajak teman lain menjauhinya.',
    ],
    jawabanBenar: 0,
    pembahasan:
      'Menahan amarah dan memaafkan merupakan ciri orang bertakwa yang menjaga persaudaraan serta kedamaian di lingkungan sekolah.',
    idDalil: 'hadis',
  },
  {
    id: 25,
    kategori: 'Sikap Islami',
    pertanyaan:
      'Jika terjadi perbedaan pendapat tajam antarperwakilan kelas mengenai program kegiatan SMK, cara penyelesaian terbaik menurut ajaran Islam adalah...',
    pilihan: [
      'Mengadu kekuatan fisik di lapangan belakang sekolah.',
      'Musyawarah dengan kepala dingin dan melibatkan pembina OSIS atau guru sebagai penengah.',
      'Memboikot seluruh kegiatan sekolah sampai keinginan kelompok sendiri dipenuhi.',
      'Membuat grup tandingan untuk saling menyindir secara daring.',
    ],
    jawabanBenar: 1,
    pembahasan:
      'Musyawarah dengan sikap saling menghormati serta pendampingan guru menjadi jalan terhormat untuk mencapai keputusan terbaik.',
    idDalil: 'hujurat',
  },
];

// ============================================================================
// UTILITAS AUDIO WEB API (TANPA FILE EKSTERNAL)
// ============================================================================
class PengelolaSuara {
  private ctx: AudioContext | null = null;
  public bisu = false;

  private dapatkanContext(): AudioContext | null {
    if (this.bisu || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public bunyiTik() {
    const ctx = this.dapatkanContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  }

  public bunyiBenar() {
    const ctx = this.dapatkanContext();
    if (!ctx) return;
    const nada = [523.25, 659.25, 783.99]; // C5 - E5 - G5
    nada.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const mulai = ctx.currentTime + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, mulai);
      gain.gain.setValueAtTime(0.001, mulai);
      gain.gain.linearRampToValueAtTime(0.12, mulai + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, mulai + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(mulai);
      osc.stop(mulai + 0.26);
    });
  }

  public bunyiSalah() {
    const ctx = this.dapatkanContext();
    if (!ctx) return;
    const nada = [330, 261.63];
    nada.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const mulai = ctx.currentTime + idx * 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, mulai);
      gain.gain.setValueAtTime(0.1, mulai);
      gain.gain.exponentialRampToValueAtTime(0.001, mulai + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(mulai);
      osc.stop(mulai + 0.24);
    });
  }

  public bunyiSelesaiRoda() {
    const ctx = this.dapatkanContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.11, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }
}

const suaraFX = new PengelolaSuara();

// ============================================================================
// KOMPONEN ILUSTRASI RAMAH & RODA SVG
// ============================================================================
function IkonRodaLogo({ ukuran = 84 }: { ukuran?: number }) {
  const r = 44;
  const cx = 50;
  const cy = 50;
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx={cx} cy={cy} r={47} fill="#F2B705" />
      {KATEGORI_RODA.map((kat, idx) => {
        const sudutMulai = ((idx * 72 - 90) * Math.PI) / 180;
        const sudutAkhir = (((idx + 1) * 72 - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(sudutMulai);
        const y1 = cy + r * Math.sin(sudutMulai);
        const x2 = cx + r * Math.cos(sudutAkhir);
        const y2 = cy + r * Math.sin(sudutAkhir);
        return (
          <path
            key={kat.id}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
            fill={kat.warna}
            stroke="#FFF8E7"
            strokeWidth="2"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={14} fill="#FFF8E7" stroke="#125834" strokeWidth="3" />
      <path
        d="M50 41 L52.6 46.8 L59 47.4 L54.2 51.6 L55.6 57.8 L50 54.4 L44.4 57.8 L45.8 51.6 L41 47.4 L47.4 46.8 Z"
        fill="#F2B705"
      />
    </svg>
  );
}

function RodaPutarSVG({
  rotasi,
  sedangBerputar,
}: {
  rotasi: number;
  sedangBerputar: boolean;
}) {
  const cx = 180;
  const cy = 180;
  const radius = 160;

  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center select-none sm:max-w-[370px]">
      {/* Jarum penunjuk di atas roda */}
      <div
        className="z-20 -mb-4 flex flex-col items-center drop-shadow-sm"
        aria-hidden="true"
      >
        <svg width="38" height="40" viewBox="0 0 38 40">
          <path
            d="M19 38 L5 10 C3.5 6.5 6 2 10 2 L28 2 C32 2 34.5 6.5 33 10 Z"
            fill="#F2B705"
            stroke="#125834"
            strokeWidth="3"
          />
          <circle cx="19" cy="11" r="4" fill="#125834" />
        </svg>
      </div>

      {/* Lingkaran roda yang berputar */}
      <div className="relative w-full aspect-square">
        <svg
          viewBox="0 0 360 360"
          className="h-full w-full"
          role="img"
          aria-label="Roda Keberuntungan Islami dengan 5 kategori pembelajaran"
          style={{
            transform: `rotate(${rotasi}deg)`,
            willChange: sedangBerputar ? 'transform' : 'auto',
          }}
        >
          {/* Bingkai luar emas */}
          <circle cx={cx} cy={cy} r={174} fill="#125834" />
          <circle cx={cx} cy={cy} r={168} fill="#F2B705" />

          {/* Titik lampu dekoratif pada bingkai */}
          {Array.from({ length: 15 }).map((_, i) => {
            const rad = ((i * 24 - 90) * Math.PI) / 180;
            const px = cx + 168 * Math.cos(rad);
            const py = cy + 168 * Math.sin(rad);
            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={3.2}
                fill={i % 2 === 0 ? '#FFF8E7' : '#125834'}
              />
            );
          })}

          {/* 5 Segmen kategori */}
          {KATEGORI_RODA.map((kat, idx) => {
            const sudutAwalDeg = idx * 72 - 90;
            const sudutAkhirDeg = (idx + 1) * 72 - 90;
            const sudutTengahDeg = idx * 72 + 36 - 90;

            const rad1 = (sudutAwalDeg * Math.PI) / 180;
            const rad2 = (sudutAkhirDeg * Math.PI) / 180;
            const radTengah = (sudutTengahDeg * Math.PI) / 180;

            const x1 = cx + radius * Math.cos(rad1);
            const y1 = cy + radius * Math.sin(rad1);
            const x2 = cx + radius * Math.cos(rad2);
            const y2 = cy + radius * Math.sin(rad2);

            const ikonX = cx + 114 * Math.cos(radTengah);
            const ikonY = cy + 114 * Math.sin(radTengah);
            const teksX = cx + 76 * Math.cos(radTengah);
            const teksY = cy + 76 * Math.sin(radTengah);
            const rotasiTeks = idx * 72 + 36;

            return (
              <g key={kat.id}>
                <path
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                  fill={kat.warna}
                  stroke="#FFF8E7"
                  strokeWidth="3"
                />
                <text
                  x={ikonX}
                  y={ikonY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="26"
                  transform={`rotate(${rotasiTeks}, ${ikonX}, ${ikonY})`}
                >
                  {kat.ikon}
                </text>
                <text
                  x={teksX}
                  y={teksY}
                  fill={kat.warnaTeks}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13.5"
                  fontWeight="700"
                  fontFamily="Poppins, sans-serif"
                  transform={`rotate(${rotasiTeks}, ${teksX}, ${teksY})`}
                >
                  {kat.labelSingkat}
                </text>
              </g>
            );
          })}

          {/* Poros tengah */}
          <circle cx={cx} cy={cy} r={30} fill="#FFF8E7" stroke="#125834" strokeWidth="5" />
          <path
            d="M180 164 L184.5 174.2 L195.5 175.4 L187.2 182.8 L189.6 193.6 L180 187.9 L170.4 193.6 L172.8 182.8 L164.5 175.4 L175.5 174.2 Z"
            fill="#F2B705"
            stroke="#125834"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN KONFETI RINGAN SAAT JAWABAN BENAR
// ============================================================================
function KonfetiRingan() {
  const partikel = [
    { kiri: '10%', warna: '#F2B705', tunda: '0ms' },
    { kiri: '22%', warna: '#2E9E63', tunda: '60ms' },
    { kiri: '34%', warna: '#1B7F4B', tunda: '30ms' },
    { kiri: '46%', warna: '#F2B705', tunda: '90ms' },
    { kiri: '58%', warna: '#2E9E63', tunda: '40ms' },
    { kiri: '70%', warna: '#1B7F4B', tunda: '80ms' },
    { kiri: '82%', warna: '#F2B705', tunda: '20ms' },
    { kiri: '90%', warna: '#2E9E63', tunda: '70ms' },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden"
      aria-hidden="true"
    >
      {partikel.map((p, idx) => (
        <span
          key={idx}
          className="partikel-konfeti absolute top-2 block h-3 w-3 rounded-sm"
          style={{
            left: p.kiri,
            backgroundColor: p.warna,
            animationDelay: p.tunda,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// FUNGSI BANTU ACAK ARRAY
// ============================================================================
function acakPilih<T>(daftar: T[]): T {
  const indeks = Math.floor(Math.random() * daftar.length);
  return daftar[indeks];
}

// ============================================================================
// KOMPONEN UTAMA APLIKASI (7 HALAMAN + MODE GURU)
// ============================================================================
export default function App() {
  const [halaman, setHalaman] = useState<Halaman>('beranda');
  const [bisuSuara, setBisuSuara] = useState(false);

  // State sesi permainan
  const [ronde, setRonde] = useState(1);
  const [skor, setSkor] = useState(0);
  const [soalTerpakaiIds, setSoalTerpakaiIds] = useState<number[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatRonde[]>([]);

  // State roda putar
  const [rotasiRoda, setRotasiRoda] = useState(0);
  const [sedangBerputar, setSedangBerputar] = useState(false);
  const [kategoriTerpilih, setKategoriTerpilih] = useState<KategoriId | null>(null);
  const animasiRef = useRef<number | null>(null);
  const rotasiSaatIniRef = useRef(0);
  const lanjutOtomatisRef = useRef<number | null>(null);

  // State soal & timer
  const [soalAktif, setSoalAktif] = useState<Soal | null>(null);
  const [sisaWaktu, setSisaWaktu] = useState(WAKTU_PER_SOAL);
  const [pilihanUser, setPilihanUser] = useState<number | null>(null);
  const [waktuHabis, setWaktuHabis] = useState(false);
  const [terjawab, setTerjawab] = useState(false);

  // State refleksi siswa (Halaman 6)
  const [refleksi1, setRefleksi1] = useState('');
  const [refleksi2, setRefleksi2] = useState('');
  const [refleksi3, setRefleksi3] = useState('');

  // State Mode Guru & konfirmasi keluar ke Beranda
  const [bukaModeGuru, setBukaModeGuru] = useState(false);
  const [filterKategoriGuru, setFilterKategoriGuru] = useState<KategoriId | 'Semua'>('Semua');
  const [konfirmasiBeranda, setKonfirmasiBeranda] = useState(false);

  const sedangDalamSesi =
    halaman === 'roda' ||
    halaman === 'tantangan' ||
    halaman === 'umpanBalik' ||
    halaman === 'refleksi';

  // Sinkronkan status mute ke pengelola suara
  const ubahStatusSuara = () => {
    const baru = !bisuSuara;
    setBisuSuara(baru);
    suaraFX.bisu = baru;
  };

  // Bersihkan timer/animasi saat unmount
  useEffect(() => {
    return () => {
      if (animasiRef.current) cancelAnimationFrame(animasiRef.current);
      if (lanjutOtomatisRef.current) window.clearTimeout(lanjutOtomatisRef.current);
    };
  }, []);

  // Hitung soal yang masih tersedia per kategori agar tidak pernah berulang
  const kategoriTersedia = useMemo(() => {
    return KATEGORI_RODA.filter((kat) =>
      BANK_SOAL.some(
        (s) => s.kategori === kat.id && !soalTerpakaiIds.includes(s.id)
      )
    );
  }, [soalTerpakaiIds]);

  // Mulai sesi permainan baru (10 ronde)
  const mulaiSesiBaru = (tujuan: Halaman = 'roda') => {
    if (animasiRef.current) cancelAnimationFrame(animasiRef.current);
    if (lanjutOtomatisRef.current) window.clearTimeout(lanjutOtomatisRef.current);
    setRonde(1);
    setSkor(0);
    setSoalTerpakaiIds([]);
    setRiwayat([]);
    setKategoriTerpilih(null);
    setSedangBerputar(false);
    setSoalAktif(null);
    setPilihanUser(null);
    setWaktuHabis(false);
    setTerjawab(false);
    setRefleksi1('');
    setRefleksi2('');
    setRefleksi3('');
    setKonfirmasiBeranda(false);
    setHalaman(tujuan);
  };

  // Buka soal dari kategori hasil putaran roda
  const bukaTantanganDariKategori = (kategori: KategoriId) => {
    if (lanjutOtomatisRef.current) {
      window.clearTimeout(lanjutOtomatisRef.current);
      lanjutOtomatisRef.current = null;
    }
    const kandidat = BANK_SOAL.filter(
      (s) => s.kategori === kategori && !soalTerpakaiIds.includes(s.id)
    );
    const soalDipilih =
      kandidat.length > 0
        ? acakPilih(kandidat)
        : acakPilih(BANK_SOAL.filter((s) => !soalTerpakaiIds.includes(s.id)));

    setSoalAktif(soalDipilih);
    setSoalTerpakaiIds((prev) => [...prev, soalDipilih.id]);
    setSisaWaktu(WAKTU_PER_SOAL);
    setPilihanUser(null);
    setWaktuHabis(false);
    setTerjawab(false);
    setHalaman('tantangan');
  };

  // Jalankan putaran roda dengan easing halus via requestAnimationFrame
  const putarRoda = () => {
    if (sedangBerputar) return;

    const daftarKandidat =
      kategoriTersedia.length > 0 ? kategoriTersedia : KATEGORI_RODA;
    const targetKategori = acakPilih(daftarKandidat);
    const targetIndex = KATEGORI_RODA.findIndex((k) => k.id === targetKategori.id);

    setKategoriTerpilih(null);
    setSedangBerputar(true);

    // Hitung sudut tujuan agar jarum atas (0 deg) tepat menunjuk segmen target
    const sudutTengahSegmen = targetIndex * 72 + 36;
    const jitter = (Math.random() - 0.5) * 34; // Tetap aman di dalam segmen (-17 s.d +17)
    const targetMod = (((360 - sudutTengahSegmen + jitter) % 360) + 360) % 360;

    const awal = rotasiSaatIniRef.current;
    const awalMod = ((awal % 360) + 360) % 360;
    let deltaSudut = targetMod - awalMod;
    if (deltaSudut <= 0) deltaSudut += 360;

    const putaranPenuh = (5 + Math.floor(Math.random() * 2)) * 360;
    const totalPerubahan = putaranPenuh + deltaSudut;
    const durasi = 3400; // ms

    let segmenTerakhir = -1;
    let waktuMulai: number | null = null;

    const langkahAnimasi = (timestamp: number) => {
      if (waktuMulai === null) waktuMulai = timestamp;
      const progres = Math.min((timestamp - waktuMulai) / durasi, 1);
      // Kurva ease-out kuartik agar melambat sangat halus di akhir
      const easing = 1 - Math.pow(1 - progres, 4);
      const sudutBaru = awal + totalPerubahan * easing;

      rotasiSaatIniRef.current = sudutBaru;
      setRotasiRoda(sudutBaru);

      // Deteksi perpindahan segmen di bawah jarum untuk efek bunyi tik
      const sudutLokal = (((360 - (sudutBaru % 360)) % 360) + 360) % 360;
      const segmenKini = Math.floor(sudutLokal / 72) % 5;
      if (segmenKini !== segmenTerakhir) {
        if (segmenTerakhir !== -1) {
          suaraFX.bunyiTik();
        }
        segmenTerakhir = segmenKini;
      }

      if (progres < 1) {
        animasiRef.current = requestAnimationFrame(langkahAnimasi);
      } else {
        setSedangBerputar(false);
        setKategoriTerpilih(targetKategori.id);
        suaraFX.bunyiSelesaiRoda();

        lanjutOtomatisRef.current = window.setTimeout(() => {
          bukaTantanganDariKategori(targetKategori.id);
        }, 1250);
      }
    };

    animasiRef.current = requestAnimationFrame(langkahAnimasi);
  };

  // Timer mundur 30 detik pada Halaman 4 (Tantangan Pengetahuan)
  useEffect(() => {
    if (halaman !== 'tantangan' || terjawab || !soalAktif) return;

    const interval = window.setInterval(() => {
      setSisaWaktu((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          // Waktu habis otomatis
          setTerjawab(true);
          setWaktuHabis(true);
          setPilihanUser(null);
          suaraFX.bunyiSalah();
          setRiwayat((lama) => [
            ...lama,
            {
              ronde,
              kategori: soalAktif.kategori,
              pertanyaan: soalAktif.pertanyaan,
              pilihanDipilih: null,
              jawabanBenar: soalAktif.jawabanBenar,
              benar: false,
              waktuHabis: true,
              poin: 0,
              bonusKecepatan: 0,
            },
          ]);
          setHalaman('umpanBalik');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [halaman, terjawab, soalAktif, ronde]);

  // Proses jawaban pilihan ganda murid
  const pilihJawaban = (indeks: number) => {
    if (terjawab || !soalAktif) return;

    const waktuTerpakai = WAKTU_PER_SOAL - sisaWaktu;
    const benar = indeks === soalAktif.jawabanBenar;
    const dapatBonus = benar && waktuTerpakai < BATAS_WAKTU_BONUS;
    const poinDidapat = benar ? POIN_BENAR + (dapatBonus ? BONUS_CEPAT : 0) : 0;

    setTerjawab(true);
    setPilihanUser(indeks);
    setWaktuHabis(false);
    setSkor((s) => s + poinDidapat);

    if (benar) {
      suaraFX.bunyiBenar();
    } else {
      suaraFX.bunyiSalah();
    }

    setRiwayat((lama) => [
      ...lama,
      {
        ronde,
        kategori: soalAktif.kategori,
        pertanyaan: soalAktif.pertanyaan,
        pilihanDipilih: indeks,
        jawabanBenar: soalAktif.jawabanBenar,
        benar,
        waktuHabis: false,
        poin: poinDidapat,
        bonusKecepatan: dapatBonus ? BONUS_CEPAT : 0,
      },
    ]);

    setHalaman('umpanBalik');
  };

  // Pintasan keyboard (A-D / 1-4) saat berada di halaman tantangan
  useEffect(() => {
    if (halaman !== 'tantangan' || terjawab || bukaModeGuru) return;

    const tanganiTombol = (e: KeyboardEvent) => {
      const huruf = e.key.toLowerCase();
      if (huruf === 'a' || huruf === '1') pilihJawaban(0);
      if (huruf === 'b' || huruf === '2') pilihJawaban(1);
      if (huruf === 'c' || huruf === '3') pilihJawaban(2);
      if (huruf === 'd' || huruf === '4') pilihJawaban(3);
    };

    window.addEventListener('keydown', tanganiTombol);
    return () => window.removeEventListener('keydown', tanganiTombol);
  });

  // Lanjut ke ronde berikutnya atau ke Halaman 6 (Refleksi) setelah ronde 10
  const lanjutSetelahUmpanBalik = () => {
    if (ronde >= TOTAL_RONDE) {
      setHalaman('refleksi');
    } else {
      setRonde((r) => r + 1);
      setKategoriTerpilih(null);
      setSoalAktif(null);
      setHalaman('roda');
    }
  };

  // Tangani klik tombol Beranda di bilah navigasi
  const klikTombolBeranda = () => {
    if (sedangDalamSesi && riwayat.length > 0) {
      setKonfirmasiBeranda(true);
    } else {
      if (animasiRef.current) cancelAnimationFrame(animasiRef.current);
      if (lanjutOtomatisRef.current) window.clearTimeout(lanjutOtomatisRef.current);
      setSedangBerputar(false);
      setHalaman('beranda');
    }
  };

  // Ringkasan skor per kategori untuk Halaman 6 (Refleksi & Evaluasi)
  const rincianPerKategori = useMemo(() => {
    return KATEGORI_RODA.map((kat) => {
      const daftar = riwayat.filter((r) => r.kategori === kat.id);
      const jumlahBenar = daftar.filter((r) => r.benar).length;
      const totalPoin = daftar.reduce((acc, cur) => acc + cur.poin, 0);
      return {
        ...kat,
        jumlahSoal: daftar.length,
        jumlahBenar,
        totalPoin,
      };
    });
  }, [riwayat]);

  const soalGuruTersaring = useMemo(() => {
    if (filterKategoriGuru === 'Semua') return BANK_SOAL;
    return BANK_SOAL.filter((s) => s.kategori === filterKategoriGuru);
  }, [filterKategoriGuru]);

  const hurufPilihan = ['A', 'B', 'C', 'D'];
  const skorMaksimal = TOTAL_RONDE * (POIN_BENAR + BONUS_CEPAT);
  const progressPersen = Math.round((ronde / TOTAL_RONDE) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8E7] text-[#18291F]">
      {/* ====================================================================
          BILAH NAVIGASI ATAS (RINGKAS, KONTRAK 3 ZONA, RAMAH MOBILE)
          ==================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[#D9E6DD] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={klikTombolBeranda}
            className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-1.5 text-left transition-colors hover:text-[#1B7F4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
            aria-label="Kembali ke Beranda Roda Keberuntungan Islami"
          >
            <IkonRodaLogo ukuran={32} />
            <span className="font-judul text-base font-bold tracking-tight text-[#125834] whitespace-nowrap sm:text-lg">
              Roda Islami
            </span>
          </button>

          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-2 sm:gap-3"
          >
            {halaman !== 'beranda' && (
              <button
                type="button"
                onClick={klikTombolBeranda}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D9E6DD] bg-white px-3 py-2 text-sm font-semibold text-[#18291F] transition-colors hover:border-[#1B7F4B] hover:text-[#1B7F4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B] whitespace-nowrap shrink-0"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Beranda</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setBukaModeGuru(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D9E6DD] bg-white px-3 py-2 text-sm font-semibold text-[#125834] transition-colors hover:border-[#1B7F4B] hover:bg-[#F3FAF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B] whitespace-nowrap shrink-0"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mode Guru</span>
              <span className="sm:hidden">Guru</span>
            </button>

            <button
              type="button"
              onClick={ubahStatusSuara}
              aria-pressed={bisuSuara}
              aria-label={bisuSuara ? 'Aktifkan efek suara' : 'Bisukan efek suara'}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#D9E6DD] bg-white px-2.5 text-[#18291F] transition-colors hover:border-[#1B7F4B] hover:text-[#1B7F4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B] shrink-0"
              title={bisuSuara ? 'Suara Mati (klik untuk nyalakan)' : 'Suara Aktif (klik untuk bisukan)'}
            >
              {bisuSuara ? (
                <VolumeX className="h-5 w-5 text-[#4B5E52]" aria-hidden="true" />
              ) : (
                <Volume2 className="h-5 w-5 text-[#1B7F4B]" aria-hidden="true" />
              )}
            </button>
          </nav>
        </div>

        {/* Bilah Progress Sesi saat bermain (halaman 3, 4, 5) */}
        {(halaman === 'roda' || halaman === 'tantangan' || halaman === 'umpanBalik') && (
          <div className="border-t border-[#E6EFE9] bg-[#F6FBF8]">
            <div className="mx-auto flex max-w-4xl flex-col gap-1.5 px-4 py-2 sm:px-6">
              <div className="flex items-center justify-between text-sm font-semibold text-[#125834]">
                <span className="angka-tabular">
                  Ronde {ronde} dari {TOTAL_RONDE}
                </span>
                <span className="angka-tabular">
                  Skor Berjalan: {skor} poin
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-[#DCE9E1]"
                role="progressbar"
                aria-valuenow={ronde}
                aria-valuemin={1}
                aria-valuemax={TOTAL_RONDE}
                aria-label={`Progres permainan ronde ${ronde} dari ${TOTAL_RONDE}`}
              >
                <div
                  className="h-full bg-[#1B7F4B] transition-transform duration-300 origin-left"
                  style={{ transform: `scaleX(${progressPersen / 100})` }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          KONFIRMASI KELUAR SESI (PENGGANTI window.confirm)
          ==================================================================== */}
      {konfirmasiBeranda && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-konfirmasi-keluar"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#D9E6DD] bg-white p-6 shadow-lg">
            <h2
              id="judul-konfirmasi-keluar"
              className="font-judul text-xl font-bold text-[#125834]"
            >
              Kembali ke Beranda?
            </h2>
            <p className="mt-2 text-base text-[#4B5E52]">
              Permainanmu saat ini berada di ronde {ronde} dengan skor {skor} poin.
              Jika kembali ke Beranda, progres ronde sesi ini akan diulang dari awal.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setKonfirmasiBeranda(false)}
                className="min-h-[48px] rounded-xl border border-[#D9E6DD] bg-white px-5 py-3 text-base font-semibold text-[#18291F] transition-colors hover:bg-[#F6FBF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
              >
                Lanjut Bermain
              </button>
              <button
                type="button"
                onClick={() => {
                  if (animasiRef.current) cancelAnimationFrame(animasiRef.current);
                  if (lanjutOtomatisRef.current) window.clearTimeout(lanjutOtomatisRef.current);
                  setSedangBerputar(false);
                  setKonfirmasiBeranda(false);
                  setHalaman('beranda');
                }}
                className="min-h-[48px] rounded-xl bg-[#1B7F4B] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[#125834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
              >
                Ya, Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          KONTEN UTAMA 7 HALAMAN
          ==================================================================== */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
        {/* ----------------------------------------------------------------
            HALAMAN 1: BERANDA
            ---------------------------------------------------------------- */}
        {halaman === 'beranda' && (
          <section
            aria-labelledby="judul-beranda"
            className="rounded-2xl border border-[#D9E6DD] bg-white p-6 shadow-sm sm:p-10"
          >
            <div className="grid items-center gap-8 md:grid-cols-12">
              <div className="md:col-span-7">
                <p className="text-sm font-semibold text-[#1B7F4B]">
                  PAI &amp; Budi Pekerti · SMK Kelas XI (Fase F)
                </p>
                <h1
                  id="judul-beranda"
                  className="mt-2 font-judul text-3xl font-bold leading-tight text-[#125834] sm:text-4xl"
                >
                  Roda Keberuntungan Islami
                </h1>
                <p className="mt-4 text-base leading-relaxed text-[#4B5E52]">
                  Putar roda pengetahuan, jawab tantangan dalam 30 detik, dan pahami
                  perbedaan perkelahian, tawuran pelajar, akibatnya, serta sikap
                  Islami untuk menjaga kedamaian di sekolah.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 border-y border-[#E6EFE9] py-4 text-center sm:text-left">
                  <div>
                    <div className="font-judul text-xl font-bold text-[#125834] angka-tabular">
                      10 Ronde
                    </div>
                    <div className="text-sm text-[#4B5E52]">Soal acak</div>
                  </div>
                  <div>
                    <div className="font-judul text-xl font-bold text-[#125834] angka-tabular">
                      5 Kategori
                    </div>
                    <div className="text-sm text-[#4B5E52]">Roda putar</div>
                  </div>
                  <div>
                    <div className="font-judul text-xl font-bold text-[#125834] angka-tabular">
                      30 Detik
                    </div>
                    <div className="text-sm text-[#4B5E52]">Per tantangan</div>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => mulaiSesiBaru('roda')}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#1B7F4B] px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#125834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
                  >
                    <span>Mulai Bermain</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setHalaman('petunjuk')}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-[#1B7F4B] bg-white px-6 py-3.5 text-base font-bold text-[#125834] transition-colors hover:bg-[#F3FAF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
                  >
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                    <span>Petunjuk</span>
                  </button>
                </div>
              </div>

              {/* Ilustrasi ramah: Roda Keberuntungan & Simbol Persaudaraan */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E6EFE9] bg-[#FFF8E7] p-6 text-center md:col-span-5">
                <IkonRodaLogo ukuran={168} />
                <div className="mt-5 space-y-1">
                  <p className="font-judul text-lg font-bold text-[#125834]">
                    Belajar Damai, Berakhlak Mulia
                  </p>
                  <p className="text-sm text-[#4B5E52]">
                    Selesaikan 10 ronde dan raih skor tertinggi bersama teman sekelasmu.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------
            HALAMAN 2: PETUNJUK & TUJUAN PEMBELAJARAN
            ---------------------------------------------------------------- */}
        {halaman === 'petunjuk' && (
          <section
            aria-labelledby="judul-petunjuk"
            className="rounded-2xl border border-[#D9E6DD] bg-white p-6 shadow-sm sm:p-8"
          >
            <p className="text-sm font-semibold text-[#1B7F4B]">
              Panduan &amp; Tujuan Pembelajaran
            </p>
            <h1
              id="judul-petunjuk"
              className="mt-1 font-judul text-2xl font-bold text-[#125834] sm:text-3xl"
            >
              Petunjuk Bermain &amp; Materi Pokok
            </h1>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Tujuan & Indikator */}
              <div className="rounded-xl border border-[#E6EFE9] bg-[#F9FCFA] p-5">
                <h2 className="font-judul text-lg font-bold text-[#125834]">
                  Tujuan Pembelajaran
                </h2>
                <p className="mt-2 text-base text-[#18291F]">
                  Murid SMK Kelas XI (Fase F) mampu mendefinisikan perkelahian
                  dan tawuran pelajar serta bersikap Islami dalam mencegah konflik.
                </p>
                <h3 className="mt-4 font-judul text-base font-bold text-[#125834]">
                  5 Indikator Pencapaian:
                </h3>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-base text-[#4B5E52]">
                  <li>Menjelaskan pengertian perkelahian.</li>
                  <li>Menjelaskan pengertian tawuran pelajar.</li>
                  <li>Membedakan perkelahian dan tawuran pelajar.</li>
                  <li>Menyebutkan akibat buruk bagi diri, sekolah, dan masyarakat.</li>
                  <li>Menunjukkan sikap Islami dalam menyelesaikan konflik.</li>
                </ol>
              </div>

              {/* Cara Bermain & Sistem Skor */}
              <div className="rounded-xl border border-[#E6EFE9] bg-[#FFFDF7] p-5">
                <h2 className="font-judul text-lg font-bold text-[#125834]">
                  Cara Bermain &amp; Sistem Skor
                </h2>
                <ul className="mt-3 space-y-2.5 text-base text-[#18291F]">
                  <li>
                    <strong>1. Satu Sesi = 10 Ronde:</strong> Pada setiap ronde,
                    tekan tombol <strong>PUTAR</strong> untuk menentukan kategori
                    soal secara acak.
                  </li>
                  <li>
                    <strong>2. Timer 30 Detik:</strong> Pilih jawaban A, B, C, atau
                    D sebelum waktu habis (soal tidak berulang).
                  </li>
                  <li>
                    <strong>3. Sistem Skor:</strong> Jawaban benar bernilai{' '}
                    <strong className="text-[#1B7F4B]">+10 poin</strong>. Jika
                    dijawab di bawah 10 detik, dapat bonus{' '}
                    <strong className="text-[#9E7300]">+5 poin</strong>. Salah atau
                    waktu habis = 0 poin.
                  </li>
                  <li>
                    <strong>4. Refleksi Akhir:</strong> Di akhir ronde 10, lihat
                    rincian skor per kategori dan isi 3 pertanyaan refleksi diri.
                  </li>
                </ul>
              </div>
            </div>

            {/* Rujukan Dalil Ringkas */}
            <div className="mt-6 rounded-xl border border-[#D9E6DD] bg-[#F6FBF8] p-5">
              <h2 className="font-judul text-lg font-bold text-[#125834]">
                Rujukan Dalil Utama
              </h2>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                {Object.values(DATA_DALIL).map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-[#DCE9E1] bg-white p-4"
                  >
                    <p className="text-sm font-bold text-[#1B7F4B]">{d.sumber}</p>
                    <p
                      dir="rtl"
                      lang="ar"
                      className="font-arab mt-2 text-right text-xl text-[#125834]"
                    >
                      {d.teksArab}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5E52]">
                      “{d.arti}”
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm italic text-[#4B5E52]">
                Catatan: Guru dapat memverifikasi kutipan dalil sebelum dipakai di
                kelas.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setHalaman('beranda')}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#D9E6DD] bg-white px-6 py-3 text-base font-semibold text-[#18291F] transition-colors hover:bg-[#F6FBF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                onClick={() => mulaiSesiBaru('roda')}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#1B7F4B] px-7 py-3 text-base font-bold text-white transition-colors hover:bg-[#125834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
              >
                <span>Lanjut ke Roda</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------
            HALAMAN 3: RODA KEBERUNTUNGAN
            ---------------------------------------------------------------- */}
        {halaman === 'roda' && (
          <section
            aria-labelledby="judul-roda"
            className="rounded-2xl border border-[#D9E6DD] bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1B7F4B]">
                Ronde {ronde} dari {TOTAL_RONDE} · Tantangan Pengetahuan
              </p>
              <h1
                id="judul-roda"
                className="mt-1 font-judul text-2xl font-bold text-[#125834] sm:text-3xl"
              >
                Putar Roda Keberuntungan
              </h1>
              <p className="mt-1 text-base text-[#4B5E52]">
                Tekan tombol <strong>PUTAR</strong> untuk menentukan kategori soalmu.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
              <RodaPutarSVG rotasi={rotasiRoda} sedangBerputar={sedangBerputar} />

              <div className="flex w-full max-w-sm flex-col items-center text-center lg:items-start lg:text-left">
                {/* Status Kategori Terpilih */}
                <div
                  aria-live="polite"
                  className="w-full rounded-xl border border-[#D9E6DD] bg-[#FFF8E7] p-4"
                >
                  {sedangBerputar ? (
                    <p className="font-judul text-lg font-bold text-[#125834]">
                      Roda sedang berputar...
                    </p>
                  ) : kategoriTerpilih ? (
                    <div>
                      <p className="text-sm font-semibold text-[#1B7F4B]">
                        Kategori terpilih:
                      </p>
                      <p className="mt-1 font-judul text-2xl font-bold text-[#125834]">
                        {
                          KATEGORI_RODA.find((k) => k.id === kategoriTerpilih)
                            ?.ikon
                        }{' '}
                        {kategoriTerpilih}
                      </p>
                      <p className="mt-1 text-sm text-[#4B5E52]">
                        Membuka soal dalam sekejap...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-judul text-base font-bold text-[#125834]">
                        Siap Memutar Roda?
                      </p>
                      <p className="mt-1 text-sm text-[#4B5E52]">
                        Tersisa {BANK_SOAL.length - soalTerpakaiIds.length} soal
                        unik di bank soal.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tombol PUTAR */}
                {!kategoriTerpilih ? (
                  <button
                    type="button"
                    onClick={putarRoda}
                    disabled={sedangBerputar}
                    className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#F2B705] px-8 py-4 font-judul text-xl font-bold tracking-wide text-[#18291F] shadow-sm transition-colors hover:bg-[#dfa702] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
                  >
                    {sedangBerputar ? 'MEMUTAR...' : 'PUTAR'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => bukaTantanganDariKategori(kategoriTerpilih)}
                    className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B7F4B] px-8 py-4 font-judul text-lg font-bold text-white transition-colors hover:bg-[#125834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
                  >
                    <span>Buka Soal Sekarang</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}

                {/* Daftar 5 Kategori ringkas */}
                <div className="mt-5 w-full space-y-1.5 text-left text-sm text-[#4B5E52]">
                  {KATEGORI_RODA.map((kat) => {
                    const sisa = BANK_SOAL.filter(
                      (s) =>
                        s.kategori === kat.id && !soalTerpakaiIds.includes(s.id)
                    ).length;
                    return (
                      <div
                        key={kat.id}
                        className="flex items-center justify-between border-b border-[#EFE8D5] py-1 last:border-b-0"
                      >
                        <span className="font-semibold text-[#18291F]">
                          {kat.ikon} {kat.id}
                        </span>
                        <span className="angka-tabular text-xs text-[#4B5E52]">
                          {sisa} soal tersisa
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------
            HALAMAN 4: TANTANGAN PENGETAHUAN
            ---------------------------------------------------------------- */}
        {halaman === 'tantangan' && soalAktif && (
          <section
            aria-labelledby="pertanyaan-soal"
            className="rounded-2xl border border-[#D9E6DD] bg-white p-5 shadow-sm sm:p-8"
          >
            {/* Baris atas: Kategori & Timer 30 detik */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFE9] pb-4">
              <div className="text-sm font-bold text-[#1B7F4B]">
                Kategori: {soalAktif.kategori} · Ronde {ronde}/{TOTAL_RONDE}
              </div>

              <div
                aria-live="polite"
                className={`inline-flex items-center gap-1.5 font-judul text-lg font-bold angka-tabular ${
                  sisaWaktu <= 8 ? 'text-[#B91C1C]' : 'text-[#125834]'
                }`}
              >
                <Clock className="h-5 w-5" aria-hidden="true" />
                <span>{sisaWaktu} detik</span>
              </div>
            </div>

            {/* Progress bar timer */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E6EFE9]">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  sisaWaktu <= 8
                    ? 'bg-[#DC2626]'
                    : sisaWaktu > 20
                    ? 'bg-[#2E9E63]'
                    : 'bg-[#F2B705]'
                }`}
                style={{ width: `${(sisaWaktu / WAKTU_PER_SOAL) * 100}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-[#4B5E52]">
              {sisaWaktu > 20
                ? 'Jawab sekarang untuk meraih bonus kecepatan +5 poin!'
                : 'Fokus dan pilih jawaban terbaik sebelum waktu habis.'}
            </p>

            {/* Pertanyaan */}
            <h1
              id="pertanyaan-soal"
              className="mt-4 font-judul text-xl font-bold leading-snug text-[#18291F] sm:text-2xl"
            >
              {soalAktif.pertanyaan}
            </h1>

            {/* Pilihan Ganda A - D */}
            <div className="mt-6 space-y-3" role="group" aria-label="Pilihan jawaban">
              {soalAktif.pilihan.map((teks, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => pilihJawaban(idx)}
                  disabled={terjawab}
                  className="flex min-h-[56px] w-full items-start gap-3.5 rounded-xl border border-[#D9E6DD] bg-[#FAFDFB] p-4 text-left text-base text-[#18291F] transition-colors hover:border-[#1B7F4B] hover:bg-[#EEF8F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1B7F4B] font-judul text-sm font-bold text-white">
                    {hurufPilihan[idx]}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{teks}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-[#4B5E52]">
              Tips keyboard: tekan tombol A, B, C, atau D (atau angka 1–4) untuk
              memilih jawaban dengan cepat.
            </p>
          </section>
        )}

        {/* ----------------------------------------------------------------
            HALAMAN 5: UMPAN BALIK & PEMBAHASAN
            ---------------------------------------------------------------- */}
        {halaman === 'umpanBalik' && soalAktif && (
          <section
            aria-labelledby="judul-umpan-balik"
            className="relative overflow-hidden rounded-2xl border border-[#D9E6DD] bg-white p-5 shadow-sm sm:p-8"
          >
            {pilihanUser === soalAktif.jawabanBenar && <KonfetiRingan />}

            {/* Status Benar / Salah / Waktu Habis */}
            {pilihanUser === soalAktif.jawabanBenar ? (
              <div className="flex items-start gap-3.5 rounded-xl border border-[#A7DFBE] bg-[#ECF9F1] p-4">
                <CheckCircle2
                  className="mt-0.5 h-7 w-7 shrink-0 text-[#1B7F4B]"
                  aria-hidden="true"
                />
                <div>
                  <h1
                    id="judul-umpan-balik"
                    className="font-judul text-xl font-bold text-[#125834]"
                  >
                    MasyaAllah, Jawabanmu Benar!
                  </h1>
                  <p className="mt-1 text-base text-[#18291F]">
                    Kamu mendapatkan{' '}
                    <strong className="angka-tabular text-[#1B7F4B]">
                      +{riwayat[riwayat.length - 1]?.poin ?? POIN_BENAR} poin
                    </strong>
                    {riwayat[riwayat.length - 1]?.bonusKecepatan ? (
                      <span> (termasuk +5 bonus kecepatan!)</span>
                    ) : null}
                  </p>
                </div>
              </div>
            ) : waktuHabis ? (
              <div className="flex items-start gap-3.5 rounded-xl border border-[#F5C2C7] bg-[#FEF2F2] p-4">
                <Clock
                  className="mt-0.5 h-7 w-7 shrink-0 text-[#B91C1C]"
                  aria-hidden="true"
                />
                <div>
                  <h1
                    id="judul-umpan-balik"
                    className="font-judul text-xl font-bold text-[#991B1B]"
                  >
                    Waktu Habis (0 Poin)
                  </h1>
                  <p className="mt-1 text-base text-[#18291F]">
                    Tetap semangat! Pelajari pembahasannya di bawah agar makin paham
                    di ronde berikutnya.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3.5 rounded-xl border border-[#F5C2C7] bg-[#FEF2F2] p-4">
                <XCircle
                  className="mt-0.5 h-7 w-7 shrink-0 text-[#B91C1C]"
                  aria-hidden="true"
                />
                <div>
                  <h1
                    id="judul-umpan-balik"
                    className="font-judul text-xl font-bold text-[#991B1B]"
                  >
                    Belum Tepat (0 Poin)
                  </h1>
                  <p className="mt-1 text-base text-[#18291F]">
                    Tidak apa-apa, belajar adalah proses. Yuk simak jawaban yang tepat
                    dan alasannya!
                  </p>
                </div>
              </div>
            )}

            {/* Jawaban Benar & Pembahasan */}
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-[#E6EFE9] bg-[#F9FCFA] p-4">
                <p className="text-sm font-bold text-[#1B7F4B]">Jawaban yang Tepat:</p>
                <p className="mt-1 text-base font-semibold text-[#18291F]">
                  {hurufPilihan[soalAktif.jawabanBenar]}.{' '}
                  {soalAktif.pilihan[soalAktif.jawabanBenar]}
                </p>
                <p className="mt-3 text-sm font-bold text-[#125834]">
                  Pembahasan Singkat:
                </p>
                <p className="mt-1 text-base leading-relaxed text-[#4B5E52]">
                  {soalAktif.pembahasan}
                </p>
              </div>

              {/* Dalil & Pesan Akhlak Relevan */}
              {(() => {
                const dalil = DATA_DALIL[soalAktif.idDalil];
                return (
                  <div className="rounded-xl border border-[#EADCA6] bg-[#FFFDF4] p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#125834]">
                      <BookOpen className="h-4 w-4 text-[#1B7F4B]" aria-hidden="true" />
                      <span>
                        Dalil &amp; Pesan Akhlak · {dalil.sumber}
                      </span>
                    </div>
                    <p
                      dir="rtl"
                      lang="ar"
                      className="font-arab mt-3 text-right text-2xl text-[#125834]"
                    >
                      {dalil.teksArab}
                    </p>
                    <p className="mt-2 text-base leading-relaxed text-[#18291F]">
                      “{dalil.arti}”
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1B7F4B]">
                      Pesan akhlak: {dalil.pesanAkhlak}
                    </p>
                    <p className="mt-2 text-xs italic text-[#4B5E52]">
                      Guru dapat memverifikasi kutipan dalil sebelum dipakai di kelas.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={lanjutSetelahUmpanBalik}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B7F4B] px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#125834] sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
              >
                <span>
                  {ronde >= TOTAL_RONDE
                    ? 'Lihat Refleksi & Evaluasi'
                    : 'Putar Lagi'}
                </span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------
            HALAMAN 6: REFLEKSI & EVALUASI
            ---------------------------------------------------------------- */}
        {halaman === 'refleksi' && (
          <section
            aria-labelledby="judul-refleksi"
            className="rounded-2xl border border-[#D9E6DD] bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-col gap-4 border-b border-[#E6EFE9] pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1B7F4B]">
                  Evaluasi 10 Ronde Selesai
                </p>
                <h1
                  id="judul-refleksi"
                  className="mt-1 font-judul text-2xl font-bold text-[#125834] sm:text-3xl"
                >
                  Hasil Belajar &amp; Refleksi Diri
                </h1>
              </div>

              <div className="rounded-xl border border-[#EADCA6] bg-[#FFF8E7] px-5 py-3 text-left sm:text-right">
                <div className="text-xs font-semibold text-[#4B5E52]">
                  SKOR AKHIR
                </div>
                <div className="font-judul text-3xl font-bold text-[#125834] angka-tabular">
                  {skor}{' '}
                  <span className="text-base font-normal text-[#4B5E52]">
                    / {skorMaksimal}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#1B7F4B]">
                  {riwayat.filter((r) => r.benar).length} dari {TOTAL_RONDE} soal
                  benar
                </div>
              </div>
            </div>

            {/* Rincian Skor per Kategori */}
            <div className="mt-6">
              <h2 className="font-judul text-lg font-bold text-[#125834]">
                Rincian Skor per Kategori
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rincianPerKategori.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#E6EFE9] bg-[#F9FCFA] p-4"
                  >
                    <div className="font-judul text-base font-bold text-[#18291F]">
                      {item.ikon} {item.id}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-sm text-[#4B5E52] angka-tabular">
                      <span>
                        {item.jumlahSoal > 0
                          ? `${item.jumlahBenar}/${item.jumlahSoal} benar`
                          : 'Belum terpilih roda'}
                      </span>
                      <span className="font-bold text-[#1B7F4B]">
                        {item.totalPoin} poin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Pertanyaan Refleksi */}
            <form
              className="mt-8 space-y-5 border-t border-[#E6EFE9] pt-6"
              onSubmit={(e) => {
                e.preventDefault();
                setHalaman('penutup');
              }}
            >
              <div>
                <h2 className="font-judul text-lg font-bold text-[#125834]">
                  Refleksi Sikap Pelajar Muslim (3 Pertanyaan)
                </h2>
                <p className="mt-1 text-sm text-[#4B5E52]">
                  Tuliskan pendapat pribadimu secara singkat dan jujur sebelum
                  mengakhiri permainan.
                </p>
              </div>

              <div>
                <label
                  htmlFor="refleksi-1"
                  className="block text-base font-semibold text-[#18291F]"
                >
                  1. Apa yang akan kamu lakukan jika temanmu mengajak ikut tawuran
                  atau membalas ejekan dengan kekerasan?
                </label>
                <textarea
                  id="refleksi-1"
                  rows={2}
                  value={refleksi1}
                  onChange={(e) => setRefleksi1(e.target.value)}
                  placeholder="Contoh: Saya akan menolak dengan sopan, mengingatkan bahayanya, dan melapor ke guru BK..."
                  className="mt-2 w-full rounded-xl border border-[#D9E6DD] bg-[#FAFDFB] p-3 text-base text-[#18291F] placeholder:text-[#788A7E] focus:border-[#1B7F4B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="refleksi-2"
                  className="block text-base font-semibold text-[#18291F]"
                >
                  2. Menurutmu, apa perbedaan terpenting antara perkelahian biasa dan
                  tawuran pelajar?
                </label>
                <textarea
                  id="refleksi-2"
                  rows={2}
                  value={refleksi2}
                  onChange={(e) => setRefleksi2(e.target.value)}
                  placeholder="Contoh: Perkelahian biasanya spontan dan sedikit orang, sedangkan tawuran massal dan sering terencana..."
                  className="mt-2 w-full rounded-xl border border-[#D9E6DD] bg-[#FAFDFB] p-3 text-base text-[#18291F] placeholder:text-[#788A7E] focus:border-[#1B7F4B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="refleksi-3"
                  className="block text-base font-semibold text-[#18291F]"
                >
                  3. Sikap Islami apa (tabayyun, menahan amarah, memaafkan, atau
                  islah) yang paling ingin kamu biasakan mulai hari ini?
                </label>
                <textarea
                  id="refleksi-3"
                  rows={2}
                  value={refleksi3}
                  onChange={(e) => setRefleksi3(e.target.value)}
                  placeholder="Contoh: Saya ingin membiasakan tabayyun dan menahan amarah sebelum berkomentar..."
                  className="mt-2 w-full rounded-xl border border-[#D9E6DD] bg-[#FAFDFB] p-3 text-base text-[#18291F] placeholder:text-[#788A7E] focus:border-[#1B7F4B] focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B7F4B] px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#125834] sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
                >
                  <span>Lanjut ke Penutup</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ----------------------------------------------------------------
            HALAMAN 7: PENUTUP
            ---------------------------------------------------------------- */}
        {halaman === 'penutup' && (
          <section
            aria-labelledby="judul-penutup"
            className="rounded-2xl border border-[#D9E6DD] bg-white p-6 text-center shadow-sm sm:p-10"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ECF9F1] text-[#1B7F4B]">
              <Award className="h-11 w-11" aria-hidden="true" />
            </div>

            <p className="mt-5 text-sm font-semibold text-[#1B7F4B]">
              Alhamdulillah · Sesi Pembelajaran Tuntas
            </p>
            <h1
              id="judul-penutup"
              className="mt-2 font-judul text-2xl font-bold text-[#125834] sm:text-3xl"
            >
              Jadilah Pelajar SMK Pembawa Damai
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#4B5E52]">
              Kehebatan sejati seorang murid SMK tidak diukur dari adu fisik atau
              ikut-ikutan tawuran, melainkan dari kecakapan menjaga lisan,
              menahan amarah, mengutamakan tabayyun, dan menjadi penebar kedamaian
              di sekolah maupun masyarakat.
            </p>

            {/* Ringkasan pencapaian & komitmen siswa jika refleksi diisi */}
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-[#EADCA6] bg-[#FFF8E7] p-5 text-left">
              <div className="flex items-center justify-between border-b border-[#EADCA6] pb-3">
                <span className="font-semibold text-[#18291F]">
                  Total Skor Kamu
                </span>
                <span className="font-judul text-xl font-bold text-[#125834] angka-tabular">
                  {skor} poin
                </span>
              </div>

              {(refleksi1.trim() || refleksi2.trim() || refleksi3.trim()) && (
                <div className="mt-3 space-y-2 text-sm text-[#18291F]">
                  <p className="font-bold text-[#125834]">
                    Catatan Komitmenmu:
                  </p>
                  {refleksi1.trim() && (
                    <p>
                      <span className="font-semibold">Menolak ajakan tawuran:</span>{' '}
                      {refleksi1}
                    </p>
                  )}
                  {refleksi3.trim() && (
                    <p>
                      <span className="font-semibold">Sikap Islami pilihan:</span>{' '}
                      {refleksi3}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-3 text-sm italic text-[#4B5E52]">
                “Semoga Allah senantiasa menjaga langkah kita dalam ilmu, akhlak
                mulia, dan keselamatan.”
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => mulaiSesiBaru('roda')}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#1B7F4B] px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#125834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                <span>Main Lagi</span>
              </button>

              <button
                type="button"
                onClick={() => setHalaman('beranda')}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-[#1B7F4B] bg-white px-7 py-3.5 text-base font-bold text-[#125834] transition-colors hover:bg-[#F3FAF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
              >
                <Home className="h-5 w-5" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ====================================================================
          FOOTER RINGKAS
          ==================================================================== */}
      <footer className="border-t border-[#E6EFE9] bg-white/80 py-4 text-center text-sm text-[#4B5E52]">
        <div className="mx-auto max-w-4xl px-4">
          Roda Keberuntungan Islami · Media Edukasi PAI &amp; Budi Pekerti SMK
          Kelas XI
        </div>
      </footer>

      {/* ====================================================================
          MODAL MODE GURU: DAFTAR LENGKAP BANK SOAL & KUNCI JAWABAN
          ==================================================================== */}
      {bukaModeGuru && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-mode-guru"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#D9E6DD] bg-white shadow-xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between gap-4 border-b border-[#E6EFE9] px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="judul-mode-guru"
                  className="font-judul text-xl font-bold text-[#125834]"
                >
                  Mode Guru · Bank Soal &amp; Kunci Jawaban
                </h2>
                <p className="text-sm text-[#4B5E52]">
                  Total {BANK_SOAL.length} soal (dapat diedit langsung pada array{' '}
                  <code className="font-mono text-xs">BANK_SOAL</code>).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBukaModeGuru(false)}
                aria-label="Tutup Mode Guru"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#D9E6DD] bg-white text-[#18291F] hover:bg-[#F6FBF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F4B]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Filter Kategori */}
            <div className="flex flex-wrap gap-2 border-b border-[#E6EFE9] bg-[#F9FCFA] px-5 py-3 sm:px-6">
              {(['Semua', ...KATEGORI_RODA.map((k) => k.id)] as const).map(
                (kat) => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setFilterKategoriGuru(kat)}
                    className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                      filterKategoriGuru === kat
                        ? 'bg-[#1B7F4B] text-white'
                        : 'border border-[#D9E6DD] bg-white text-[#18291F] hover:border-[#1B7F4B]'
                    }`}
                  >
                    {kat}
                  </button>
                )
              )}
            </div>

            {/* Daftar Soal */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#EADCA6] bg-[#FFFDF4] p-3.5 text-sm text-[#4B5E52]">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7F4B]"
                  aria-hidden="true"
                />
                <span>
                  Guru dapat memverifikasi kutipan dalil sebelum dipakai di kelas.
                </span>
              </div>

              {soalGuruTersaring.map((soal, idx) => (
                <article
                  key={soal.id}
                  className="rounded-xl border border-[#E6EFE9] bg-[#FAFDFB] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#1B7F4B]">
                    <span>
                      Soal #{idx + 1} · {soal.kategori}
                    </span>
                    <span className="text-[#4B5E52]">
                      Dalil: {DATA_DALIL[soal.idDalil].sumber}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-judul text-base font-bold text-[#18291F]">
                    {soal.pertanyaan}
                  </h3>
                  <ul className="mt-2.5 space-y-1.5 text-sm">
                    {soal.pilihan.map((pil, pIdx) => {
                      const iniKunci = pIdx === soal.jawabanBenar;
                      return (
                        <li
                          key={pIdx}
                          className={`rounded-lg px-3 py-2 ${
                            iniKunci
                              ? 'border border-[#A7DFBE] bg-[#ECF9F1] font-bold text-[#125834]'
                              : 'text-[#4B5E52]'
                          }`}
                        >
                          {hurufPilihan[pIdx]}. {pil}{' '}
                          {iniKunci ? ' (Kunci Jawaban)' : ''}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2.5 text-sm text-[#4B5E52]">
                    <strong className="text-[#125834]">Pembahasan:</strong>{' '}
                    {soal.pembahasan}
                  </p>
                </article>
              ))}
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end border-t border-[#E6EFE9] px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setBukaModeGuru(false)}
                className="min-h-[48px] rounded-xl bg-[#1B7F4B] px-6 py-2.5 text-base font-bold text-white hover:bg-[#125834] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#125834]"
              >
                Tutup Mode Guru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Nilai awal (seed) indikator per kode program, hasil riset di PERENCANAAN.md §2.
// Guru/koordinator bebas menambah, mengubah, atau menghapusnya lewat menu Indikator.

export type TemplateSeed = {
  teks: string;
  teks_terjemahan?: string | null;
};

export type IndikatorSeed = {
  nama: string;
  nama_terjemahan?: string;
  nama_arab?: string;
  keterangan: string;
  templates?: Record<"A" | "B" | "C" | "D", TemplateSeed>;
};

const KSM_SEED: IndikatorSeed[] = [
  {
    nama: "Penguasaan Konsep",
    keterangan: "Pemahaman materi inti bidang",
    templates: {
      A: { teks: "Menunjukkan penguasaan yang sangat baik dalam memahami konsep dan materi inti bidang kompetisi." },
      B: { teks: "Menunjukkan penguasaan yang baik dalam memahami konsep dan materi inti bidang kompetisi." },
      C: { teks: "Menunjukkan penguasaan yang cukup baik dalam materi inti, namun perlu penguatan pada topik lanjutan." },
      D: { teks: "Masih perlu bimbingan intensif dalam memahami konsep-konsep dasar bidang kompetisi." },
    },
  },
  {
    nama: "Pemecahan Masalah (HOTS)",
    keterangan: "Analisis, penalaran, dan soal non-rutin",
    templates: {
      A: { teks: "Menunjukkan kemampuan yang sangat baik dalam menganalisis, bernalar, dan memecahkan soal-soal non-rutin (HOTS)." },
      B: { teks: "Menunjukkan kemampuan yang baik dalam memecahkan soal-soal penalaran dan masalah non-rutin." },
      C: { teks: "Menunjukkan kemampuan yang cukup baik dalam memecahkan masalah, namun butuh pembiasaan pada soal tingkat tinggi." },
      D: { teks: "Masih perlu bimbingan dalam teknik analisis dan pemecahan masalah bertingkat tinggi." },
    },
  },
  {
    nama: "Integrasi Sains–Keislaman",
    keterangan: "Menghubungkan konsep sains dengan nilai/teks keislaman",
    templates: {
      A: { teks: "Menunjukkan pemahaman yang sangat baik dalam mengintegrasikan konsep keilmuan dengan nilai dan dalil keislaman." },
      B: { teks: "Menunjukkan pemahaman yang baik dalam menghubungkan konsep materi dengan konteks keislaman." },
      C: { teks: "Menunjukkan pemahaman yang cukup baik dalam integrasi keilmuan dan keislaman." },
      D: { teks: "Masih perlu bimbingan dalam mengaitkan konsep keilmuan dengan nilai-nilai dan teks keislaman." },
    },
  },
  {
    nama: "Ketelitian & Manajemen Waktu",
    keterangan: "Akurasi dan kecepatan saat simulasi",
    templates: {
      A: { teks: "Menunjukkan ketelitian dan manajemen waktu yang sangat baik serta akurasi tinggi selama simulasi." },
      B: { teks: "Menunjukkan ketelitian dan pembagian waktu yang baik dalam menyelesaikan tugas simulasi." },
      C: { teks: "Menunjukkan ketelitian yang cukup baik, namun perlu lebih cermat dalam manajemen waktu pengerjaan." },
      D: { teks: "Masih perlu bimbingan dalam menjaga ketelitian hitungan serta efisiensi waktu pengerjaan." },
    },
  },
  {
    nama: "Hasil Try Out / Simulasi",
    keterangan: "Rata-rata skor try out selama semester",
    templates: {
      A: { teks: "Meraih capaian hasil try out dan simulasi yang sangat memuaskan secara konsisten." },
      B: { teks: "Meraih capaian hasil try out dan simulasi yang baik dan stabil." },
      C: { teks: "Meraih capaian try out yang cukup baik dan berpotensi untuk terus ditingkatkan." },
      D: { teks: "Hasil try out masih perlu peningkatan dan evaluasi materi secara mendalam." },
    },
  },
  {
    nama: "Keaktifan Pembinaan",
    keterangan: "Kehadiran dan keaktifan di sesi pembinaan",
    templates: {
      A: { teks: "Menunjukkan kedisiplinan kehadiran dan keaktifan yang sangat tinggi selama sesi pembinaan." },
      B: { teks: "Menunjukkan kehadiran dan keaktifan yang baik dalam mengikuti pembinaan." },
      C: { teks: "Cukup aktif dalam mengikuti pembinaan, perlu meningkatkan inisiatif bertanya dan berdiskusi." },
      D: { teks: "Masih perlu peningkatan kedisiplinan kehadiran dan keaktifan dalam program pembinaan." },
    },
  },
];

const RISET_SEED: IndikatorSeed[] = [
  {
    nama: "Identifikasi Masalah & Orisinalitas",
    keterangan: "Kepekaan melihat masalah dan kebaruan ide",
    templates: {
      A: { teks: "Menunjukkan kepekaan yang sangat baik dalam mengidentifikasi masalah penelitian dan menghasilkan ide yang orisinal." },
      B: { teks: "Menunjukkan kemampuan yang baik dalam merumuskan masalah penelitian yang menarik dan relevan." },
      C: { teks: "Menunjukkan kemampuan yang cukup baik dalam menemukan masalah penelitian, namun perlu penajaman fokus." },
      D: { teks: "Masih perlu bimbingan dalam mengidentifikasi permasalahan dan orisinalitas gagasan penelitian." },
    },
  },
  {
    nama: "Kajian Pustaka",
    keterangan: "Mencari dan memakai referensi yang relevan",
    templates: {
      A: { teks: "Menunjukkan kemampuan yang sangat baik dalam menelusuri, memilah, dan mengkaji referensi pustaka yang kredibel." },
      B: { teks: "Menunjukkan kemampuan yang baik dalam menggunakan referensi yang relevan untuk mendukung penelitian." },
      C: { teks: "Menunjukkan kemampuan yang cukup baik dalam telaah pustaka, namun referensi perlu diperluas." },
      D: { teks: "Masih perlu bimbingan dalam mencari dan mengutip sumber referensi ilmiah yang sesuai." },
    },
  },
  {
    nama: "Metodologi",
    keterangan: "Ketepatan rancangan dan prosedur penelitian",
    templates: {
      A: { teks: "Menunjukkan pemahaman yang sangat baik dalam merancang metodologi penelitian yang tepat dan sistematis." },
      B: { teks: "Menunjukkan rancangan prosedur penelitian yang baik dan terarah sesuai kaidah ilmiah." },
      C: { teks: "Menunjukkan pemahaman metodologi yang cukup baik, namun memerlukan penyempurnaan alur kerja." },
      D: { teks: "Masih perlu bimbingan dalam menentukan rancangan metode dan prosedur penelitian." },
    },
  },
  {
    nama: "Pengumpulan & Analisis Data",
    keterangan: "Ketelitian mengambil dan mengolah data",
    templates: {
      A: { teks: "Menunjukkan ketelitian yang sangat tinggi dalam pengumpulan data dan analisis yang mendalam serta objektif." },
      B: { teks: "Menunjukkan ketelitian yang baik dalam mengumpulkan dan mengolah data penelitian." },
      C: { teks: "Menunjukkan kemampuan yang cukup baik dalam pengumpulan data, namun analisis perlu diperdalam." },
      D: { teks: "Masih perlu bimbingan dalam teknik pengumpulan dan pengolahan data penelitian." },
    },
  },
  {
    nama: "Penulisan Ilmiah",
    keterangan: "Sistematika, koherensi, dan teknik penulisan",
    templates: {
      A: { teks: "Menunjukkan sistematika penulisan laporan ilmiah yang sangat rapi, koheren, dan sesuai kaidah tata tulis." },
      B: { teks: "Menunjukkan teknik penulisan karya ilmiah yang baik dan tersusun secara runtut." },
      C: { teks: "Menunjukkan penulisan yang cukup baik, namun perlu perbaikan pada koherensi paragraf dan format penulisan." },
      D: { teks: "Masih perlu bimbingan dalam menyusun laporan penelitian yang sesuai dengan format karya tulis ilmiah." },
    },
  },
  {
    nama: "Presentasi & Penguasaan Materi",
    keterangan: "Kepercayaan diri, etika, dan kemampuan menjawab pertanyaan",
    templates: {
      A: { teks: "Menunjukkan kepercayaan diri yang sangat baik, penguasaan materi yang matang, dan lugas dalam menjawab pertanyaan." },
      B: { teks: "Menunjukkan presentasi yang baik, komunikatif, dan mampu menjelaskan hasil penelitian dengan jelas." },
      C: { teks: "Menunjukkan penampilan presentasi yang cukup baik, namun perlu meningkatkan penguasaan materi saat tanya jawab." },
      D: { teks: "Masih perlu bimbingan dalam membangun kepercayaan diri dan teknik mempresentasikan karya ilmiah." },
    },
  },
  {
    nama: "Kolaborasi & Etika Penelitian",
    keterangan: "Kerja tim dan kejujuran ilmiah",
    templates: {
      A: { teks: "Menunjukkan kerja sama tim yang sangat solid serta menjunjung tinggi etika dan kejujuran ilmiah." },
      B: { teks: "Menunjukkan kolaborasi yang baik dengan tim serta menghargai etika dalam proses riset." },
      C: { teks: "Menunjukkan partisipasi yang cukup baik dalam kerja tim, perlu peningkatan inisiatif kerja bersama." },
      D: { teks: "Masih perlu bimbingan dalam etika penelitian, kejujuran ilmiah, dan kontribusi kerja tim." },
    },
  },
];

export const INDIKATOR_DEFAULT: Record<string, IndikatorSeed[]> = {
  ING: [
    {
      nama: "Fluency",
      nama_terjemahan: "Kelancaran",
      keterangan: "Kelancaran berbicara, jeda/keraguan, alur ujaran",
      templates: {
        A: {
          teks: "Demonstrates excellent fluency in speech with natural pacing and minimal hesitation.",
          teks_terjemahan: "Menunjukkan kelancaran berbicara yang sangat baik dengan tempo alami dan sedikit jeda.",
        },
        B: {
          teks: "Demonstrates good fluency in speech with occasional pauses.",
          teks_terjemahan: "Menunjukkan kelancaran berbicara yang baik dengan jeda sesekali.",
        },
        C: {
          teks: "Shows fair fluency in speech but often hesitates or searches for words.",
          teks_terjemahan: "Menunjukkan kelancaran berbicara yang cukup baik namun sering ragu atau mencari kata.",
        },
        D: {
          teks: "Needs improvement in speaking fluency and continuous speech flow.",
          teks_terjemahan: "Masih perlu bimbingan dalam kelancaran berbicara dan kesinambungan alur ujaran.",
        },
      },
    },
    {
      nama: "Grammar",
      nama_terjemahan: "Tata Bahasa",
      keterangan: "Ketepatan dan variasi struktur kalimat",
      templates: {
        A: {
          teks: "Demonstrates excellent grammatical accuracy and uses varied sentence structures effectively.",
          teks_terjemahan: "Menunjukkan ketepatan tata bahasa yang sangat baik dan menggunakan variasi struktur kalimat secara efektif.",
        },
        B: {
          teks: "Demonstrates good grammatical accuracy with minor errors that do not impede communication.",
          teks_terjemahan: "Menunjukkan ketepatan tata bahasa yang baik dengan kesalahan kecil yang tidak mengganggu komunikasi.",
        },
        C: {
          teks: "Shows fair grammatical control but makes noticeable errors in complex structures.",
          teks_terjemahan: "Menunjukkan penguasaan tata bahasa yang cukup baik namun masih melakukan kesalahan pada struktur yang kompleks.",
        },
        D: {
          teks: "Needs improvement in basic grammatical structures and sentence construction.",
          teks_terjemahan: "Masih perlu bimbingan dalam penguasaan struktur dasar tata bahasa dan penyusunan kalimat.",
        },
      },
    },
    {
      nama: "Vocabulary",
      nama_terjemahan: "Kosakata",
      keterangan: "Keluasan dan ketepatan pilihan kata",
      templates: {
        A: {
          teks: "Demonstrates an extensive and precise vocabulary across various communicative contexts.",
          teks_terjemahan: "Menunjukkan penguasaan kosakata yang sangat luas dan tepat dalam berbagai konteks komunikasi.",
        },
        B: {
          teks: "Demonstrates a good range of vocabulary with appropriate word choices.",
          teks_terjemahan: "Menunjukkan penguasaan kosakata yang baik dengan pilihan kata yang sesuai.",
        },
        C: {
          teks: "Shows fair vocabulary usage but relies on basic and repetitive words.",
          teks_terjemahan: "Menunjukkan penggunaan kosakata yang cukup baik namun masih mengandalkan kata-kata dasar yang berulang.",
        },
        D: {
          teks: "Needs improvement in building vocabulary to express ideas effectively.",
          teks_terjemahan: "Masih perlu bimbingan dalam memperkaya kosakata untuk mengungkapkan gagasan secara efektif.",
        },
      },
    },
    {
      nama: "Pronunciation",
      nama_terjemahan: "Pelafalan",
      keterangan: "Pelafalan, intonasi, word stress, kejelasan",
      templates: {
        A: {
          teks: "Demonstrates excellent and clear pronunciation with natural intonation and word stress.",
          teks_terjemahan: "Menunjukkan pelafalan yang sangat baik dan jelas dengan intonasi serta penekanan kata yang alami.",
        },
        B: {
          teks: "Demonstrates good pronunciation with generally clear speech and intonation.",
          teks_terjemahan: "Menunjukkan pelafalan yang baik dengan kejelasan ucapan dan intonasi yang baik.",
        },
        C: {
          teks: "Shows fair pronunciation; some words require effort to understand.",
          teks_terjemahan: "Menunjukkan pelafalan yang cukup baik; beberapa kata masih memerlukan usaha untuk dipahami.",
        },
        D: {
          teks: "Needs improvement in pronouncing words correctly and clearly.",
          teks_terjemahan: "Masih perlu bimbingan dalam melafalkan kata-kata dengan tepat dan jelas.",
        },
      },
    },
    {
      nama: "Comprehension",
      nama_terjemahan: "Pemahaman",
      keterangan: "Memahami teks/ujaran lalu merespons dengan tepat",
      templates: {
        A: {
          teks: "Demonstrates excellent comprehension of spoken and written texts, responding accurately and promptly.",
          teks_terjemahan: "Menunjukkan pemahaman yang sangat baik terhadap teks lisan maupun tulis, serta merespons dengan tepat dan cepat.",
        },
        B: {
          teks: "Demonstrates good comprehension of texts and responds appropriately in most situations.",
          teks_terjemahan: "Menunjukkan pemahaman yang baik terhadap teks dan merespons dengan tepat pada sebagian besar situasi.",
        },
        C: {
          teks: "Shows fair comprehension of texts but sometimes needs repetition or clarification to respond.",
          teks_terjemahan: "Menunjukkan pemahaman teks yang cukup baik namun terkadang membutuhkan pengulangan atau klarifikasi untuk merespons.",
        },
        D: {
          teks: "Needs improvement in comprehending texts and formulating appropriate responses.",
          teks_terjemahan: "Masih perlu bimbingan dalam memahami isi teks dan menyusun respons yang tepat.",
        },
      },
    },
  ],
  ARB: [
    {
      nama: "Maharah Istima'",
      nama_arab: "مهارة الاستماع",
      keterangan: "Memahami ujaran/teks lisan berbahasa Arab",
      templates: {
        A: {
          teks: "يُظْهِرُ قُدْرَةً مُمْتَازَةً عَلَى فَهْمِ النُّصُوصِ المَسْمُوعَةِ وَاسْتِيعَابِ المَعَانِي بِدِقَّةٍ.",
          teks_terjemahan: "Menunjukkan kemampuan yang sangat baik dalam memahami teks simakan dan menyerap makna secara akurat.",
        },
        B: {
          teks: "يُظْهِرُ قُدْرَةً جَيِّدَةً جِدًّا عَلَى فَهْمِ النُّصُوصِ المَسْمُوعَةِ وَالتَّفَاعُلِ مَعَهَا.",
          teks_terjemahan: "Menunjukkan kemampuan yang baik dalam memahami teks simakan dan berinteraksi dengannya.",
        },
        C: {
          teks: "يُظْهِرُ قُدْرَةً مَقْبُولَةً عَلَى فَهْمِ النُّصُوصِ المَسْمُوعَةِ مَعَ الحَاجَةِ إِلَى تَكْرَارٍ.",
          teks_terjemahan: "Menunjukkan kemampuan yang cukup dalam memahami teks simakan dengan perlunya pengulangan.",
        },
        D: {
          teks: "يَحْتَاجُ إِلَى مَزِيدٍ مِنَ التَّدْرِيبِ وَالإِرْشَادِ فِي فَهْمِ النُّصُوصِ المَسْمُوعَةِ.",
          teks_terjemahan: "Masih memerlukan bimbingan dan latihan lebih dalam memahami teks simakan.",
        },
      },
    },
    {
      nama: "Maharah Kalam (Muhadatsah)",
      nama_arab: "مهارة الكلام",
      keterangan: "Berbicara: kelancaran, ketepatan, respons dalam dialog",
      templates: {
        A: {
          teks: "يُظْهِرُ طَلَاقَةً وَقُدْرَةً مُمْتَازَةً عَلَى التَّحَدُّثِ وَالمُحَادَثَةِ بِعِبَارَاتٍ سَلِيمَةٍ.",
          teks_terjemahan: "Menunjukkan kelancaran dan kemampuan yang sangat baik dalam berbicara dan bercakap-cakap dengan ungkapan yang benar.",
        },
        B: {
          teks: "يُظْهِرُ قُدْرَةً جَيِّدَةً جِدًّا عَلَى التَّعْبِيرِ الشَّفَهِيِّ وَالمُشَارَكَةِ فِي الحِوَارِ.",
          teks_terjemahan: "Menunjukkan kemampuan yang baik dalam mengungkapkan gagasan secara lisan dan berpartisipasi dalam dialog.",
        },
        C: {
          teks: "يُظْهِرُ قُدْرَةً مَقْبُولَةً عَلَى التَّحَدُّثِ مَعَ بَعْضِ التَّرَدُّدِ أَثْنَاءِ الكَلَامِ.",
          teks_terjemahan: "Menunjukkan kemampuan yang cukup dalam berbicara dengan sedikit keraguan saat berbicara.",
        },
        D: {
          teks: "يَحْتَاجُ إِلَى تَشْجِيعٍ وَمُمَارَسَةٍ مُسْتَمِرَّةٍ لِتَطْوِيرِ مَهَارَةِ الكَلَامِ.",
          teks_terjemahan: "Masih memerlukan dorongan dan latihan berkesinambungan untuk mengembangkan keterampilan berbicara.",
        },
      },
    },
    {
      nama: "Maharah Qira'ah",
      nama_arab: "مهارة القراءة",
      keterangan: "Membaca teks: ketepatan baca, harakat, dan pemahaman isi",
      templates: {
        A: {
          teks: "يُظْهِرُ قُدْرَةً مُمْتَازَةً عَلَى قِرَاءَةِ النُّصُوصِ بِضَبْطِ الشَّكْلِ وَفَهْمِ مَضَامِينِهَا.",
          teks_terjemahan: "Menunjukkan kemampuan yang sangat baik dalam membaca teks dengan harakat yang tepat dan memahami kandungannya.",
        },
        B: {
          teks: "يُظْهِرُ قُدْرَةً جَيِّدَةً جِدًّا عَلَى القِرَاءَةِ السَّلِيمَةِ وَفَهْمِ الفِكْرَةِ الرَّئِيسِيَّةِ.",
          teks_terjemahan: "Menunjukkan kemampuan yang baik dalam membaca secara tepat dan memahami ide pokok teks.",
        },
        C: {
          teks: "يُظْهِرُ قُدْرَةً مَقْبُولَةً عَلَى القِرَاءَةِ مَعَ وُجُودِ بَعْضِ الأَخْطَاءِ فِي الحَرَكَاتِ.",
          teks_terjemahan: "Menunjukkan kemampuan yang cukup dalam membaca dengan beberapa kekeliruan pada harakat.",
        },
        D: {
          teks: "يَحْتَاجُ إِلَى إِرْشَادٍ فِي صِحَّةِ القِرَاءَةِ وَضَبْطِ الكَلِمَاتِ وَفَهْمِ النَّصِّ.",
          teks_terjemahan: "Masih memerlukan bimbingan dalam ketepatan membaca, penerapan harakat kata, dan pemahaman teks.",
        },
      },
    },
    {
      nama: "Maharah Kitabah (Insya')",
      nama_arab: "مهارة الكتابة",
      keterangan: "Menulis kalimat/paragraf: imla' dan susunan kalimat",
      templates: {
        A: {
          teks: "يُظْهِرُ قُدْرَةً مُمْتَازَةً عَلَى الكِتَابَةِ الصَّحِيحَةِ وَتَأْلِيفِ الجُمَلِ بِأُسْلُوبٍ وَاضِحٍ.",
          teks_terjemahan: "Menunjukkan kemampuan yang sangat baik dalam menulis secara benar dan menyusun kalimat dengan gaya bahasa yang jelas.",
        },
        B: {
          teks: "يُظْهِرُ قُدْرَةً جَيِّدَةً جِدًّا عَلَى تَرْكِيبِ الجُمَلِ وَالكِتَابَةِ الإِمْلائِيَّةِ السَّلِيمَةِ.",
          teks_terjemahan: "Menunjukkan kemampuan yang baik dalam menyusun kalimat dan penulisan imla yang tepat.",
        },
        C: {
          teks: "يُظْهِرُ قُدْرَةً مَقْبُولَةً فِي الكِتَابَةِ مَعَ وُجُودِ أَخْطَاءٍ إِمْلائِيَّةٍ وَتَرْكِيبِيَّةٍ بَسِيطَةٍ.",
          teks_terjemahan: "Menunjukkan kemampuan yang cukup dalam menulis dengan beberapa kesalahan imla dan struktur yang sederhana.",
        },
        D: {
          teks: "يَحْتَاجُ إِلَى تَدْرِيبٍ مُكَثَّفٍ فِي قَوَاعِدِ الإِمْلَاءِ وَبِنَاءِ الجُمَلِ العَرَبِيَّةِ.",
          teks_terjemahan: "Masih memerlukan latihan intensif dalam kaidah imla dan pembentukan kalimat bahasa Arab.",
        },
      },
    },
    {
      nama: "Mufradat",
      nama_arab: "المفردات",
      keterangan: "Penguasaan dan penggunaan kosakata",
      templates: {
        A: {
          teks: "يَمْتَلِكُ ثَرْوَةً لُغَوِيَّةً مُمْتَازَةً مِنَ المُفْرَدَاتِ وَيَسْتَخْدِمُهَا فِي سِيَاقِهَا المُنَاسِبِ.",
          teks_terjemahan: "Memiliki kekayaan kosakata bahasa Arab yang sangat baik dan menggunakannya pada konteks yang sesuai.",
        },
        B: {
          teks: "يَمْتَلِكُ قَدْرًا جَيِّدًا جِدًّا مِنَ المُفْرَدَاتِ وَيُوَظِّفُهَا بِشَكْلٍ صَحِيحٍ.",
          teks_terjemahan: "Memiliki penguasaan kosakata yang baik dan menerapkannya dengan tepat.",
        },
        C: {
          teks: "يَمْتَلِكُ حَصِيلَةً مَقْبُولَةً مِنَ المُفْرَدَاتِ مَعَ تَكْرَارِ الكَلِمَاتِ المَأْلُوفَةِ.",
          teks_terjemahan: "Memiliki perbendaharaan kosakata yang cukup dengan kecenderungan mengulang kata-kata yang sudah lazim.",
        },
        D: {
          teks: "يَحْتَاجُ إِلَى حِفْظِ وَتَوْسِيعِ دَائِرَةِ المُفْرَدَاتِ اللُّغَوِيَّةِ وَاسْتِخْدَامِهَا.",
          teks_terjemahan: "Masih memerlukan bimbingan dalam menghafal dan memperluas perbendaharaan kosakata serta penggunaannya.",
        },
      },
    },
    {
      nama: "Qawa'id",
      nama_arab: "القواعد",
      keterangan: "Penerapan kaidah tata bahasa (nahwu-sharaf)",
      templates: {
        A: {
          teks: "يُظْهِرُ فَهْمًا مُمْتَازًا لِقَوَاعِدِ النَّحْوِ وَالصَّرْفِ وَتَطْبِيقَهَا بِدِقَّةٍ.",
          teks_terjemahan: "Menunjukkan pemahaman yang sangat baik terhadap kaidah nahwu-sharaf dan menerapkannya secara akurat.",
        },
        B: {
          teks: "يُظْهِرُ فَهْمًا جَيِّدًا جِدًّا لِلْقَوَاعِدِ النَّحْوِيَّةِ وَالصَّرْفِيَّةِ فِي التَّطْبِيقِ.",
          teks_terjemahan: "Menunjukkan pemahaman yang baik terhadap kaidah nahwu dan sharaf dalam penerapannya.",
        },
        C: {
          teks: "يُظْهِرُ فَهْمًا مَقْبُولًا لِلْقَوَاعِدِ مَعَ الحَاجَةِ إِلَى مَزِيدٍ مِنَ الضَّبْطِ.",
          teks_terjemahan: "Menunjukkan pemahaman yang cukup terhadap kaidah namun masih memerlukan ketelitian lebih.",
        },
        D: {
          teks: "يَحْتَاجُ إِلَى إِرْشَادٍ مُسْتَمِرٍّ فِي فَهْمِ وَتَطْبِيقِ قَوَاعِدِ النَّحْوِ وَالصَّرْفِ.",
          teks_terjemahan: "Masih memerlukan bimbingan berkelanjutan dalam memahami dan menerapkan kaidah nahwu dan sharaf.",
        },
      },
    },
  ],
  THF: [
    { nama: "Kelancaran Hafalan", keterangan: "Minim tawaqquf, tardid, dan sabqul lisan" },
    { nama: "Tajwid", keterangan: "Hukum nun/mim sukun, mad, ghunnah, waqaf-ibtida'" },
    { nama: "Makharijul Huruf & Sifat Huruf", keterangan: "Ketepatan tempat keluar dan sifat huruf" },
    { nama: "Fashahah", keterangan: "Kefasihan: harakat, panjang-pendek, kejelasan" },
    { nama: "Muraja'ah", keterangan: "Kekuatan dan kekonsistenan menjaga hafalan lama" },
    { nama: "Adab & Kedisiplinan Setoran", keterangan: "Kehadiran, kesiapan, dan adab terhadap Al-Qur'an" },
  ],
  AGM: [
    { nama: "Praktik Ibadah", keterangan: "Wudhu, shalat fardhu/sunnah, tata cara dan bacaan" },
    { nama: "Hafalan Doa & Dzikir Harian", keterangan: "Doa sehari-hari, dzikir ba'da shalat, wirid" },
    { nama: "Pemahaman Fiqih Ibadah", keterangan: "Pemahaman dasar thaharah, shalat, dan puasa" },
    { nama: "Baca Kitab", keterangan: "Membaca dan memahami kitab dasar sesuai kurikulum" },
    { nama: "Khithabah / Muhadharah", keterangan: "Kemampuan menyampaikan ceramah singkat" },
    { nama: "Akhlak & Adab", keterangan: "Adab kepada guru, teman, dan lingkungan" },
    { nama: "Kedisiplinan Ibadah", keterangan: "Shalat berjamaah, kehadiran kegiatan keagamaan" },
    {
      nama: "Qiroat",
      keterangan: "Kaidah bacaan qiraat dan seni tilawah Al-Qur'an",
      templates: {
        A: { teks: "Menunjukkan penguasaan yang sangat baik dalam kaidah bacaan qiraat dan seni tilawah Al-Qur'an." },
        B: { teks: "Menunjukkan penguasaan yang baik dalam bacaan qiraat dan seni tilawah Al-Qur'an." },
        C: { teks: "Menunjukkan penguasaan yang cukup baik dalam bacaan qiraat, namun perlu memperhalus lagu dan makhraj." },
        D: { teks: "Masih perlu bimbingan dalam penerapan kaidah dasar qiraat dan irama tilawah Al-Qur'an." },
      },
    },
  ],
  "KSM-MAT": KSM_SEED,
  "KSM-IPA": KSM_SEED,
  "KSM-IPS": KSM_SEED,
  "RST-AGM": RISET_SEED,
  "RST-HUM": RISET_SEED,
  "RST-SNS": RISET_SEED,
};

/** Kalimat default "Menunjukkan penguasaan ... dalam {keterangan}" (PERENCANAAN.md §4.1). Hanya untuk program berbahasa Indonesia. */
export function templateFormulaId(keterangan: string): Record<"A" | "B" | "C" | "D", string> {
  const materi = keterangan.charAt(0).toLowerCase() + keterangan.slice(1);
  return {
    A: `Menunjukkan penguasaan yang sangat baik dalam ${materi}.`,
    B: `Menunjukkan penguasaan yang baik dalam ${materi}.`,
    C: `Menunjukkan penguasaan yang cukup baik dalam ${materi}.`,
    D: `Masih perlu bimbingan dalam ${materi}.`,
  };
}

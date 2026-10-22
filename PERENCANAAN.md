# Perencanaan Aplikasi Rapor Program Unggulan
### MTs KH. A. Wahab Muhsin

> Status: **Fase 0–8 (seluruh roadmap inti §12) sudah ditulis.** Belum ada migrasi dari Fase 4 ke atas yang dijalankan user, jadi belum ada tes manual end-to-end. Dokumen ini acuan waktu pengerjaan; item "Lanjutan" di §12 (portal ortu, log setoran harian, notifikasi WA) belum dikerjakan.
> Progres kode: Fase 0–6 ditulis lengkap (lihat riwayat commit/migrasi untuk detail tiap fase; beberapa migrasi masih menunggu dijalankan user). Fase 7 (Rapor & Cetak) sudah ditulis: tabel `rapor` (status draft→review→disetujui→terkunci, snapshot JSONB, kode_verifikasi), perhitungan nilai akhir/predikat di `src/lib/rapor/hitung.ts` (TypeScript murni + unit test, BUKAN fungsi Postgres — supaya bisa di-unit-test seperti engine.ts), komponen cetak A4 (`src/components/rapor/`: KopRapor yang sudah ada sejak Fase 0, + TabelIndikator, TabelHafalan, BlokTandaTangan dinamis 1-3 guru, Watermark), QR code (`qrcode` npm), halaman `/rapor` (daftar program) → `/rapor/[kode]` (status per peserta) → `/rapor/[kode]/[pesertaId]` (pratinjau A4 + alur kerja), dan `/cetak/[kode]` (halaman cetak massal A4 tanpa sidebar, di luar route group dashboard). Lolos tsc/lint/vitest (18/18), menunggu migrasi `20261021080000_rapor.sql` (dan semua migrasi Fase 6 sebelumnya) dijalankan + tes manual.
>
> **Disengaja berbeda dari rencana awal / masih disederhanakan (lihat memori project untuk alasan lengkap):**
> - Prestasi/Proyek/Kehadiran jadi tab `/program/[kode]/...`, bukan rute terpisah `/ksm/...`/`/riset/...`.
> - `audit_log` dan halaman publik `/verifikasi/[kode]` BELUM dibuat — itu eksplisit masuk Fase 8 di roadmap §12, bukan Fase 7. `kode_verifikasi` & QR sudah dibuat di Fase 7, tapi link-nya belum bisa dibuka sampai Fase 8.
> - Tabel hafalan cetak masih 1 kolom biasa, belum "2 kolom berdampingan" / mode ringkas per §5.2a.
> - Watermark cetak baru teks diagonal, belum logo besar transparan di tengah.
> - Belum ada tombol admin buat "tambah program baru" via UI (10 program tetap, diseed via migrasi) — sesuai scope Fase 2, bukan utang Fase 7.
>
> **Fase 8 (Leger & Polish) SELESAI juga:** Leger Excel (`/leger` + `/api/leger`, sheet Rekap + per-program + THF Ringkas/Detail, ExcelJS dengan header hijau muda/border/freeze panes/rotasi teks header/warna merah muda di bawah KKTP/peringkat otomatis), dashboard progres per program (`/dashboard`, menggantikan checklist fase developer yang tadinya di situ), halaman publik `/verifikasi/[kode]` (RPC Postgres `security definer` khusus, cuma expose data aman), audit_log (trigger otomatis tiap perubahan status rapor + catat tiap unduhan leger). Lolos tsc/lint/vitest (18/18).
> Stack: **Next.js (App Router, TypeScript) + shadcn/ui + Supabase**, tampilan putih bersih.

## ✅ Keputusan yang Sudah Disepakati

| # | Topik | Keputusan |
|---|---|---|
| 1 | Kepesertaan | **Tidak semua siswa ikut semua program.** Peserta dipilih per siswa per program, lintas kelas (satu kelas bisa punya beberapa siswa saja yang ikut program tertentu) |
| 2 | Bentuk rapor | **Terpisah per program.** Satu siswa yang ikut 3 program mendapat 3 lembar rapor |
| 3 | Bahasa B. Inggris | Deskripsi **berbahasa Inggris**, dengan **terjemahan bahasa Indonesia dicetak miring (italic)** di bawahnya |
| 4 | Kertas | **A4**. Kop madrasah berupa gambar yang akan diberikan (diunggah di menu Pengaturan) |
| 5 | Tanda tangan | **1–3 guru koordinator program** + **Kepala Madrasah selalu paling bawah** (layout di §5.2) |
| 6 | Periode | **Per semester saja** (tidak ada rapor tengah semester) |
| 7 | Bahasa B. Arab | **Sama dengan B. Inggris**: deskripsi **berbahasa Arab** + terjemahan Indonesia *italic* di bawahnya |
| 8 | Tahfidz | **Laporan per surat**: dikelompokkan per juz, surat dipilih lewat dropdown, dan setiap surat diberi nilai. Bisa banyak juz (misal 5 juz) |
| 9 | KSM | Dipecah jadi **3 program**: KSM Matematika, KSM IPA, KSM IPS, masing-masing dengan **guru sendiri** |
| 10 | Riset | Dipecah jadi **3 program**: Riset Keagamaan, Riset Humaniora, Riset Sains, masing-masing dengan **guru sendiri** |
| 11 | Hafalan tahfidz | **Kumulatif**: rapor menampilkan semua hafalan sejak awal, dan surat yang baru disetor semester ini diberi tanda |
| 12 | Nilai per surat | **Cukup 1 angka** per surat. Kualitas bacaan dinilai lewat indikator umum |
| 13 | Nilai akhir Tahfidz | **60% rata-rata hafalan + 40% indikator kualitas** |
| 14 | Predikat | **A–D**, dengan **label Arab** (Mumtaz, Jayyid Jiddan, Jayyid, Maqbul) untuk B. Arab dan Tahfidz |
| 15 | Foto & TTD ortu | **Tanpa foto siswa** dan **tanpa tanda tangan orang tua** |
| 16 | Konfigurasi | Tanggal rapor, nama & NIP Kepala Madrasah, kota, dan kop diatur di **halaman Pengaturan**. File kop menyusul |
| 17 | Gaya rapor | **Meniru rapor reguler madrasah** (`7.1.pdf`): kop 2 logo, identitas 2 kolom, tabel *Capaian Hasil Belajar* bergaris hitam, kalimat *"Menunjukkan penguasaan yang … dalam …"*, Prestasi, Ketidakhadiran, Catatan, watermark, QR, footer. **Tanpa TTD orang tua** (§5) |
| 18 | Leger | Admin bisa **mengunduh leger nilai dalam format Excel (.xlsx)** (lihat §8, *Leger Excel*) |

---

## 1. Ringkasan Konsep

Rapor ini terpisah dari rapor reguler (RDM/e-Rapor). Isinya hasil belajar di **6 rumpun Program Unggulan** yang dipecah menjadi **10 program**. **Setiap program punya rapor, guru, dan penanda tangannya sendiri.** Siswa hanya menerima rapor untuk program yang ia ikuti.

| Rumpun | Program | Kode | Jenis modul | Bahasa rapor |
|---|---|---|---|---|
| Bahasa Inggris | Bahasa Inggris | `ING` | Standar | EN + terjemah ID |
| Bahasa Arab | Bahasa Arab | `ARB` | Standar | AR + terjemah ID |
| Tahfidz | Tahfidz Al-Qur'an | `THF` | **Hafalan per surat** + indikator kualitas | ID |
| Keagamaan | Keagamaan | `AGM` | Standar | ID |
| **KSM** | KSM Matematika | `KSM-MAT` | Standar + prestasi lomba | ID |
| | KSM IPA | `KSM-IPA` | Standar + prestasi lomba | ID |
| | KSM IPS | `KSM-IPS` | Standar + prestasi lomba | ID |
| **Riset** | Riset Keagamaan | `RST-AGM` | Standar + data proyek | ID |
| | Riset Humaniora | `RST-HUM` | Standar + data proyek | ID |
| | Riset Sains | `RST-SNS` | Standar + data proyek | ID |

**Kenapa KSM & Riset dipecah jadi program sendiri, bukan "bidang"?** Karena gurunya berbeda. Dengan dipecah, setiap guru otomatis punya daftar peserta, indikator, template deskripsi, penanda tangan, dan rapor sendiri, tanpa logika khusus. Rumpun hanya dipakai untuk pengelompokan di menu, dashboard, dan judul rapor (misal *"KSM — Matematika"*). Indikator default diambil dari rumpunnya, lalu tiap guru bebas menyesuaikan.

**Alur utama:**

```
Admin/koordinator memilih peserta tiap program (lintas kelas)
   → guru isi nilai per indikator (0–100)
   → sistem tentukan predikat (A/B/C/D) per indikator
   → sistem ambil template deskripsi indikator sesuai predikat
   → sistem rangkai deskripsi naratif (+ terjemahan bila program bilingual)
   → guru cek dan boleh edit → disetujui → dikunci
   → dicetak: 1 lembar rapor per siswa per program
```

**Model kepesertaan:**
```
Kelas VIII-A (30 siswa)
 ├─ Ahmad   → B. Inggris, Tahfidz
 ├─ Budi    → (tidak ikut program unggulan)
 ├─ Citra   → B. Arab, KSM Matematika, Riset Sains
 └─ ...
Program B. Inggris → peserta: Ahmad (VIII-A), Dina (VIII-B), Eko (VII-C), ...
                     dibagi ke kelompok/halaqah bila perlu
```

**Fitur kunci:** indikator di **semua program** bisa ditambah, dihapus, diubah urutannya, dan diberi bobot oleh guru. Setiap indikator punya 4 template deskripsi (satu per predikat), jadi deskripsi rapor tersusun otomatis tapi tetap bisa diubah.

---

## 2. Hasil Riset: Indikator Default per Program

Indikator di bawah ini hanya **nilai awal (seed)**. Guru bebas menambah dan mengurangi lewat menu *Program → Indikator*.

### 2.1 Bahasa Inggris (sesuai permintaan)
Mengacu pada pola rubrik speaking analitik (mirip kriteria IELTS: *fluency & coherence, lexical resource, grammatical range & accuracy, pronunciation*), ditambah *comprehension*.

| Indikator | Yang dinilai |
|---|---|
| **Fluency** | Kelancaran berbicara, jeda/keraguan, alur ujaran |
| **Grammar** | Ketepatan dan variasi struktur kalimat |
| **Vocabulary** | Keluasan dan ketepatan pilihan kata |
| **Pronunciation** | Pelafalan, intonasi, *word stress*, kejelasan |
| **Comprehension** | Memahami teks/ujaran lalu merespons dengan tepat |

*Usulan opsional (nonaktif secara default):* Writing, Listening, Confidence/Public Speaking.

### 2.2 Bahasa Arab (usulan hasil riset)
Kajian pembelajaran bahasa Arab di MTs (termasuk buku Kemenag kelas VII) memakai **4 maharah**: istima', kalam, qira'ah, kitabah. Program unggulan biasanya juga menilai **unsur bahasa** (mufradat dan qawa'id) secara terpisah.

| Indikator | Nama Arab | Yang dinilai |
|---|---|---|
| **Maharah Istima'** | مهارة الاستماع | Memahami ujaran/teks lisan berbahasa Arab |
| **Maharah Kalam** (Muhadatsah) | مهارة الكلام | Berbicara: kelancaran, ketepatan, respons dalam dialog |
| **Maharah Qira'ah** | مهارة القراءة | Membaca teks: ketepatan baca, harakat, dan pemahaman isi |
| **Maharah Kitabah** (Insya') | مهارة الكتابة | Menulis kalimat/paragraf: imla' dan susunan kalimat |
| **Mufradat** | المفردات | Penguasaan dan penggunaan kosakata |
| **Qawa'id** (Nahwu-Sharaf) | القواعد | Penerapan kaidah tata bahasa |

*Usulan opsional:* Tarjamah (terjemah), Khithabah/Muhadharah (pidato bahasa Arab), Mahfuzhat.

### 2.3 Tahfidz Al-Qur'an
Penelitian penilaian tahfidz di pesantren/madrasah memakai dua kelompok aspek: **kualitas bacaan** (makharijul huruf, sifat huruf, tajwid, fashahah) dan **kualitas hafalan** (kesalahan hafalan seperti *tawaqquf*/berhenti, *tardid*/mengulang, dan *sabqul lisan*/salah ucap).

**A. Indikator kualitas (dinilai 0–100):**

| Indikator | Yang dinilai |
|---|---|
| **Kelancaran Hafalan** | Minim *tawaqquf*, *tardid*, dan *sabqul lisan* |
| **Tajwid** | Hukum nun/mim sukun, mad, ghunnah, waqaf-ibtida' |
| **Makharijul Huruf & Sifat Huruf** | Ketepatan tempat keluar dan sifat huruf |
| **Fashahah** | Kefasihan: harakat, panjang-pendek, kejelasan |
| **Muraja'ah** | Kekuatan dan kekonsistenan menjaga hafalan lama |
| **Adab & Kedisiplinan Setoran** | Kehadiran, kesiapan, dan adab terhadap Al-Qur'an |

**B. Laporan hafalan per surat (sesuai keputusan):**

Guru menginput hafalan dengan alur **Juz → Surat → Nilai**:

```
[ Juz ▼ 30 ]  [ Surat ▼ An-Naba' (1–40) ]  [ Ayat 1 s/d 40 ]  [ Nilai 92 ]  [+ Tambah]
```

- **Dropdown surat otomatis menyesuaikan juz** yang dipilih (data 114 surat + pembagian juz disimpan sebagai master data Al-Qur'an).
- **Surat yang terpotong lintas juz** (misal Al-Baqarah di Juz 1–3) muncul di setiap juz yang memuatnya, dengan rentang ayat sesuai juz itu. Kalau baru hafal sebagian, guru bisa mengisi rentang ayatnya.
- **Tidak ada batas jumlah juz.** Siswa dengan 5 juz atau lebih tetap tertampung.
- Ada tombol **"Tambah 1 juz penuh"** yang otomatis mengisi semua surat dalam juz itu, jadi guru tinggal mengisi nilainya.
- Setiap surat mendapat nilai 0–100 dan predikat otomatis.

**Hafalan bersifat kumulatif (sesuai keputusan):**
- Hafalan melekat ke **siswa**, bukan ke semester. Setiap baris mencatat **semester saat disetor**.
- Rapor semester X menampilkan **semua hafalan yang disetor sampai semester X**. Surat yang disetor **semester ini** diberi tanda **(baru)**.
- Kalau surat lama diuji ulang (muraja'ah) dan nilainya diperbarui, rapor semester lalu **tidak berubah** karena sudah tersimpan sebagai snapshot saat dikunci.
- Siswa yang pindah halaqah atau berganti guru tetap membawa seluruh riwayat hafalannya.

**Rekap otomatis di rapor:** total kumulatif (jumlah juz penuh/sebagian, surat, ayat), **tambahan semester ini**, dan **rata-rata nilai hafalan**.

**Nilai akhir Tahfidz** = **60% rata-rata nilai seluruh surat (kumulatif)** + **40% rata-rata indikator kualitas**. Bobot ini tetap bisa diubah di pengaturan program.

### 2.4 Keagamaan
Instrumen praktik ibadah di MTs/SMP umumnya menilai praktik wudhu dan shalat secara rinci, hafalan doa, dan sikap (akhlak), dengan observasi dan rubrik.

| Indikator | Yang dinilai |
|---|---|
| **Praktik Ibadah** | Wudhu, shalat fardhu/sunnah, tata cara dan bacaan |
| **Hafalan Doa & Dzikir Harian** | Doa sehari-hari, dzikir ba'da shalat, wirid |
| **Pemahaman Fiqih Ibadah** | Pemahaman dasar thaharah, shalat, dan puasa |
| **Baca Kitab** | Membaca dan memahami kitab dasar (sesuai kurikulum pondok/madrasah) |
| **Khithabah / Muhadharah** | Kemampuan menyampaikan ceramah singkat |
| **Akhlak & Adab** | Adab kepada guru, teman, dan lingkungan |
| **Kedisiplinan Ibadah** | Shalat berjamaah, kehadiran kegiatan keagamaan |

### 2.5 KSM — Matematika, IPA, IPS (3 program terpisah)
> ⚠️ **Catatan riset:** sejak 2025 KSM berganti nama menjadi **Olimpiade Madrasah Indonesia (OMI)**. Menurut satu sumber, bidang jenjang MTs pada OMI 2025 adalah Matematika, IPA, dan Fisika Terintegrasi. Edisi sebelumnya memakai Matematika, IPA, dan IPS Terpadu Terintegrasi. Madrasah memakai **Matematika, IPA, IPS**. Karena setiap bidang adalah program biasa, bidang baru (misal Fisika) cukup ditambah lewat menu tanpa mengubah kode.

Ketiga program memakai indikator default yang sama di bawah ini, lalu **tiap guru bebas menyesuaikan** indikator programnya sendiri:

| Indikator | Yang dinilai |
|---|---|
| **Penguasaan Konsep** | Pemahaman materi inti bidang |
| **Pemecahan Masalah (HOTS)** | Analisis, penalaran, dan soal non-rutin |
| **Integrasi Sains–Keislaman** | Menghubungkan konsep sains dengan nilai/teks keislaman (ciri khas soal KSM) |
| **Ketelitian & Manajemen Waktu** | Akurasi dan kecepatan saat simulasi |
| **Hasil Try Out / Simulasi** | Rata-rata skor try out selama semester |
| **Keaktifan Pembinaan** | Kehadiran dan keaktifan di sesi pembinaan |

**Data tambahan:** riwayat lomba (nama lomba, tingkat: madrasah/kab/prov/nasional, peringkat).

### 2.6 Riset — Keagamaan, Humaniora, Sains (3 program terpisah)
Pembagian ini **sejalan dengan bidang MYRES** (Ilmu Keagamaan; Sosial & Humaniora; Sains, Matematika & Teknologi). Ketiga program memakai indikator default yang sama, lalu tiap guru menyesuaikan.

Indikator diturunkan dari aspek penilaian **MYRES** (*Madrasah Young Researchers Super Camp*, Kemenag), yaitu proposal, presentasi, dan laporan, yang dirangkum untuk level MTs. Sumber yang sama menekankan bahwa **penilaian berfokus pada proses penelitian, bukan hasil**.

| Indikator | Yang dinilai |
|---|---|
| **Identifikasi Masalah & Orisinalitas** | Kepekaan melihat masalah dan kebaruan ide |
| **Kajian Pustaka** | Mencari dan memakai referensi yang relevan |
| **Metodologi** | Ketepatan rancangan dan prosedur penelitian |
| **Pengumpulan & Analisis Data** | Ketelitian mengambil dan mengolah data |
| **Penulisan Ilmiah** | Sistematika, koherensi, dan teknik penulisan |
| **Presentasi & Penguasaan Materi** | Kepercayaan diri, etika, dan kemampuan menjawab pertanyaan |
| **Kolaborasi & Etika Penelitian** | Kerja tim dan kejujuran ilmiah |

**Data tambahan:** judul penelitian, tahap (proposal → pengambilan data → laporan → presentasi), dan lomba yang diikuti. Bidang dan pembimbing otomatis mengikuti program dan gurunya.

---

## 3. Skala Nilai & Predikat

Kurikulum madrasah (KMA 1503/2025, perubahan KMA 450/2024) **tidak mengunci** skala predikat untuk program tambahan. Jadi skalanya dibuat **bisa diatur**, dengan default:

| Predikat | Rentang | Label umum | Label Inggris | Label Arab |
|---|---|---|---|---|
| **A** | 90–100 | Sangat Baik | Excellent | ممتاز *Mumtaz* |
| **B** | 80–89 | Baik | Good | جيد جدا *Jayyid Jiddan* |
| **C** | 70–79 | Cukup | Fair | جيد *Jayyid* |
| **D** | < 70 | Perlu Bimbingan | Needs Improvement | مقبول *Maqbul* |

- **Label yang dipakai di rapor:** B. Inggris → label Inggris, **B. Arab & Tahfidz → label Arab** (ditulis Arab + Latin, misal ممتاز *Mumtaz*), program lain → label umum.
- **Nilai akhir program** = rata-rata berbobot dari nilai indikator (bobot default sama, bisa diubah guru). Khusus Tahfidz: 60% hafalan + 40% kualitas.
- Batas ketuntasan (KKTP) bisa diatur per program.

---

## 4. Mesin Deskripsi Otomatis (inti aplikasi)

Mesin deskripsi menghasilkan **dua lapis** teks, mengikuti format rapor reguler madrasah:

| Lapis | Tempat di rapor | Isi |
|---|---|---|
| **1. Capaian Kompetensi per indikator** | Kolom *Capaian Kompetensi* di setiap baris tabel | Satu kalimat per indikator sesuai predikatnya |
| **2. Catatan Guru Program** | Kotak *Catatan Guru Program* | Rangkuman naratif (kekuatan → yang perlu ditingkatkan → saran). Dibuat otomatis sebagai draf, lalu guru bebas mengubahnya |

### 4.1 Template per indikator × predikat
Setiap indikator punya 4 kalimat template, plus 1 **saran tindak lanjut** untuk predikat C/D.

**Gaya kalimat default mengikuti rapor reguler madrasah:**

| Predikat | Pola kalimat (ID) |
|---|---|
| A | *Menunjukkan penguasaan yang **sangat baik** dalam {materi indikator}* |
| B | *Menunjukkan penguasaan yang **baik** dalam {materi indikator}* |
| C | *Menunjukkan penguasaan yang **cukup baik** dalam {materi indikator}* |
| D | *Masih **perlu bimbingan** dalam {materi indikator}* |

`{materi indikator}` diisi guru per indikator (misal *"berbicara lancar dan runtut dalam percakapan sehari-hari"*). Guru juga boleh menulis kalimat bebas per predikat.

Contoh versi Inggris untuk indikator **Fluency**:

| Predikat | Template |
|---|---|
| A | *speaks fluently and naturally with minimal hesitation* |
| B | *speaks fairly fluently with occasional pauses* |
| C | *speaks with frequent pauses and hesitation* |
| D | *still has difficulty speaking continuously* |
| Saran | *practice daily speaking routines such as storytelling and conversation drills* |

### 4.2 Cara merangkai Catatan Guru Program (lapis 2)
Indikator dikelompokkan berdasarkan predikat, lalu dirangkai mengikuti pola deskripsi Kurikulum Merdeka: **yang sudah dikuasai → yang perlu ditingkatkan → tindak lanjut**.

> **Contoh draf otomatis (B. Inggris):**
> *"Ahmad shows excellent ability in Fluency and Vocabulary, and good ability in Grammar and Comprehension. He needs improvement in Pronunciation. It is recommended to practice minimal pairs and shadowing native audio regularly."*

### 4.3 Deskripsi bilingual (B. Inggris & B. Arab)
Setiap template di program bilingual punya **dua kolom teks**: utama (English) dan terjemahan (Indonesia). Mesin merangkai keduanya dengan struktur yang sama, jadi terjemahannya selalu sejajar dengan teks Inggris.

| Predikat | Teks utama (EN) | Terjemahan (ID) |
|---|---|---|
| A | *speaks fluently and naturally with minimal hesitation* | *berbicara dengan lancar dan alami dengan sedikit keraguan* |
| B | *speaks fairly fluently with occasional pauses* | *berbicara cukup lancar dengan sesekali jeda* |

**Hasil cetak:**
> Ahmad shows excellent ability in Fluency and Vocabulary, and good ability in Grammar and Comprehension. He needs improvement in Pronunciation. It is recommended to practice shadowing native audio regularly.
>
> *Ahmad menunjukkan kemampuan sangat baik dalam Fluency dan Vocabulary, serta baik dalam Grammar dan Comprehension. Ahmad perlu peningkatan dalam Pronunciation. Disarankan untuk rutin berlatih shadowing audio penutur asli.*

**Contoh hasil cetak B. Arab** (teks Arab rata kanan/RTL, terjemahan rata kiri):

> <div dir="rtl">الطالب أحمد ممتاز في مهارة الكلام والمفردات، وجيد جدا في مهارة القراءة ومهارة الاستماع، ويحتاج إلى التحسين في القواعد ومهارة الكتابة. ويُنصح بالإكثار من تدريبات تركيب الجمل وفق القواعد النحوية.</div>
>
> *Ananda Ahmad sangat baik (mumtaz) dalam Maharah Kalam dan Mufradat, baik sekali dalam Maharah Qira'ah dan Istima', dan perlu peningkatan dalam Qawa'id dan Maharah Kitabah. Disarankan memperbanyak latihan menyusun kalimat sesuai kaidah nahwu.*

- Nama indikator juga bisa diberi terjemahan, misalnya **Fluency** *(Kelancaran)* atau **مهارة الكلام** *(Maharah Kalam)*.
- Bilingual adalah **pengaturan per program** (`bahasa_utama` + `tampilkan_terjemahan`). Aktif untuk B. Inggris dan B. Arab.
- Kalau guru mengedit deskripsi manual, kedua teks (utama & terjemahan) bisa diedit terpisah.

**Catatan teknis B. Arab:**
- Teks Arab dirender dengan `dir="rtl"` dan font **Amiri / Noto Naskh Arabic**, baik di layar maupun di cetakan.
- Kata sambung dan predikat versi Arab disiapkan di mesin: ممتاز، جيد جدا، جيد، مقبول, serta penghubung "و", "، " dan "ويحتاج إلى التحسين في".
- Sapaan memakai **الطالب** (putra) atau **الطالبة** (putri) sesuai data jenis kelamin. Nama siswa ditulis dalam huruf Arab jika tersedia (kolom opsional `nama_arab` di data siswa); kalau tidak ada, sapaan dipakai tanpa nama.
- Editor template punya input khusus RTL supaya guru nyaman mengetik huruf Arab.

### 4.4 Aturan
- **Bahasa deskripsi diatur per program** (B. Inggris → EN + terjemah, B. Arab → AR + terjemah, lainnya → Indonesia). Placeholder: `{nama}`, `{panggilan}` (Ananda / الطالب), `{indikator}`.
- Kata ganti netral ("Ananda"/nama) supaya tidak salah gender. Untuk English dan Arab, kata ganti diambil dari data jenis kelamin.
- Guru bisa **override** deskripsi akhir. Sistem menandai "diedit manual" dan menyediakan tombol *"Generate ulang"*.
- Template default disediakan untuk semua indikator seed, termasuk versi Arab dan Inggris beserta terjemahannya. Guru tinggal menyesuaikan.
- **Tahfidz:** deskripsi juga menyebut capaian hafalan, misalnya *"Ananda Ahmad telah menghafal 2 juz (Juz 30 dan 29) sebanyak 48 surat dengan rata-rata nilai 89 (Baik). ..."*, lalu dilanjutkan rangkaian indikator kualitas.

---

## 5. Format Rapor (Desain Cetak)

> **Acuan:** contoh rapor reguler madrasah (`7.1.pdf`, e-Rapor TP 2024/2025). Rapor Program Unggulan **meniru gaya visual rapor reguler** supaya terasa satu keluarga dokumen, dengan penyesuaian: **tanpa TTD orang tua**, **tanpa ekstrakurikuler/kenaikan kelas**, dan **tanpa foto**.

**Satu dokumen A4 portrait per siswa per program**, umumnya 1–2 halaman.

### 5.1 Elemen visual yang diambil dari rapor reguler

| Elemen | Rapor reguler | Rapor Program Unggulan |
|---|---|---|
| **Kop** | Logo Kemenag (kiri) + logo madrasah (kanan), teks tengah: *KEMENTERIAN AGAMA REPUBLIK INDONESIA* / **MTSS KH.A.WAHAB MUHSIN SUKAHIDENG** (serif tebal) / alamat *italic*, lalu garis bawah | **Sama.** Kop dirender sebagai HTML dari Pengaturan (2 logo + baris teks), jadi tajam saat dicetak. Opsi upload gambar kop jadi tetap tersedia |
| **Identitas** | 2 kolom: Nama, NIS/NISN, Madrasah, Alamat \| Kelas, Fase, Semester, Tahun Ajaran | **Sama**, ditambah baris **Program** (misal *KSM — Matematika*) dan **Kelompok** (jika ada) |
| **Judul** | **CAPAIAN HASIL BELAJAR** (tebal, tengah) | **CAPAIAN HASIL BELAJAR** + subjudul nama program |
| **Tabel nilai** | Garis hitam tipis, kolom *Mata Pelajaran \| Nilai Akhir \| Capaian Kompetensi*, baris **Jumlah** | Kolom **No \| Indikator \| Nilai \| Predikat \| Capaian Kompetensi**, baris **Jumlah**, **Rata-rata / Nilai Akhir** |
| **Kalimat capaian** | *"Menunjukkan penguasaan yang [sangat baik / baik / cukup baik] dalam …"* | **Gaya kalimat yang sama dijadikan template default** (lihat §4) |
| **Prestasi** | Tabel *No \| Jenis Prestasi \| Keterangan* | **Sama** (semua program, terutama KSM & Riset) |
| **Ketidakhadiran** | Sakit / Izin / Alpa … Hari | **Sama**, khusus kehadiran di pembinaan program |
| **Catatan** | Kotak *Catatan Pendidik* | Kotak **Catatan Guru Program** |
| **Watermark** | Teks diagonal berulang *"\* MTsS KH. A. Wahab Muhsin Sukahideng \*"* hijau muda + logo besar transparan di tengah | **Sama** (teks & logo watermark diatur di Pengaturan, bisa dimatikan) |
| **QR** | QR kiri bawah dengan logo di tengahnya | **Sama**, mengarah ke `/verifikasi/[kode]` |
| **Footer** | `VII.1 _ NAMA _ NISN` (kiri) · `Halaman n` (kanan) | **Sama**, ditambah kode program: `VII.1 _ NAMA _ NISN _ ING` |
| **TTD** | Orang Tua (kiri) · Wali Kelas (kanan) · Kepala (bawah tengah) | **Tanpa orang tua.** 1–3 guru program + Kepala (lihat §5.3) |
| **Font** | Sans (Arial/Helvetica) untuk isi, serif untuk nama madrasah di kop | **Sama**, ditambah **Amiri** untuk teks Arab |

### 5.2 Tata letak (contoh: B. Inggris)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo        KEMENTERIAN AGAMA REPUBLIK INDONESIA     [Logo   │
│  Kemenag]    MTSS KH.A.WAHAB MUHSIN SUKAHIDENG        Madrasah]│
│              Jl. Makam Pahlawan KHZ. Musthofa ... (italic)     │
│              Kecamatan Sukarame, Kab. Tasikmalaya (italic)     │
│══════════════════════════════════════════════════════════════│
│ NAMA      : ………………………          Kelas        : VII.1             │
│ NIS/NISN  : ……… / ………           Fase         : D                 │
│ Madrasah  : MTsS KH.A.WAHAB…    Semester     : Ganjil            │
│ Program   : Bahasa Inggris      Tahun Ajaran : 2026/2027         │
│──────────────────────────────────────────────────────────────│
│                 CAPAIAN HASIL BELAJAR                         │
│               PROGRAM UNGGULAN BAHASA INGGRIS                 │
│ ┌──┬────────────────┬──────┬──────┬───────────────────────┐   │
│ │No│ Indikator      │Nilai │Pred. │ Capaian Kompetensi    │   │
│ ├──┼────────────────┼──────┼──────┼───────────────────────┤   │
│ │1 │ Fluency        │  92  │  A   │ Shows excellent mastery│   │
│ │  │ (Kelancaran)   │      │      │ in speaking fluently…  │   │
│ │  │                │      │      │ /Menunjukkan penguasaan│ ← italic
│ │  │                │      │      │ yang sangat baik dalam…/│   │
│ │2 │ Grammar        │  85  │  B   │ …                      │   │
│ │… │ …              │  …   │  …   │ …                      │   │
│ ├──┴────────────────┼──────┼──────┼───────────────────────┤   │
│ │ Jumlah            │ 429  │      │                        │   │
│ │ Nilai Akhir       │  86  │  B   │                        │   │
│ └───────────────────┴──────┴──────┴───────────────────────┘   │
│ Prestasi        [No | Jenis Prestasi | Keterangan]            │
│ Ketidakhadiran  [Sakit … Hari | Izin … Hari | Alpa … Hari]    │
│ Catatan Guru Program  [kotak teks]                            │
│                                                               │
│                              [Kota], [tanggal rapor]          │
│        [ BLOK TANDA TANGAN — lihat §5.3 ]                     │
│ [QR]                                                          │
│ VII.1 _ NAMA _ NISN _ ING                          Halaman 1  │
└──────────────────────────────────────────────────────────────┘
        (watermark teks diagonal + logo transparan di belakang)
```

**Bagian khusus per jenis program:**
- **B. Arab:** kolom *Capaian Kompetensi* berisi teks Arab (RTL, font Amiri) + terjemahan *italic*. Nama indikator ditulis Arab + Latin, dan predikat memakai label Arab (ممتاز *Mumtaz*, dst.).
- **Tahfidz:** tabel hafalan per surat ditempatkan sebelum tabel indikator kualitas (lihat §5.2a).
- **KSM (Mat/IPA/IPS):** identitas *Program: KSM — Matematika*. Prestasi lomba masuk ke tabel Prestasi.
- **Riset (Agm/Hum/Sains):** baris tambahan di identitas: **Judul Penelitian** dan **Tahap**.

### 5.2a Rapor Tahfidz (laporan per surat, kumulatif)

```
│                 CAPAIAN HASIL BELAJAR                          │
│               PROGRAM UNGGULAN TAHFIDZ AL-QUR'AN               │
│ A. Capaian Hafalan                                             │
│ ┌──┬─────┬───────────────────────┬────────┬──────┬────────┐    │
│ │No│ Juz │ Surat                 │ Ayat   │Nilai │ Pred.  │    │
│ ├──┼─────┼───────────────────────┼────────┼──────┼────────┤    │
│ │1 │ 30  │ An-Naba'   النبأ       │ 1–40   │  92  │ ممتاز  │    │
│ │2 │     │ An-Nazi'at النازعات    │ 1–46   │  88  │جيد جدا │    │
│ │… │     │ …                     │ …      │  …   │ …      │    │
│ │38│ 29  │ Al-Mulk    الملك  (baru)│ 1–30   │  90  │ ممتاز  │    │
│ └──┴─────┴───────────────────────┴────────┴──────┴────────┘    │
│ Kumulatif: 2 juz · 48 surat · 1.012 ayat · Rata-rata 89        │
│ Tambahan semester ini: Juz 29 (11 surat)                       │
│                                                                │
│ B. Kualitas Bacaan & Hafalan                                   │
│ [No | Indikator | Nilai | Pred. | Capaian Kompetensi]          │
│ Nilai Akhir Tahfidz: 88 (جيد جدا) — 60% hafalan + 40% kualitas  │
```

- **Juz 30 saja sudah 37 surat**, jadi siswa dengan 5 juz bisa punya ratusan baris. Supaya tetap rapi di A4:
  - Tabel hafalan dicetak **2 kolom berdampingan** (kiri/kanan) dengan font sedikit lebih kecil.
  - Kalau masih lebih dari 1 halaman, tabel otomatis berlanjut ke halaman berikutnya dengan **header tabel diulang**, dan blok tanda tangan tetap di halaman terakhir.
  - Alternatif yang bisa dipilih di pengaturan: **mode ringkas**, yaitu juz yang sudah tuntas penuh ditampilkan 1 baris saja ("Juz 30 — 37 surat — rata-rata 90"), sedangkan rincian per surat hanya untuk juz yang sedang berjalan.

### 5.3 Blok Tanda Tangan (dinamis 1–3 guru program, tanpa orang tua)

Setiap program punya daftar **guru penanda tangan (1–3 orang)**, diatur per periode. **Kepala Madrasah selalu ada dan selalu paling bawah.** Tempat & tanggal rapor (dari Pengaturan) dicetak di atas kolom paling kanan, seperti di rapor reguler. Nama ditulis **tebal**, dengan NIP di bawahnya. **QR** ada di kiri bawah.

**1 guru program** → satu baris, kiri–kanan:
```
                                          [Kota], [tanggal rapor]
   Guru Program B. Inggris                Kepala Madrasah



   NAMA GURU 1                            NAMA KEPALA
   NIP. ...                               NIP. ...
[QR]
```

**2 guru program** → 2 guru berdampingan di atas, Kepala di bawah tengah:
```
                                          [Kota], [tanggal rapor]
   Guru Program B. Inggris                Guru Program B. Inggris



   NAMA GURU 1                            NAMA GURU 2
   NIP. ...                               NIP. ...
                           Mengetahui
                         Kepala Madrasah
[QR]


                          NAMA KEPALA
                          NIP. ...
```

**3 guru program** → 3 guru berjajar di atas, Kepala di bawah tengah:
```
                                          [Kota], [tanggal rapor]
   Guru Program           Guru Program           Guru Program



   NAMA GURU 1            NAMA GURU 2            NAMA GURU 3
   NIP. ...               NIP. ...               NIP. ...
                           Mengetahui
                         Kepala Madrasah
[QR]


                          NAMA KEPALA
                          NIP. ...
```

**Implementasi:** komponen `<BlokTandaTangan guru={[...]} kepala={...} />` memakai CSS Grid:
- `guru.length === 1` → `grid-cols-2` (guru kiri, kepala kanan)
- `guru.length === 2` → baris 1 `grid-cols-2`, baris 2 kepala di tengah
- `guru.length === 3` → baris 1 `grid-cols-3`, baris 2 kepala di tengah
- Label jabatan bisa diatur (misal "Koordinator Program", "Guru Tahfidz"), dan gambar TTD/stempel opsional dari Storage.
- Validasi di database: maksimal 3 penanda tangan per program per periode.

---

## 6. Peran Pengguna (Role)

| Role | Hak akses |
|---|---|
| **Admin / Operator** | Semua: master data, tahun ajaran, penugasan, pengaturan, cetak |
| **Koordinator Program Unggulan** | Memantau semua program, mengatur peserta, memfinalkan rapor |
| **Guru Program** (1–3 per program) | Hanya program/kelompok yang ditugaskan: atur indikator & template, input nilai, edit deskripsi & catatan. Guru yang ditandai *penanda tangan* tampil di blok TTD rapor |
| **Kepala Madrasah** | Melihat semua dan menyetujui; tanda tangan digital (gambar TTD) |
| *(Fase lanjut)* Orang tua/Siswa | Melihat rapor lewat link/QR |

Keamanan memakai **Supabase Row Level Security (RLS)**, jadi guru secara teknis tidak bisa mengubah nilai di luar penugasannya, bukan sekadar disembunyikan di UI.

---

## 7. Desain Database (Supabase / PostgreSQL)

```
profiles            (id → auth.users, nama, nip, role, ttd_url)
pengaturan          (nama_madrasah, alamat_madrasah, kota,
                     kop_mode[html|gambar], kop_baris JSONB (teks per baris + gaya),
                     logo_kiri_url (Kemenag), logo_kanan_url (madrasah), kop_url,
                     watermark_aktif, watermark_teks, watermark_logo_url,
                     kepala_nama, kepala_nip, kepala_ttd_url, stempel_url)
fase_tingkat        (tingkat 7/8/9 → fase "D")
periode             (id, tahun_ajaran "2026/2027", semester, aktif, tanggal_rapor)
kelas               (id, periode_id, nama "VIII-A", tingkat)
siswa               (id, nis, nisn, nama, nama_arab NULL, jk)
kelas_siswa         (kelas_id, siswa_id)

rumpun_program      (id, kode, nama, urutan)   -- ING, ARB, THF, AGM, KSM, RST
program             (id, rumpun_id, kode, nama, nama_arab,
                     jenis[standar|tahfidz|ksm|riset],
                     bahasa_utama[id|en|ar], tampilkan_terjemahan bool,
                     judul_rapor, urutan, kktp,
                     bobot_hafalan NULL)       -- khusus tahfidz, default 60
skala_predikat      (id, program_id NULL=global, kode, min, max, label, label_en, label_ar)
indikator           (id, program_id, periode_id, nama, nama_terjemahan, nama_arab,
                     keterangan, bobot, urutan, aktif)
template_deskripsi  (indikator_id, predikat_kode, teks, teks_terjemahan)  -- + kode 'SARAN'

kelompok_program    (id, program_id, periode_id, nama)        -- mis. "Halaqah 1", "English Club A"
peserta_program     (id, periode_id, program_id, siswa_id, kelompok_id NULL)
                     UNIQUE(periode, program, siswa)
penugasan_guru      (guru_id, program_id, periode_id, kelompok_id NULL=semua)
penanda_tangan      (program_id, periode_id, guru_id, label_jabatan, urutan 1–3)
                     -- CHECK maks. 3 per program per periode

nilai               (id, peserta_program_id, indikator_id, nilai 0–100,
                     capaian_override NULL, capaian_override_terjemahan NULL,
                     updated_by, updated_at)   UNIQUE(peserta, indikator)
                     -- capaian per baris = template sesuai predikat, kecuali di-override guru

-- Master data Al-Qur'an (seed sekali, read-only)
quran_surat         (no 1–114, nama_latin, nama_arab, jumlah_ayat)
quran_juz_surat     (juz 1–30, surat_no, ayat_awal, ayat_akhir)
                     -- ±145 baris; surat lintas juz punya beberapa baris

-- Hafalan per surat (KUMULATIF: melekat ke siswa, bukan ke semester)
tahfidz_hafalan     (id, siswa_id, juz, surat_no, ayat_awal, ayat_akhir,
                     nilai 0–100, periode_setor_id, catatan,
                     updated_by, updated_at)
                     UNIQUE(siswa_id, juz, surat_no)
                     -- CHECK rentang ayat valid sesuai quran_juz_surat
                     -- rapor periode X = semua baris dengan periode_setor <= X
                     -- "(baru)" = periode_setor_id = periode rapor

prestasi            (siswa_id, program_id, nama_lomba, tingkat, peringkat, tanggal)
riset_proyek        (peserta_program_id, judul, tahap)
kehadiran_program   (peserta_program_id, hadir, sakit, izin, alpa)

rapor               (id, peserta_program_id UNIQUE, nilai_akhir, predikat,
                     catatan_auto, catatan_auto_terjemahan,      -- draf lapis 2
                     catatan_final, catatan_final_terjemahan, diedit_manual,
                     status[draft|review|disetujui|terkunci],
                     kode_verifikasi, snapshot JSONB, diterbitkan_at)
                     -- 1 baris = 1 lembar rapor (1 siswa × 1 program)
audit_log           (siapa, tabel, aksi, data_lama, data_baru, waktu)
```

**Keputusan desain penting:**
1. **Indikator terikat ke periode (semester).** Di awal semester, indikator semester lalu diklon otomatis. Kalau guru menghapus indikator di semester ini, rapor semester lalu tetap utuh.
2. **Snapshot saat rapor dikunci.** Seluruh isi rapor (nilai, deskripsi + terjemahan, nama indikator, **daftar penanda tangan**) disimpan ke `snapshot JSONB`. Rapor lama tidak berubah walaupun guru/kepala berganti.
3. **`peserta_program` adalah pusat data.** Siswa terdaftar per program, tidak per kelas, jadi bisa lintas kelas dan hanya siswa tertentu. Kelas reguler tetap disimpan untuk identitas di rapor dan filter.
4. **Rapor = 1 siswa × 1 program**, sesuai keputusan rapor terpisah per program. Persetujuan dan penguncian juga per program, jadi rapor Tahfidz bisa terbit duluan walaupun B. Inggris belum selesai.
5. Perhitungan nilai akhir & predikat dibuat sebagai **fungsi Postgres / view**, jadi satu sumber kebenaran untuk UI dan cetak.
6. **Rumpun → Program.** KSM dan Riset masing-masing punya 3 program anak dengan guru, peserta, dan rapor sendiri. RLS bekerja di level program, jadi guru KSM IPA tidak bisa menyentuh nilai KSM Matematika.
7. **Hafalan tahfidz kumulatif per siswa.** Dropdown surat diisi dari `quran_juz_surat` sesuai juz yang dipilih. Hafalan tidak perlu disalin antar semester karena melekat ke siswa, dan rapor lama tetap aman lewat snapshot.

---

## 8. Peta Halaman (Sitemap)

```
/login
/dashboard                       → progres pengisian nilai & status rapor per program
/master
   /periode                      → tahun ajaran & semester aktif
   /kelas
   /siswa                        → CRUD + import Excel
   /guru                         → akun & role
/program                         → daftar per rumpun (KSM ▸ Mat/IPA/IPS, Riset ▸ Agm/Hum/Sains)
   /[kode]                       → detail program
   /[kode]/indikator             → tambah/hapus/urut (drag & drop)/bobot
   /[kode]/template              → editor template deskripsi per predikat (+ terjemahan, input RTL untuk Arab)
   /[kode]/peserta               → PILIH PESERTA lintas kelas, kelompok
   /[kode]/guru                  → guru program & penanda tangan (1–3, urutan)
/nilai/[kode]                    → GRID INPUT NILAI (baris=peserta, kolom=indikator),
                                   filter per kelompok / per kelas
/tahfidz/hafalan                 → daftar peserta tahfidz + ringkasan juz/surat
/tahfidz/hafalan/[pesertaId]     → INPUT HAFALAN: Juz ▼ → Surat ▼ → ayat → nilai
/ksm/[kode]/prestasi
/riset/[kode]/proyek
/kehadiran
/rapor/[kode]                    → daftar rapor satu program: status, review, finalisasi
/rapor/[kode]/[pesertaId]        → preview A4 + edit deskripsi/terjemahan + catatan
/siswa/[id]                      → profil siswa: program yang diikuti + link ke tiap rapornya
/cetak/[kode]?kelompok=&kelas=   → cetak massal satu program (1 rapor per halaman A4)
/leger                           → UNDUH LEGER EXCEL (admin): pilih periode, program, kelas/kelompok
/api/leger                       → route handler yang membuat file .xlsx
/pengaturan                      → KONFIGURASI RAPOR: kop (2 logo + baris teks, atau gambar),
                                   alamat & kota, tanggal rapor per semester, nama & NIP Kepala
                                   Madrasah, TTD/stempel (opsional), watermark, skala predikat & label
                                   + PREVIEW rapor A4 langsung saat mengubah pengaturan
/verifikasi/[kode]               → publik, cek keaslian rapor
```

### Halaman unggulan: Grid Input Nilai
- Tampilan seperti spreadsheet (TanStack Table + input sel), navigasi keyboard (Tab/Enter/panah).
- **Badge predikat** langsung berubah warna saat nilai diketik.
- **Autosave** dengan indikator "Tersimpan ✓".
- Panel samping (shadcn `Sheet`) berisi **preview deskripsi otomatis** siswa yang dipilih.
- **Import/Export Excel** untuk guru yang lebih nyaman mengisi di Excel.
- Validasi 0–100 dan penanda sel kosong.

### Halaman unggulan: Pilih Peserta Program
- Tabel semua siswa dengan filter kelas, centang massal, dan pencarian nama.
- Kolom yang menampilkan **program lain yang sudah diikuti** siswa tersebut.
- Assign kelompok langsung dari tabel. Ada juga import daftar peserta dari Excel (NIS + kode program).
- Tombol **"Salin peserta dari semester lalu"**.

### Halaman unggulan: Leger Excel (khusus Admin)

**Pilihan unduhan:**
- **Periode** (default: semester aktif)
- **Cakupan:** satu program, satu rumpun (misal semua KSM), atau **semua program sekaligus**
- **Filter** kelas / kelompok (opsional)
- **Opsi kolom:** sertakan *Capaian Kompetensi* (teks deskripsi), sertakan *Peringkat*, sertakan *Ketidakhadiran*

**Isi file `.xlsx` (contoh nama file: `Leger_ProgramUnggulan_2026-2027_Ganjil.xlsx`):**

| Sheet | Isi |
|---|---|
| **Rekap** | Baris = semua siswa peserta program unggulan. Kolom = No, NIS, NISN, Nama, Kelas, lalu **nilai akhir tiap program** (kosong jika tidak ikut), jumlah program diikuti, rata-rata |
| **Satu sheet per program** (ING, ARB, AGM, KSM-MAT, …) | Baris = peserta. Kolom = No, NIS, NISN, Nama, Kelas, Kelompok, **nilai tiap indikator** (urutan sesuai indikator), Jumlah, Nilai Akhir, Predikat, Peringkat*, Sakit/Izin/Alpa*, Capaian*, Status rapor |
| **THF — Ringkas** | Peserta tahfidz: jumlah juz (penuh/sebagian), jumlah surat, total ayat, tambahan semester ini, rata-rata hafalan, nilai indikator kualitas, Nilai Akhir (60/40), Predikat |
| **THF — Detail Hafalan** | Satu baris per surat: Nama, Juz, Surat (Latin + Arab), Ayat, Nilai, Predikat, Semester setor, *(baru)* |

\* = kolom opsional

**Format Excel (mengikuti gaya leger madrasah):**
- Kepala sheet: nama madrasah, judul **LEGER NILAI PROGRAM UNGGULAN — [PROGRAM]**, tahun ajaran & semester, lalu nama guru program.
- Header tabel tebal dengan latar hijau muda, **border tipis di semua sel**, header tetap terlihat saat di-scroll (*freeze panes*), lebar kolom otomatis, nama indikator miring 45° jika kolomnya banyak.
- Nilai di bawah KKTP diberi warna merah muda. Baris rata-rata kelas ada di bawah tabel.
- Blok tanda tangan (guru program + Kepala Madrasah) di bawah tabel, siap dicetak. Area cetak disetel ke **A4 landscape**.
- Kolom teks Arab memakai font Arab dan rata kanan.

**Teknis:** dibuat di server dengan **ExcelJS** (mendukung border, warna, merge cell, freeze panes, dan page setup; SheetJS versi gratis tidak bisa styling). Datanya diambil dari view Postgres yang sama dengan rapor, jadi angka di leger **selalu sama** dengan angka di rapor. Rapor yang sudah dikunci diambil dari snapshot. Hanya role **Admin** (dan Kepala/Koordinator, jika diizinkan) yang bisa mengunduh. Setiap unduhan dicatat di `audit_log`.

### Halaman unggulan: Input Hafalan Tahfidz
- Kiri: daftar peserta halaqah. Kanan: hafalan siswa terpilih, dikelompokkan per juz (accordion).
- Form tambah: **Juz** (`Select` 1–30) → **Surat** (`Combobox` berisi surat di juz itu saja, dengan nama Latin + Arab) → **Ayat** (otomatis terisi penuh, bisa diubah untuk hafalan sebagian) → **Nilai**.
- Tombol **"Tambah 1 juz penuh"** mengisi semua surat dalam juz sekaligus, lalu nilai diisi cepat ala grid.
- Validasi: surat tidak boleh dobel di juz yang sama, dan ayat harus berada dalam rentang juz tersebut.
- Rekap langsung terlihat: jumlah juz, jumlah surat, total ayat, dan rata-rata nilai.

---

## 9. Arsitektur Teknis

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components, Server Actions, mudah di-deploy ke Vercel |
| UI | **shadcn/ui + Tailwind CSS** | Komponen bersih, mudah dikustom ke tema putih |
| Ikon | lucide-react | Bawaan shadcn |
| Form & validasi | react-hook-form + zod | Skema validasi dipakai bersama client & server |
| Tabel/grid | TanStack Table | Grid input nilai & daftar data |
| Drag & drop | dnd-kit | Mengurutkan indikator |
| Grafik | Recharts (shadcn charts) | Grafik progres & statistik di dashboard |
| Database/Auth/Storage | **Supabase** (`@supabase/ssr`) | Postgres + RLS + Auth + Storage (logo, foto, TTD) |
| Excel | **ExcelJS** (export leger bergaya) + SheetJS (baca file import) | Leger rapi siap cetak; import siswa/nilai/peserta |
| Cetak/PDF | **Halaman cetak HTML + CSS `@page { size: A4 }`** (fase 1), opsional `@react-pdf/renderer` (fase lanjut) | Hasil cetak sama persis dengan preview; cetak massal satu program sekaligus |
| QR | `qrcode` | QR verifikasi rapor |
| Deploy | Vercel + Supabase Cloud | Gratis/murah untuk skala satu madrasah |

**Struktur folder rencana:**
```
src/
  app/
    (auth)/login/
    (dashboard)/dashboard, master/, program/, nilai/, rapor/, ...
    cetak/[kode]/             ← layout khusus print A4 tanpa sidebar
    verifikasi/[kode]/        ← publik
  components/
    ui/                       ← shadcn
    rapor/                    ← RaporA4, KopRapor, TabelIndikator, DeskripsiBilingual,
                                 BlokTandaTangan, TabelHafalan, KsmPrestasi, RisetInfo
    nilai/                    ← NilaiGrid, PredikatBadge, DeskripsiPreview
    tahfidz/                  ← HafalanForm (Juz ▸ Surat), HafalanAccordion, RekapHafalan
  lib/
    supabase/ (client.ts, server.ts, middleware.ts)
    deskripsi/engine.ts       ← mesin perangkai deskripsi ID/EN/AR (unit-tested)
    quran.ts                  ← helper juz ↔ surat ↔ ayat
    predikat.ts
    validations/
  types/database.ts           ← hasil `supabase gen types`
supabase/
  migrations/                 ← skema + RLS + fungsi
  seed.sql                    ← 6 rumpun, 10 program, indikator & template default,
                                 114 surat + pembagian 30 juz
```

---

## 10. Arah Desain UI ("putih bersih")

- **Latar `#FFFFFF`**, kartu putih dengan border tipis `zinc-200`, tanpa bayangan tebal.
- **Satu warna aksen:** hijau zamrud (emerald-600), cocok dengan identitas madrasah. Dipakai hemat: tombol utama, status aktif, progress.
- **Warna predikat** dibuat lembut: A = emerald, B = sky, C = amber, D = rose (latar pastel + teks gelap).
- Font: **Plus Jakarta Sans / Inter** untuk UI, **Amiri** untuk teks Arab.
- Layout: sidebar kiri yang bisa diciutkan, header dengan pemilih **periode aktif**, dan breadcrumb.
- Banyak ruang kosong, tabel dengan baris longgar, dan *empty state* yang ramah.
- Responsif: guru tetap bisa input nilai dari HP (grid berubah jadi form per siswa).

---

## 11. Alur Kerja Satu Semester

```
1. Admin    : buka periode baru → indikator & template diklon dari semester lalu
2. Admin    : sinkron kelas & siswa (import Excel)
3. Admin    : pilih PESERTA tiap program (lintas kelas) + kelompok
              (KSM Mat/IPA/IPS & Riset Agm/Hum/Sains masing-masing terpisah)
4. Admin    : tetapkan guru program (1–3) + urutan penanda tangan
5. Guru     : (opsional) sesuaikan indikator, bobot, dan template + terjemahan
6. Guru     : input nilai indikator, hafalan per surat (tahfidz), prestasi,
              data riset, kehadiran
7. Sistem   : hitung nilai akhir, predikat, deskripsi otomatis (+ terjemahan)
8. Guru     : review & edit deskripsi, tulis catatan → ajukan
9. Kepala   : setujui per program → rapor TERKUNCI (snapshot dibuat)
10. Admin   : cetak massal per program (bisa difilter kelompok/kelas)
11. Admin   : UNDUH LEGER EXCEL (rekap + per program + detail hafalan tahfidz)
```

---

## 12. Tahapan Pengerjaan (Roadmap)

| Fase | Isi | Hasil yang bisa dicoba |
|---|---|---|
| **0. Fondasi** | Setup Next.js, shadcn, Supabase, auth, layout dashboard, tema | Login + dashboard kosong |
| **1. Master Data** | Periode, kelas, siswa (import Excel), guru & role, pengaturan (kop, kepala, TTD) | Data sekolah lengkap |
| **2. Program & Peserta** | Seed 6 rumpun / 10 program, pilih peserta lintas kelas, kelompok, guru program & penanda tangan | Peserta tiap program terdaftar |
| **3. Indikator & Template** | CRUD indikator (drag-urut, bobot, terjemahan), skala predikat, editor template bilingual (EN & AR/RTL) | Guru bisa atur indikator sendiri |
| **4. Mesin Deskripsi** | `engine.ts` ID/EN/AR + unit test, preview langsung | Deskripsi + terjemahan muncul otomatis |
| **5. Input Nilai** | Penugasan, grid nilai, autosave, RLS | Guru bisa mengisi nilai |
| **6. Modul Khusus** | Master data Al-Qur'an, **input hafalan Juz ▸ Surat ▸ Nilai**, prestasi KSM, proyek riset, kehadiran | Data khusus tiap program |
| **7. Rapor & Cetak** | Layout A4 + kop, blok TTD dinamis 1–3 guru, tabel hafalan multi-halaman, alur persetujuan, kunci + snapshot, cetak massal, QR | **Rapor siap cetak** |
| **8. Leger & Polish** | **Leger Excel** (rekap, per program, detail hafalan), dashboard progres, verifikasi publik, audit log | **Leger siap unduh**, aplikasi siap dipakai penuh |
| *Lanjutan* | Portal orang tua, log setoran tahfidz harian, notifikasi WA | — |

---

## 13. Pertanyaan yang Perlu Dijawab Sebelum Eksekusi

✅ **Semua pertanyaan perencanaan sudah dijawab** (lihat tabel Keputusan #1–#16).

Yang masih ditunggu (tidak menghalangi mulai ngoding):
- **Logo Kemenag & logo madrasah** (PNG transparan, resolusi tinggi). Kop dibangun ulang sebagai HTML mengikuti contoh rapor reguler, jadi cukup dua logo ini (gambar kop utuh tetap bisa dipakai kalau lebih disukai). Sebelum file datang, dipakai logo placeholder.
- **Akun Supabase**: buat project baru di supabase.com. Kunci API-nya nanti dimasukkan sendiri ke file `.env.local`, tidak perlu dikirim lewat chat.
- **Akses orang tua online** tidak masuk cakupan awal (tetap di daftar *Lanjutan*).

---

## 14. Sumber Riset

- Empat maharah bahasa Arab MTs (buku Kemenag kelas VII): [Al Mi'yar – STIQ Amuntai](https://jurnal.stiq-amuntai.ac.id/index.php/al-miyar/article/download/3667/pdf)
- Indikator maharah kalam: [Al Mi'yar 5226](https://jurnal.stiq-amuntai.ac.id/index.php/al-miyar/article/download/5226/pdf)
- Rubrik sebagai alat evaluasi kemahiran bahasa Arab: [Al-Bayan – UIN Raden Intan](https://ejournal.radenintan.ac.id/index.php/albayan/article/view/2598)
- Muhadatsah pada program unggulan MTs: [eprints UMS](https://eprints.ums.ac.id/90692), [Lahjah – Ibrahimy](https://journal.ibrahimy.ac.id/index.php/Lahjah/article/download/7688/3169/33557)
- Aspek penilaian tahfidz (makhraj, sifat huruf, tajwid, fashahah, tawaqquf, sabqul lisan): [IDR UIN Antasari](https://idr.uin-antasari.ac.id/31988/6/BAB%20IV.pdf), [IDR UIN Antasari (Bab V)](https://idr.uin-antasari.ac.id/24444/8/BAB%20V.pdf), [Etheses IAIN Kediri](https://etheses.iainkediri.ac.id/21936/)
- Instrumen praktik ibadah MTs/SMP: [ICONIC – Ar-Raniry](https://journal.ar-raniry.ac.id/iconic/article/download/2692/1329/6036), [Pendas – Unpas](https://www.journal.unpas.ac.id/index.php/pendas/article/download/44898/25201/164286)
- KSM menjadi OMI 2025 & bidang MTs: [Pojoksatu](https://www.pojoksatu.id/edugov/1086478241/download-soal-lengkap-ksm-omi-2025-semua-jenjang-masih-ada-waktu-untuk-berlatih-kesempatan-uji-coba-di-sini), [Tirto](https://tirto.id/kisi-kisi-omi-2025-mapel-ips-jenjang-mts-hio1)
- Aspek penilaian MYRES: [yunandra.com](https://yunandra.com/aspek-penilaian-kompetisi-myres-madrasah-young-researchers-supercamp/), bidang MYRES: [suarapemerintah.id](https://suarapemerintah.id/?p=255612)
- Pola deskripsi rapor Kurikulum Merdeka: [JCOSCIS – Unilak](https://journal.unilak.ac.id/index.php/jcoscis/article/download/13073/5155), [kurikulummerdeka.com](https://kurikulummerdeka.com/tag/deskripsi/)
- KMA 1503/2025: [bukuyunandra.com](https://bukuyunandra.com/?p=8262)
- Rubrik speaking (fluency, vocabulary, grammar, pronunciation): [IELTS speaking criteria](https://admin.ieltskorea.org/img/exam_intro/file/스피킹%20채점기준.pdf), [Sanako rubric template](https://sanako.com/wp-content/uploads/2024/09/Rubric-template-for-Speaking-assessment.pdf)
- Data juz↔surat↔ayat (seed `quran_surat`/`quran_juz_surat`, Fase 6): [alquran.cloud API](https://alquran.cloud/api) (ayat per juz, mushaf Hafs/Kufi — total 6236 ayat, cocok Kemenag), disilangkan dengan [quran.com API v4](https://quran.com/api) (nama surat); diverifikasi kontinu tanpa celah/tumpang-tindih terhadap jumlah ayat tiap surat

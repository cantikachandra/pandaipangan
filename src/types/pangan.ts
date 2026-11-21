export type KomoditasId =
  | 'beras'
  | 'cabai_merah'
  | 'cabai_rawit'
  | 'bawang_merah'
  | 'telur_ayam_ras';

export type PeriodeId = '2026-08' | '2026-09' | '2026-10';

export type MenuId =
  | 'SIAGA'
  | 'IKLIM'
  | 'PASOK'
  | 'PROYEKSI'
  | 'JALUR'
  | 'SIMULASI'
  | 'DATA_SCIENTIST';

export type StatusData = 'NYATA' | 'SIMULASI';

export type AlertLevel = 'Normal' | 'Waspada' | 'Siaga' | 'Awas';

export type VerifikasiStatus = 'Menunggu Verifikasi Analis' | 'Terverifikasi';

export type Strategi4K =
  | 'Keterjangkauan Harga'
  | 'Ketersediaan Pasokan'
  | 'Kelancaran Distribusi'
  | 'Komunikasi Efektif';

export type IklimLayerId = 'curah_hujan' | 'suhu' | 'indeks_kekeringan' | 'anomali';

export type ModelProyeksiId = 'XGBoost' | 'SARIMAX';

export interface DataRecordMinimal {
  provinsi_kode: string;
  komoditas: string;
  tanggal: string;
  nilai: number;
  satuan: string;
  status: StatusData;
  sumber: string;
}

export interface WilayahProvinsi {
  provinsi_kode: string;
  nama: string;
  pulau: string;
  lat: number;
  lon: number;
  peran: 'sentra' | 'konsumsi' | 'campuran';
  sentra_komoditas: KomoditasId[];
  catatan_wilayah: string;
}

export interface IklimSimRecord extends DataRecordMinimal {
  periode: PeriodeId;
  dasarian: string;
  curah_hujan_mm: number;
  curah_hujan_normal_mm: number;
  anomali_pct: number;
  suhu_c: number;
  indeks_kekeringan: number; // 0-100 (lebih tinggi = lebih kering)
  zona_kering_BMKG_sim: boolean;
}

export interface KerentananSimRecord extends DataRecordMinimal {
  komoditas: KomoditasId;
  periode: PeriodeId;
  risiko_iklim: number; // 0-100
  ketergantungan_musim: number; // 0-100
  defisit_pasokan: number; // 0-100
  skor_pasok: number; // 0.4*iklim + 0.3*musim + 0.3*defisit
  level_siaga: AlertLevel;
}

export interface HargaProvinsiSimRecord extends DataRecordMinimal {
  komoditas: KomoditasId;
  periode: PeriodeId;
  harga_nasional_jangkar: number;
  selisih_wilayah_pct: number;
  perubahan_mtm_pct: number;
  hap_acuan: number | null;
  di_atas_hap_pct: number | null;
}

export interface AliranPasokanSimRecord extends DataRecordMinimal {
  komoditas: KomoditasId;
  asal_kode: string;
  asal_nama: string;
  tujuan_kode: string;
  tujuan_nama: string;
  volume_ton_minggu: number;
  waktu_tempuh_jam: number;
  risiko_hambatan: 'Rendah' | 'Sedang' | 'Tinggi';
  koridor_utama: string;
}

export interface ReiSimRecord extends DataRecordMinimal {
  periode: PeriodeId;
  pmi_nasional_dasar: number;
  rei_skor: number; // 0-100
  tekanan_permintaan: 'Moderat' | 'Meningkat' | 'Tinggi';
  redd_flag: boolean;
  redd_alasan: string | null;
}

export interface VerifikasiRecord {
  provinsi_kode: string;
  komoditas: KomoditasId;
  status: VerifikasiStatus;
  analis: string;
  waktu: string | null;
  catatan: string;
}

export interface ProyeksiPoint {
  tanggal: string;
  label: string;
  tipe: 'historis' | 'prediksi';
  harga_aktual?: number;
  harga_prediksi?: number;
  batas_bawah?: number;
  batas_atas?: number;
  status: StatusData;
  sumber: string;
}

export interface SimulasiSkenario {
  id: string;
  nama: string;
  jenis: 'kekeringan' | 'hujan_ekstrem' | 'hambatan_distribusi';
  keparahan: 'ringan' | 'sedang' | 'berat';
  durasi_hari: number;
  komoditas: KomoditasId;
  elastisitas_permintaan: number;
  elastisitas_penawaran: number;
  penurunan_pasokan_pct: number;
  kenaikan_harga_pct: number;
  perubahan_skor_risiko: number;
  harga_baseline: number;
  harga_proyeksi: number;
}

export interface UserSession {
  email: string;
  nama: string;
  peran: string;
  loginAt: string;
}

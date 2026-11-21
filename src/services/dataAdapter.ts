import wilayahRaw from '../data/wilayah.json';
import dataNyataRaw from '../data/data_nyata.json';
import iklimSimRaw from '../data/iklim_sim.json';
import kerentananSimRaw from '../data/kerentanan_sim.json';
import hargaProvinsiSimRaw from '../data/harga_provinsi_sim.json';
import aliranPasokanSimRaw from '../data/aliran_pasokan_sim.json';
import reiSimRaw from '../data/rei_sim.json';

import type {
  AliranPasokanSimRecord,
  AlertLevel,
  HargaProvinsiSimRecord,
  IklimSimRecord,
  KerentananSimRecord,
  KomoditasId,
  ModelProyeksiId,
  PeriodeId,
  ProyeksiPoint,
  ReiSimRecord,
  SimulasiSkenario,
  Strategi4K,
  WilayahProvinsi,
} from '../types/pangan';

export const KOMODITAS_META: Record<
  KomoditasId,
  { id: KomoditasId; label: string; hap: number | null; satuan: string; karakter: string }
> = {
  beras: {
    id: 'beras',
    label: 'Beras',
    hap: 14900,
    satuan: 'Rp/kg',
    karakter: 'Surplus produksi 2025 (34,69 jt ton vs konsumsi 30,81 jt ton), kerentanan rendah',
  },
  cabai_merah: {
    id: 'cabai_merah',
    label: 'Cabai Merah',
    hap: 55000,
    satuan: 'Rp/kg',
    karakter: 'Sangat sensitif kemarau/El Niño & distribusi; andil utama volatile food Okt 2026',
  },
  cabai_rawit: {
    id: 'cabai_rawit',
    label: 'Cabai Rawit',
    hap: 57000,
    satuan: 'Rp/kg',
    karakter: 'Volatilitas tertinggi (+52,4% di atas HAP awal Okt 2026); sentra rentan kering',
  },
  bawang_merah: {
    id: 'bawang_merah',
    label: 'Bawang Merah',
    hap: 41500,
    satuan: 'Rp/kg',
    karakter: 'Terpusat di Brebes/Bima/Palu; ketergantungan musiman menengah-tinggi',
  },
  telur_ayam_ras: {
    id: 'telur_ayam_ras',
    label: 'Telur Ayam Ras',
    hap: 30000,
    satuan: 'Rp/kg',
    karakter: 'Pasokan sentra Blitar & Lampung relatif stabil; sensitif biaya pakan jagung',
  },
};

export const PERIODE_META: Record<PeriodeId, { id: PeriodeId; label: string; singkat: string }> = {
  '2026-08': { id: '2026-08', label: 'Agustus 2026', singkat: 'Agu 2026' },
  '2026-09': { id: '2026-09', label: 'September 2026', singkat: 'Sep 2026' },
  '2026-10': { id: '2026-10', label: 'Oktober 2026', singkat: 'Okt 2026' },
};

export interface ProvinsiSnapshot {
  wilayah: WilayahProvinsi;
  iklim: IklimSimRecord;
  kerentanan: KerentananSimRecord;
  harga: HargaProvinsiSimRecord;
  rei: ReiSimRecord;
  aliranMasuk: AliranPasokanSimRecord[];
  aliranKeluar: AliranPasokanSimRecord[];
  prioritas4K: {
    strategi: Strategi4K;
    aksi: string;
    urgensi: AlertLevel;
  }[];
}

/**
 * Antarmuka Lapisan Data (Data Adapter Interface).
 * Memisahkan komponen UI dari sumber data agar mudah diganti dari JSON lokal
 * ke endpoint API resmi instansi terkait pada tahap produksi.
 */
export interface PanganDataAdapter {
  getAllWilayah(): Promise<WilayahProvinsi[]>;
  getGeoJsonBatasProvinsi(): Promise<GeoJSON.FeatureCollection | null>;
  getDataNyata(): typeof dataNyataRaw;
  getIklimByPeriode(periode: PeriodeId): Promise<IklimSimRecord[]>;
  getKerentananByFilter(periode: PeriodeId, komoditas: KomoditasId): Promise<KerentananSimRecord[]>;
  getHargaByFilter(periode: PeriodeId, komoditas: KomoditasId): Promise<HargaProvinsiSimRecord[]>;
  getReiByPeriode(periode: PeriodeId): Promise<ReiSimRecord[]>;
  getAliranPasokan(komoditas?: KomoditasId): Promise<AliranPasokanSimRecord[]>;
  getProvinsiSnapshots(periode: PeriodeId, komoditas: KomoditasId): Promise<ProvinsiSnapshot[]>;
  getProyeksiHarga(
    provinsiKode: string | null,
    komoditas: KomoditasId,
    horizonHari: 7 | 14,
    model: ModelProyeksiId,
    periode: PeriodeId
  ): {
    seri: ProyeksiPoint[];
    probabilitasLonjakan: number;
    perubahanProyeksiPct: number;
    faktorPendorong: {
      nama: 'Iklim' | 'Pasokan' | 'Musiman' | 'Harga Historis';
      kontribusiPct: number;
      arah: 'Naik' | 'Stabil' | 'Turun';
      ringkasan: string;
    }[];
  };
  hitungSimulasiSkenario(params: {
    nama: string;
    jenis: 'kekeringan' | 'hujan_ekstrem' | 'hambatan_distribusi';
    keparahan: 'ringan' | 'sedang' | 'berat';
    durasi_hari: number;
    komoditas: KomoditasId;
    elastisitas_permintaan: number;
    elastisitas_penawaran: number;
    customDropPct?: number;
  }): SimulasiSkenario;
  getAlternatifWilayah(
    tujuanKode: string,
    komoditas: KomoditasId,
    snapshots: ProvinsiSnapshot[]
  ): {
    provinsi: WilayahProvinsi;
    skorPasok: number;
    harga: number;
    estimasiJam: number;
    alasan: string;
  }[];
}

class LocalJsonDataAdapter implements PanganDataAdapter {
  private wilayah: WilayahProvinsi[] = wilayahRaw as WilayahProvinsi[];
  private iklim: IklimSimRecord[] = iklimSimRaw as IklimSimRecord[];
  private kerentanan: KerentananSimRecord[] = kerentananSimRaw as KerentananSimRecord[];
  private harga: HargaProvinsiSimRecord[] = hargaProvinsiSimRaw as HargaProvinsiSimRecord[];
  private aliran: AliranPasokanSimRecord[] = aliranPasokanSimRaw as AliranPasokanSimRecord[];
  private rei: ReiSimRecord[] = reiSimRaw as ReiSimRecord[];

  async getAllWilayah(): Promise<WilayahProvinsi[]> {
    // [INTEGRASI API ASLI - BPS / Kemendagri]
    // Ganti dengan fetch('/api/wilayah/provinsi') untuk daftar kode wilayah resmi BPS/Kepmendagri.
    return this.wilayah;
  }

  async getGeoJsonBatasProvinsi(): Promise<GeoJSON.FeatureCollection | null> {
    // [INTEGRASI API ASLI - BIG / BPS GeoJSON]
    // Tempat memasang berkas poligon batas 38 provinsi resmi dari Badan Informasi Geospasial (BIG) atau BPS:
    // Contoh:
    //   const res = await fetch('/assets/geojson/indonesia-38-provinsi.geojson');
    //   if (res.ok) return await res.json();
    // Pada prototipe ini mengembalikan null sehingga peta otomatis memakai marker lingkaran
    // berbasis koordinat pusat provinsi dari dokumen pendukung (wilayah.json).
    return null;
  }

  getDataNyata() {
    // [INTEGRASI API ASLI - BI, BPS, PIHPS, Bapanas, Kemendag, BMKG]
    // Kumpulan rilis resmi yang dapat disinkronkan melalui endpoint backend /api/nyata/*.
    return dataNyataRaw;
  }

  async getIklimByPeriode(periode: PeriodeId): Promise<IklimSimRecord[]> {
    // [INTEGRASI API ASLI - BMKG Data Online & Prakiraan Musim]
    // Ganti dengan: fetch(`https://api.bmkg.go.id/...` via server proxy `/api/bmkg/iklim?periode=${periode}`)
    // untuk mengambil curah hujan dasarian, indeks kekeringan SPI/HTH, suhu, dan anomali El Niño.
    return this.iklim.filter((r) => r.periode === periode);
  }

  async getKerentananByFilter(
    periode: PeriodeId,
    komoditas: KomoditasId
  ): Promise<KerentananSimRecord[]> {
    // [INTEGRASI API ASLI - Bapanas Neraca Pangan & BPS KSA]
    // Ganti dengan kalkulasi dinamis dari stok gudang Bapanas + luas panen KSA BPS + risiko iklim BMKG.
    return this.kerentanan.filter((r) => r.periode === periode && r.komoditas === komoditas);
  }

  async getHargaByFilter(
    periode: PeriodeId,
    komoditas: KomoditasId
  ): Promise<HargaProvinsiSimRecord[]> {
    // [INTEGRASI API ASLI - PIHPS Bank Indonesia, Panel Harga Bapanas, SP2KP Kemendag]
    // PENTING: PIHPS (hargapangan.id), Panel Harga Bapanas, dan SP2KP Kemendag memiliki definisi pasar
    // dan cakupan berbeda. Jangan menggabungkan seri mentah tanpa penyesuaian definisi/bobot.
    // Contoh: fetch(`/api/harga/provinsi?sumber=PIHPS&periode=${periode}&komoditas=${komoditas}`)
    return this.harga.filter((r) => r.periode === periode && r.komoditas === komoditas);
  }

  async getReiByPeriode(periode: PeriodeId): Promise<ReiSimRecord[]> {
    // [INTEGRASI API ASLI - Bank Indonesia Regional Economic Index & PMI]
    // Ganti dengan endpoint indikator ekonomi regional (Kantor Perwakilan BI daerah + S&P PMI Manufaktur).
    return this.rei.filter((r) => r.periode === periode);
  }

  async getAliranPasokan(komoditas?: KomoditasId): Promise<AliranPasokanSimRecord[]> {
    // [INTEGRASI API ASLI - Kemenhub / Bapanas Distribusi Pangan Antarwilayah]
    // Ganti dengan data arus muatan tol laut, angkutan logistik darat, dan neraca perdagangan antarprovinsi.
    if (!komoditas) return this.aliran;
    return this.aliran.filter((r) => r.komoditas === komoditas);
  }

  async getProvinsiSnapshots(
    periode: PeriodeId,
    komoditas: KomoditasId
  ): Promise<ProvinsiSnapshot[]> {
    const [wilayahList, iklimList, kerentananList, hargaList, reiList, aliranList] =
      await Promise.all([
        this.getAllWilayah(),
        this.getIklimByPeriode(periode),
        this.getKerentananByFilter(periode, komoditas),
        this.getHargaByFilter(periode, komoditas),
        this.getReiByPeriode(periode),
        this.getAliranPasokan(),
      ]);

    const iklimMap = new Map(iklimList.map((i) => [i.provinsi_kode, i]));
    const kerentananMap = new Map(kerentananList.map((k) => [k.provinsi_kode, k]));
    const hargaMap = new Map(hargaList.map((h) => [h.provinsi_kode, h]));
    const reiMap = new Map(reiList.map((r) => [r.provinsi_kode, r]));

    return wilayahList.map((w) => {
      const ikl = iklimMap.get(w.provinsi_kode)!;
      const ker = kerentananMap.get(w.provinsi_kode)!;
      const hrg = hargaMap.get(w.provinsi_kode)!;
      const reiRec = reiMap.get(w.provinsi_kode)!;
      const aliranMasuk = aliranList.filter(
        (a) => a.tujuan_kode === w.provinsi_kode && a.komoditas === komoditas
      );
      const aliranKeluar = aliranList.filter(
        (a) => a.asal_kode === w.provinsi_kode && a.komoditas === komoditas
      );

      // Sesuaikan status REDD bila komoditas bukan cabai
      const effectiveRei: ReiSimRecord =
        komoditas === 'beras' || komoditas === 'telur_ayam_ras'
          ? {
              ...reiRec,
              redd_flag: false,
              redd_alasan: null,
            }
          : reiRec;

      const prioritas4K = this.buildPrioritas4K(w, ker, hrg, effectiveRei, komoditas);

      return {
        wilayah: w,
        iklim: ikl,
        kerentanan: ker,
        harga: hrg,
        rei: effectiveRei,
        aliranMasuk,
        aliranKeluar,
        prioritas4K,
      };
    });
  }

  private buildPrioritas4K(
    w: WilayahProvinsi,
    ker: KerentananSimRecord,
    hrg: HargaProvinsiSimRecord,
    rei: ReiSimRecord,
    komoditas: KomoditasId
  ): ProvinsiSnapshot['prioritas4K'] {
    const namaKom = KOMODITAS_META[komoditas].label;
    const isHigh = ker.level_siaga === 'Awas' || ker.level_siaga === 'Siaga';
    const overHap = (hrg.di_atas_hap_pct ?? 0) > 15;

    return [
      {
        strategi: 'Keterjangkauan Harga',
        urgensi: overHap ? 'Siaga' : ker.level_siaga,
        aksi: overHap
          ? `Gelar Gerakan Pangan Murah (GPM) ${namaKom} di ${w.nama}; harga saat ini +${hrg.di_atas_hap_pct}% di atas HAP.`
          : `Pantau disparitas harga eceran ${namaKom} terhadap HAP di pasar pantauan TPID ${w.nama}.`,
      },
      {
        strategi: 'Ketersediaan Pasokan',
        urgensi: ker.defisit_pasokan >= 60 ? 'Siaga' : 'Waspada',
        aksi:
          komoditas === 'beras'
            ? `Jaga cadangan beras pemerintah (CBP) & serapan panen lokal untuk mempertahankan surplus wilayah.`
            : `Aktifkan Kerja Sama Antar Daerah (KAD) pasokan ${namaKom} dan dukungan irigasi/pompanisasi di sentra.`,
      },
      {
        strategi: 'Kelancaran Distribusi',
        urgensi: rei.redd_flag || isHigh ? 'Siaga' : 'Normal',
        aksi: rei.redd_flag
          ? `Audit rantai pasok & fasilitasi subsidi ongkos angkut (SOA) guna mengurai ketidakselarasan REDD di ${w.nama}.`
          : `Monitor jadwal bongkar muat koridor logistik utama menuju ${w.nama}.`,
      },
      {
        strategi: 'Komunikasi Efektif',
        urgensi: isHigh ? 'Waspada' : 'Normal',
        aksi: `Koordinasi publikasi data stok dan harga terverifikasi melalui humas TPIP-TPID ${w.nama} untuk meredam ekspektasi inflasi.`,
      },
    ];
  }

  getProyeksiHarga(
    provinsiKode: string | null,
    komoditas: KomoditasId,
    horizonHari: 7 | 14,
    model: ModelProyeksiId,
    periode: PeriodeId
  ) {
    const basePrices: Record<KomoditasId, number> = {
      beras: 14820,
      cabai_merah: 63913,
      cabai_rawit: 86846,
      bawang_merah: 41200,
      telur_ayam_ras: 29150,
    };

    const rec = provinsiKode
      ? this.harga.find(
          (h) =>
            h.provinsi_kode === provinsiKode &&
            h.komoditas === komoditas &&
            h.periode === periode
        )
      : null;

    const anchorPrice = rec ? rec.nilai : basePrices[komoditas];
    const kerRec = provinsiKode
      ? this.kerentanan.find(
          (k) =>
            k.provinsi_kode === provinsiKode &&
            k.komoditas === komoditas &&
            k.periode === periode
        )
      : null;

    const skor = kerRec
      ? kerRec.skor_pasok
      : komoditas === 'cabai_rawit'
        ? 78
        : komoditas === 'cabai_merah'
          ? 74
          : komoditas === 'bawang_merah'
            ? 56
            : komoditas === 'telur_ayam_ras'
              ? 36
              : 24;

    // Trend slope per day based on vulnerability and model
    const dailyTrend =
      komoditas === 'beras'
        ? 0.0008
        : komoditas === 'telur_ayam_ras'
          ? 0.0018
          : komoditas === 'bawang_merah'
            ? 0.0042
            : komoditas === 'cabai_merah'
              ? 0.0078
              : 0.0085;

    const modelMultiplier = model === 'XGBoost' ? 1.08 : 0.94;
    const bandSpreadBase = model === 'XGBoost' ? 0.032 : 0.045;

    const seri: ProyeksiPoint[] = [];
    // 10 historical points leading up to anchorPrice
    for (let i = -9; i <= 0; i++) {
      const wave = Math.sin(i * 0.7 + skor) * 0.014;
      const histFactor = 1 + i * dailyTrend * 0.75 + wave;
      const val = Math.round((anchorPrice * histFactor) / 50) * 50;
      const dayNum = 15 + i;
      seri.push({
        tanggal: `2026-10-${String(dayNum).padStart(2, '0')}`,
        label: `${dayNum} Okt`,
        tipe: 'historis',
        harga_aktual: i === 0 ? anchorPrice : val,
        harga_prediksi: i === 0 ? anchorPrice : undefined,
        batas_bawah: i === 0 ? anchorPrice : undefined,
        batas_atas: i === 0 ? anchorPrice : undefined,
        status: 'SIMULASI',
        sumber: 'Simulasi Historis Berjangkar Kemendag/PIHPS',
      });
    }

    // 7 or 14 forecast days
    let lastPred = anchorPrice;
    for (let d = 1; d <= horizonHari; d++) {
      const stepTrend = dailyTrend * modelMultiplier * (1 + (skor - 50) / 140);
      const nonLinear = model === 'XGBoost' ? Math.sin(d * 0.45) * 0.006 : Math.cos(d * 0.3) * 0.003;
      const pred = Math.round((anchorPrice * (1 + stepTrend * d + nonLinear)) / 50) * 50;
      const halfBand = pred * (bandSpreadBase + d * 0.0045);
      lastPred = pred;
      const dayOffset = 15 + d;
      const label = dayOffset <= 31 ? `${dayOffset} Okt` : `${dayOffset - 31} Nov`;
      seri.push({
        tanggal: dayOffset <= 31 ? `2026-10-${String(dayOffset).padStart(2, '0')}` : `2026-11-${String(dayOffset - 31).padStart(2, '0')}`,
        label,
        tipe: 'prediksi',
        harga_prediksi: pred,
        batas_bawah: Math.round((pred - halfBand) / 50) * 50,
        batas_atas: Math.round((pred + halfBand) / 50) * 50,
        status: 'SIMULASI',
        sumber: `Simulasi Proyeksi ${model} (Simulasi, bukan model terlatih)`,
      });
    }

    const perubahanProyeksiPct = Number((((lastPred - anchorPrice) / anchorPrice) * 100).toFixed(1));
    const probabilitasLonjakan = Math.min(
      94,
      Math.max(12, Math.round(skor * 0.92 + (model === 'XGBoost' ? 4 : -2)))
    );

    const faktorPendorong = [
      {
        nama: 'Iklim' as const,
        kontribusiPct: komoditas === 'beras' ? 22 : 38,
        arah: (komoditas === 'beras' ? 'Stabil' : 'Naik') as 'Naik' | 'Stabil',
        ringkasan:
          komoditas === 'beras'
            ? 'Stok nasional 2025 kuat meredam guncangan kemarau 2026.'
            : 'El Niño kuat & kekeringan Jawa-NTB-Sulsel menekan produktivitas panen.',
      },
      {
        nama: 'Pasokan' as const,
        kontribusiPct: komoditas === 'beras' ? 18 : 31,
        arah: (komoditas === 'beras' ? 'Turun' : 'Naik') as 'Naik' | 'Turun',
        ringkasan:
          komoditas === 'beras'
            ? 'Surplus beras nasional ~3,88 jt ton menjaga pasokan stabil.'
            : 'Friksi distribusi antarwilayah memicu kelangkaan lokal meski sentra cukup.',
      },
      {
        nama: 'Musiman' as const,
        kontribusiPct: 19,
        arah: 'Naik' as const,
        ringkasan: 'Pola menuju November 2026 & persiapan akhir tahun meningkatkan permintaan.',
      },
      {
        nama: 'Harga Historis' as const,
        kontribusiPct: komoditas === 'beras' ? 41 : 12,
        arah: (komoditas === 'beras' ? 'Stabil' : 'Naik') as 'Naik' | 'Stabil',
        ringkasan:
          komoditas === 'beras'
            ? 'Momentum harga stabil dekat HAP Rp14.900/kg.'
            : 'Momentum kenaikan Sep→Okt (>10% pada cabai) masih terbawa dalam lag jangka pendek.',
      },
    ];

    return {
      seri,
      probabilitasLonjakan,
      perubahanProyeksiPct,
      faktorPendorong,
    };
  }

  hitungSimulasiSkenario(params: {
    nama: string;
    jenis: 'kekeringan' | 'hujan_ekstrem' | 'hambatan_distribusi';
    keparahan: 'ringan' | 'sedang' | 'berat';
    durasi_hari: number;
    komoditas: KomoditasId;
    elastisitas_permintaan: number;
    elastisitas_penawaran: number;
    customDropPct?: number;
  }): SimulasiSkenario {
    const baselinePrices: Record<KomoditasId, number> = {
      beras: 14820,
      cabai_merah: 57383,
      cabai_rawit: 78802,
      bawang_merah: 38400,
      telur_ayam_ras: 28900,
    };

    const baseDropBySeverity: Record<'ringan' | 'sedang' | 'berat', number> = {
      ringan: 3.5,
      sedang: 8.0,
      berat: 14.5,
    };

    const komoditasSens: Record<KomoditasId, number> = {
      beras: 0.35, // stok kuat 2026 meredam penurunan pasokan efektif
      cabai_merah: 1.0,
      cabai_rawit: 1.12,
      bawang_merah: 0.85,
      telur_ayam_ras: 0.55,
    };

    const jenisMult: Record<'kekeringan' | 'hujan_ekstrem' | 'hambatan_distribusi', number> = {
      kekeringan: 1.0,
      hujan_ekstrem: 1.1,
      hambatan_distribusi: 0.92,
    };

    const durasiFactor = Math.max(0.6, Math.min(1.6, params.durasi_hari / 21));
    const penurunanPasokanPct =
      params.customDropPct !== undefined
        ? Number(params.customDropPct.toFixed(1))
        : Number(
            (
              baseDropBySeverity[params.keparahan] *
              komoditasSens[params.komoditas] *
              jenisMult[params.jenis] *
              durasiFactor
            ).toFixed(1)
          );

    const sumElasticity = Math.max(
      0.1,
      params.elastisitas_permintaan + params.elastisitas_penawaran
    );
    // Rumus sensitivitas: ΔP/P ≈ x / (εd + εs)
    const kenaikanHargaPct = Number((penurunanPasokanPct / sumElasticity).toFixed(1));
    const hargaBaseline = baselinePrices[params.komoditas];
    const hargaProyeksi = Math.round((hargaBaseline * (1 + kenaikanHargaPct / 100)) / 50) * 50;
    const perubahanSkorRisiko = Math.min(
      45,
      Math.round(penurunanPasokanPct * 1.9 + params.durasi_hari * 0.25)
    );

    return {
      id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nama: params.nama,
      jenis: params.jenis,
      keparahan: params.keparahan,
      durasi_hari: params.durasi_hari,
      komoditas: params.komoditas,
      elastisitas_permintaan: params.elastisitas_permintaan,
      elastisitas_penawaran: params.elastisitas_penawaran,
      penurunan_pasokan_pct: penurunanPasokanPct,
      kenaikan_harga_pct: kenaikanHargaPct,
      perubahan_skor_risiko: perubahanSkorRisiko,
      harga_baseline: hargaBaseline,
      harga_proyeksi: hargaProyeksi,
    };
  }

  getAlternatifWilayah(
    tujuanKode: string,
    komoditas: KomoditasId,
    snapshots: ProvinsiSnapshot[]
  ) {
    const tujuan = snapshots.find((s) => s.wilayah.provinsi_kode === tujuanKode);
    if (!tujuan) return [];

    // Cari provinsi sentra atau campuran dengan skor PASOK terendah & bukan tujuan itu sendiri
    const kandidat = snapshots
      .filter(
        (s) =>
          s.wilayah.provinsi_kode !== tujuanKode &&
          (s.wilayah.sentra_komoditas.includes(komoditas) || s.wilayah.peran === 'sentra')
      )
      .map((s) => {
        const dLat = s.wilayah.lat - tujuan.wilayah.lat;
        const dLon = s.wilayah.lon - tujuan.wilayah.lon;
        const distDeg = Math.sqrt(dLat * dLat + dLon * dLon);
        const estimasiJam = Math.max(5, Math.round(distDeg * 3.8 + 4));
        return {
          provinsi: s.wilayah,
          skorPasok: s.kerentanan.skor_pasok,
          harga: s.harga.nilai,
          estimasiJam,
          alasan:
            s.kerentanan.skor_pasok < 55
              ? `Sentra alternatif relatif aman (Skor PASOK ${s.kerentanan.skor_pasok}) dengan selisih harga efisien.`
              : `Sentra ${s.wilayah.pulau} dengan ketersediaan stok terpantau dan akses koridor ~${estimasiJam} jam.`,
        };
      })
      .sort((a, b) => a.skorPasok - b.skorPasok || a.estimasiJam - b.estimasiJam);

    return kandidat.slice(0, 3);
  }
}

export const panganDataAdapter: PanganDataAdapter = new LocalJsonDataAdapter();

export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka);
}

export function getAlertStyle(level: AlertLevel): {
  bg: string;
  text: string;
  border: string;
  hex: string;
  kodeAngka: string;
} {
  switch (level) {
    case 'Normal':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        hex: '#16A34A',
        kodeAngka: '1 · Normal',
      };
    case 'Waspada':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
        hex: '#EAB308',
        kodeAngka: '2 · Waspada',
      };
    case 'Siaga':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-300',
        hex: '#EA580C',
        kodeAngka: '3 · Siaga',
      };
    case 'Awas':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-300',
        hex: '#DC2626',
        kodeAngka: '4 · Awas',
      };
  }
}

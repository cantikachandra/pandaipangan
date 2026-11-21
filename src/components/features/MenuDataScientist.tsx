import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Database,
  FlaskConical,
  GitBranch,
  History,
  ShieldAlert,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { KomoditasId, ModelProyeksiId } from '../../types/pangan';
import { formatRupiah, KOMODITAS_META, panganDataAdapter } from '../../services/dataAdapter';
import { DataBadge } from '../DataBadge';

type DsTabId = 'dataset' | 'pipeline' | 'kualitas' | 'backtest' | 'lab';

export const MenuDataScientist: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DsTabId>('dataset');
  const [backtestStep, setBacktestStep] = useState<number>(0);
  const [showCleanedSeries, setShowCleanedSeries] = useState<boolean>(false);

  // Model Lab state
  const [labKomoditas, setLabKomoditas] = useState<KomoditasId>('cabai_merah');
  const [labModel, setLabModel] = useState<ModelProyeksiId>('XGBoost');
  const [labDropPct, setLabDropPct] = useState<number>(8.0);
  const [labEd, setLabEd] = useState<number>(0.3);
  const [labEs, setLabEs] = useState<number>(0.4);

  const dataNyata = panganDataAdapter.getDataNyata();

  const datasetInventory = [
    {
      nama: 'Inflasi Nasional (IHK, Inti, Volatile Food, Administered)',
      status: 'NYATA' as const,
      sumber: 'BI Siaran Pers No.28/238/DKom (2 Nov 2026) & BPS',
      tanggal: 'Agu–Okt 2026',
      cakupan: 'Nasional (6 seri indikator)',
      catatan: 'Angka Agustus dari pemberitaan; Okt 2026 volatile food andil 0,13 pp.',
    },
    {
      nama: 'PMI Manufaktur Indonesia (Dasar REI)',
      status: 'NYATA' as const,
      sumber: 'Rilis PMI Nasional (Okt 2026)',
      tanggal: 'Sep–Okt 2026',
      cakupan: 'Nasional (Sep 52,4 · Okt 54,0)',
      catatan: 'Menjadi jangkar utama pembangkitan REI regional.',
    },
    {
      nama: 'Harga Pangan Okt 2026 (PIHPS, Bapanas, Kemendag, SP2KP)',
      status: 'NYATA' as const,
      sumber: 'PIHPS BI, Bapanas, SP2KP Kemendag, Pemberitaan',
      tanggal: '1–25 Okt 2026',
      cakupan: 'Nasional (8 rilis terpisah + HAP Mendag)',
      catatan: 'Definisi antarlembaga berbeda; PIHPS 6 Okt (114.000) ditandai anomali.',
    },
    {
      nama: 'Produksi & Luas Panen Padi 2023–2025',
      status: 'NYATA' as const,
      sumber: 'BPS (Kerangka Sampel Area / KSA)',
      tanggal: '2023–2025',
      cakupan: 'Nasional & 4 Provinsi Utama',
      catatan: 'Angka 2025 memakai rilis terakhir 34,69 jt ton (riwayat 4 versi revisi disimpan).',
    },
    {
      nama: 'El Niño, Kemarau 2026, GPIPS & Sentra Cabai',
      status: 'NYATA' as const,
      sumber: 'BMKG, BI (2026b), Kementan via Pemberitaan',
      tanggal: '2023–2026',
      cakupan: '369 Zona Musim (48,84% daratan)',
      catatan: 'Sentra cabai 26 kab. melampaui konsumsi namun harga tetap tinggi (bahan uji REDD).',
    },
    {
      nama: 'Pertumbuhan PDRB TW III 2026 & Makro Moneter (BI-Rate, Kurs)',
      status: 'NYATA' as const,
      sumber: 'BPS & Bank Indonesia (Esai SIAGA Gen-School 2026)',
      tanggal: 'Okt–Nov 2026',
      cakupan: 'Nasional (5,47%) & Daerah (Maluku Utara >16% s.d Papua Barat 3,16%)',
      catatan: 'BI-Rate 5,75%, Kurs Rp18.128/USD, jeda rilis PDB 36 hari.',
    },
    {
      nama: 'Adopsi & Volume Transaksi QRIS Nasional (Sem I 2026)',
      status: 'NYATA' as const,
      sumber: 'BI / ANTARA (Esai SIAGA Gen-School 2026)',
      tanggal: 'Jun 2026',
      cakupan: '65,77 jt pengguna · 44,86 jt merchant (96,68% UMKM)',
      catatan: 'Volume 12,55 miliar (+100,12%); wajib dinormalisasi per merchant aktif agar tidak bias.',
    },
    {
      nama: 'wilayah.json (Koordinat Pusat 38 Provinsi)',
      status: 'NYATA' as const,
      sumber: 'Dokumen Data Pendukung Bagian 8',
      tanggal: '19 Nov 2026',
      cakupan: '38 Provinsi Indonesia',
      catatan: 'Perkiraan titik tengah; ganti dengan GeoJSON resmi BIG/BPS untuk poligon.',
    },
    {
      nama: 'iklim_sim.json (Curah Hujan, Suhu, Kekeringan, Anomali)',
      status: 'SIMULASI' as const,
      sumber: 'Simulasi Terkalibrasi Kemarau BMKG',
      tanggal: 'Agu–Okt 2026',
      cakupan: '38 Provinsi × 3 Periode (114 baris)',
      catatan: 'Jawa, Nusa Tenggara, Sulsel disimulasikan lebih kering pada Agu–Okt 2026.',
    },
    {
      nama: 'kerentanan_sim.json (Skor PASOK 0–100)',
      status: 'SIMULASI' as const,
      sumber: 'Rumus 0,4 Iklim + 0,3 Musim + 0,3 Defisit',
      tanggal: 'Agu–Okt 2026',
      cakupan: '38 Provinsi × 5 Komoditas × 3 Periode (570 baris)',
      catatan: 'Beras rendah (surplus 2025), cabai merah & rawit tinggi.',
    },
    {
      nama: 'harga_provinsi_sim.json (Harga Harian/Bulanan Provinsi)',
      status: 'SIMULASI' as const,
      sumber: 'Jangkar Nasional + Selisih Wilayah Acak 3–15%',
      tanggal: 'Agu–Okt 2026',
      cakupan: '38 Provinsi × 5 Komoditas × 3 Periode (570 baris)',
      catatan: 'Bukan seri harian resmi; ganti dengan PIHPS/Bapanas per provinsi.',
    },
    {
      nama: 'aliran_pasokan_sim.json & rei_sim.json',
      status: 'SIMULASI' as const,
      sumber: 'Model Arus Antarwilayah & Variasi Regional PMI',
      tanggal: 'Agu–Okt 2026',
      cakupan: '22 Koridor Utama & 114 Catatan REI',
      catatan: 'Menggambarkan koridor Jatim/Jateng/Jabar ke DKI/Banten/Kalimantan/Sumatera.',
    },
  ];

  // Kualitas Data: Seri PIHPS vs Bapanas vs SP2KP
  const rawitSeriesChart = [
    {
      tanggal: '1 Okt',
      PIHPS: 101550,
      PIHPS_Bersih: 101550,
      SP2KP: 80420,
      Bapanas: null,
      Kemendag: null,
    },
    {
      tanggal: '5 Okt (Awal)',
      PIHPS: null,
      PIHPS_Bersih: null,
      SP2KP: null,
      Bapanas: null,
      Kemendag: 86846,
    },
    {
      tanggal: '6 Okt (Anomali)',
      PIHPS: 114000,
      PIHPS_Bersih: 101900, // Ditandai & diinterpolasi pada tampilan bersih
      SP2KP: null,
      Bapanas: null,
      Kemendag: null,
    },
    {
      tanggal: '7 Okt (Pekan 1)',
      PIHPS: null,
      PIHPS_Bersih: null,
      SP2KP: null,
      Bapanas: 93566,
      Kemendag: null,
    },
    {
      tanggal: '8 Okt',
      PIHPS: 102250,
      PIHPS_Bersih: 102250,
      SP2KP: null,
      Bapanas: null,
      Kemendag: null,
    },
    {
      tanggal: '14 Okt',
      PIHPS: null,
      PIHPS_Bersih: null,
      SP2KP: null,
      Bapanas: 93629,
      Kemendag: null,
    },
  ];

  // Backtest Comparison Data
  const backtestCompareChart = [
    {
      komoditas: 'Cabai Merah (Rp/kg)',
      September: dataNyata.backtest_sep_okt_2026.kondisi_masukan_1_okt.cabai_merah_sep,
      Oktober_Realisasi: dataNyata.backtest_sep_okt_2026.realisasi_okt.cabai_merah_okt,
    },
    {
      komoditas: 'Cabai Rawit (Rp/kg)',
      September: dataNyata.backtest_sep_okt_2026.kondisi_masukan_1_okt.cabai_rawit_sep,
      Oktober_Realisasi: dataNyata.backtest_sep_okt_2026.realisasi_okt.cabai_rawit_okt,
    },
  ];

  // Model Lab Calculations
  const labResult = useMemo(() => {
    const sim = panganDataAdapter.hitungSimulasiSkenario({
      nama: 'Lab Interaktif',
      jenis: 'kekeringan',
      keparahan: 'sedang',
      durasi_hari: 21,
      komoditas: labKomoditas,
      elastisitas_permintaan: labEd,
      elastisitas_penawaran: labEs,
      customDropPct: labDropPct,
    });
    const probLonjakan = Math.min(
      96,
      Math.max(10, Math.round(sim.kenaikan_harga_pct * 3.8 + (labModel === 'XGBoost' ? 8 : 3)))
    );
    const spreadPct = labModel === 'XGBoost' ? 0.055 : 0.072;
    const batasBawah = Math.round((sim.harga_proyeksi * (1 - spreadPct)) / 50) * 50;
    const batasAtas = Math.round((sim.harga_proyeksi * (1 + spreadPct)) / 50) * 50;

    // Sensitivity curve across supply drops 0..20%
    const curve = [0, 2, 4, 6, 8, 10, 12, 15, 18, 20].map((drop) => {
      const pct = Number((drop / Math.max(0.1, labEd + labEs)).toFixed(1));
      const p = Math.round((sim.harga_baseline * (1 + pct / 100)) / 50) * 50;
      return {
        drop: `-${drop}%`,
        harga: p,
        pita: [
          Math.round((p * (1 - spreadPct)) / 50) * 50,
          Math.round((p * (1 + spreadPct)) / 50) * 50,
        ],
        kenaikanPct: pct,
      };
    });

    return { sim, probLonjakan, batasBawah, batasAtas, curve };
  }, [labKomoditas, labModel, labDropPct, labEd, labEs]);

  const tabs: { id: DsTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dataset', label: '1. Dataset (Nyata & Simulasi)', icon: <Database className="h-3.5 w-3.5" /> },
    { id: 'pipeline', label: '2. Pipeline & EW4All', icon: <GitBranch className="h-3.5 w-3.5" /> },
    { id: 'kualitas', label: '3. Kualitas Data & Anomali', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { id: 'backtest', label: '4. Backtest Sep–Okt 2026', icon: <History className="h-3.5 w-3.5" /> },
    { id: 'lab', label: '5. Model Lab (Simulasi)', icon: <FlaskConical className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Top Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">
            Ruang Kerja Data Scientist & Audit Metodologi
          </h2>
          <p className="text-xs text-slate-500">
            Transparansi penuh pemisahan data NYATA vs SIMULASI, pipeline EW4All, anomali lintas
            lembaga, backtest historis, dan laboratorium sensitivitas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DATASET */}
      {activeTab === 'dataset' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 font-display text-sm font-bold text-slate-900">
              Inventaris Dataset Sistem PANDAI PANGAN
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2.5">Dataset</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Sumber</th>
                    <th className="px-3 py-2.5">Tanggal / Periode</th>
                    <th className="px-3 py-2.5">Catatan Kualitas & Cakupan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {datasetInventory.map((d) => (
                    <tr key={d.nama} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{d.nama}</td>
                      <td className="px-3 py-2.5">
                        <DataBadge status={d.status} compact />
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{d.sumber}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                        {d.tanggal}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        <span className="font-medium text-slate-800">{d.cakupan}:</span> {d.catatan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Data Nyata: Inflasi, Harga, Padi BPS, Iklim */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Data Nyata A: Inflasi Nasional 2026 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Data Nyata A: Inflasi Nasional Agu–Okt 2026 & PMI
                </h4>
                <DataBadge status="NYATA" sumber="BI No.28/238/DKom & BPS" compact />
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2">Indikator</th>
                      <th className="px-3 py-2 text-right">Agu 2026</th>
                      <th className="px-3 py-2 text-right">Sep 2026</th>
                      <th className="px-3 py-2 text-right">Okt 2026</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {dataNyata.inflasi_nasional_2026.seri.map((r) => (
                      <tr key={r.indikator}>
                        <td className="px-3 py-2 font-sans font-medium text-slate-800">
                          {r.indikator}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.agu_2026 !== null ? `${r.agu_2026}%` : '–'}
                        </td>
                        <td className="px-3 py-2 text-right">{r.sep_2026}%</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {r.okt_2026}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="px-3 py-2 font-sans font-semibold text-slate-800">
                        PMI Manufaktur Indonesia
                      </td>
                      <td className="px-3 py-2 text-right">–</td>
                      <td className="px-3 py-2 text-right">52,4</td>
                      <td className="px-3 py-2 text-right font-bold text-sky-800">54,0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Nyata C: Produksi Padi & Beras BPS 2023-2025 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Data Nyata C: Luas Panen & Produksi Padi 2023–2025
                </h4>
                <DataBadge status="NYATA" sumber="BPS (KSA)" compact />
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2">Tahun</th>
                      <th className="px-3 py-2 text-right">Luas Panen</th>
                      <th className="px-3 py-2 text-right">Padi (GKG)</th>
                      <th className="px-3 py-2 text-right">Beras</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {dataNyata.produksi_padi_beras_bps.tahunan.map((t) => (
                      <tr key={t.tahun}>
                        <td className="px-3 py-2 font-bold text-slate-900">{t.tahun}</td>
                        <td className="px-3 py-2 text-right">{t.luas_panen_juta_ha} jt ha</td>
                        <td className="px-3 py-2 text-right">{t.produksi_gkg_juta_ton} jt ton</td>
                        <td className="px-3 py-2 text-right">
                          {t.produksi_beras_juta_ton ? `${t.produksi_beras_juta_ton} jt ton` : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-600">
                Produsen beras 2025 terbesar: Jawa Timur (~6 jt ton), Sumatera Selatan (2,04 jt
                ton), Lampung (1,82 jt ton), Banten (1,01 jt ton). Konsumsi nasional 2025: 30,81 jt
                ton (surplus).
              </div>
            </div>
          </div>

          {/* Data Nyata B & D */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-slate-900">
                Data Nyata D: Kejadian Iklim (El Niño & Kemarau 2026) dan Kebijakan
              </h4>
              <DataBadge status="NYATA" sumber="BMKG, BI, Kementan" compact />
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {dataNyata.iklim_dan_kebijakan.map((item) => (
                <div
                  key={item.peristiwa}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div className="font-bold text-slate-900">{item.peristiwa}</div>
                  <p className="mt-1 leading-relaxed text-slate-700">{item.keterangan}</p>
                  <div className="mt-1.5 text-[10px] font-medium text-emerald-800">
                    NYATA · {item.sumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PIPELINE & EARLY WARNINGS FOR ALL */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Alur Pipeline Data ke Keputusan & Keselarasan 4 Pilar Early Warnings for All (WMO 2024)
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Setiap tahap menjaga keterlacakan sumber (NYATA vs SIMULASI) dan memastikan keputusan
              akhir tetap berada di tangan analis Bank Indonesia dan TPIP-TPID.
            </p>

            {/* 6-Stage Flow Diagram */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-6">
              {[
                {
                  step: '01. Ingest Data',
                  detail: 'BMKG (iklim), PIHPS/Bapanas/SP2KP (harga), BPS (KSA/IHK), PMI/REI.',
                  pilar: 'Pilar 1 & 2',
                },
                {
                  step: '02. Pembersihan',
                  detail: 'Pisah seri antarlembaga, deteksi anomali (mis. PIHPS 6 Okt), simpan versi revisi.',
                  pilar: 'Pilar 2',
                },
                {
                  step: '03. Rekayasa Fitur',
                  detail: 'Hitung skor PASOK (0,4+0,3+0,3), deviasi HAP, dan indeks kekeringan.',
                  pilar: 'Pilar 1 & 2',
                },
                {
                  step: '04. Model & Simulasi',
                  detail: 'Proyeksi XGBoost/SARIMAX (simulasi), detektor REDD, dan sensitivitas ΔP/P.',
                  pilar: 'Pilar 2',
                },
                {
                  step: '05. Peringatan Dini',
                  detail: 'Klasifikasi Normal, Waspada, Siaga, Awas & rekomendasi rute JALUR.',
                  pilar: 'Pilar 3',
                },
                {
                  step: '06. Verifikasi Analis',
                  detail: 'Status Menunggu → Terverifikasi Analis BI/TPID → pemetaan aksi 4K GPIPS.',
                  pilar: 'Pilar 3 & 4',
                },
              ].map((node, idx) => (
                <div
                  key={node.step}
                  className="relative flex flex-col justify-between rounded-lg border border-slate-300 bg-slate-50 p-3"
                >
                  <div>
                    <div className="font-mono text-[10px] font-semibold text-sky-800">
                      {node.pilar}
                    </div>
                    <div className="mt-0.5 font-display text-xs font-bold text-slate-900">
                      {node.step}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                      {node.detail}
                    </p>
                  </div>
                  {idx < 5 && (
                    <ArrowRight className="mt-2 hidden h-4 w-4 self-end text-slate-400 md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4 Pillars WMO */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              {
                pilar: 'Pilar 1 · Risk Knowledge (Pengetahuan Risiko)',
                modul: 'PASOK, IKLIM & Dataset Historis',
                uraian:
                  'Pemetaan kerentanan komoditas (beras rendah vs cabai tinggi), ketergantungan sentra 26 kabupaten, serta catatan historis dampak El Niño 2023 ke produksi padi 2024 (-1,6%).',
              },
              {
                pilar: 'Pilar 2 · Detection, Monitoring & Forecasting',
                modul: 'IKLIM, PROYEKSI, REDD & Kualitas Data',
                uraian:
                  'Pemantauan curah hujan/kekeringan BMKG, pemisahan seri harga lintas lembaga, penyaringan anomali (6 Okt), serta proyeksi 7–14 hari dengan pita ketidakpastian.',
              },
              {
                pilar: 'Pilar 3 · Warning Dissemination & Communication',
                modul: 'SIAGA & Komunikasi Efektif (4K)',
                uraian:
                  'Empat tingkat peringatan berwarna + angka (Normal/Waspada/Siaga/Awas) dengan gerbang verifikasi analis sebelum diteruskan ke forum koordinasi TPIP-TPID.',
              },
              {
                pilar: 'Pilar 4 · Preparedness & Response',
                modul: 'JALUR, SIMULASI & Aksi 4K GPIPS',
                uraian:
                  'Rekomendasi sentra alternatif saat wilayah berstatus Siaga/Awas, uji skenario guncangan pasokan, dan pemetaan aksi GPM, KAD, serta subsidi ongkos angkut.',
              },
            ].map((p) => (
              <div key={p.pilar} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-display text-xs font-bold text-[#0B1F3A]">{p.pilar}</div>
                <div className="mt-0.5 font-mono text-[11px] text-sky-800">Modul: {p.modul}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{p.uraian}</p>
              </div>
            ))}
          </div>

          {/* Arsitektur Lima Lapis SIAGA + Tata Kelola NIST AI RMF & Kesiapan Rupiah Digital */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Arsitektur Lima Lapis SIAGA, Tata Kelola AI & Kesiapan Rupiah Digital
                </h4>
                <p className="text-xs text-slate-500">
                  Mengacu NIST AI RMF 1.0 (Govern, Map, Measure, Manage), Satu Data Indonesia
                  (Perpres 39/2019), dan UU Pelindungan Data Pribadi (UU No. 27/2022).
                </p>
              </div>
              <DataBadge status="NYATA" sumber="Kerangka Esai SIAGA 2026" compact />
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5">
              {[
                {
                  lapis: 'S · Sumber Data',
                  isi: 'Cahaya malam VIIRS, QRIS agregat-anonim, data UMKM, serta indikator resmi (PDRB, IHK, harga pangan).',
                },
                {
                  lapis: 'I · Integrasi & Tata Kelola',
                  isi: 'Penyelarasan wilayah/periode, privacy-by-design (ambang merchant minimum per sel), kepatuhan UU PDP.',
                },
                {
                  lapis: 'A · Analitik AI',
                  isi: 'XGBoost sebagai model nowcasting utama vs benchmark DFM/AR; Isolation Forest deteksi anomali; SHAP untuk explainability.',
                },
                {
                  lapis: 'G · Geospasial',
                  isi: 'Peta tematik dan indeks wilayah/sel grid menghasilkan REI(i,t) = Σ wk·zk dan REDD(i,t) = max |zk − zl|.',
                },
                {
                  lapis: 'A · Aksi Kebijakan',
                  isi: 'Peringatan dini + tingkat keyakinan bagi analis BI & TPID; siap integrasi sinyal Rupiah Digital (PoC Proyek Garuda).',
                },
              ].map((l) => (
                <div key={l.lapis} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="font-display font-bold text-[#0B1F3A]">{l.lapis}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{l.isi}</p>
                </div>
              ))}
            </div>

            {/* Peta Jalan 2027-2029+ */}
            <div className="mt-4 border-t border-slate-200 pt-3">
              <div className="mb-2 text-xs font-bold text-slate-800">
                Peta Jalan Implementasi & Integrasi Kelembagaan SIAGA
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                {dataNyata.siaga_ekonomi_2026.peta_jalan.map((pj) => (
                  <div key={pj.tahap} className="rounded border border-slate-200 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{pj.tahap}</span>
                      <span className="font-mono text-sky-800">{pj.waktu}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{pj.keluaran}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KUALITAS DATA */}
      {activeTab === 'kualitas' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Aturan Metodologi: Seri Harga Antarlembaga Tidak Boleh Digabung Tanpa Penyesuaian
              </span>
              <DataBadge status="NYATA" sumber="PIHPS · Bapanas · SP2KP" compact />
            </div>
            <p className="mt-1 leading-relaxed">
              Pada tanggal yang sama (1 Oktober 2026), harga cabai rawit merah tercatat{' '}
              <strong className="font-mono">Rp101.550/kg</strong> di PIHPS Nasional (BI), namun{' '}
              <strong className="font-mono">Rp80.420/kg</strong> di SP2KP Kemendag (selisih{' '}
              <strong className="font-mono">Rp21.130/kg</strong>) karena perbedaan definisi pasar
              pantauan dan cakupan responden.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {/* Chart Perbedaan Seri & Anomali 6 Okt */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    Perbandingan Seri Cabai Rawit Merah & Deteksi Anomali 6 Okt 2026
                  </h4>
                  <p className="text-xs text-slate-500">
                    PIHPS 6 Okt (Rp114.000) melonjak tajam dibanding 1 Okt (Rp101.550) & 8 Okt
                    (Rp102.250).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCleanedSeries((v) => !v)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    showCleanedSeries
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  {showCleanedSeries
                    ? 'Tampilan: Seri Ditandai & Dibersihkan'
                    : 'Tampilan: Data Mentah (Anomali Terlihat)'}
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={rawitSeriesChart}
                    margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={[75000, 120000]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`}
                    />
                    <Tooltip formatter={(v) => formatRupiah(Number(v ?? 0))} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey={showCleanedSeries ? 'PIHPS_Bersih' : 'PIHPS'}
                      name={
                        showCleanedSeries
                          ? 'PIHPS (Anomali 6 Okt Ditandai)'
                          : 'PIHPS Nasional / Pemberitaan'
                      }
                      stroke="#DC2626"
                      strokeWidth={2.2}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="Bapanas"
                      name="Panel Harga Bapanas"
                      stroke="#0284C7"
                      strokeWidth={2.2}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="SP2KP"
                      name="SP2KP Kemendag"
                      stroke="#16A34A"
                      strokeWidth={2.2}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="Kemendag"
                      name="Kemendag Rata-rata Nasional"
                      stroke="#D97706"
                      strokeWidth={2.2}
                      connectNulls
                    />
                    {!showCleanedSeries && (
                      <ReferenceDot
                        x="6 Okt (Anomali)"
                        y={114000}
                        r={6}
                        fill="#DC2626"
                        stroke="#0F172A"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Penandaan Anomali & Riwayat Revisi BPS */}
            <div className="space-y-3 xl:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Mekanisme Penandaan Anomali Sistem
                </h4>
                <div className="mt-2 space-y-2 text-xs text-slate-700">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
                    <div className="font-semibold text-red-900">
                      Flag: ANOMALI_CAKUPAN · 6 Okt 2026 (PIHPS Pemberitaan)
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-red-800">
                      Rawit merah Rp114.000 (+12,3% dalam 5 hari) lalu kembali ke Rp102.250 pada 8
                      Okt. Sistem menandai titik ini sebagai perbedaan cakupan/outlier agar tidak
                      langsung memicu alarm Awas palsu.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <div className="font-semibold text-slate-900">
                      Flag: PERLU_VERIFIKASI · HAP Cabai Merah Rp55.000/kg
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      Artikel sumber menulis angka 55.000 pada kalimat ambigu; sistem menandai agar
                      diverifikasi ke Permendag/Bapanas resmi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    Versi Data & Riwayat Revisi Beras 2025
                  </h4>
                  <DataBadge status="NYATA" sumber="BPS" compact />
                </div>
                <div className="space-y-1.5 text-xs">
                  {dataNyata.produksi_padi_beras_bps.riwayat_revisi_2025.map((rev) => (
                    <div
                      key={rev.versi}
                      className="flex items-center justify-between rounded border border-slate-200 px-2.5 py-1.5"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{rev.versi}</span>
                        <span className="ml-2 text-[11px] text-slate-500">{rev.keterangan}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {rev.produksi_beras_juta_ton} jt ton
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Koreksi Bias Tiga Sinyal SIAGA */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Koreksi Bias Tiga Sinyal Ekonomi Alternatif (Mengapa Tidak Boleh Dibaca Mentah)
                </h4>
                <p className="text-xs text-slate-500">
                  Pertumbuhan QRIS +100,12% mencerminkan adopsi, bukan pertumbuhan PDB 100%; setiap
                  sinyal dikalibrasi terhadap indikator resmi.
                </p>
              </div>
              <DataBadge status="NYATA" sumber="Tabel 1 Esai SIAGA 2026" compact />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2">Sinyal</th>
                    <th className="px-3 py-2">Yang Direkam</th>
                    <th className="px-3 py-2">Bias Utama</th>
                    <th className="px-3 py-2">Koreksi dalam Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dataNyata.siaga_ekonomi_2026.tabel_koreksi_sinyal.map((row) => (
                    <tr key={row.sinyal} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-900">{row.sinyal}</td>
                      <td className="px-3 py-2 text-slate-700">{row.direkam}</td>
                      <td className="px-3 py-2 text-amber-900">{row.bias}</td>
                      <td className="px-3 py-2 font-medium text-emerald-800">{row.koreksi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKTEST SEP-OKT 2026 */}
      {activeTab === 'backtest' && (
        <div className="space-y-4">
          {/* Step Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                '1. Masukan 1 Okt 2026',
                '2. Respons 6 Fitur',
                '3. Realisasi Okt 2026',
                '4. Analog El Niño 2023',
              ].map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setBacktestStep(idx)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    backtestStep === idx
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={backtestStep === 0}
                onClick={() => setBacktestStep((s) => Math.max(0, s - 1))}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                disabled={backtestStep === 3}
                onClick={() => setBacktestStep((s) => Math.min(3, s + 1))}
                className="inline-flex items-center gap-1 rounded-md bg-[#0B1F3A] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#13325c] disabled:opacity-40"
              >
                <span>Langkah Berikutnya</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Step Content */}
          {backtestStep === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Langkah 1: Kondisi Masukan Sistem pada Posisi 1 Oktober 2026
                </h3>
                <DataBadge status="NYATA" sumber="BMKG, BPS, Kemendag, BI" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <div className="font-semibold text-slate-600">Sinyal Iklim (BMKG)</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {dataNyata.backtest_sep_okt_2026.kondisi_masukan_1_okt.el_nino}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <div className="font-semibold text-slate-600">Inflasi Volatile Food Sep 2026</div>
                  <div className="mt-1 font-mono text-lg font-bold text-orange-700">
                    1,46% mtm · 5,03% yoy
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <div className="font-semibold text-slate-600">
                    Harga Rata-rata Nasional Sep 2026
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                    Cabai Merah: Rp57.383/kg
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    Cabai Rawit: Rp78.802/kg
                  </div>
                </div>
              </div>
            </div>
          )}

          {backtestStep === 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Langkah 2: Respons Enam Fitur Inti PANDAI PANGAN
                </h3>
                <DataBadge status="SIMULASI" sumber="Uji Mundur Perilaku Sistem" compact />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    fitur: 'IKLIM',
                    isi: 'Anomali kekeringan di sentra hortikultura Jawa, Sumatera, dan Sulawesi terdeteksi kuat.',
                  },
                  {
                    fitur: 'PASOK',
                    isi: 'Skor kerentanan cabai tinggi (Siaga/Awas); beras tetap rendah berkat surplus 2025 & stok kuat.',
                  },
                  {
                    fitur: 'PROYEKSI',
                    isi: 'Probabilitas lonjakan cabai 7–14 hari tinggi, disertai pita ketidakpastian & faktor iklim-musiman.',
                  },
                  {
                    fitur: 'SIAGA & REDD',
                    isi: 'Status Siaga cabai setelah verifikasi analis; REDD menandai wilayah yang harganya naik meski pasokan nasional cukup.',
                  },
                  {
                    fitur: 'JALUR',
                    isi: 'Menghasilkan rekomendasi wilayah alternatif sumber cabai untuk simpul konsumsi yang melonjak.',
                  },
                  {
                    fitur: 'SIMULASI',
                    isi: 'Membandingkan skenario El Niño bertahan hingga awal 2027 vs kembali normal dan dampaknya ke cabai.',
                  },
                ].map((f) => (
                  <div key={f.fitur} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="font-display font-bold text-[#0B1F3A]">{f.fitur}</div>
                    <p className="mt-1 leading-relaxed text-slate-700">{f.isi}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {backtestStep === 2 && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 xl:grid-cols-12">
              <div className="space-y-3 xl:col-span-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Langkah 3: Perbandingan dengan Realisasi Oktober 2026
                  </h3>
                  <DataBadge status="NYATA" sumber="Kemendag & BI 2 Nov 2026" compact />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="font-semibold text-slate-800">Cabai Merah (rata-rata nasional)</span>
                    <span className="font-mono font-bold text-red-700">
                      57.383 → 63.913 (+11,4%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="font-semibold text-slate-800">Cabai Rawit (rata-rata nasional)</span>
                    <span className="font-mono font-bold text-red-700">
                      78.802 → 86.846 (+10,2%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="font-semibold text-slate-800">Volatile Food Oktober 2026</span>
                    <span className="font-mono font-bold text-orange-700">
                      0,77% mtm · 5,81% yoy
                    </span>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                    <strong>Kesimpulan Uji Mundur:</strong> Pendorong utama realisasi inflasi
                    pangan Oktober 2026 adalah cabai merah dan cabai rawit, konsisten dengan sinyal
                    peringatan awal sistem.
                  </div>
                </div>
              </div>
              <div className="h-60 xl:col-span-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={backtestCompareChart} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="komoditas" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`}
                    />
                    <Tooltip formatter={(v) => formatRupiah(Number(v ?? 0))} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="September" name="Masukan Sep 2026 (NYATA)" fill="#64748B" radius={[3, 3, 0, 0]} />
                    <Bar
                      dataKey="Oktober_Realisasi"
                      name="Realisasi Awal Okt 2026 (NYATA)"
                      fill="#DC2626"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {backtestStep === 3 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Langkah 4: Skenario Analog Historis El Niño 2023 → Awal 2024
                </h3>
                <DataBadge status="NYATA" sumber="BMKG, BPS, BI (2024)" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <div className="font-semibold text-slate-600">Guncangan Iklim 2023</div>
                  <div className="mt-1 font-bold text-slate-900">El Niño & IOD Positif 2023</div>
                  <p className="mt-1 text-slate-600">
                    Kekeringan berkepanjangan menggeser musim tanam padi nasional.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <div className="font-semibold text-slate-600">Dampak Produksi Padi 2024</div>
                  <div className="mt-1 font-mono text-lg font-bold text-red-700">Turun ~1,6%</div>
                  <p className="mt-1 text-slate-600">
                    GKG turun dari 53,98 jt ton (2023) menjadi 53,14 jt ton (2024); luas panen
                    10,21 → 10,05 jt ha.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <div className="font-semibold text-slate-600">Lonjakan Volatile Food Feb 2024</div>
                  <div className="mt-1 font-mono text-lg font-bold text-red-700">8,47% (yoy)</div>
                  <p className="mt-1 text-slate-600">
                    Didorong beras, cabai merah, dan telur ayam ras. Catatan 2026: stok pemerintah
                    lebih kuat dibanding puncak El Niño 2023.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MODEL LAB */}
      {activeTab === 'lab' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Laboratorium Sensitivitas Model
              </h3>
              <DataBadge status="SIMULASI" compact />
            </div>
            <p className="text-xs text-amber-800">
              Label wajib: <strong>Simulasi, bukan model terlatih</strong>. Ubah parameter di bawah
              untuk mengamati respons harga & ketidakpastian.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Komoditas</label>
                <select
                  value={labKomoditas}
                  onChange={(e) => setLabKomoditas(e.target.value as KomoditasId)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5"
                >
                  {Object.values(KOMODITAS_META).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Arsitektur Model</label>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  {(['XGBoost', 'SARIMAX'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLabModel(m)}
                      className={`flex-1 rounded-md py-1 text-xs font-semibold ${
                        labModel === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Penurunan Pasokan Efektif (x)</span>
                  <span className="font-mono">{labDropPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={labDropPct}
                  onChange={(e) => setLabDropPct(Number(e.target.value))}
                  className="mt-1 w-full accent-[#0B1F3A]"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Elastisitas Permintaan (εd)</span>
                  <span className="font-mono">{labEd.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={labEd}
                  onChange={(e) => setLabEd(Number(e.target.value))}
                  className="mt-1 w-full accent-[#0B1F3A]"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Elastisitas Penawaran (εs)</span>
                  <span className="font-mono">{labEs.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={labEs}
                  onChange={(e) => setLabEs(Number(e.target.value))}
                  className="mt-1 w-full accent-[#0B1F3A]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Prediksi Harga ({labModel} Simulasi)</div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {formatRupiah(labResult.sim.harga_proyeksi)}
                </div>
                <div className="font-mono text-xs font-semibold text-orange-700">
                  +{labResult.sim.kenaikan_harga_pct}% vs baseline
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Probabilitas Lonjakan</div>
                <div className="mt-1 font-mono text-lg font-bold text-red-700">
                  {labResult.probLonjakan}%
                </div>
                <div className="text-[11px] text-slate-500">Simulasi, bukan model terlatih</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Rentang Ketidakpastian</div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {formatRupiah(labResult.batasBawah)} – {formatRupiah(labResult.batasAtas)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Rumus: {labDropPct}% / ({labEd} + {labEs})
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={labResult.curve} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="drop" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`}
                  />
                  <Tooltip
                    formatter={(val, name) => {
                      if (Array.isArray(val)) {
                        return [
                          `${formatRupiah(Number(val[0]))} – ${formatRupiah(Number(val[1]))}`,
                          'Rentang Ketidakpastian',
                        ];
                      }
                      return [formatRupiah(Number(val ?? 0)), String(name ?? '')];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="pita"
                    name="Rentang Ketidakpastian (Simulasi)"
                    stroke="none"
                    fill="#FDBA74"
                    fillOpacity={0.4}
                  />
                  <Line
                    type="monotone"
                    dataKey="harga"
                    name={`Kurva Sensitivitas ${labModel} (Simulasi)`}
                    stroke="#0B1F3A"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

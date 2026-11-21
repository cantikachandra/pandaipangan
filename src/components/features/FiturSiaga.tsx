import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { KomoditasId, PeriodeId, Strategi4K, VerifikasiRecord } from '../../types/pangan';
import {
  formatRupiah,
  getAlertStyle,
  KOMODITAS_META,
  panganDataAdapter,
  type ProvinsiSnapshot,
} from '../../services/dataAdapter';
import { DataBadge } from '../DataBadge';

interface FiturSiagaProps {
  snapshots: ProvinsiSnapshot[];
  komoditas: KomoditasId;
  periode: PeriodeId;
  verifikasiMap: Record<string, VerifikasiRecord>;
  onVerifikasi: (provinsiKode: string, catatan: string) => void;
  onSelectProvinsi: (kode: string) => void;
}

export const FiturSiaga: React.FC<FiturSiagaProps> = ({
  snapshots,
  komoditas,
  periode,
  verifikasiMap,
  onVerifikasi,
  onSelectProvinsi,
}) => {
  const [filter4K, setFilter4K] = useState<'Semua' | Strategi4K>('Semua');
  const dataNyata = panganDataAdapter.getDataNyata();
  const pmiOkt = dataNyata.inflasi_nasional_2026.pmi_manufaktur.okt_2026;
  const pmiSep = dataNyata.inflasi_nasional_2026.pmi_manufaktur.sep_2026;
  const siagaMakro = dataNyata.siaga_ekonomi_2026;

  const avgRei =
    snapshots.reduce((acc, s) => acc + s.rei.rei_skor, 0) / Math.max(1, snapshots.length);
  const reddProvinces = snapshots.filter((s) => s.rei.redd_flag);
  const priorityProvinces = [...snapshots]
    .filter((s) => s.kerentanan.level_siaga === 'Awas' || s.kerentanan.level_siaga === 'Siaga')
    .sort((a, b) => b.kerentanan.skor_pasok - a.kerentanan.skor_pasok);

  const verifiedCount = priorityProvinces.filter(
    (s) => verifikasiMap[`${s.wilayah.provinsi_kode}:${komoditas}`]?.status === 'Terverifikasi'
  ).length;

  const gpips4KSummary: {
    strategi: Strategi4K;
    fokus: string;
    jumlahWilayah: number;
    tindakan: string;
  }[] = [
    {
      strategi: 'Keterjangkauan Harga',
      fokus: 'Wilayah di atas HAP >15%',
      jumlahWilayah: snapshots.filter((s) => (s.harga.di_atas_hap_pct ?? 0) > 15).length,
      tindakan: `Operasi pasar & Gerakan Pangan Murah (GPM) ${KOMODITAS_META[komoditas].label} di simpul konsumsi.`,
    },
    {
      strategi: 'Ketersediaan Pasokan',
      fokus: 'Sentra berisiko iklim tinggi',
      jumlahWilayah: snapshots.filter((s) => s.kerentanan.risiko_iklim >= 60).length,
      tindakan: 'Pengamanan cadangan pangan, dukungan pompanisasi, dan pemantauan stok gudang.',
    },
    {
      strategi: 'Kelancaran Distribusi',
      fokus: 'Anomali REDD & koridor padat',
      jumlahWilayah: reddProvinces.length,
      tindakan: 'Fasilitasi Subsidi Ongkos Angkut (SOA) & Kerja Sama Antar Daerah (KAD).',
    },
    {
      strategi: 'Komunikasi Efektif',
      fokus: 'Seluruh TPID provinsi prioritas',
      jumlahWilayah: priorityProvinces.length,
      tindakan: 'Rilis informasi stok & harga terverifikasi bersama TPIP-TPID (GPIPS 13 Mei 2026).',
    },
  ];

  const displayed4K =
    filter4K === 'Semua'
      ? gpips4KSummary
      : gpips4KSummary.filter((item) => item.strategi === filter4K);

  return (
    <div className="space-y-4">
      {/* Top KPI Cards: REI (Nowcasting), REDD, Verifikasi Analis */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* REI */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Regional Economic Index (REI)
            </span>
            <span className="font-mono text-[11px] font-medium text-sky-800">
              REI(i,t) = Σ wk·zk
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900">
              {avgRei.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">rata-rata 38 provinsi (0–100)</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-600">
            <span>
              Jangkar PMI:{' '}
              <strong className="font-mono text-slate-900">
                {periode === '2026-09' ? pmiSep : pmiOkt}
              </strong>{' '}
              · BI-Rate <strong className="font-mono text-slate-900">5,75%</strong>
            </span>
            <DataBadge status="NYATA" sumber="BI & PMI" compact />
          </div>
        </div>

        {/* REDD */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Discrepancy Detector (REDD)
            </span>
            <span className="font-mono text-[11px] font-medium text-amber-800">
              max |zk − zl| &gt; τ
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-amber-700">
              {reddProvinces.length}
            </span>
            <span className="text-xs text-slate-500">wilayah deviasi antarsinyal</span>
          </div>
          <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-slate-600">
            {reddProvinces.length > 0
              ? 'Mengukur ketidakselarasan antar-sinyal (cahaya malam VIIRS, QRIS UMKM, pasokan, dan harga).'
              : 'Tidak ada anomali ketidakselarasan signifikan untuk komoditas ini.'}
          </p>
        </div>

        {/* Verifikasi Analis */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Verifikasi Analis BI / TPID
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Human-in-the-Loop
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900">
              {verifiedCount}/{priorityProvinces.length}
            </span>
            <span className="text-xs text-slate-500">peringatan Siaga/Awas terverifikasi</span>
          </div>
          <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-slate-600">
            SIAGA bukan pengambil keputusan otomatis; analis memvalidasi status sebelum tindak
            lanjut TPID.
          </p>
        </div>
      </div>

      {/* Konteks Makro & Disparitas PDRB TW III 2026 + Sinyal Alternatif (dari Esai SIAGA) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              Nowcasting Disparitas Ekonomi Daerah & Sinyal Alternatif (TW III 2026)
            </h3>
            <p className="text-xs text-slate-500">
              PDB rilis dengan jeda 36 hari; sinyal VIIRS, QRIS (65,77 jt pengguna · 44,86 jt
              merchant, 96,68% UMKM), dan harga pangan menjembatani jeda antar-RDG.
            </p>
          </div>
          <DataBadge status="NYATA" sumber="BPS & BI (Okt–Nov 2026)" compact />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {siagaMakro.pdrb_tw3_2026_daerah.map((d) => (
            <button
              key={d.wilayah}
              type="button"
              onClick={() => d.provinsi_kode !== '00' && onSelectProvinsi(d.provinsi_kode)}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                d.provinsi_kode === '00'
                  ? 'border-sky-200 bg-sky-50/70'
                  : 'border-slate-200 bg-slate-50 hover:border-sky-400'
              }`}
            >
              <div className="truncate text-[11px] font-semibold text-slate-700">{d.wilayah}</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-slate-900">{d.label}</div>
              <div className="text-[10px] text-slate-500">PDRB TW III (yoy)</div>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Queue & Verification Table + 4K Strategy */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
          <div className="mb-3">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Antrean Peringatan & Verifikasi ({KOMODITAS_META[komoditas].label})
            </h3>
            <p className="text-xs text-slate-500">
              Klik nama provinsi untuk fokus peta, atau verifikasi langsung peringatan wilayah.
            </p>
          </div>

          {priorityProvinces.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              Seluruh 38 provinsi berada pada level Normal atau Waspada untuk{' '}
              {KOMODITAS_META[komoditas].label} (tidak ada status Siaga/Awas).
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2">Provinsi</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2 text-right">Harga</th>
                    <th className="px-3 py-2">Status Verifikasi</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {priorityProvinces.slice(0, 12).map((s) => {
                    const st = getAlertStyle(s.kerentanan.level_siaga);
                    const verif = verifikasiMap[`${s.wilayah.provinsi_kode}:${komoditas}`];
                    const isVerified = verif?.status === 'Terverifikasi';

                    return (
                      <tr key={s.wilayah.provinsi_kode} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onSelectProvinsi(s.wilayah.provinsi_kode)}
                            className="font-semibold text-sky-900 hover:underline"
                          >
                            {s.wilayah.nama}
                          </button>
                          {s.rei.redd_flag && (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700">
                              <AlertTriangle className="h-3 w-3" />
                              REDD Aktif
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${st.bg} ${st.text} ${st.border}`}
                          >
                            {st.kodeAngka}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-800">
                          {formatRupiah(s.harga.nilai)}
                        </td>
                        <td className="px-3 py-2">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800">
                              <Clock className="h-3.5 w-3.5" />
                              Menunggu Verifikasi
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isVerified ? (
                            <button
                              type="button"
                              onClick={() => onSelectProvinsi(s.wilayah.provinsi_kode)}
                              className="rounded border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Detail
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onVerifikasi(
                                  s.wilayah.provinsi_kode,
                                  `Verifikasi cepat level ${s.kerentanan.level_siaga} oleh Analis.`
                                )
                              }
                              className="rounded bg-[#0B1F3A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#13325c]"
                            >
                              Verifikasi
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Prioritas Koordinasi Strategi 4K (GPIPS) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Prioritas Koordinasi Strategi 4K
              </h3>
              <p className="text-xs text-slate-500">
                Kerangka GPIPS Bank Indonesia (diluncurkan 13 Mei 2026)
              </p>
            </div>
            <DataBadge status="NYATA" sumber="BI (2026b) GPIPS" compact />
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {(
              [
                'Semua',
                'Keterjangkauan Harga',
                'Ketersediaan Pasokan',
                'Kelancaran Distribusi',
                'Komunikasi Efektif',
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter4K(tab)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  filter4K === tab
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab === 'Semua' ? 'Semua 4K' : tab.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {displayed4K.map((item) => (
              <div
                key={item.strategi}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.strategi}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-sky-800">
                    <TrendingUp className="h-3 w-3" />
                    {item.jumlahWilayah} provinsi
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-500">{item.fokus}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.tindakan}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

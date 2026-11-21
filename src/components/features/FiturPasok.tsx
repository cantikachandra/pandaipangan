import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { KomoditasId, PeriodeId } from '../../types/pangan';
import {
  formatRupiah,
  getAlertStyle,
  KOMODITAS_META,
  panganDataAdapter,
  PERIODE_META,
  type ProvinsiSnapshot,
} from '../../services/dataAdapter';
import { DataBadge } from '../DataBadge';

interface FiturPasokProps {
  snapshots: ProvinsiSnapshot[];
  komoditas: KomoditasId;
  periode: PeriodeId;
  onSelectProvinsi: (kode: string) => void;
}

export const FiturPasok: React.FC<FiturPasokProps> = ({
  snapshots,
  komoditas,
  periode,
  onSelectProvinsi,
}) => {
  const dataNyata = panganDataAdapter.getDataNyata();

  const komoditasSummary = useMemo(() => {
    return [
      { komoditas: 'Beras', rataSkor: 24 },
      { komoditas: 'Telur Ayam', rataSkor: 37 },
      { komoditas: 'Bawang Merah', rataSkor: 56 },
      { komoditas: 'Cabai Merah', rataSkor: 74 },
      { komoditas: 'Cabai Rawit', rataSkor: 79 },
    ];
  }, []);

  const sentraPrioritas = useMemo(() => {
    return [...snapshots]
      .filter((s) => s.wilayah.peran === 'sentra' || s.wilayah.sentra_komoditas.includes(komoditas))
      .sort((a, b) => b.kerentanan.skor_pasok - a.kerentanan.skor_pasok);
  }, [snapshots, komoditas]);

  return (
    <div className="space-y-4">
      {/* Formula Banner + BPS Surplus Real Context */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-7">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Skor Kerentanan PASOK ({KOMODITAS_META[komoditas].label} · {PERIODE_META[periode].singkat})
          </h3>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
            Skor PASOK (0–100) = 0,4 × Risiko Iklim + 0,3 × Ketergantungan Musim + 0,3 × Defisit Pasokan
          </div>
          <p className="mt-2 text-xs text-slate-600">{KOMODITAS_META[komoditas].karakter}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900">
              Kalender Panen & Surplus Padi 2025
            </span>
            <DataBadge status="NYATA" sumber="BPS (KSA 2025)" compact />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
            {dataNyata.produksi_padi_beras_bps.pola_musiman_2025.map((m) => (
              <div key={m.bulan} className="rounded border border-slate-200 bg-slate-50 p-1.5">
                <div className="font-semibold text-slate-700">{m.bulan.slice(0, 3)}</div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {m.luas_panen_juta_ha} jt ha
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-600">
            Produksi beras 2025{' '}
            <strong className="font-mono">34,69 jt ton</strong> vs konsumsi{' '}
            <strong className="font-mono">30,81 jt ton</strong> → beras berkerentanan rendah.
          </p>
        </div>
      </div>

      {/* Commodity Comparison Chart & Priority Centers Table */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <h4 className="mb-2 font-display text-sm font-bold text-slate-900">
            Perbandingan Kerentanan Antarkomoditas
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={komoditasSummary}
                layout="vertical"
                margin={{ top: 6, right: 16, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="komoditas" width={92} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${Number(v ?? 0)}/100`, 'Skor PASOK']} />
                <Bar dataKey="rataSkor" fill="#0B1F3A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
          <div className="mb-2">
            <h4 className="font-display text-sm font-bold text-slate-900">
              Daftar Sentra Prioritas ({KOMODITAS_META[komoditas].label})
            </h4>
            <p className="text-xs text-slate-500">
              Rincian komponen 0,4 Iklim + 0,3 Musim + 0,3 Defisit per provinsi sentra
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2">Provinsi Sentra</th>
                  <th className="px-2 py-2 text-right">Iklim (0,4)</th>
                  <th className="px-2 py-2 text-right">Musim (0,3)</th>
                  <th className="px-2 py-2 text-right">Defisit (0,3)</th>
                  <th className="px-2 py-2 text-right">Skor</th>
                  <th className="px-3 py-2 text-right">Harga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sentraPrioritas.map((s) => {
                  const st = getAlertStyle(s.kerentanan.level_siaga);
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
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-slate-600">
                        {s.kerentanan.risiko_iklim}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-slate-600">
                        {s.kerentanan.ketergantungan_musim}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-slate-600">
                        {s.kerentanan.defisit_pasokan}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className={`font-mono font-bold ${st.text}`}>
                          {s.kerentanan.skor_pasok}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">
                        {formatRupiah(s.harga.nilai)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

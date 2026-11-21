import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import type { KomoditasId, SimulasiSkenario } from '../../types/pangan';
import { formatRupiah, KOMODITAS_META, panganDataAdapter } from '../../services/dataAdapter';
import { DataBadge } from '../DataBadge';

interface FiturSimulasiProps {
  defaultKomoditas: KomoditasId;
}

export const FiturSimulasi: React.FC<FiturSimulasiProps> = ({ defaultKomoditas }) => {
  const [activeTab, setActiveTab] = useState<'skenario' | 'evaluasi'>('skenario');
  const [jenis, setJenis] = useState<'kekeringan' | 'hujan_ekstrem' | 'hambatan_distribusi'>(
    'kekeringan'
  );
  const [keparahan, setKeparahan] = useState<'ringan' | 'sedang' | 'berat'>('sedang');
  const [durasi, setDurasi] = useState<number>(21);
  const [komoditas, setKomoditas] = useState<KomoditasId>(defaultKomoditas);
  const [elastisitasD, setElastisitasD] = useState<number>(0.3);
  const [elastisitasS, setElastisitasS] = useState<number>(0.4);
  const [savedScenarios, setSavedScenarios] = useState<SimulasiSkenario[]>(() => [
    panganDataAdapter.hitungSimulasiSkenario({
      nama: 'Skenario A: Kemarau Sedang (Ilustratif PDF)',
      jenis: 'kekeringan',
      keparahan: 'sedang',
      durasi_hari: 21,
      komoditas: 'cabai_merah',
      elastisitas_permintaan: 0.3,
      elastisitas_penawaran: 0.4,
      customDropPct: 8.0,
    }),
    panganDataAdapter.hitungSimulasiSkenario({
      nama: 'Skenario B: El Niño Bertahan s.d. 2027',
      jenis: 'kekeringan',
      keparahan: 'berat',
      durasi_hari: 45,
      komoditas: 'cabai_merah',
      elastisitas_permintaan: 0.3,
      elastisitas_penawaran: 0.4,
    }),
  ]);

  const preview = useMemo(() => {
    const labelJenis =
      jenis === 'kekeringan'
        ? 'Kekeringan'
        : jenis === 'hujan_ekstrem'
          ? 'Hujan Ekstrem'
          : 'Hambatan Distribusi';
    return panganDataAdapter.hitungSimulasiSkenario({
      nama: `${labelJenis} (${keparahan}, ${durasi}h · ${KOMODITAS_META[komoditas].label})`,
      jenis,
      keparahan,
      durasi_hari: durasi,
      komoditas,
      elastisitas_permintaan: elastisitasD,
      elastisitas_penawaran: elastisitasS,
    });
  }, [jenis, keparahan, durasi, komoditas, elastisitasD, elastisitasS]);

  const handleSaveScenario = () => {
    if (savedScenarios.length >= 3) return;
    setSavedScenarios((prev) => [...prev, preview]);
  };

  const handleRemoveScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const comparisonChartData = useMemo(() => {
    const list = savedScenarios.length > 0 ? savedScenarios : [preview];
    return list.map((s, i) => ({
      name: `Skenario ${i + 1}`,
      fullNama: s.nama,
      baseline: s.harga_baseline,
      proyeksi: s.harga_proyeksi,
      kenaikanPct: s.kenaikan_harga_pct,
    }));
  }, [savedScenarios, preview]);

  // Contoh format evaluasi simulasi (bukan klaim akurasi model terlatih)
  const evalRows = [
    { komoditas: 'Beras', mape: '2,1%', precision: '0,88', recall: '0,85', leadTime: '11 hari' },
    { komoditas: 'Cabai Merah', mape: '7,4%', precision: '0,79', recall: '0,82', leadTime: '8 hari' },
    { komoditas: 'Cabai Rawit', mape: '8,6%', precision: '0,76', recall: '0,80', leadTime: '7 hari' },
    { komoditas: 'Bawang Merah', mape: '5,3%', precision: '0,81', recall: '0,78', leadTime: '9 hari' },
    { komoditas: 'Telur Ayam Ras', mape: '3,2%', precision: '0,86', recall: '0,84', leadTime: '10 hari' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('skenario')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'skenario'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simulasi Skenario & Pembanding (Maks. 3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evaluasi')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'evaluasi'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Evaluasi (MAPE, Precision, Recall, Lead Time)
          </button>
        </div>
        <DataBadge status="SIMULASI" sumber="Rumus ΔP/P ≈ x / (εd + εs)" />
      </div>

      {activeTab === 'skenario' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Builder Controls */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Konfigurasi Skenario Guncangan
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Jenis Skenario</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as typeof jenis)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="kekeringan">Kekeringan / El Niño</option>
                  <option value="hujan_ekstrem">Hujan Ekstrem / La Niña</option>
                  <option value="hambatan_distribusi">Hambatan Distribusi</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Komoditas</label>
                <select
                  value={komoditas}
                  onChange={(e) => setKomoditas(e.target.value as KomoditasId)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  {Object.values(KOMODITAS_META).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Keparahan</label>
                <select
                  value={keparahan}
                  onChange={(e) => setKeparahan(e.target.value as typeof keparahan)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="ringan">Ringan</option>
                  <option value="sedang">Sedang</option>
                  <option value="berat">Berat</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Durasi (Hari)</label>
                <select
                  value={durasi}
                  onChange={(e) => setDurasi(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value={7}>7 Hari</option>
                  <option value={14}>14 Hari</option>
                  <option value={21}>21 Hari</option>
                  <option value={30}>30 Hari</option>
                  <option value={45}>45 Hari</option>
                  <option value={60}>60 Hari</option>
                </select>
              </div>
            </div>

            {/* Elasticity Sliders */}
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="font-semibold text-slate-800">
                Parameter Sensitivitas: ΔP/P ≈ x / (εd + εs)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between">
                    <span>εd (Permintaan)</span>
                    <span className="font-mono font-bold">{elastisitasD.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={elastisitasD}
                    onChange={(e) => setElastisitasD(Number(e.target.value))}
                    className="mt-1 w-full accent-[#0B1F3A]"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>εs (Penawaran)</span>
                    <span className="font-mono font-bold">{elastisitasS.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={elastisitasS}
                    onChange={(e) => setElastisitasS(Number(e.target.value))}
                    className="mt-1 w-full accent-[#0B1F3A]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-600">
                Contoh ilustratif (asumsi): εd = 0,3 dan εs = 0,4 → kenaikan harga cabai merah
                +11,4% setara penurunan pasokan efektif ~8,0% (SIMULASI).
              </p>
            </div>

            {/* Live Preview Output */}
            <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-sky-950">
                <span>Pratinjau Dampak vs Baseline</span>
                <span className="font-mono text-orange-700">
                  +{preview.kenaikan_harga_pct}% harga
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div>
                  Pasokan: <strong className="text-red-700">-{preview.penurunan_pasokan_pct}%</strong>
                </div>
                <div>
                  Risiko: <strong>+{preview.perubahan_skor_risiko} poin</strong>
                </div>
                <div>
                  Proyeksi: <strong>{formatRupiah(preview.harga_proyeksi)}</strong>
                </div>
              </div>
              <button
                type="button"
                disabled={savedScenarios.length >= 3}
                onClick={handleSaveScenario}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#13325c] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>
                  {savedScenarios.length >= 3
                    ? 'Slot Pembanding Penuh (Maks. 3 Skenario)'
                    : 'Tambah ke Pembanding Skenario'}
                </span>
              </button>
            </div>
          </div>

          {/* Comparison Chart & Saved Slots */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Perbandingan Skenario vs Baseline ({savedScenarios.length}/3)
              </h3>
              <DataBadge status="SIMULASI" compact />
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`}
                  />
                  <Tooltip
                    formatter={(val, name) => [formatRupiah(Number(val ?? 0)), String(name ?? '')]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullNama ?? ''}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="baseline" name="Harga Baseline (Rp/kg)" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="proyeksi" name="Harga Skenario (SIMULASI)" fill="#EA580C" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {savedScenarios.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      Skenario {idx + 1}: {s.nama}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      Pasokan -{s.penurunan_pasokan_pct}% · εd={s.elastisitas_permintaan} · εs=
                      {s.elastisitas_penawaran} · Risiko +{s.perubahan_skor_risiko}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <div className="font-bold text-orange-700">+{s.kenaikan_harga_pct}%</div>
                      <div className="text-[11px] text-slate-600">
                        {formatRupiah(s.harga_proyeksi)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveScenario(s.id)}
                      title="Hapus skenario"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Evaluasi Kinerja Peringatan (Contoh Format Simulasi)
              </h3>
              <p className="text-xs text-slate-600">
                Karena model pada prototipe ini adalah simulasi (bukan model terlatih), angka di
                bawah ditampilkan sebagai contoh format metrik evaluasi (MAPE, Precision, Recall,
                dan Lead Time), bukan klaim akurasi operasional.
              </p>
            </div>
            <DataBadge status="SIMULASI" sumber="Contoh Format Evaluasi" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2.5">Komoditas</th>
                  <th className="px-3 py-2.5 text-right">MAPE Harga (Contoh)</th>
                  <th className="px-3 py-2.5 text-right">Precision Peringatan</th>
                  <th className="px-3 py-2.5 text-right">Recall Peringatan</th>
                  <th className="px-3 py-2.5 text-right">Lead Time (Hari sebelum lonjakan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evalRows.map((r) => (
                  <tr key={r.komoditas} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{r.komoditas}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">{r.mape}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                      {r.precision}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">{r.recall}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-sky-800">
                      {r.leadTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

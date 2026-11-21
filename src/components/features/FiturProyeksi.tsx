import React, { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import type { KomoditasId, ModelProyeksiId, PeriodeId } from '../../types/pangan';
import {
  formatRupiah,
  KOMODITAS_META,
  panganDataAdapter,
  type ProvinsiSnapshot,
} from '../../services/dataAdapter';
import { DataBadge } from '../DataBadge';

interface FiturProyeksiProps {
  selectedSnap: ProvinsiSnapshot | null;
  komoditas: KomoditasId;
  periode: PeriodeId;
}

export const FiturProyeksi: React.FC<FiturProyeksiProps> = ({
  selectedSnap,
  komoditas,
  periode,
}) => {
  const [model, setModel] = useState<ModelProyeksiId>('XGBoost');
  const [horizon, setHorizon] = useState<7 | 14>(14);

  const komMeta = KOMODITAS_META[komoditas];
  const wilayahLabel = selectedSnap ? selectedSnap.wilayah.nama : 'Rata-rata Nasional';

  const result = useMemo(
    () =>
      panganDataAdapter.getProyeksiHarga(
        selectedSnap?.wilayah.provinsi_kode ?? null,
        komoditas,
        horizon,
        model,
        periode
      ),
    [selectedSnap, komoditas, horizon, model, periode]
  );

  const chartData = useMemo(
    () =>
      result.seri.map((p) => ({
        ...p,
        pita:
          p.batas_bawah !== undefined && p.batas_atas !== undefined
            ? [p.batas_bawah, p.batas_atas]
            : undefined,
      })),
    [result.seri]
  );

  const lastPoint = result.seri[result.seri.length - 1];

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Proyeksi Harga {komMeta.label} — {wilayahLabel}
            </h3>
            <DataBadge status="SIMULASI" sumber="Simulasi, bukan model terlatih" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-800">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Output model {model} pada prototipe ini adalah <strong>Simulasi, bukan model terlatih</strong>{' '}
              dan disertai pita ketidakpastian (interval kepercayaan).
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Model Toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['XGBoost', 'SARIMAX'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  model === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Horizon Toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {([7, 14] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  horizon === h
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {h} Hari
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Forecast Chart + Probability Card */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Harga Historis & Proyeksi {horizon} Hari dengan Pita Ketidakpastian
            </span>
            {komMeta.hap && (
              <span className="font-mono text-[11px] text-slate-500">
                HAP Acuan: {formatRupiah(komMeta.hap)}/kg
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (Array.isArray(value)) {
                      return [
                        `${formatRupiah(Number(value[0]))} – ${formatRupiah(Number(value[1]))}`,
                        'Pita Ketidakpastian',
                      ];
                    }
                    return [formatRupiah(Number(value ?? 0)), String(name ?? '')];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {komMeta.hap && (
                  <ReferenceLine
                    y={komMeta.hap}
                    stroke="#16A34A"
                    strokeDasharray="4 4"
                    label={{
                      value: 'HAP',
                      position: 'insideTopRight',
                      fill: '#15803D',
                      fontSize: 10,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="pita"
                  name="Pita Ketidakpastian (Simulasi)"
                  stroke="none"
                  fill="#FDBA74"
                  fillOpacity={0.42}
                />
                <Line
                  type="monotone"
                  dataKey="harga_aktual"
                  name="Historis (Rp/kg)"
                  stroke="#0B1F3A"
                  strokeWidth={2.2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="harga_prediksi"
                  name={`Proyeksi ${model} (Simulasi)`}
                  stroke="#EA580C"
                  strokeWidth={2.4}
                  strokeDasharray="5 3"
                  dot={{ r: 2.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Probabilitas Lonjakan & Ringkasan Rentang */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Probabilitas Lonjakan Harga
              </span>
              <DataBadge status="SIMULASI" compact />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`font-mono text-3xl font-bold ${
                  result.probabilitasLonjakan >= 65
                    ? 'text-red-700'
                    : result.probabilitasLonjakan >= 45
                      ? 'text-orange-600'
                      : 'text-emerald-700'
                }`}
              >
                {result.probabilitasLonjakan}%
              </span>
              <span className="text-xs text-slate-500">dalam {horizon} hari ke depan</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  result.probabilitasLonjakan >= 65
                    ? 'bg-red-600'
                    : result.probabilitasLonjakan >= 45
                      ? 'bg-orange-500'
                      : 'bg-emerald-600'
                }`}
                style={{ width: `${result.probabilitasLonjakan}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="font-semibold text-slate-800">
              Estimasi Titik Akhir ({lastPoint.label})
            </div>
            <div className="mt-1 font-mono text-base font-bold text-slate-900">
              {formatRupiah(lastPoint.harga_prediksi ?? 0)}/kg{' '}
              <span className="text-xs font-semibold text-orange-700">
                ({result.perubahanProyeksiPct >= 0 ? '+' : ''}
                {result.perubahanProyeksiPct}%)
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-600">
              Rentang ketidakpastian: {formatRupiah(lastPoint.batas_bawah ?? 0)} –{' '}
              {formatRupiah(lastPoint.batas_atas ?? 0)}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Model {model} · Simulasi, bukan model terlatih
            </div>
          </div>
        </div>
      </div>

      {/* 4 Driver Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {result.faktorPendorong.map((f) => (
          <div key={f.nama} className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Faktor {f.nama}</span>
              <span className="font-mono text-xs font-semibold text-sky-800">
                {f.kontribusiPct}% · {f.arah}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{f.ringkasan}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
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
import { CloudRain, Flame, Thermometer, Wind } from 'lucide-react';
import type { IklimLayerId, KomoditasId, PeriodeId } from '../../types/pangan';
import { KOMODITAS_META, PERIODE_META, type ProvinsiSnapshot } from '../../services/dataAdapter';
import { DataBadge } from '../DataBadge';

interface FiturIklimProps {
  snapshots: ProvinsiSnapshot[];
  iklimSubLayer: IklimLayerId;
  onIklimSubLayerChange: (layer: IklimLayerId) => void;
  komoditas: KomoditasId;
  periode: PeriodeId;
  onSelectProvinsi: (kode: string) => void;
}

export const FiturIklim: React.FC<FiturIklimProps> = ({
  snapshots,
  iklimSubLayer,
  onIklimSubLayerChange,
  komoditas,
  periode,
  onSelectProvinsi,
}) => {
  const chartData = useMemo(() => {
    const focusCodes = ['32', '33', '35', '52', '53', '73', '12', '16', '63', '91'];
    return focusCodes
      .map((code) => snapshots.find((s) => s.wilayah.provinsi_kode === code))
      .filter((s): s is ProvinsiSnapshot => Boolean(s))
      .map((s) => ({
        kode: s.wilayah.provinsi_kode,
        provinsi: s.wilayah.nama
          .replace('Nusa Tenggara ', 'NT')
          .replace('Sulawesi Selatan', 'Sulsel')
          .replace('Sumatera ', 'Sum')
          .replace('Kalimantan ', 'Kal')
          .replace('Jawa ', 'Ja'),
        namaLengkap: s.wilayah.nama,
        aktual: s.iklim.curah_hujan_mm,
        normal: s.iklim.curah_hujan_normal_mm,
      }));
  }, [snapshots]);

  const sentraRentan = useMemo(() => {
    return snapshots
      .filter(
        (s) =>
          (s.wilayah.sentra_komoditas.includes(komoditas) || s.wilayah.peran === 'sentra') &&
          s.iklim.zona_kering_BMKG_sim
      )
      .sort((a, b) => b.iklim.indeks_kekeringan - a.iklim.indeks_kekeringan);
  }, [snapshots, komoditas]);

  const layerOptions: { id: IklimLayerId; label: string; icon: React.ReactNode }[] = [
    { id: 'indeks_kekeringan', label: 'Indeks Kekeringan', icon: <Flame className="h-3.5 w-3.5" /> },
    { id: 'curah_hujan', label: 'Curah Hujan', icon: <CloudRain className="h-3.5 w-3.5" /> },
    { id: 'suhu', label: 'Suhu Udara', icon: <Thermometer className="h-3.5 w-3.5" /> },
    { id: 'anomali', label: 'Anomali Hujan', icon: <Wind className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Control & BMKG Real Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Layer Iklim & Pemantauan Kekeringan ({PERIODE_META[periode].label})
            </h3>
            <DataBadge status="NYATA" sumber="BMKG & Bisnis 12 Agu 2026" compact />
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Kemarau 2026 lebih kering & lebih panjang dari normal (369 Zona Musim / 48,84% daratan
            pada Agustus); El Niño kategori kuat (peluang hingga 75%) diperkirakan bertahan hingga
            awal 2027.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {layerOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onIklimSubLayerChange(opt.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                iklimSubLayer === opt.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rainfall Chart + Vulnerable Production Centers */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
          <div className="mb-3">
            <h4 className="font-display text-sm font-bold text-slate-900">
              Curah Hujan Aktual vs Normal (mm)
            </h4>
            <p className="text-xs text-slate-500">
              Jawa, Nusa Tenggara, dan Sulawesi Selatan menunjukkan defisit curah hujan lebih kering
              pada Agu–Okt 2026.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="provinsi" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit=" mm" />
                <Tooltip
                  formatter={(value, name) => [`${Number(value ?? 0)} mm`, String(name ?? '')]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.namaLengkap ?? ''}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="aktual" name="Curah Hujan Aktual (mm)" fill="#EA580C" radius={[3, 3, 0, 0]} />
                <Bar dataKey="normal" name="Normal Klimatologis (mm)" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <div className="mb-3">
            <h4 className="font-display text-sm font-bold text-slate-900">
              Sentra Produksi Rentan Kekeringan
            </h4>
            <p className="text-xs text-slate-500">
              Filter komoditas: {KOMODITAS_META[komoditas].label} · Klik untuk zoom peta
            </p>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {sentraRentan.map((s) => (
              <button
                key={s.wilayah.provinsi_kode}
                type="button"
                onClick={() => onSelectProvinsi(s.wilayah.provinsi_kode)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-orange-300 hover:bg-orange-50/40"
              >
                <div>
                  <div className="font-semibold text-slate-900">{s.wilayah.nama}</div>
                  <div className="text-[11px] text-slate-500">
                    Hujan {s.iklim.curah_hujan_mm} mm ({s.iklim.anomali_pct}% vs normal) ·{' '}
                    {s.iklim.suhu_c}°C
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-orange-700">
                    Indeks {s.iklim.indeks_kekeringan}
                  </div>
                  <div className="text-[10px] text-slate-500">{s.iklim.dasarian}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

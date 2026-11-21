import React, { useMemo, useState } from 'react';
import { ArrowRight, Compass, Truck } from 'lucide-react';
import type { AliranPasokanSimRecord, KomoditasId } from '../../types/pangan';
import {
  formatRupiah,
  getAlertStyle,
  KOMODITAS_META,
  panganDataAdapter,
  type ProvinsiSnapshot,
} from '../../services/dataAdapter';

interface FiturJalurProps {
  aliranList: AliranPasokanSimRecord[];
  snapshots: ProvinsiSnapshot[];
  komoditas: KomoditasId;
  selectedProvinsiKode: string | null;
  onSelectProvinsi: (kode: string) => void;
}

export const FiturJalur: React.FC<FiturJalurProps> = ({
  aliranList,
  snapshots,
  komoditas,
  selectedProvinsiKode,
  onSelectProvinsi,
}) => {
  const siagaAwasProvinces = useMemo(
    () =>
      snapshots
        .filter((s) => s.kerentanan.level_siaga === 'Siaga' || s.kerentanan.level_siaga === 'Awas')
        .sort((a, b) => b.kerentanan.skor_pasok - a.kerentanan.skor_pasok),
    [snapshots]
  );

  const [targetAltKode, setTargetAltKode] = useState<string>('31');

  const activeTargetKode = useMemo(() => {
    if (selectedProvinsiKode) {
      const sel = snapshots.find((s) => s.wilayah.provinsi_kode === selectedProvinsiKode);
      if (sel && (sel.kerentanan.level_siaga === 'Siaga' || sel.kerentanan.level_siaga === 'Awas')) {
        return sel.wilayah.provinsi_kode;
      }
    }
    if (siagaAwasProvinces.some((s) => s.wilayah.provinsi_kode === targetAltKode)) {
      return targetAltKode;
    }
    return siagaAwasProvinces[0]?.wilayah.provinsi_kode ?? '31';
  }, [selectedProvinsiKode, snapshots, siagaAwasProvinces, targetAltKode]);

  const activeTargetSnap = snapshots.find((s) => s.wilayah.provinsi_kode === activeTargetKode);

  const alternatifList = useMemo(
    () => panganDataAdapter.getAlternatifWilayah(activeTargetKode, komoditas, snapshots),
    [activeTargetKode, komoditas, snapshots]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Tabel Koridor Pasokan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
          <div className="mb-3">
            <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-slate-900">
              <Truck className="h-4 w-4 text-sky-700" />
              <span>Aliran Pasokan ({KOMODITAS_META[komoditas].label})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ketebalan garis pada peta proporsional terhadap volume ton/minggu.
            </p>
          </div>

          {aliranList.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              Belum ada koridor antarprovinsi utama pada filter komoditas ini.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2">Koridor Sentra → Konsumsi</th>
                    <th className="px-2 py-2 text-right">Volume</th>
                    <th className="px-2 py-2 text-right">Tempuh</th>
                    <th className="px-3 py-2 text-right">Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {aliranList.map((f, idx) => (
                    <tr key={`${f.asal_kode}-${f.tujuan_kode}-${idx}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <button
                            type="button"
                            onClick={() => onSelectProvinsi(f.asal_kode)}
                            className="text-sky-800 hover:underline"
                          >
                            {f.asal_nama}
                          </button>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => onSelectProvinsi(f.tujuan_kode)}
                            className="text-sky-800 hover:underline"
                          >
                            {f.tujuan_nama}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500">{f.koridor_utama}</div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-semibold text-slate-800">
                        {f.volume_ton_minggu.toLocaleString('id-ID')} t/mgg
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-slate-600">
                        {f.waktu_tempuh_jam} jam
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                            f.risiko_hambatan === 'Tinggi'
                              ? 'border-red-300 bg-red-50 text-red-800'
                              : f.risiko_hambatan === 'Sedang'
                                ? 'border-amber-300 bg-amber-50 text-amber-800'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {f.risiko_hambatan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rekomendasi Wilayah Alternatif ketika Siaga/Awas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <div className="mb-3">
            <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-slate-900">
              <Compass className="h-4 w-4 text-orange-600" />
              <span>Rekomendasi Wilayah Alternatif</span>
            </h3>
            <p className="text-xs text-slate-500">
              Opsi pengalihan pasokan saat wilayah tujuan berstatus Siaga atau Awas.
            </p>
          </div>

          {siagaAwasProvinces.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              Tidak ada wilayah berstatus Siaga atau Awas pada komoditas{' '}
              {KOMODITAS_META[komoditas].label}. Aliran distribusi berjalan normal.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="target-alt-prov"
                  className="mb-1 block text-[11px] font-semibold text-slate-700"
                >
                  Wilayah Terdampak (Siaga / Awas)
                </label>
                <select
                  id="target-alt-prov"
                  value={activeTargetKode}
                  onChange={(e) => {
                    setTargetAltKode(e.target.value);
                    onSelectProvinsi(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                >
                  {siagaAwasProvinces.map((s) => (
                    <option key={s.wilayah.provinsi_kode} value={s.wilayah.provinsi_kode}>
                      {s.wilayah.nama} ({s.kerentanan.level_siaga} · Skor {s.kerentanan.skor_pasok})
                    </option>
                  ))}
                </select>
              </div>

              {activeTargetSnap && (
                <div className="rounded-lg border border-orange-200 bg-orange-50/70 px-3 py-2 text-xs text-slate-800">
                  Status saat ini:{' '}
                  <strong className={getAlertStyle(activeTargetSnap.kerentanan.level_siaga).text}>
                    {activeTargetSnap.kerentanan.level_siaga}
                  </strong>{' '}
                  · Harga {formatRupiah(activeTargetSnap.harga.nilai)}/kg
                </div>
              )}

              <div className="space-y-2">
                {alternatifList.map((alt, idx) => (
                  <button
                    key={alt.provinsi.provinsi_kode}
                    type="button"
                    onClick={() => onSelectProvinsi(alt.provinsi.provinsi_kode)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left text-xs transition-colors hover:border-sky-400 hover:bg-sky-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {idx + 1}. {alt.provinsi.nama}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-sky-800">
                        {formatRupiah(alt.harga)}/kg · ~{alt.estimasiJam} jam
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{alt.alasan}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

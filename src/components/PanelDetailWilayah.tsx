import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  X,
} from 'lucide-react';
import type {
  KomoditasId,
  PeriodeId,
  VerifikasiRecord,
} from '../types/pangan';
import {
  formatRupiah,
  getAlertStyle,
  KOMODITAS_META,
  panganDataAdapter,
  PERIODE_META,
  type ProvinsiSnapshot,
} from '../services/dataAdapter';
import { DataBadge } from './DataBadge';

interface PanelDetailWilayahProps {
  selectedSnap: ProvinsiSnapshot | null;
  snapshots: ProvinsiSnapshot[];
  komoditas: KomoditasId;
  periode: PeriodeId;
  verifikasiMap: Record<string, VerifikasiRecord>;
  onVerifikasi: (provinsiKode: string, catatan: string) => void;
  onClearSelection: () => void;
  onSelectProvinsi: (kode: string) => void;
}

export const PanelDetailWilayah: React.FC<PanelDetailWilayahProps> = ({
  selectedSnap,
  snapshots,
  komoditas,
  periode,
  verifikasiMap,
  onVerifikasi,
  onClearSelection,
  onSelectProvinsi,
}) => {
  const [catatanInput, setCatatanInput] = useState('');
  const dataNyata = panganDataAdapter.getDataNyata();
  const komMeta = KOMODITAS_META[komoditas];

  if (!selectedSnap) {
    const counts = {
      Awas: snapshots.filter((s) => s.kerentanan.level_siaga === 'Awas').length,
      Siaga: snapshots.filter((s) => s.kerentanan.level_siaga === 'Siaga').length,
      Waspada: snapshots.filter((s) => s.kerentanan.level_siaga === 'Waspada').length,
      Normal: snapshots.filter((s) => s.kerentanan.level_siaga === 'Normal').length,
    };
    const topProvinsi = [...snapshots]
      .sort((a, b) => b.kerentanan.skor_pasok - a.kerentanan.skor_pasok)
      .slice(0, 5);

    const ihkRow = dataNyata.inflasi_nasional_2026.seri[0];
    const vfRow = dataNyata.inflasi_nasional_2026.seri[3];
    const vfMtmRow = dataNyata.inflasi_nasional_2026.seri[4];

    return (
      <aside className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        <div className="border-b border-slate-200 pb-3">
          <p className="text-xs font-medium text-slate-500">Ringkasan Nasional</p>
          <h2 className="mt-0.5 font-display text-base font-bold text-slate-900">
            Detail Wilayah & Peringatan Dini
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Klik salah satu marker provinsi pada peta untuk meninjau harga, skor kerentanan,
            indikator iklim, sinyal REDD, dan verifikasi analis.
          </p>
        </div>

        {/* Real National Macro & Inflation Anchor */}
        <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-800">
              Makro & Inflasi ({PERIODE_META[periode].label})
            </span>
            <DataBadge status="NYATA" sumber="BI & BPS" compact />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-slate-200 bg-white p-2">
              <div className="text-[11px] text-slate-500">IHK (yoy)</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-slate-900">
                {periode === '2026-08'
                  ? `${ihkRow.agu_2026}%`
                  : periode === '2026-09'
                    ? `${ihkRow.sep_2026}%`
                    : `${ihkRow.okt_2026}%`}
              </div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-2">
              <div className="text-[11px] text-slate-500">Volatile Food (yoy / mtm)</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-orange-700">
                {periode === '2026-08'
                  ? `${vfRow.agu_2026}% / ${vfMtmRow.agu_2026}%`
                  : periode === '2026-09'
                    ? `${vfRow.sep_2026}% / ${vfMtmRow.sep_2026}%`
                    : `${vfRow.okt_2026}% / ${vfMtmRow.okt_2026}%`}
              </div>
            </div>
          </div>
          <div className="text-[11px] leading-relaxed text-slate-600">
            BI-Rate <strong className="font-mono text-slate-800">5,75%</strong> · PDB TW III{' '}
            <strong className="font-mono text-slate-800">5,47%</strong> · PMI{' '}
            <strong className="font-mono text-slate-800">
              {periode === '2026-09' ? '52,4' : '54,0'}
            </strong>
          </div>
        </div>

        {/* Distribution of Alert Levels */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-800">
            Sebaran Status {komMeta.label} (38 Provinsi)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['Awas', 'Siaga', 'Waspada', 'Normal'] as const).map((lvl) => {
              const st = getAlertStyle(lvl);
              return (
                <div
                  key={lvl}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${st.bg} ${st.border}`}
                >
                  <span className={`text-xs font-semibold ${st.text}`}>{st.kodeAngka}</span>
                  <span className={`font-mono text-sm font-bold ${st.text}`}>{counts[lvl]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Highest Vulnerability Provinces */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-800">
            5 Provinsi Prioritas Pemantauan
          </div>
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {topProvinsi.map((s) => {
              const st = getAlertStyle(s.kerentanan.level_siaga);
              return (
                <button
                  key={s.wilayah.provinsi_kode}
                  type="button"
                  onClick={() => onSelectProvinsi(s.wilayah.provinsi_kode)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{s.wilayah.nama}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {formatRupiah(s.harga.nilai)}/kg
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-xs font-bold ${st.text}`}>
                      {s.kerentanan.skor_pasok}/100
                    </span>
                    <div className={`text-[10px] font-semibold ${st.text}`}>
                      {s.kerentanan.level_siaga}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

  const { wilayah, iklim, kerentanan, harga, rei, prioritas4K } = selectedSnap;
  const alertStyle = getAlertStyle(kerentanan.level_siaga);
  const verifKey = `${wilayah.provinsi_kode}:${komoditas}`;
  const verifRec = verifikasiMap[verifKey];
  const isVerified = verifRec?.status === 'Terverifikasi';
  const pdrbDaerah = dataNyata.siaga_ekonomi_2026.pdrb_tw3_2026_daerah.find(
    (d) => d.provinsi_kode === wilayah.provinsi_kode
  );

  return (
    <aside className="flex h-full flex-col gap-3.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
      {/* Header Provinsi */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-sky-700" />
            <span>
              {wilayah.pulau} · {wilayah.lat.toFixed(2)}, {wilayah.lon.toFixed(2)}
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-slate-900">{wilayah.nama}</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Peran: <span className="font-semibold capitalize">{wilayah.peran}</span> ·{' '}
            {wilayah.catatan_wilayah}
          </p>
          {pdrbDaerah && (
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-sky-900">
              <span>PDRB TW III 2026: {pdrbDaerah.label} (yoy)</span>
              <DataBadge status="NYATA" sumber="BPS" compact />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          title="Kembali ke ringkasan nasional"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status Peringatan & Alur Verifikasi Analis */}
      <div className={`rounded-lg border p-3 ${alertStyle.bg} ${alertStyle.border}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-medium text-slate-700">
              Status SIAGA ({komMeta.label})
            </div>
            <div className={`font-display text-base font-bold ${alertStyle.text}`}>
              {alertStyle.kodeAngka}
            </div>
          </div>
        </div>

        <div className="mt-2.5 border-t border-slate-300/60 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            {isVerified ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span className="text-emerald-800">Terverifikasi</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-amber-700" />
                <span className="text-amber-900">Menunggu Verifikasi Analis</span>
              </>
            )}
          </div>

          {isVerified && verifRec ? (
            <div className="mt-1 text-[11px] text-slate-700">
              Oleh {verifRec.analis} ({verifRec.waktu})
              {verifRec.catatan && (
                <div className="mt-0.5 italic text-slate-600">"{verifRec.catatan}"</div>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={catatanInput}
                onChange={(e) => setCatatanInput(e.target.value)}
                placeholder="Catatan singkat verifikasi (opsional)..."
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onVerifikasi(
                    wilayah.provinsi_kode,
                    catatanInput.trim() || 'Tervalidasi sesuai sinyal harga & pasokan TPID.'
                  );
                  setCatatanInput('');
                }}
                className="w-full rounded-md bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#13325c]"
              >
                Verifikasi Peringatan Analis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* REDD Discrepancy Alert */}
      {rei.redd_flag && rei.redd_alasan && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span>REDD Terdeteksi</span>
          </div>
          <p className="mt-1 leading-relaxed text-amber-900/90">{rei.redd_alasan}</p>
        </div>
      )}

      {/* Harga Komoditas Wilayah */}
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-800">
          Harga {komMeta.label} ({PERIODE_META[periode].singkat})
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-xl font-bold text-slate-900">
            {formatRupiah(harga.nilai)}
            <span className="text-xs font-normal text-slate-500">/kg</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
              harga.perubahan_mtm_pct > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {harga.perubahan_mtm_pct > 0 ? '+' : ''}
            {harga.perubahan_mtm_pct}% mtm
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
          <div>
            Jangkar Nasional:{' '}
            <span className="font-mono font-semibold text-slate-800">
              {formatRupiah(harga.harga_nasional_jangkar)}
            </span>
          </div>
          <div>
            Selisih vs HAP:{' '}
            <span className="font-mono font-semibold text-slate-800">
              {harga.di_atas_hap_pct !== null
                ? `${harga.di_atas_hap_pct > 0 ? '+' : ''}${harga.di_atas_hap_pct}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Skor Kerentanan PASOK */}
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-800">Skor Kerentanan PASOK</div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="font-mono text-lg font-bold text-slate-900">
            {kerentanan.skor_pasok} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            0,4×Iklim + 0,3×Musim + 0,3×Defisit
          </span>
        </div>
        <div className="mt-2 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>Risiko Iklim (40%)</span>
            <span className="font-mono font-semibold text-slate-800">
              {kerentanan.risiko_iklim}/100
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Ketergantungan Musim (30%)</span>
            <span className="font-mono font-semibold text-slate-800">
              {kerentanan.ketergantungan_musim}/100
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Defisit Pasokan (30%)</span>
            <span className="font-mono font-semibold text-slate-800">
              {kerentanan.defisit_pasokan}/100
            </span>
          </div>
        </div>
      </div>

      {/* Iklim & REI */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-slate-200 p-2.5">
          <div className="text-[11px] font-semibold text-slate-700">Iklim Wilayah</div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900">
            {iklim.curah_hujan_mm} mm
          </div>
          <div className="text-[11px] text-slate-600">
            Anomali: <span className="font-mono">{iklim.anomali_pct}%</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Kekeringan: <span className="font-mono">{iklim.indeks_kekeringan}/100</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-2.5">
          <div className="text-[11px] font-semibold text-slate-700">REI Regional</div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900">{rei.rei_skor}</div>
          <div className="text-[11px] text-slate-600">
            Dasar PMI: <span className="font-mono">{rei.pmi_nasional_dasar}</span>
          </div>
          <div className="text-[11px] text-slate-600">Permintaan: {rei.tekanan_permintaan}</div>
        </div>
      </div>

      {/* Strategi 4K */}
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="mb-2 text-xs font-semibold text-slate-800">
          Rekomendasi Aksi Koordinasi 4K (GPIPS)
        </div>
        <div className="space-y-2">
          {prioritas4K.map((item) => (
            <div key={item.strategi} className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                <span>{item.strategi}</span>
                <span className="font-mono text-[10px] text-slate-500">{item.urgensi}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{item.aksi}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

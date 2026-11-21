import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Maximize2, Minimize2, RotateCcw, Search, Layers, Map as MapIcon, Satellite, Mountain } from 'lucide-react';
import type {
  AliranPasokanSimRecord,
  IklimLayerId,
  KomoditasId,
  MenuId,
  VerifikasiRecord,
} from '../types/pangan';
import {
  formatRupiah,
  getAlertStyle,
  KOMODITAS_META,
  type ProvinsiSnapshot,
} from '../services/dataAdapter';

export type MapLayerMode =
  | 'siaga'
  | 'pasok'
  | 'harga'
  | 'iklim_hujan'
  | 'iklim_suhu'
  | 'iklim_kekeringan'
  | 'iklim_anomali'
  | 'jalur';

export type BasemapStyleId = 'simpel' | 'satelit' | 'medan';

interface PetaGeospasialProps {
  activeMenu: MenuId;
  iklimSubLayer: IklimLayerId;
  onIklimSubLayerChange: (layer: IklimLayerId) => void;
  snapshots: ProvinsiSnapshot[];
  aliranList: AliranPasokanSimRecord[];
  komoditas: KomoditasId;
  selectedProvinsiKode: string | null;
  onSelectProvinsi: (kode: string | null) => void;
  verifikasiMap: Record<string, VerifikasiRecord>;
  isLoading: boolean;
}

const INDONESIA_CENTER: [number, number] = [-2.2, 117.8];
const INDONESIA_ZOOM = 5;

const MapController: React.FC<{
  selectedSnap: ProvinsiSnapshot | null;
  resetSignal: number;
  isFullscreen: boolean;
}> = ({ selectedSnap, resetSignal, isFullscreen }) => {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isFullscreen, map]);

  useEffect(() => {
    if (selectedSnap) {
      map.flyTo([selectedSnap.wilayah.lat, selectedSnap.wilayah.lon], 6.4, {
        duration: 0.6,
      });
    }
  }, [selectedSnap, map]);

  useEffect(() => {
    if (resetSignal > 0) {
      map.flyTo(INDONESIA_CENTER, INDONESIA_ZOOM, { duration: 0.6 });
    }
  }, [resetSignal, map]);

  return null;
};

function getColorTier4(
  val: number,
  thresholds: [number, number, number],
  invert = false
): { hex: string; tierLabel: string } {
  const [t1, t2, t3] = thresholds;
  if (!invert) {
    if (val >= t3) return { hex: '#DC2626', tierLabel: '4 · Awas / Kritis' };
    if (val >= t2) return { hex: '#EA580C', tierLabel: '3 · Siaga / Tinggi' };
    if (val >= t1) return { hex: '#EAB308', tierLabel: '2 · Waspada / Sedang' };
    return { hex: '#16A34A', tierLabel: '1 · Normal / Aman' };
  } else {
    if (val <= t1) return { hex: '#DC2626', tierLabel: '4 · Sangat Kering' };
    if (val <= t2) return { hex: '#EA580C', tierLabel: '3 · Kering' };
    if (val <= t3) return { hex: '#EAB308', tierLabel: '2 · Agak Kering' };
    return { hex: '#16A34A', tierLabel: '1 · Cukup / Normal' };
  }
}

export const PetaGeospasial: React.FC<PetaGeospasialProps> = ({
  activeMenu,
  iklimSubLayer,
  onIklimSubLayerChange,
  snapshots,
  aliranList,
  komoditas,
  selectedProvinsiKode,
  onSelectProvinsi,
  verifikasiMap,
  isLoading,
}) => {
  const [manualLayer, setManualLayer] = useState<MapLayerMode | null>(null);
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyleId>('simpel');
  const [showSatelliteLabels, setShowSatelliteLabels] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setManualLayer(null);
  }, [activeMenu]);

  const effectiveLayer: MapLayerMode = useMemo(() => {
    if (manualLayer) return manualLayer;
    if (activeMenu === 'IKLIM') {
      if (iklimSubLayer === 'curah_hujan') return 'iklim_hujan';
      if (iklimSubLayer === 'suhu') return 'iklim_suhu';
      if (iklimSubLayer === 'anomali') return 'iklim_anomali';
      return 'iklim_kekeringan';
    }
    if (activeMenu === 'PASOK') return 'pasok';
    if (activeMenu === 'PROYEKSI') return 'harga';
    if (activeMenu === 'JALUR') return 'jalur';
    return 'siaga';
  }, [manualLayer, activeMenu, iklimSubLayer]);

  const selectedSnap = useMemo(
    () => snapshots.find((s) => s.wilayah.provinsi_kode === selectedProvinsiKode) ?? null,
    [snapshots, selectedProvinsiKode]
  );

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return snapshots.filter((s) => s.wilayah.nama.toLowerCase().includes(q)).slice(0, 6);
  }, [snapshots, searchQuery]);

  const coordByCode = useMemo(() => {
    return new Map(
      snapshots.map((s) => [s.wilayah.provinsi_kode, [s.wilayah.lat, s.wilayah.lon] as [number, number]])
    );
  }, [snapshots]);

  const legendSpec = useMemo(() => {
    switch (effectiveLayer) {
      case 'iklim_hujan':
        return {
          title: 'Curah Hujan (mm/bulan)',
          items: [
            { color: '#16A34A', label: '1 · Normal (>110 mm)' },
            { color: '#EAB308', label: '2 · Menengah (75–110 mm)' },
            { color: '#EA580C', label: '3 · Rendah (40–74 mm)' },
            { color: '#DC2626', label: '4 · Sangat Kering (<40 mm)' },
          ],
        };
      case 'iklim_suhu':
        return {
          title: 'Suhu Permukaan (°C)',
          items: [
            { color: '#16A34A', label: '1 · Sejuk (<27,5°C)' },
            { color: '#EAB308', label: '2 · Hangat (27,5–28,4°C)' },
            { color: '#EA580C', label: '3 · Panas (28,5–29,4°C)' },
            { color: '#DC2626', label: '4 · Ekstrem (≥29,5°C)' },
          ],
        };
      case 'iklim_anomali':
        return {
          title: 'Anomali Hujan (% vs Normal)',
          items: [
            { color: '#16A34A', label: '1 · Normal (>-15%)' },
            { color: '#EAB308', label: '2 · Defisit Ringan (-30% s.d -15%)' },
            { color: '#EA580C', label: '3 · Defisit Kuat (-50% s.d -31%)' },
            { color: '#DC2626', label: '4 · Defisit Ekstrem (<-50%)' },
          ],
        };
      case 'iklim_kekeringan':
        return {
          title: 'Indeks Kekeringan (0–100)',
          items: [
            { color: '#16A34A', label: '1 · Normal (0–39)' },
            { color: '#EAB308', label: '2 · Waspada (40–59)' },
            { color: '#EA580C', label: '3 · Kering (60–74)' },
            { color: '#DC2626', label: '4 · Kritis (75–100)' },
          ],
        };
      case 'harga':
        return {
          title: `Deviasi Harga ${KOMODITAS_META[komoditas].label} vs HAP`,
          items: [
            { color: '#16A34A', label: '1 · ≤ HAP (≤0%)' },
            { color: '#EAB308', label: '2 · +1% s.d +15% HAP' },
            { color: '#EA580C', label: '3 · +16% s.d +35% HAP' },
            { color: '#DC2626', label: '4 · > +35% HAP' },
          ],
        };
      case 'jalur':
        return {
          title: `Koridor Pasokan ${KOMODITAS_META[komoditas].label}`,
          items: [
            { color: '#16A34A', label: '1 · Hambatan Rendah' },
            { color: '#EAB308', label: '2 · Hambatan Sedang' },
            { color: '#DC2626', label: '3 · Hambatan Tinggi / Padat' },
            { color: '#0284C7', label: 'Garis · Tebal = Volume Ton/Minggu' },
          ],
        };
      case 'pasok':
      case 'siaga':
      default:
        return {
          title:
            effectiveLayer === 'pasok'
              ? `Skor Kerentanan PASOK 0–100 (${KOMODITAS_META[komoditas].label})`
              : `Level Peringatan SIAGA (${KOMODITAS_META[komoditas].label})`,
          items: [
            { color: '#16A34A', label: '1 · Normal (Skor 0–39)' },
            { color: '#EAB308', label: '2 · Waspada (Skor 40–59)' },
            { color: '#EA580C', label: '3 · Siaga (Skor 60–74)' },
            { color: '#DC2626', label: '4 · Awas (Skor 75–100)' },
          ],
        };
    }
  }, [effectiveLayer, komoditas]);

  const getMarkerPresentation = (snap: ProvinsiSnapshot) => {
    const { iklim, kerentanan, harga, rei, wilayah } = snap;
    let colorHex = '#16A34A';
    let metricText = '';
    let levelText = '';
    let radius = 8;

    switch (effectiveLayer) {
      case 'iklim_hujan': {
        const tier = getColorTier4(iklim.curah_hujan_mm, [40, 75, 110], true);
        colorHex = tier.hex;
        levelText = tier.tierLabel;
        metricText = `${iklim.curah_hujan_mm} mm (Normal ${iklim.curah_hujan_normal_mm} mm)`;
        radius = wilayah.peran === 'sentra' ? 10 : 8;
        break;
      }
      case 'iklim_suhu': {
        const tier = getColorTier4(iklim.suhu_c, [27.5, 28.5, 29.5]);
        colorHex = tier.hex;
        levelText = tier.tierLabel;
        metricText = `${iklim.suhu_c.toFixed(1)} °C`;
        radius = 8 + Math.max(0, (iklim.suhu_c - 26) * 1.2);
        break;
      }
      case 'iklim_anomali': {
        const tier = getColorTier4(iklim.anomali_pct, [-50, -30, -15], true);
        colorHex = tier.hex;
        levelText = tier.tierLabel;
        metricText = `${iklim.anomali_pct > 0 ? '+' : ''}${iklim.anomali_pct}% vs normal`;
        radius = 9;
        break;
      }
      case 'iklim_kekeringan': {
        const tier = getColorTier4(iklim.indeks_kekeringan, [40, 60, 75]);
        colorHex = tier.hex;
        levelText = tier.tierLabel;
        metricText = `Indeks Kekeringan: ${iklim.indeks_kekeringan}/100`;
        radius = 7 + iklim.indeks_kekeringan / 18;
        break;
      }
      case 'harga': {
        const over = harga.di_atas_hap_pct ?? 0;
        const tier = getColorTier4(over, [1, 16, 36]);
        colorHex = tier.hex;
        levelText = tier.tierLabel;
        metricText = `${formatRupiah(harga.nilai)}/kg (${over >= 0 ? '+' : ''}${over}% vs HAP)`;
        radius = 8 + Math.min(6, Math.max(0, over / 10));
        break;
      }
      case 'pasok':
      case 'jalur':
      case 'siaga':
      default: {
        const st = getAlertStyle(kerentanan.level_siaga);
        colorHex = st.hex;
        levelText = st.kodeAngka;
        metricText = `Skor PASOK: ${kerentanan.skor_pasok}/100 · REI: ${rei.rei_skor}`;
        radius =
          kerentanan.level_siaga === 'Awas'
            ? 12
            : kerentanan.level_siaga === 'Siaga'
              ? 10.5
              : kerentanan.level_siaga === 'Waspada'
                ? 9
                : 7.5;
        break;
      }
    }

    return { colorHex, metricText, levelText, radius };
  };

  const handleResetZoom = () => {
    onSelectProvinsi(null);
    setResetSignal((n) => n + 1);
  };

  const handleLayerSelect = (val: MapLayerMode) => {
    setManualLayer(val);
    if (val === 'iklim_hujan') onIklimSubLayerChange('curah_hujan');
    if (val === 'iklim_suhu') onIklimSubLayerChange('suhu');
    if (val === 'iklim_kekeringan') onIklimSubLayerChange('indeks_kekeringan');
    if (val === 'iklim_anomali') onIklimSubLayerChange('anomali');
  };

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-white p-3'
          : 'relative flex h-[430px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:h-[460px]'
      }
    >
      {/* Map Top Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Province */}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari provinsi (38 wilayah)..."
              aria-label="Cari provinsi di peta"
              className="w-44 rounded-md border border-slate-300 bg-white py-1 pr-2.5 pl-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none sm:w-52"
            />
            {searchFocused && searchMatches.length > 0 && (
              <div className="absolute top-full left-0 z-[1000] mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {searchMatches.map((m) => (
                  <button
                    key={m.wilayah.provinsi_kode}
                    type="button"
                    onMouseDown={() => {
                      onSelectProvinsi(m.wilayah.provinsi_kode);
                      setSearchQuery(m.wilayah.nama);
                      setSearchFocused(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-100"
                  >
                    <span className="font-medium text-slate-800">{m.wilayah.nama}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {m.kerentanan.level_siaga}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer Switcher */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <select
              aria-label="Pilih layer peta"
              value={effectiveLayer}
              onChange={(e) => handleLayerSelect(e.target.value as MapLayerMode)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-sky-700 focus:outline-none"
            >
              <option value="siaga">Layer: Peringatan SIAGA & REDD</option>
              <option value="pasok">Layer: Kerentanan PASOK (0–100)</option>
              <option value="harga">Layer: Deviasi Harga vs HAP</option>
              <option value="iklim_kekeringan">Layer Iklim: Indeks Kekeringan</option>
              <option value="iklim_hujan">Layer Iklim: Curah Hujan</option>
              <option value="iklim_suhu">Layer Iklim: Suhu Udara</option>
              <option value="iklim_anomali">Layer Iklim: Anomali Curah Hujan</option>
              <option value="jalur">Layer: Aliran Pasokan (JALUR)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset zoom peta Indonesia"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Zoom</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh peta'}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{isFullscreen ? 'Tutup' : 'Layar Penuh'}</span>
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="relative flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-600">
            Memuat data geospasial 38 provinsi...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-600">
            Tidak ada data wilayah yang cocok dengan filter saat ini.
          </div>
        ) : (
          <MapContainer
            center={INDONESIA_CENTER}
            zoom={INDONESIA_ZOOM}
            minZoom={4}
            maxZoom={12}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            {/* 3 Versi Basemap ala Google Maps: Simpel, Satelit, Medan/Jalan */}
            {basemapStyle === 'simpel' && (
              <TileLayer
                key="tile-simpel"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
            )}

            {basemapStyle === 'satelit' && (
              <>
                <TileLayer
                  key="tile-satelit"
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                {showSatelliteLabels && (
                  <TileLayer
                    key="tile-satelit-labels"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  />
                )}
              </>
            )}

            {basemapStyle === 'medan' && (
              <TileLayer
                key="tile-medan"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            <MapController
              selectedSnap={selectedSnap}
              resetSignal={resetSignal}
              isFullscreen={isFullscreen}
            />

            {effectiveLayer === 'jalur' &&
              aliranList.map((flow, idx) => {
                const pFrom = coordByCode.get(flow.asal_kode);
                const pTo = coordByCode.get(flow.tujuan_kode);
                if (!pFrom || !pTo) return null;

                const weight = Math.max(2.5, Math.min(8.5, flow.volume_ton_minggu / 360));
                const color =
                  flow.risiko_hambatan === 'Tinggi'
                    ? '#DC2626'
                    : flow.risiko_hambatan === 'Sedang'
                      ? '#EAB308'
                      : '#16A34A';

                const isHighlighted =
                  !selectedProvinsiKode ||
                  flow.asal_kode === selectedProvinsiKode ||
                  flow.tujuan_kode === selectedProvinsiKode;

                return (
                  <Polyline
                    key={`${flow.asal_kode}-${flow.tujuan_kode}-${idx}`}
                    positions={[pFrom, pTo]}
                    pathOptions={{
                      color,
                      weight: isHighlighted ? weight : 2,
                      opacity: isHighlighted ? 0.88 : 0.25,
                      dashArray: flow.risiko_hambatan === 'Tinggi' ? '6 4' : undefined,
                    }}
                  >
                    <Tooltip sticky className="pangan-tooltip">
                      <div className="space-y-0.5">
                        <div className="font-semibold">
                          {flow.asal_nama} → {flow.tujuan_nama}
                        </div>
                        <div className="font-mono text-[11px]">
                          Volume: {flow.volume_ton_minggu.toLocaleString('id-ID')} ton/minggu ·{' '}
                          {flow.waktu_tempuh_jam} jam
                        </div>
                        <div className="text-[11px] text-amber-300">
                          Hambatan: {flow.risiko_hambatan}
                        </div>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

            {snapshots.map((snap) => {
              const { colorHex, metricText, levelText, radius } = getMarkerPresentation(snap);
              const isSelected = snap.wilayah.provinsi_kode === selectedProvinsiKode;
              const isVulnerableSentra =
                effectiveLayer.startsWith('iklim_') &&
                snap.wilayah.sentra_komoditas.includes(komoditas) &&
                snap.iklim.zona_kering_BMKG_sim;
              const verifKey = `${snap.wilayah.provinsi_kode}:${komoditas}`;
              const isVerified = verifikasiMap[verifKey]?.status === 'Terverifikasi';

              return (
                <CircleMarker
                  key={snap.wilayah.provinsi_kode}
                  center={[snap.wilayah.lat, snap.wilayah.lon]}
                  radius={isSelected ? radius + 4 : radius}
                  pathOptions={{
                    color: isSelected
                      ? '#0B1F3A'
                      : isVulnerableSentra
                        ? '#7C2D12'
                        : snap.rei.redd_flag && effectiveLayer === 'siaga'
                          ? '#0F172A'
                          : '#FFFFFF',
                    weight: isSelected ? 3 : isVulnerableSentra ? 2.5 : 1.5,
                    fillColor: colorHex,
                    fillOpacity: isSelected ? 0.96 : 0.85,
                  }}
                  eventHandlers={{
                    click: () => onSelectProvinsi(snap.wilayah.provinsi_kode),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} className="pangan-tooltip">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-3 font-semibold">
                        <span>{snap.wilayah.nama}</span>
                        <span className="font-mono text-[11px] text-sky-300">{levelText}</span>
                      </div>
                      <div className="font-mono text-[11px]">{metricText}</div>
                      <div className="text-[11px] text-slate-300">
                        Harga: {formatRupiah(snap.harga.nilai)}/kg · Peran: {snap.wilayah.peran}
                      </div>
                      {snap.rei.redd_flag && (
                        <div className="text-[11px] font-medium text-amber-300">
                          REDD Aktif: Ketidakselarasan antarsinyal
                        </div>
                      )}
                      {isVerified && (
                        <div className="text-[11px] font-medium text-emerald-300">
                          Terverifikasi Analis
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}

        {/* Google Maps-style 3-Mode Basemap Selector (Bottom Right) */}
        <div className="pointer-events-auto absolute right-3 bottom-6 z-[400] flex flex-col items-end gap-1.5">
          {basemapStyle === 'satelit' && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow-sm">
              <input
                type="checkbox"
                checked={showSatelliteLabels}
                onChange={(e) => setShowSatelliteLabels(e.target.checked)}
                className="accent-[#0B1F3A]"
              />
              <span>Label Wilayah</span>
            </label>
          )}
          <div
            role="group"
            aria-label="Pilih gaya peta"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white/95 p-1 shadow-md"
          >
            <button
              type="button"
              onClick={() => setBasemapStyle('simpel')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                basemapStyle === 'simpel'
                  ? 'bg-[#0B1F3A] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Simpel</span>
            </button>
            <button
              type="button"
              onClick={() => setBasemapStyle('satelit')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                basemapStyle === 'satelit'
                  ? 'bg-[#0B1F3A] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Satellite className="h-3.5 w-3.5" />
              <span>Satelit</span>
            </button>
            <button
              type="button"
              onClick={() => setBasemapStyle('medan')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                basemapStyle === 'medan'
                  ? 'bg-[#0B1F3A] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Mountain className="h-3.5 w-3.5" />
              <span>Medan & Jalan</span>
            </button>
          </div>
        </div>

        {/* Dynamic Accessible Legend Overlay (Bottom Left) */}
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[400] max-w-[265px] rounded-lg border border-slate-300 bg-white/95 p-2.5 shadow-md">
          <div className="text-[11px] font-semibold text-slate-800">{legendSpec.title}</div>
          <div className="mt-1.5 grid grid-cols-1 gap-1">
            {legendSpec.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[11px] text-slate-700">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-400/50"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-mono text-[10.5px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

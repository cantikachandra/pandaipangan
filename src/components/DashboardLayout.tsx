import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CloudRain,
  FlaskConical,
  LogOut,
  Menu,
  PackageCheck,
  Route,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  AliranPasokanSimRecord,
  IklimLayerId,
  KomoditasId,
  MenuId,
  PeriodeId,
  UserSession,
  VerifikasiRecord,
} from '../types/pangan';
import {
  KOMODITAS_META,
  panganDataAdapter,
  PERIODE_META,
  type ProvinsiSnapshot,
} from '../services/dataAdapter';
import { PetaGeospasial } from './PetaGeospasial';
import { PanelDetailWilayah } from './PanelDetailWilayah';
import { FiturSiaga } from './features/FiturSiaga';
import { FiturIklim } from './features/FiturIklim';
import { FiturPasok } from './features/FiturPasok';
import { FiturProyeksi } from './features/FiturProyeksi';
import { FiturJalur } from './features/FiturJalur';
import { FiturSimulasi } from './features/FiturSimulasi';
import { MenuDataScientist } from './features/MenuDataScientist';

interface DashboardLayoutProps {
  session: UserSession;
  onLogout: () => void;
}

const MENU_ITEMS: { id: MenuId; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    id: 'SIAGA',
    label: 'SIAGA',
    sub: 'Dashboard Terpadu',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    id: 'IKLIM',
    label: 'IKLIM',
    sub: 'Cuaca & Kekeringan',
    icon: <CloudRain className="h-4 w-4" />,
  },
  {
    id: 'PASOK',
    label: 'PASOK',
    sub: 'Skor Kerentanan',
    icon: <PackageCheck className="h-4 w-4" />,
  },
  {
    id: 'PROYEKSI',
    label: 'PROYEKSI',
    sub: 'Prediksi 7–14 Hari',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    id: 'JALUR',
    label: 'JALUR',
    sub: 'Aliran & Alternatif',
    icon: <Route className="h-4 w-4" />,
  },
  {
    id: 'SIMULASI',
    label: 'SIMULASI',
    sub: 'Skenario & Evaluasi',
    icon: <SlidersHorizontal className="h-4 w-4" />,
  },
  {
    id: 'DATA_SCIENTIST',
    label: 'DATA SCIENTIST',
    sub: 'Audit & Model Lab',
    icon: <FlaskConical className="h-4 w-4" />,
  },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ session, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState<MenuId>('SIAGA');
  const [komoditas, setKomoditas] = useState<KomoditasId>('cabai_rawit');
  const [periode, setPeriode] = useState<PeriodeId>('2026-10');
  const [selectedProvinsiKode, setSelectedProvinsiKode] = useState<string | null>(null);
  const [iklimSubLayer, setIklimSubLayer] = useState<IklimLayerId>('indeks_kekeringan');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [snapshots, setSnapshots] = useState<ProvinsiSnapshot[]>([]);
  const [aliranList, setAliranList] = useState<AliranPasokanSimRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State verifikasi analis di memori saja
  const [verifikasiMap, setVerifikasiMap] = useState<Record<string, VerifikasiRecord>>({
    '31:cabai_rawit': {
      provinsi_kode: '31',
      komoditas: 'cabai_rawit',
      status: 'Terverifikasi',
      analis: 'Analis Bank Indonesia (Demo)',
      waktu: '08:45 WIB',
      catatan: 'Terverifikasi: selisih harga pasar induk melebihi HAP >50%.',
    },
  });

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMsg(null);

    Promise.all([
      panganDataAdapter.getProvinsiSnapshots(periode, komoditas),
      panganDataAdapter.getAliranPasokan(komoditas),
    ])
      .then(([snaps, flows]) => {
        if (!active) return;
        setSnapshots(snaps);
        setAliranList(flows);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat data lokal.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [periode, komoditas]);

  const selectedSnap = useMemo(
    () => snapshots.find((s) => s.wilayah.provinsi_kode === selectedProvinsiKode) ?? null,
    [snapshots, selectedProvinsiKode]
  );

  const handleVerifikasi = (provinsiKode: string, catatan: string) => {
    const key = `${provinsiKode}:${komoditas}`;
    const waktu = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setVerifikasiMap((prev) => ({
      ...prev,
      [key]: {
        provinsi_kode: provinsiKode,
        komoditas,
        status: 'Terverifikasi',
        analis: session.nama,
        waktu: `${waktu} WIB`,
        catatan,
      },
    }));
  };

  const siagaCount = useMemo(
    () =>
      snapshots.filter(
        (s) => s.kerentanan.level_siaga === 'Siaga' || s.kerentanan.level_siaga === 'Awas'
      ).length,
    [snapshots]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      {/* Top Institutional Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Mobile Nav Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Buka menu navigasi"
              className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1F3A] text-sky-300">
                <Activity className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-sm font-bold tracking-tight text-[#0B1F3A]">
                  PANDAI PANGAN
                </div>
                <div className="hidden text-[11px] text-slate-500 sm:block">
                  Prediksi & Aksi Dini Inflasi Pangan
                </div>
              </div>
            </div>
          </div>

          {/* Center: Global Filters (Komoditas, Periode, Wilayah) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-komoditas" className="text-[11px] font-semibold text-slate-600">
                Komoditas:
              </label>
              <select
                id="filter-komoditas"
                value={komoditas}
                onChange={(e) => setKomoditas(e.target.value as KomoditasId)}
                className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none"
              >
                {Object.values(KOMODITAS_META).map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-periode" className="text-[11px] font-semibold text-slate-600">
                Periode:
              </label>
              <select
                id="filter-periode"
                value={periode}
                onChange={(e) => setPeriode(e.target.value as PeriodeId)}
                className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none"
              >
                {Object.values(PERIODE_META).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-wilayah" className="text-[11px] font-semibold text-slate-600">
                Wilayah:
              </label>
              <select
                id="filter-wilayah"
                value={selectedProvinsiKode ?? ''}
                onChange={(e) => setSelectedProvinsiKode(e.target.value || null)}
                className="max-w-[190px] rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-sky-700 focus:bg-white focus:outline-none"
              >
                <option value="">Semua Provinsi (38)</option>
                {snapshots.map((s) => (
                  <option key={s.wilayah.provinsi_kode} value={s.wilayah.provinsi_kode}>
                    {s.wilayah.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Demo User & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-right md:flex">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-semibold text-slate-800">{session.nama}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Left Sidebar (Desktop + Responsive Drawer) */}
        <aside
          className={`${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 block w-60 shadow-xl' : 'hidden'
          } shrink-0 border-r border-slate-200 bg-[#0B1F3A] text-slate-100 lg:static lg:block lg:w-56`}
        >
          <div className="flex h-full flex-col justify-between p-3">
            <div>
              <div className="mb-2 px-2.5 pt-1 text-[11px] font-medium text-slate-400">
                Modul Keputusan
              </div>
              <nav className="space-y-1">
                {MENU_ITEMS.map((item) => {
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveMenu(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <div>
                          <div className="font-display text-xs font-bold tracking-wide">
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] ${
                              isActive ? 'text-sky-100' : 'text-slate-400'
                            }`}
                          >
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      {item.id === 'SIAGA' && siagaCount > 0 && (
                        <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          {siagaCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-6 rounded-lg border border-slate-700 bg-[#08172c] p-3 text-[11px] text-slate-300">
              <div className="font-semibold text-white">Prinsip Tata Kelola</div>
              <p className="mt-1 leading-relaxed text-slate-400">
                Sistem hanya mendukung analisis. Setiap angka membedakan sumber{' '}
                <strong className="text-emerald-300">NYATA</strong> dan{' '}
                <strong className="text-amber-300">SIMULASI</strong>.
              </p>
            </div>
          </div>
        </aside>

        {/* Center + Right Workspace */}
        <main className="flex-1 overflow-x-hidden p-4">
          {errorMsg ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
              Terjadi kendala saat memuat data: {errorMsg}
            </div>
          ) : activeMenu === 'DATA_SCIENTIST' ? (
            <MenuDataScientist />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              {/* Center Column: Always Visible Geospatial Map + Active Feature Workspace */}
              <div className="space-y-4 xl:col-span-8">
                <PetaGeospasial
                  activeMenu={activeMenu}
                  iklimSubLayer={iklimSubLayer}
                  onIklimSubLayerChange={setIklimSubLayer}
                  snapshots={snapshots}
                  aliranList={aliranList}
                  komoditas={komoditas}
                  selectedProvinsiKode={selectedProvinsiKode}
                  onSelectProvinsi={setSelectedProvinsiKode}
                  verifikasiMap={verifikasiMap}
                  isLoading={isLoading}
                />

                {!isLoading && (
                  <>
                    {activeMenu === 'SIAGA' && (
                      <FiturSiaga
                        snapshots={snapshots}
                        komoditas={komoditas}
                        periode={periode}
                        verifikasiMap={verifikasiMap}
                        onVerifikasi={handleVerifikasi}
                        onSelectProvinsi={setSelectedProvinsiKode}
                      />
                    )}
                    {activeMenu === 'IKLIM' && (
                      <FiturIklim
                        snapshots={snapshots}
                        iklimSubLayer={iklimSubLayer}
                        onIklimSubLayerChange={setIklimSubLayer}
                        komoditas={komoditas}
                        periode={periode}
                        onSelectProvinsi={setSelectedProvinsiKode}
                      />
                    )}
                    {activeMenu === 'PASOK' && (
                      <FiturPasok
                        snapshots={snapshots}
                        komoditas={komoditas}
                        periode={periode}
                        onSelectProvinsi={setSelectedProvinsiKode}
                      />
                    )}
                    {activeMenu === 'PROYEKSI' && (
                      <FiturProyeksi
                        selectedSnap={selectedSnap}
                        komoditas={komoditas}
                        periode={periode}
                      />
                    )}
                    {activeMenu === 'JALUR' && (
                      <FiturJalur
                        aliranList={aliranList}
                        snapshots={snapshots}
                        komoditas={komoditas}
                        selectedProvinsiKode={selectedProvinsiKode}
                        onSelectProvinsi={setSelectedProvinsiKode}
                      />
                    )}
                    {activeMenu === 'SIMULASI' && <FiturSimulasi defaultKomoditas={komoditas} />}
                  </>
                )}
              </div>

              {/* Right Panel: Selected Province Detail */}
              <div className="xl:col-span-4">
                <PanelDetailWilayah
                  selectedSnap={selectedSnap}
                  snapshots={snapshots}
                  komoditas={komoditas}
                  periode={periode}
                  verifikasiMap={verifikasiMap}
                  onVerifikasi={handleVerifikasi}
                  onClearSelection={() => setSelectedProvinsiKode(null)}
                  onSelectProvinsi={setSelectedProvinsiKode}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mandatory Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            PANDAI PANGAN · Data sumber lokal (Dokumen Data Pendukung s.d. 19 November 2026)
          </span>
          <strong className="font-semibold text-slate-900">
            Keputusan akhir ada pada Bank Indonesia dan TPIP-TPID.
          </strong>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Play, Pause } from 'lucide-react';
import { Archipelago3DScene } from './Archipelago3DScene';
import type { UserSession } from '../types/pangan';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [animPaused, setAnimPaused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === 'analis@pandaipangan.id' && password === 'Pandai#Pangan2026') {
      onLoginSuccess({
        email: 'analis@pandaipangan.id',
        nama: 'Analis Bank Indonesia (Demo)',
        peran: 'Analis Pengendalian Inflasi Pangan · TPIP-TPID',
        loginAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });
      return;
    }

    setErrorMsg('Email atau kata sandi tidak valid. Periksa kembali kredensial analis Anda.');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061224] text-slate-100">
      {/* Full-bleed Three.js 3D Visualization */}
      <div className="absolute inset-0">
        <Archipelago3DScene paused={animPaused} />
      </div>

      {/* Subtle directional gradient scrim so top narrative & left login card stay crisp while leaving the right 3D scene bright */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6, 18, 36, 0.88) 0%, rgba(6, 18, 36, 0.48) 38%, rgba(6, 18, 36, 0.25) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-6 lg:px-10">
        {/* Top Bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/40 bg-[#0b2342] text-sky-300">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 2L4 6v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V6l-8-4z" />
                <path d="M8 13l2.5-2.5 2 2L16 9" />
              </svg>
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-tight text-white">
                PANDAI PANGAN
              </span>
              <p className="text-[11px] text-slate-300">
                Prediksi dan Aksi Dini Inflasi Pangan · Terintegrasi Arsitektur SIAGA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAnimPaused((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0d213d] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-sky-500/60 hover:text-white whitespace-nowrap shrink-0"
          >
            {animPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{animPaused ? 'Putar Visualisasi 3D' : 'Jeda Visualisasi 3D'}</span>
          </button>
        </header>

        {/* Top Editorial Words & Sentences (Di bagian atas) */}
        <section className="mt-4 max-w-3xl space-y-2.5">
          <p className="font-display text-xs font-semibold tracking-wider text-sky-300 uppercase">
            Nowcasting Ekonomi Daerah & Peringatan Dini Inflasi Pangan
          </p>
          <h1 className="font-display text-2xl leading-tight font-bold text-white sm:text-3xl lg:text-4xl">
            Menjaga Denyut Stabilitas Harga dari Sabang hingga Merauke.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-200">
            Statistik resmi hadir dengan jeda waktu, sementara dinamika pasar bergerak setiap hari.
            Dengan memadukan pancaran cahaya malam satelit VIIRS, jejak transaksi UMKM QRIS,
            kerentanan iklim, serta kesiapan arsitektur Rupiah Digital, PANDAI PANGAN dan SIAGA
            menerjemahkan sinyal terfragmentasi menjadi navigasi kebijakan yang sigap dan terukur.
          </p>
        </section>

        {/* Lower Split: Compact Email & Password Login Card on Left + Unobstructed 3D Visualization Beside It */}
        <section className="my-6 grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="w-full max-w-[360px] rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <p className="text-[11px] font-semibold text-sky-800">
                  Bank Indonesia · TPIP-TPID
                </p>
                <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-slate-900">
                  Masuk Sistem Analis
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email institusi"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pr-10 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800"
                  >
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#13325c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
                >
                  Masuk
                </button>
              </form>

              <p className="mt-4 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
                Akun demo. Pengecekan di sisi klien, tidak aman untuk produksi.
              </p>
            </div>
          </div>

          {/* Right column intentionally open so the 3D Nusantara visualization sits cleanly beside the login box */}
          <div className="hidden min-h-[320px] lg:col-span-7 lg:block" aria-hidden="true" />
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
          <span>PANDAI PANGAN · Terintegrasi Kerangka Lima Lapis SIAGA</span>
          <span>Keputusan akhir ada pada Bank Indonesia dan TPIP-TPID.</span>
        </footer>
      </div>
    </div>
  );
};

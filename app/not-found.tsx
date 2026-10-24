import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">404 - Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">
          Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

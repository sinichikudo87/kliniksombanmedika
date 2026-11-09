import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Clock,
  Phone,
  ShieldCheck,
  Building,
  X,
  Stethoscope,
  Copy,
  Check,
  Compass,
} from 'lucide-react';

interface ClinicMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicMapModal: React.FC<ClinicMapModalProps> = ({ isOpen, onClose }) => {
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!isOpen) return null;

  const clinicAddress = 'Kampung Bebek dan Telur Asin, Kebonsari RT.05 RW.03, Kec. Candi, Kabupaten Sidoarjo, Jawa Timur 61271';
  const latitude = -7.4819734;
  const longitude = 112.7162826;
  const coordinateStr = `${latitude}, ${longitude}`;
  const googleMapsUrl = 'https://maps.app.goo.gl/NX7nyKLxtx7rGx6j7';
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  const clinicPhotos = [
    { title: 'Tampak Depan & Plang', url: 'https://maps.app.goo.gl/NX7nyKLxtx7rGx6j7', src: '/klinik_somban_real_1.jpg' },
    { title: 'Area Parkir & Masuk', url: 'https://maps.app.goo.gl/uHrybrxspgEcp1y18', src: '/klinik_somban_real_2.jpg' },
    { title: 'Pintu Pelayanan', url: 'https://maps.app.goo.gl/QXjJ8D3GxnB8ZAnPA', src: '/klinik_somban_real_3.jpg' },
    { title: 'Ruang Poli Pelayanan', url: 'https://maps.app.goo.gl/N4vAU5jERNLj48G68', src: '/klinik_somban_real_4.jpg' },
    { title: 'Lingkungan Faskes', url: 'https://maps.app.goo.gl/uAmruwLvrU1tkzTR6', src: '/klinik_somban_real_5.jpg' },
  ];

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(coordinateStr);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Lokasi &amp; Koordinat Klinik Somban Medika
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-mono">
                  Sidoarjo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fasilitas Kesehatan Tingkat Pertama (Klinik Pratama Rawat Jalan &amp; BPJS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
          {/* Interactive Map Iframe Container */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-xs bg-slate-100 dark:bg-slate-950">
            {/* OpenStreetMap Embed centered directly on coordinates */}
            <iframe
              title="Peta Lokasi Klinik Somban Medika Sidoarjo"
              className="w-full h-56 sm:h-64 border-0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=112.7050%2C-7.4850%2C112.7300%2C-7.4620&amp;layer=mapnik&amp;marker=${latitude}%2C${longitude}`}
              loading="lazy"
            />
            {/* Overlay map badge */}
            <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Kebonsari, Candi, Sidoarjo</span>
            </div>
            
            {/* Coordinates Badge */}
            <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              <span>{coordinateStr}</span>
            </div>
          </div>

          {/* Address & GPS Coordinates Details Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Alamat Lengkap Faskes:
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                {clinicAddress}
              </p>
            </div>

            {/* GPS Coordinates readout */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Koordinat GPS / Peta</span>
                  <span className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">{coordinateStr} ({latitude}° S, {longitude}° E)</span>
                </div>
              </div>
              <button
                onClick={handleCopyCoordinates}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                {copiedCoords ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Jam Operasional:</span>
                  <span>Senin – Sabtu: 07:00 – 21:00 WIB</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Telepon / WhatsApp:</span>
                  <span>(031) 896-1234 · 0812-3456-7890</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Map Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka di Google Maps (Titik Resmi)</span>
            </a>

            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Petunjuk Rute Navigasi</span>
            </a>
          </div>

          {/* Real Google Maps Photos of Clinic */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Foto Resmi Lokasi Klinik di Google Maps:
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">5 Sudut Foto</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {clinicPhotos.map((p, idx) => (
                <a
                  key={idx}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-emerald-500 block shadow-2xs"
                >
                  <img
                    src={p.src}
                    alt={p.title}
                    className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate flex items-center gap-1">
                      <span>{p.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Clinic Service Summary */}
          <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Layanan Medis Klinik Somban Medika:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Poli Umum BPJS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Poli Umum 2 (dr. Diana)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>KIA &amp; Kebidanan / KB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Farmasi &amp; Apotek BPJS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Laboratorium Sederhana</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Prolanis (DM &amp; HT)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

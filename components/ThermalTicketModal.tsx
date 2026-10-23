'use client';

import React from 'react';
import { QueueItem } from '@/types/queue';
import { Printer, X, QrCode, CheckCircle2 } from 'lucide-react';

interface ThermalTicketModalProps {
  queueItem: QueueItem | null;
  onClose: () => void;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({ queueItem, onClose }) => {
  if (!queueItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(queueItem.waktuDaftar).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(queueItem.waktuDaftar).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white text-slate-800 rounded-2xl max-w-[340px] w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-slate-100 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Action Header */}
        <div className="flex items-center gap-2 mb-3.5 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <h3 className="font-bold text-slate-900 text-sm">Pendaftaran Berhasil</h3>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div id="printable-ticket" className="border border-dashed border-slate-300 rounded-lg p-5 bg-amber-50/20 font-mono text-center text-xs space-y-3">
          {/* Header */}
          <div className="border-b border-dashed border-slate-300 pb-3">
            <h2 className="font-bold text-sm tracking-wide text-slate-900">TPMD DR. MACHMUJUR</h2>
            <p className="text-[10px] text-slate-600">Kode Faskes: 019U901 · Bridging BPJS</p>
            <p className="text-[10px] text-slate-500">Jl. Raya Faskes No. 91 · Telp: (021) 8899-721</p>
          </div>

          {/* Ticket Body */}
          <div className="py-2">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{queueItem.poliNama}</p>
            <div className="my-2 py-3 bg-white border border-slate-200 rounded-lg shadow-inner">
              <span className="text-4xl font-extrabold text-slate-950 tracking-wider">
                {queueItem.nomorAntrean}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-700">{queueItem.dokterNama}</p>
            <p className="text-[10px] text-slate-500">{queueItem.ruangNama}</p>
          </div>

          {/* Info Details */}
          <div className="border-t border-b border-dashed border-slate-300 py-2.5 text-left text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Pasien:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">{queueItem.namaPasien}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tipe Peserta:</span>
              <span className="font-semibold text-slate-800">{queueItem.tipePasien}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. BPJS/NIK:</span>
              <span className="font-mono text-slate-800">{queueItem.noBpjs || queueItem.nik}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Daftar:</span>
              <span className="text-slate-800" suppressHydrationWarning>{formattedDate}, {formattedTime} WIB</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-dotted border-slate-200">
              <span className="text-emerald-700 font-semibold">Estimasi Panggil:</span>
              <span className="text-emerald-700 font-bold">{queueItem.estimasiJamPanggil}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perkiraan Tunggu:</span>
              <span className="font-medium text-slate-800">± {queueItem.estimasiWaktuTungguMenit} Menit</span>
            </div>
          </div>

          {/* QR Code Simulation & Barcode */}
          <div className="py-2 flex flex-col items-center justify-center space-y-1">
            <div className="w-24 h-24 border border-slate-300 rounded bg-white p-1.5 flex items-center justify-center">
              {/* Simulated QR Code matrix */}
              <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-900 rounded-sm">
                <div className="bg-white col-span-2 row-span-2 rounded-xs"></div>
                <div className="bg-slate-900"></div>
                <div className="bg-white col-span-2 row-span-2 rounded-xs"></div>
                <div className="bg-white"></div>
                <div className="bg-slate-900"></div>
                <div className="bg-white"></div>
                <div className="bg-white col-span-2 row-span-2 rounded-xs"></div>
                <div className="bg-white"></div>
                <div className="bg-slate-900 col-span-2"></div>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-tighter">
              {queueItem.kodeBooking}
            </p>
            <p className="text-[9px] text-slate-400">Scan QR di Mobile JKN untuk lacak antrean</p>
          </div>

          {/* Footer Note */}
          <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-500">
            <p>Simpan tiket ini hingga nomor dipanggil.</p>
            <p>Terima kasih atas kepercayaan Anda.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Tiket (POS)</span>
          </button>
          <button
            onClick={onClose}
            className="h-10 px-4 border border-slate-300/90 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

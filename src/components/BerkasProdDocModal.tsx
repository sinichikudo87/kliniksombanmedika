import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  X,
  FileCheck,
  Shield,
  Layers,
  Edit3,
  Globe,
  Building,
  User,
  ExternalLink,
  Copy,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  BerkasProdMetadata,
  DEFAULT_BERKAS_PROD_METADATA,
  downloadSuratPermohonanDoc,
  downloadBaUatDoc,
  downloadPaktaIntegritasDoc,
  downloadWsUrlAntrolDoc,
  downloadSemuaBerkasProdDoc,
  generateSuratPermohonanHtml,
  generateBaUatHtml,
  generatePaktaIntegritasHtml,
  generateWsUrlAntrolHtml,
} from '../services/docProdBerkasGenerator';
import { useQueue } from '../context/QueueContext';
import {
  showSuccessAlert,
  showToast,
  showConfirmDialog,
} from '../utils/swal';

interface BerkasProdDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'surat' | 'uat' | 'pakta' | 'ws' | 'edit';
}

export const BerkasProdDocModal: React.FC<BerkasProdDocModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'surat',
}) => {
  const { bpjsConfig } = useQueue();

  const [metadata, setMetadata] = useState<BerkasProdMetadata>(() => ({
    ...DEFAULT_BERKAS_PROD_METADATA,
    namaFaskes: bpjsConfig.namaFaskes || DEFAULT_BERKAS_PROD_METADATA.namaFaskes,
    kodePPK: bpjsConfig.kodePPK || DEFAULT_BERKAS_PROD_METADATA.kodePPK,
    emailFaskes: bpjsConfig.emailFaskes || DEFAULT_BERKAS_PROD_METADATA.emailFaskes,
    consId: bpjsConfig.consId || DEFAULT_BERKAS_PROD_METADATA.consId,
    userKey: bpjsConfig.userKey || DEFAULT_BERKAS_PROD_METADATA.userKey,
  }));

  const [activeTab, setActiveTab] = useState<'surat' | 'uat' | 'pakta' | 'ws' | 'edit'>(initialTab);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccessNotice = (msg: string) => {
    setDownloadSuccessMessage(msg);
    showToast(msg, 'success');
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  };

  const handleDownloadSurat = () => {
    downloadSuratPermohonanDoc(metadata);
    showSuccessNotice(`File "1_Surat_Permohonan_Bridging_PROD_${metadata.kodePPK}.doc" berhasil diunduh!`);
  };

  const handleDownloadUat = () => {
    downloadBaUatDoc(metadata);
    showSuccessNotice(`File "2_Berita_Acara_UAT_Antrol_PROD_${metadata.kodePPK}.doc" berhasil diunduh!`);
  };

  const handleDownloadPakta = () => {
    downloadPaktaIntegritasDoc(metadata);
    showSuccessNotice(`File "3_Pakta_Integritas_Faskes_dan_Vendor_PROD_${metadata.kodePPK}.doc" berhasil diunduh!`);
  };

  const handleDownloadWs = () => {
    downloadWsUrlAntrolDoc(metadata);
    showSuccessNotice(`File "4_Dokumen_Teknis_WS_URL_Antrol_PROD_${metadata.kodePPK}.doc" berhasil diunduh!`);
  };

  const handleDownloadAll = () => {
    downloadSemuaBerkasProdDoc(metadata);
    showSuccessNotice(`Paket Lengkap Berkas PROD (.doc) berhasil diunduh!`);
  };

  const handleResetMetadata = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Reset Metadata Berkas?',
      text: 'Semua isian formulir kustomisasi berkas PROD akan dikembalikan ke data default standar RS.',
      confirmButtonText: 'Ya, Reset Formulir',
      cancelButtonText: 'Batal',
    });
    if (confirmed) {
      setMetadata(DEFAULT_BERKAS_PROD_METADATA);
      showToast('Formulir berkas berhasil direset ke nilai default', 'info');
    }
  };

  const handleSaveAndPreview = () => {
    setActiveTab('surat');
    showSuccessAlert(
      'Metadata Berkas PROD Disimpan',
      'Perubahan faskes, dokter penanggung jawab, dan vendor IT berhasil diterapkan ke seluruh dokumen Word.'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="berkas-prod-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[94vh] sm:h-[90vh]">
        {/* 1. Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="berkas-prod-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Berkas Pengajuan Bridging Production (PROD) BPJS
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                  FORMAT .DOC WORD
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumen resmi permohonan, BA UAT, Pakta Integritas (Faskes &amp; Vendor), dan WS URL khusus Antrean Online (Antrol).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Top Banner Notification if Downloaded */}
        {downloadSuccessMessage && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 duration-150 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{downloadSuccessMessage}</span>
            </div>
            <span className="text-[11px] opacity-90">Buka langsung di Microsoft Word atau Google Docs</span>
          </div>
        )}

        {/* 3. Fast Download Action Buttons Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap hidden sm:inline">
              Download Cepat (.doc):
            </span>
            <button
              onClick={handleDownloadSurat}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Unduh 1. Surat Permohonan (.doc)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Surat Permohonan</span>
            </button>

            <button
              onClick={handleDownloadUat}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Unduh 2. BA UAT (.doc)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>2. BA UAT</span>
            </button>

            <button
              onClick={handleDownloadPakta}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Unduh 3. Pakta Integritas (Faskes & Vendor) (.doc)"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>3. Pakta Integritas (2)</span>
            </button>

            <button
              onClick={handleDownloadWs}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Unduh 4. WS URL Khusus Antrol (.doc)"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>4. WS URL (Antrol)</span>
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0"
            title="Download Semua 4 Berkas dalam 1 File Word Lengkap"
          >
            <Download className="w-4 h-4" />
            <span>Download Semua Berkas (.doc)</span>
          </button>
        </div>

        {/* 4. Tab Navigation Bar */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('surat')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'surat'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Surat Permohonan</span>
          </button>

          <button
            onClick={() => setActiveTab('uat')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'uat'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>2. Berita Acara (BA) UAT</span>
          </button>

          <button
            onClick={() => setActiveTab('pakta')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pakta'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3. Pakta Integritas (Faskes &amp; Vendor)</span>
          </button>

          <button
            onClick={() => setActiveTab('ws')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ws'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>4. WS URL (Khusus Antrol)</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ml-auto ${
              activeTab === 'edit'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Kustomisasi Data Faskes</span>
          </button>
        </div>

        {/* 5. Main Preview & Editing Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
          {/* TAB 1: SURAT PERMOHONAN PREVIEW */}
          {activeTab === 'surat' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    1. Surat Permohonan Akses &amp; Bridging Production
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Surat resmi dari Pimpinan Faskes kepada Kepala Kantor Cabang BPJS Kesehatan.
                  </p>
                </div>
                <button
                  onClick={handleDownloadSurat}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen (.doc)</span>
                </button>
              </div>

              {/* Document Paper Container */}
              <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 font-serif leading-relaxed text-sm">
                <div dangerouslySetInnerHTML={{ __html: generateSuratPermohonanHtml(metadata) }} />
              </div>
            </div>
          )}

          {/* TAB 2: BA UAT PREVIEW */}
          {activeTab === 'uat' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    2. Berita Acara User Acceptance Testing (BA UAT)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Laporan hasil pengujian 12 modul antrean online (Task 1-7, kuota, pembatalan, TTS) antara dr. Machmujur dan Dedy Angga Kurniawan, S.Kom.
                  </p>
                </div>
                <button
                  onClick={handleDownloadUat}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen (.doc)</span>
                </button>
              </div>

              {/* Document Paper Container */}
              <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 font-serif leading-relaxed text-sm">
                <div dangerouslySetInnerHTML={{ __html: generateBaUatHtml(metadata) }} />
              </div>
            </div>
          )}

          {/* TAB 3: PAKTA INTEGRITAS PREVIEW */}
          {activeTab === 'pakta' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    3. Pakta Integritas 2 Pihak (Pimpinan Faskes &amp; Vendor IT)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kepatuhan kerahasiaan data medis, keamanan sistem SSL/TLS, dan UU Perlindungan Data Pribadi.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPakta}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen (.doc)</span>
                </button>
              </div>

              {/* Document Paper Container */}
              <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 font-serif leading-relaxed text-sm">
                <div dangerouslySetInnerHTML={{ __html: generatePaktaIntegritasHtml(metadata) }} />
              </div>
            </div>
          )}

          {/* TAB 4: WS URL KHUSUS ANTROL PREVIEW */}
          {activeTab === 'ws' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    4. Dokumen Spesifikasi Teknis &amp; Pemetaan WS URL (Antrol)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daftar Base URL, IP Public, pemetaan endpoint Task ID 1-7, dan formula otentikasi HMAC-SHA256.
                  </p>
                </div>
                <button
                  onClick={handleDownloadWs}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen (.doc)</span>
                </button>
              </div>

              {/* Document Paper Container */}
              <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 font-serif leading-relaxed text-sm">
                <div dangerouslySetInnerHTML={{ __html: generateWsUrlAntrolHtml(metadata) }} />
              </div>
            </div>
          )}

          {/* TAB 5: KUSTOMISASI FORM DATA */}
          {activeTab === 'edit' && (
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  <span>Kustomisasi Data Berkas Permohonan PROD</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ubah data faskes, nomor surat, nama pimpinan, atau vendor jika diperlukan. Perubahan langsung tercermin pada dokumen Word (.doc) yang Anda unduh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Surat Permohonan
                  </label>
                  <input
                    type="text"
                    value={metadata.nomorSurat}
                    onChange={(e) => setMetadata({ ...metadata, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Berita Acara UAT
                  </label>
                  <input
                    type="text"
                    value={metadata.nomorBaUat}
                    onChange={(e) => setMetadata({ ...metadata, nomorBaUat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="text"
                    value={metadata.tanggalSurat}
                    onChange={(e) => setMetadata({ ...metadata, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kantor Cabang BPJS Pembina
                  </label>
                  <input
                    type="text"
                    value={metadata.kantorCabangBPJS}
                    onChange={(e) => setMetadata({ ...metadata, kantorCabangBPJS: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Fasilitas Kesehatan (Faskes)
                  </label>
                  <input
                    type="text"
                    value={metadata.namaFaskes}
                    onChange={(e) => setMetadata({ ...metadata, namaFaskes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode PPK BPJS
                  </label>
                  <input
                    type="text"
                    value={metadata.kodePPK}
                    onChange={(e) => setMetadata({ ...metadata, kodePPK: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Kabupaten Faskes
                  </label>
                  <input
                    type="text"
                    value={metadata.kotaFaskes}
                    onChange={(e) => setMetadata({ ...metadata, kotaFaskes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Faskes
                  </label>
                  <input
                    type="text"
                    value={metadata.alamatFaskes}
                    onChange={(e) => setMetadata({ ...metadata, alamatFaskes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pimpinan / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={metadata.namaPimpinan}
                    onChange={(e) => setMetadata({ ...metadata, namaPimpinan: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIK Pimpinan
                  </label>
                  <input
                    type="text"
                    value={metadata.nikPimpinan}
                    onChange={(e) => setMetadata({ ...metadata, nikPimpinan: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pengembang &amp; Verifikator IT (Lead Developer)
                  </label>
                  <input
                    type="text"
                    value={metadata.namaPicVendor}
                    onChange={(e) => setMetadata({ ...metadata, namaPicVendor: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Tim / Perusahaan Vendor
                  </label>
                  <input
                    type="text"
                    value={metadata.namaVendor}
                    onChange={(e) => setMetadata({ ...metadata, namaVendor: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IP Public Static Server Faskes
                  </label>
                  <input
                    type="text"
                    value={metadata.ipPublicServer}
                    onChange={(e) => setMetadata({ ...metadata, ipPublicServer: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL Server Faskes (Webhook)
                  </label>
                  <input
                    type="text"
                    value={metadata.urlServerFaskes}
                    onChange={(e) => setMetadata({ ...metadata, urlServerFaskes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetMetadata}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Reset ke Nilai Default
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndPreview}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                >
                  Simpan &amp; Lihat Pratinjau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Format Microsoft Word 100% kompatibel dengan MS Word 2010/2016/2019/365, LibreOffice &amp; Google Docs.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Paket Lengkap 4 Berkas (.doc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueue } from '@/lib/queue-context';
import { showSwalSuccess, showSwalError, showSwalAlert } from '@/lib/swal';
import {
  BarChart3,
  ClipboardList,
  Users,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Building2,
  Stethoscope,
  Clock,
  X,
} from 'lucide-react';

interface PcareVisitReportItem {
  id: string;
  noKunjungan: string | null;
  noRujukan?: string | null;
  queueId?: string | null;
  noKartu: string;
  nik?: string | null;
  namaPasien: string;
  poliKode: string;
  poliNama: string;
  diagnosaKode: string;
  diagnosaNama: string;
  statusPulang: string;
  namaPpkRujuk?: string | null;
  ppkRujuk?: string | null;
  poliRujuk?: string | null;
  tglRencanaRujuk?: string | null;
  isBridged: boolean;
  bridgingStatus: string;
  createdAt?: string;
}

const MONTH_OPTIONS = [
  { value: 'ALL', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export const LaporanView: React.FC = () => {
  const { queues, bpjsConfig } = useQueue();

  const [reportType, setReportType] = useState<'KUNJUNGAN' | 'ANTREAN'>('KUNJUNGAN');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const [visits, setVisits] = useState<PcareVisitReportItem[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState<boolean>(false);
  const [visitsError, setVisitsError] = useState<string | null>(null);

  const fetchVisits = useCallback(async (showFeedback = false) => {
    setIsLoadingVisits(true);
    setVisitsError(null);
    try {
      const res = await fetch('/api/pcare/visits', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && Array.isArray(json.visits)) {
        setVisits(json.visits);
        if (showFeedback) {
          showSwalSuccess(`Berhasil memuat ${json.visits.length} data laporan kunjungan.`, 'Data Diperbarui');
        }
      } else {
        const msg = json?.message || 'Gagal memuat data laporan kunjungan PCare.';
        setVisitsError(msg);
        if (showFeedback) showSwalError(msg, 'Gagal Memuat');
      }
    } catch (err: any) {
      const msg = err?.message || 'Koneksi ke server faskes terputus.';
      setVisitsError(msg);
      if (showFeedback) showSwalError(msg, 'Error Koneksi');
    } finally {
      setIsLoadingVisits(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/pcare/visits', { cache: 'no-store' })
      .then((res) => res.json().catch(() => null).then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!active) return;
        if (ok && json?.success && Array.isArray(json.visits)) {
          setVisits(json.visits);
        } else if (json?.message) {
          setVisitsError(json.message);
        }
      })
      .catch((err: any) => {
        if (active) {
          setVisitsError(err?.message || 'Koneksi ke server faskes terputus.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Dynamic Year Options from both Visits and Queues + current year
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = String(new Date().getFullYear());
    years.add(currentYear);

    for (const v of visits) {
      if (v.createdAt) {
        const d = new Date(v.createdAt);
        if (!Number.isNaN(d.getTime())) years.add(String(d.getFullYear()));
      }
    }
    for (const q of queues) {
      if (q.waktuDaftar) {
        const d = new Date(q.waktuDaftar);
        if (!Number.isNaN(d.getTime())) years.add(String(d.getFullYear()));
      }
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [visits, queues]);

  const matchesMonthYear = useCallback(
    (dateStr?: string) => {
      if (selectedMonth === 'ALL' && selectedYear === 'ALL') return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const yearStr = String(d.getFullYear());
      if (selectedMonth !== 'ALL' && monthStr !== selectedMonth) return false;
      if (selectedYear !== 'ALL' && yearStr !== selectedYear) return false;
      return true;
    },
    [selectedMonth, selectedYear]
  );

  // Filtered PCare Visits
  const filteredVisits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visits.filter((v) => {
      if (!matchesMonthYear(v.createdAt)) return false;
      if (!q) return true;
      const target = [
        v.id,
        v.noKunjungan || '',
        v.noRujukan || '',
        v.noKartu || '',
        v.nik || '',
        v.namaPasien || '',
        v.poliNama || '',
        v.poliKode || '',
        v.diagnosaKode || '',
        v.diagnosaNama || '',
        v.statusPulang || '',
        v.namaPpkRujuk || '',
        v.ppkRujuk || '',
      ]
        .join(' ')
        .toLowerCase();
      return target.includes(q);
    });
  }, [visits, searchQuery, matchesMonthYear]);

  // Filtered Queues
  const filteredQueues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queues.filter((item) => {
      if (!matchesMonthYear(item.waktuDaftar)) return false;
      if (!q) return true;
      const target = [
        item.nomorAntrean || '',
        item.kodeBooking || '',
        item.namaPasien || '',
        item.nik || '',
        item.noBpjs || '',
        item.poliNama || '',
        item.poliKode || '',
        item.dokterNama || '',
        item.tipePasien || '',
        item.status || '',
        item.keluhan || '',
      ]
        .join(' ')
        .toLowerCase();
      return target.includes(q);
    });
  }, [queues, searchQuery, matchesMonthYear]);

  const hasActiveFilter = selectedMonth !== 'ALL' || selectedYear !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
  };

  const handleExportCsv = () => {
    if (reportType === 'KUNJUNGAN') {
      if (filteredVisits.length === 0) {
        showSwalAlert('Tidak ada data laporan kunjungan sesuai filter untuk diekspor.', { title: 'Data Kosong', icon: 'info' });
        return;
      }
      const headers = [
        'ID',
        'No. Kunjungan',
        'No. Rujukan',
        'No. Kartu BPJS',
        'NIK',
        'Nama Pasien',
        'Poli',
        'Kode ICD-10',
        'Nama Diagnosa',
        'Status Pulang',
        'RS Tujuan Rujukan',
        'Status Bridging',
        'Tanggal',
      ];
      const rows = filteredVisits.map((v) => [
        v.id,
        v.noKunjungan || '-',
        v.noRujukan || '-',
        v.noKartu || '-',
        v.nik || '-',
        v.namaPasien,
        v.poliNama,
        v.diagnosaKode,
        v.diagnosaNama,
        v.statusPulang,
        v.namaPpkRujuk || '-',
        v.isBridged ? 'Terkirim BPJS' : v.bridgingStatus,
        v.createdAt ? new Date(v.createdAt).toLocaleString('id-ID') : '-',
      ]);
      downloadCsvFile(headers, rows, `laporan-kunjungan-${selectedYear}-${selectedMonth}.csv`);
    } else {
      if (filteredQueues.length === 0) {
        showSwalAlert('Tidak ada data laporan antrean sesuai filter untuk diekspor.', { title: 'Data Kosong', icon: 'info' });
        return;
      }
      const headers = [
        'Nomor Antrean',
        'Kode Booking',
        'Nama Pasien',
        'Tipe Peserta',
        'No. BPJS',
        'NIK',
        'Poli',
        'Dokter',
        'Status',
        'Waktu Daftar',
      ];
      const rows = filteredQueues.map((q) => [
        q.nomorAntrean,
        q.kodeBooking,
        q.namaPasien,
        q.tipePasien,
        q.noBpjs || '-',
        q.nik || '-',
        q.poliNama,
        q.dokterNama,
        q.status,
        q.waktuDaftar ? new Date(q.waktuDaftar).toLocaleString('id-ID') : '-',
      ]);
      downloadCsvFile(headers, rows, `laporan-antrean-${selectedYear}-${selectedMonth}.csv`);
    }
  };

  const downloadCsvFile = (headers: string[], rows: any[][], filename: string) => {
    const escapeCell = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSwalSuccess(`Laporan berhasil diekspor (${rows.length} baris).`, 'Export CSV Berhasil');
  };

  // Summary Stats
  const stats = useMemo(() => {
    if (reportType === 'KUNJUNGAN') {
      const total = filteredVisits.length;
      const bridged = filteredVisits.filter((v) => v.isBridged).length;
      const rujukan = filteredVisits.filter(
        (v) => Boolean(v.noRujukan) || Boolean(v.namaPpkRujuk) || v.statusPulang.toLowerCase().includes('rujuk')
      ).length;
      const rawatJalan = total - rujukan;
      return {
        label1: 'Total Kunjungan',
        val1: total,
        label2: 'Terkirim ke BPJS',
        val2: bridged,
        label3: 'Rujukan FKTL',
        val3: rujukan,
        label4: 'Berobat Jalan',
        val4: rawatJalan,
      };
    } else {
      const total = filteredQueues.length;
      const selesai = filteredQueues.filter((q) => q.status === 'SELESAI').length;
      const bpjsCount = filteredQueues.filter((q) => q.tipePasien === 'BPJS').length;
      const umumCount = filteredQueues.filter((q) => q.tipePasien === 'UMUM').length;
      return {
        label1: 'Total Antrean',
        val1: total,
        label2: 'Selesai Dilayani',
        val2: selesai,
        label3: 'Pasien BPJS',
        val3: bpjsCount,
        label4: 'Pasien Umum',
        val4: umumCount,
      };
    }
  }, [reportType, filteredVisits, filteredQueues]);

  const activePeriodLabel = useMemo(() => {
    const mLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || 'Semua Bulan';
    const yLabel = selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear;
    return `${mLabel} · ${yLabel}`;
  }, [selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Laporan Pelayanan Faskes</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Periode: {activePeriodLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-2">
              Laporan Kunjungan, Rujukan &amp; Antrean ({bpjsConfig.namaFaskes})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau rekap data kunjungan PCare dan antrean loket berdasarkan filter per bulan, tahun, dan pencarian data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchVisits(true)}
              disabled={isLoadingVisits}
              className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVisits ? 'animate-spin' : ''}`} />
              <span>{isLoadingVisits ? 'Memuat...' : 'Refresh Data'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Switch + Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Switch Jenis Laporan */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 self-start">
            <button
              type="button"
              onClick={() => setReportType('KUNJUNGAN')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                reportType === 'KUNJUNGAN'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Laporan Kunjungan &amp; Rujukan ({filteredVisits.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setReportType('ANTREAN')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                reportType === 'ANTREAN'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Laporan Antrean Pasien ({filteredQueues.length})</span>
            </button>
          </div>

          {/* Filter Bulan, Tahun & Pencarian Input Text */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            {/* Pencarian Data (Input Text) */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIK, BPJS, diagnosa, RS..."
                className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Per Bulan */}
            <select
              aria-label="Filter Bulan Laporan"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer flex-1 sm:flex-none"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Filter Per Tahun */}
            <select
              aria-label="Filter Tahun Laporan"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer flex-1 sm:flex-none"
            >
              <option value="ALL">Semua Tahun</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>{stats.label1}</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{stats.val1}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mb-1">
            <span>{stats.label2}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">{stats.val2}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 mb-1">
            <span>{stats.label3}</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">{stats.val3}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 mb-1">
            <span>{stats.label4}</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-700">{stats.val4}</div>
        </div>
      </div>

      {/* Error Notice for Visits if MySQL disconnected */}
      {reportType === 'KUNJUNGAN' && visitsError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{visitsError}</span>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">
              {reportType === 'KUNJUNGAN'
                ? 'Laporan Kunjungan & Rujukan Pasien'
                : 'Laporan Antrean Pendaftaran Pasien'}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Menampilkan {reportType === 'KUNJUNGAN' ? filteredVisits.length : filteredQueues.length} baris
          </span>
        </div>

        {reportType === 'KUNJUNGAN' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">No. Kunjungan / ID</th>
                  <th className="p-3">Nama Pasien</th>
                  <th className="p-3">No. BPJS / NIK</th>
                  <th className="p-3">Poli</th>
                  <th className="p-3">Diagnosa ICD-10</th>
                  <th className="p-3">Status &amp; RS Rujukan</th>
                  <th className="p-3 text-center">Bridging BPJS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-1.5">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-700">
                          {isLoadingVisits
                            ? 'Memuat data laporan...'
                            : hasActiveFilter
                            ? 'Tidak ada data kunjungan yang sesuai filter bulan, tahun, atau pencarian.'
                            : 'Belum ada data kunjungan PCare.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {v.noKunjungan || v.id}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{v.namaPasien}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                        <div>{v.noKartu || '-'}</div>
                        {v.nik && <div className="text-[10px] text-slate-400">NIK: {v.nik}</div>}
                      </td>
                      <td className="p-3 text-slate-700">{v.poliNama}</td>
                      <td className="p-3 text-slate-800 max-w-[220px] truncate" title={`[${v.diagnosaKode}] ${v.diagnosaNama}`}>
                        [{v.diagnosaKode}] {v.diagnosaNama}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.statusPulang.toLowerCase().includes('rujuk')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.statusPulang}
                        </span>
                        {v.noRujukan && (
                          <div className="text-[10px] font-mono text-amber-800 mt-0.5">Rujuk: {v.noRujukan}</div>
                        )}
                        {v.namaPpkRujuk && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]" title={v.namaPpkRujuk}>
                            RS: {v.namaPpkRujuk}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {v.isBridged ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terkirim</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                            <span>Tersimpan Sistem</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Tanggal Daftar</th>
                  <th className="p-3">No. Antrean</th>
                  <th className="p-3">Nama Pasien</th>
                  <th className="p-3">Tipe &amp; No. BPJS / NIK</th>
                  <th className="p-3">Poli &amp; Dokter</th>
                  <th className="p-3">Keluhan</th>
                  <th className="p-3 text-center">Status Layanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-1.5">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-700">
                          {hasActiveFilter
                            ? 'Tidak ada data antrean yang sesuai filter bulan, tahun, atau pencarian.'
                            : 'Belum ada data antrean pasien.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQueues.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {q.waktuDaftar
                          ? new Date(q.waktuDaftar).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {q.nomorAntrean}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{q.namaPasien}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                        <span
                          className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                            q.tipePasien === 'BPJS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {q.tipePasien}
                        </span>
                        <span>{q.noBpjs || q.nik || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{q.poliNama}</div>
                        <div className="text-[11px] text-slate-500">{q.dokterNama}</div>
                      </td>
                      <td className="p-3 text-slate-600 max-w-[200px] truncate" title={q.keluhan || '-'}>
                        {q.keluhan || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            q.status === 'SELESAI'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'DIPANGGIL' || q.status === 'DILAYANI'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : q.status === 'BATAL' || q.status === 'DILEWATI'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

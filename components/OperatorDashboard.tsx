'use client';

import React, { useState } from 'react';
import { useQueue } from '@/lib/queue-context';
import { maskSensitive } from '@/lib/encrypted-db';
import { BPJS_TASK_NAMES } from '@/lib/bpjs-bridging';
import { QueueItem } from '@/types/queue';
import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Volume2,
  Play,
  RotateCcw,
  Pill,
  SkipForward,
  UserPlus,
  Search,
  Filter,
  Activity,
  ShieldCheck,
  Stethoscope,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const {
    queues,
    poliList,
    bpjsConfig,
    callQueue,
    startService,
    finishQueue,
    skipQueue,
    cancelQueue,
    transferToPharmacy,
    addQueue,
    audioEnabled,
  } = useQueue();

  const [selectedPoliKode, setSelectedPoliKode] = useState<string>('UMU'); // Default to Poli Umum (dr. Machmujur)
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUnmasked, setShowUnmasked] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Manual Add Form State
  const [manualNama, setManualNama] = useState('');
  const [manualNik, setManualNik] = useState('');
  const [manualNoBpjs, setManualNoBpjs] = useState('');
  const [manualTipe, setManualTipe] = useState<'BPJS' | 'UMUM'>('BPJS');
  const [manualPoli, setManualPoli] = useState('UMU');
  const [manualKeluhan, setManualKeluhan] = useState('');

  // Selected Poli Object
  const currentPoli = poliList.find((p) => p.kode === selectedPoliKode) || poliList[0];

  // Queues filtered for currently selected Poli
  const poliQueues = selectedPoliKode === 'ALL'
    ? queues
    : queues.filter((q) => q.poliKode === selectedPoliKode);

  // Currently called or served item in selected Poli
  const activeServing = poliQueues.find(
    (q) => q.status === 'DIPANGGIL' || q.status === 'DILAYANI'
  );

  // Next waiting item in selected Poli
  const nextWaiting = poliQueues.find((q) => q.status === 'MENUNGGU');

  // Stats calculation
  const totalToday = poliQueues.length;
  const waitingCount = poliQueues.filter((q) => q.status === 'MENUNGGU').length;
  const servingCount = poliQueues.filter((q) => q.status === 'DIPANGGIL' || q.status === 'DILAYANI').length;
  const finishedCount = poliQueues.filter((q) => q.status === 'SELESAI').length;

  // Filtered Queues for Table
  const filteredTableQueues = poliQueues.filter((q) => {
    const matchesStatus = filterStatus === 'ALL' || q.status === filterStatus;
    const matchesSearch =
      q.nomorAntrean.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.nik.includes(searchQuery) ||
      q.noBpjs.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleCallNext = async () => {
    if (nextWaiting) {
      await callQueue(nextWaiting.id);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNama) return;

    await addQueue({
      namaPasien: manualNama,
      nik: manualNik || '3201019900001235',
      noBpjs: manualNoBpjs,
      poliKode: manualPoli,
      tipePasien: manualTipe,
      keluhan: manualKeluhan,
    });

    setManualNama('');
    setManualNik('');
    setManualNoBpjs('');
    setManualKeluhan('');
    setShowManualModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Station Selector & Bridging Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Loket / Poli:
          </span>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setSelectedPoliKode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedPoliKode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Poli ({queues.length})
            </button>
            {poliList.map((p) => {
              const count = queues.filter((q) => q.poliKode === p.kode && q.status === 'MENUNGGU').length;
              const isSelected = selectedPoliKode === p.kode;
              return (
                <button
                  key={p.kode}
                  onClick={() => setSelectedPoliKode(p.kode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{p.nama}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">VClaim Aktif</span>
            <span className="text-emerald-300">·</span>
            <span className="font-mono text-emerald-900">CID: {bpjsConfig.consId}</span>
          </div>

          <button
            onClick={() => setShowManualModal(true)}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Pendaftaran Loket</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid with Automatic Wait Times */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Total Antrean Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{totalToday}</div>
          <p className="text-[11px] text-slate-500 mt-1">Termasuk BPJS & Pasien Umum</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-amber-700">Sedang Menunggu</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">{waitingCount}</div>
          <p className="text-[11px] text-amber-800 font-medium mt-1">
            Est. tunggu antrean: ±{waitingCount * (currentPoli?.durasiRataRataMenit || 10)} menit
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-emerald-700">Sedang Dilayani</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">{servingCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Di ruang periksa & loket</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-teal-700">Selesai Dilayani</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 font-mono tracking-tight">{finishedCount}</div>
          <p className="text-[11px] text-teal-800 font-medium mt-1">Tersinkron ke Task 6/7 BPJS</p>
        </div>
      </div>

      {/* QUICK CALL CONTROL CONSOLE FOR CURRENT POLI */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Active Calling Box */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-emerald-400">
                Konsol Panggilan · {selectedPoliKode === 'ALL' ? 'Poli Umum' : currentPoli.nama}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-medium">{currentPoli.dokter}</span>
            </div>

            {activeServing ? (
              <div className="flex items-center gap-4 bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 sm:p-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-500 text-slate-950 font-black font-mono text-2xl flex items-center justify-center shrink-0 shadow-md">
                  {activeServing.nomorAntrean}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-white truncate">{activeServing.namaPasien}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        activeServing.status === 'DIPANGGIL'
                          ? 'bg-amber-400 text-slate-950 animate-pulse'
                          : 'bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {activeServing.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate font-mono">
                    {showUnmasked ? activeServing.noBpjs || activeServing.nik : maskSensitive(activeServing.noBpjs || activeServing.nik)} · Pasien {activeServing.tipePasien}
                  </p>
                  <p className="text-[11px] text-emerald-400/90 mt-0.5 truncate">
                    Keluhan: {activeServing.keluhan || 'Konsultasi Rutin'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 text-center text-slate-400 text-xs sm:text-sm">
                Belum ada pasien yang sedang dipanggil di loket ini. Klik tombol <strong className="text-emerald-400">&quot;Panggil Berikutnya&quot;</strong>.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCallNext}
              disabled={!nextWaiting}
              className="h-10 flex items-center gap-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] text-xs sm:text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>
                Panggil Berikutnya {nextWaiting ? `(${nextWaiting.nomorAntrean})` : ''}
              </span>
            </button>

            {activeServing && (
              <>
                <button
                  onClick={() => callQueue(activeServing.id)}
                  className="h-10 flex items-center gap-1.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                  title="Panggil Ulang Pasien dengan TTS"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Panggil Ulang</span>
                </button>

                {activeServing.status === 'DIPANGGIL' && (
                  <button
                    onClick={() => startService(activeServing.id)}
                    className="h-10 flex items-center gap-1.5 px-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Mulai</span>
                  </button>
                )}

                <button
                  onClick={() => finishQueue(activeServing.id)}
                  className="h-10 flex items-center gap-1.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </button>

                {activeServing.poliKode !== 'FAR' && (
                  <button
                    onClick={() => transferToPharmacy(activeServing.id)}
                    className="h-10 flex items-center gap-1.5 px-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors"
                    title="Buat tiket resep obat ke Farmasi"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Resep Obat</span>
                  </button>
                )}

                <button
                  onClick={() => skipQueue(activeServing.id)}
                  className="h-10 flex items-center gap-1.5 px-3 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-semibold border border-slate-700 hover:border-rose-800/40 transition-colors"
                  title="Lewati Pasien"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Lewati</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QUEUE TABLE & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Antrean Pasien</h3>
            <span className="text-xs font-mono text-slate-400">({filteredTableQueues.length} data)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, antrean, NIK..."
                className="pl-9 pr-3 h-9 text-xs rounded-xl border border-slate-300/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none w-48 sm:w-60 shadow-2xs font-medium"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-0.5 bg-slate-100/90 p-1 rounded-xl text-xs border border-slate-200/60 shadow-2xs">
              {['ALL', 'MENUNGGU', 'DILAYANI', 'SELESAI'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    filterStatus === st
                      ? 'bg-white text-slate-900 shadow-2xs ring-1 ring-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st}
                </button>
              ))}
            </div>

            {/* Privacy Mask Toggle */}
            <button
              onClick={() => setShowUnmasked(!showUnmasked)}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl border border-slate-300/90 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors shadow-2xs"
              title="Buka / Tutup Sensor NIK Pasien (UU PDP)"
            >
              {showUnmasked ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span className="font-semibold">{showUnmasked ? 'Sensor PII' : 'Lihat PII'}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 font-bold text-[11px]">No. Antrean</th>
                <th className="py-3 px-4 font-bold text-[11px]">Nama Pasien</th>
                <th className="py-3 px-4 font-bold text-[11px]">No. BPJS / NIK</th>
                <th className="py-3 px-4 font-bold text-[11px]">Poli & Ruang</th>
                <th className="py-3 px-4 font-bold text-[11px]">Waktu Daftar</th>
                <th className="py-3 px-4 font-bold text-[11px]">Estimasi Panggil</th>
                <th className="py-3 px-4 font-bold text-[11px]">Task BPJS</th>
                <th className="py-3 px-4 font-bold text-[11px]">Status</th>
                <th className="py-3 px-4 font-bold text-[11px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTableQueues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada antrean yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTableQueues.map((item) => {
                  const taskInfo = BPJS_TASK_NAMES[item.bpjsTaskId] || {
                    name: `Task ${item.bpjsTaskId}`,
                  };

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === 'DIPANGGIL' ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                            {item.nomorAntrean}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              item.tipePasien === 'BPJS'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.tipePasien}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.namaPasien}
                        {item.keluhan && (
                          <span className="block text-[11px] text-slate-400 font-normal truncate max-w-[180px]">
                            {item.keluhan}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {showUnmasked ? item.noBpjs || item.nik : maskSensitive(item.noBpjs || item.nik)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900">{item.poliNama}</span>
                        <span className="block text-[11px] text-slate-500">{item.ruangNama}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono" suppressHydrationWarning>
                        {new Date(item.waktuDaftar).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-700">{item.estimasiJamPanggil}</span>
                        {item.status === 'MENUNGGU' && (
                          <span className="block text-[10px] text-slate-400">
                            ± {item.estimasiWaktuTungguMenit} mnt
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Task {item.bpjsTaskId}: {taskInfo.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'MENUNGGU'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'DIPANGGIL'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : item.status === 'DILAYANI'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'SELESAI'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'MENUNGGU' && (
                            <button
                              onClick={() => callQueue(item.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Panggil
                            </button>
                          )}
                          {item.status === 'DIPANGGIL' && (
                            <button
                              onClick={() => startService(item.id)}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Mulai
                            </button>
                          )}
                          {item.status === 'DILAYANI' && (
                            <button
                              onClick={() => finishQueue(item.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Selesai
                            </button>
                          )}
                          <button
                            onClick={() => cancelQueue(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Batalkan Antrean"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DAFTARKAN PASIEN MANUAL / WALK-IN OLEH PETUGAS */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Pendaftaran Pasien Loket Admisi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Daftarkan pasien manual langsung ke sistem antrean bridging
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Pasien</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualTipe('BPJS')}
                    className={`py-2 rounded-xl font-semibold border ${
                      manualTipe === 'BPJS'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    BPJS Kesehatan
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTipe('UMUM')}
                    className={`py-2 rounded-xl font-semibold border ${
                      manualTipe === 'UMUM'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Pasien Umum
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pasien *</label>
                <input
                  type="text"
                  required
                  value={manualNama}
                  onChange={(e) => setManualNama(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIK (16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={manualNik}
                  onChange={(e) => setManualNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="3201..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              {manualTipe === 'BPJS' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Kartu BPJS (13 Digit)</label>
                  <input
                    type="text"
                    maxLength={13}
                    value={manualNoBpjs}
                    onChange={(e) => setManualNoBpjs(e.target.value.replace(/\D/g, ''))}
                    placeholder="0001..."
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Poli Tujuan</label>
                <select
                  value={manualPoli}
                  onChange={(e) => setManualPoli(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                >
                  {poliList.map((p) => (
                    <option key={p.kode} value={p.kode}>
                      {p.nama} ({p.dokter})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keluhan Pasien</label>
                <textarea
                  value={manualKeluhan}
                  onChange={(e) => setManualKeluhan(e.target.value)}
                  placeholder="Keluhan singkat..."
                  rows={2}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Daftarkan Antrean
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

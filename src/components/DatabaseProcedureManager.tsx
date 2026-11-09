import React, { useEffect, useState } from 'react';
import {
  Database,
  Table as TableIcon,
  Play,
  RotateCcw,
  Check,
  Copy,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  ArrowRight,
  RefreshCw,
  Terminal,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showSuccessAlert, showErrorAlert, showToast } from '../utils/swal';

interface DatabaseProcedureManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseProcedureManager: React.FC<DatabaseProcedureManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const { executeSelectProcedure, executeUpsertProcedure, fetchDatabaseSchema } = useAuth();

  const [activeTab, setActiveTab] = useState<'tables' | 'select' | 'upsert' | 'sql'>('tables');
  const [schemaData, setSchemaData] = useState<any | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<string>('users');

  // SELECT Procedure Runner state
  const [selectedSelectProc, setSelectedSelectProc] = useState<string>('sp_select_users');
  const [selectFilterRole, setSelectFilterRole] = useState<string>('ALL');
  const [selectFilterStatus, setSelectFilterStatus] = useState<string>('ALL');
  const [selectSearch, setSelectSearch] = useState<string>('');
  const [selectLimit, setSelectLimit] = useState<number>(50);
  const [isExecutingSelect, setIsExecutingSelect] = useState<boolean>(false);
  const [selectResult, setSelectResult] = useState<any | null>(null);

  // UPSERT Procedure Runner state
  const [selectedUpsertProc, setSelectedUpsertProc] = useState<string>('sp_upsert_user');
  const [upsertUserData, setUpsertUserData] = useState({
    id: '',
    username: 'petugas_baru',
    fullName: 'Siti Aminah, Amd.Kep',
    role: 'petugas_loket',
    email: 'siti.aminah@sombanmedika.id',
    phone: '081234567890',
    nip: '199505052020012003',
    password: 'password123',
    isActive: true,
  });
  const [upsertTicketData, setUpsertTicketData] = useState({
    id: '',
    nomorAntrean: 'A-010',
    huruf: 'A',
    angka: 10,
    kategori: 'BPJS',
    poliTujuan: 'Admisi BPJS & SEP',
    kodePoli: 'ADM',
    dokterNama: 'dr. Machmujur',
    namaPasien: 'Budi Santoso',
    noKartuBPJS: '0001234567890',
    nik: '3515081234567890',
    nomorRM: 'RM-2026-099',
    kodeBooking: 'BK-MANUAL-001',
    loketDipanggil: 'Loket 1',
    status: 'SELESAI',
    taskIdBpjs: 5,
  });
  const [isExecutingUpsert, setIsExecutingUpsert] = useState<boolean>(false);
  const [upsertResult, setUpsertResult] = useState<any | null>(null);

  // SQL code state
  const [copiedSQL, setCopiedSQL] = useState<boolean>(false);

  const loadSchema = async () => {
    setIsLoadingSchema(true);
    try {
      const data = await fetchDatabaseSchema();
      if (data.success) {
        setSchemaData(data);
      }
    } catch (e) {
      console.error('Failed to load database schema:', e);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSchema();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute SELECT
  const handleRunSelect = async () => {
    setIsExecutingSelect(true);
    setSelectResult(null);
    try {
      const params: any = {
        p_search: selectSearch,
        p_limit: selectLimit,
      };

      if (selectedSelectProc === 'sp_select_users') {
        params.p_role = selectFilterRole;
        params.p_status = selectFilterStatus;
      } else if (selectedSelectProc === 'sp_select_antrean') {
        params.p_status = selectFilterStatus;
        params.p_kategori = selectFilterRole;
      }

      const res = await executeSelectProcedure(selectedSelectProc, params);
      setSelectResult(res);
      if (res.success) {
        showToast(`Prosedur SELECT berhasil mengambil ${res.data?.length || 0} baris data`, 'success');
      } else {
        showErrorAlert('Gagal Menjalankan Prosedur SELECT', res.message || 'Terjadi kesalahan saat menjalankan query SELECT.');
      }
    } catch (err: any) {
      setSelectResult({ success: false, message: err.message });
      showErrorAlert('Gagal Menjalankan Prosedur SELECT', err.message || 'Terjadi kesalahan eksekusi.');
    } finally {
      setIsExecutingSelect(false);
    }
  };

  // Execute UPSERT
  const handleRunUpsert = async () => {
    setIsExecutingUpsert(true);
    setUpsertResult(null);
    try {
      let payload = {};
      if (selectedUpsertProc === 'sp_upsert_user') {
        payload = upsertUserData;
      } else if (selectedUpsertProc === 'sp_upsert_antrean') {
        payload = upsertTicketData;
      }

      const res = await executeUpsertProcedure(selectedUpsertProc, payload);
      setUpsertResult(res);
      if (res.success) {
        showSuccessAlert(
          'Prosedur Simpan / UPSERT Sukses',
          res.message || 'Data berhasil disimpan dan disinkronkan ke database.'
        );
      } else {
        showErrorAlert('Gagal Menjalankan Prosedur UPSERT', res.message || 'Gagal menyimpan perubahan ke database.');
      }
      // reload schema record count
      loadSchema();
    } catch (err: any) {
      setUpsertResult({ success: false, message: err.message });
      showErrorAlert('Gagal Menjalankan Prosedur UPSERT', err.message || 'Terjadi kesalahan eksekusi.');
    } finally {
      setIsExecutingUpsert(false);
    }
  };

  const handleCopySQL = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSQL(true);
    showToast('Skrip SQL berhasil disalin ke clipboard', 'info');
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="db-modal-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[92vh] sm:h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 id="db-modal-title" className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Tabel Database & Stored Procedures (SELECT & UPSERT)
                </h2>
                <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800 shrink-0">
                  SQL Ready
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Struktur data pengguna, antrean, dan konsol eksekusi prosedur SELECT dan UPSERT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons (Horizontally scrollable on small screens) */}
        <div className="px-4 sm:px-6 pt-2 sm:pt-3 flex gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel Database ({schemaData?.tables?.length || 4})</span>
          </button>
          <button
            onClick={() => setActiveTab('select')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'select'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span>Prosedur SELECT (Query)</span>
          </button>
          <button
            onClick={() => setActiveTab('upsert')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'upsert'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-500" />
            <span>Prosedur UPSERT (Insert/Update)</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-purple-500" />
            <span>Skrip SQL (.sql) & DDL</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
          {/* ================= TAB 1: TABLES SCHEMA ================= */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* Tables pill picker */}
              <div className="flex flex-wrap items-center gap-2">
                {schemaData?.tables?.map((tbl: any) => (
                  <button
                    key={tbl.tableName}
                    onClick={() => setSelectedTable(tbl.tableName)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTable === tbl.tableName
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>{tbl.tableName}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        selectedTable === tbl.tableName
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tbl.recordCount} baris
                    </span>
                  </button>
                ))}
              </div>

              {/* Table Schema Details */}
              {(() => {
                const currentTbl = schemaData?.tables?.find((t: any) => t.tableName === selectedTable);
                if (!currentTbl) return null;
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-800/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                            TABLE `{currentTbl.tableName}`
                          </span>
                          <span className="text-[11px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono">
                            PK: {currentTbl.primaryKey}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {currentTbl.description}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                        Total {currentTbl.columns?.length} Kolom
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-2.5">Nama Kolom</th>
                            <th className="px-4 py-2.5">Tipe Data</th>
                            <th className="px-4 py-2.5">Key</th>
                            <th className="px-4 py-2.5">Null?</th>
                            <th className="px-4 py-2.5">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {currentTbl.columns?.map((col: any) => (
                            <tr
                              key={col.name}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                {col.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                {col.type}
                              </td>
                              <td className="px-4 py-2.5 font-mono">
                                {col.key === 'PRI' ? (
                                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold rounded text-[10px]">
                                    PRI
                                  </span>
                                ) : col.key === 'UNI' ? (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold rounded text-[10px]">
                                    UNI
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                                {col.nullable ? 'YES' : 'NO'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                                {col.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= TAB 2: SELECT PROCEDURE ================= */}
          {activeTab === 'select' && (
            <div className="space-y-6">
              {/* Selector procedure */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      Eksekutor Prosedur SELECT (Stored Procedure)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Uji coba pemanggilan prosedur SELECT untuk mengambil data dengan filter dinamis
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSelectProc}
                      onChange={(e) => setSelectedSelectProc(e.target.value)}
                      className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    >
                      <option value="sp_select_users">CALL sp_select_users</option>
                      <option value="sp_select_antrean">CALL sp_select_antrean</option>
                      <option value="sp_select_loket">CALL sp_select_loket</option>
                      <option value="sp_select_bridging_logs">CALL sp_select_bridging_logs</option>
                    </select>

                    <button
                      onClick={handleRunSelect}
                      disabled={isExecutingSelect}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isExecutingSelect ? 'Menjalankan...' : 'Eksekusi SELECT'}</span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {selectedSelectProc === 'sp_select_users' ? 'Role Pengguna (p_role)' : 'Kategori (p_kategori)'}
                    </label>
                    <select
                      value={selectFilterRole}
                      onChange={(e) => setSelectFilterRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    >
                      <option value="ALL">Semua (ALL)</option>
                      {selectedSelectProc === 'sp_select_users' ? (
                        <>
                          <option value="admin">Administrator</option>
                          <option value="petugas_loket">Petugas Loket</option>
                          <option value="dokter">Dokter</option>
                          <option value="farmasi">Farmasi</option>
                        </>
                      ) : (
                        <>
                          <option value="BPJS">BPJS</option>
                          <option value="UMUM">UMUM</option>
                          <option value="PRIORITAS">PRIORITAS</option>
                          <option value="FARMASI">FARMASI</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Status (p_status)
                    </label>
                    <select
                      value={selectFilterStatus}
                      onChange={(e) => setSelectFilterStatus(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    >
                      <option value="ALL">Semua (ALL)</option>
                      {selectedSelectProc === 'sp_select_users' ? (
                        <>
                          <option value="ACTIVE">Aktif (1)</option>
                          <option value="INACTIVE">Nonaktif (0)</option>
                        </>
                      ) : (
                        <>
                          <option value="MENUNGGU">MENUNGGU</option>
                          <option value="DIPANGGIL">DIPANGGIL</option>
                          <option value="SEDANG_DILAYANI">SEDANG_DILAYANI</option>
                          <option value="SELESAI">SELESAI</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Pencarian Teks (p_search)
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={selectSearch}
                        onChange={(e) => setSelectSearch(e.target.value)}
                        placeholder="Nama, username, NIP, no tiket..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Area */}
              {selectResult && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-2">
                  <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                        {selectResult.queryDescription}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Waktu: <strong>{selectResult.executionTimeMs} ms</strong></span>
                      <span>Hasil: <strong>{selectResult.rowCount} baris</strong></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          {selectResult.data && selectResult.data.length > 0 ? (
                            Object.keys(selectResult.data[0]).map((k) => (
                              <th key={k} className="px-3.5 py-2 whitespace-nowrap">
                                {k}
                              </th>
                            ))
                          ) : (
                            <th className="px-4 py-2">Data Kosong</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectResult.data && selectResult.data.length > 0 ? (
                          selectResult.data.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              {Object.values(row).map((v: any, j: number) => (
                                <td key={j} className="px-3.5 py-2 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">
                                  {typeof v === 'boolean'
                                    ? v ? 'TRUE' : 'FALSE'
                                    : typeof v === 'object'
                                    ? JSON.stringify(v)
                                    : String(v ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">
                              Tidak ada data yang cocok dengan kriteria filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: UPSERT PROCEDURE ================= */}
          {activeTab === 'upsert' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600" />
                      Eksekutor Prosedur UPSERT (Insert on Duplicate Key Update)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Uji coba prosedur UPSERT: jika ID/Username sudah ada maka otomatis di-UPDATE, jika belum ada otomatis di-INSERT baru!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUpsertProc}
                      onChange={(e) => setSelectedUpsertProc(e.target.value)}
                      className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    >
                      <option value="sp_upsert_user">CALL sp_upsert_user</option>
                      <option value="sp_upsert_antrean">CALL sp_upsert_antrean</option>
                    </select>

                    <button
                      onClick={handleRunUpsert}
                      disabled={isExecutingUpsert}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isExecutingUpsert ? 'Menjalankan...' : 'Eksekusi UPSERT'}</span>
                    </button>
                  </div>
                </div>

                {/* Form Inputs based on selected proc */}
                {selectedUpsertProc === 'sp_upsert_user' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Username (Kunci Duplikat)
                      </label>
                      <input
                        type="text"
                        value={upsertUserData.username}
                        onChange={(e) => setUpsertUserData({ ...upsertUserData, username: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={upsertUserData.fullName}
                        onChange={(e) => setUpsertUserData({ ...upsertUserData, fullName: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Role
                      </label>
                      <select
                        value={upsertUserData.role}
                        onChange={(e) => setUpsertUserData({ ...upsertUserData, role: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      >
                        <option value="petugas_loket">Petugas Loket</option>
                        <option value="dokter">Dokter</option>
                        <option value="farmasi">Farmasi</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={upsertUserData.email}
                        onChange={(e) => setUpsertUserData({ ...upsertUserData, email: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        NIP / SIP
                      </label>
                      <input
                        type="text"
                        value={upsertUserData.nip}
                        onChange={(e) => setUpsertUserData({ ...upsertUserData, nip: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={upsertUserData.password}
                        onChange={(e) => setUpsertUserData({ ...upsertUserData, password: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nomor Antrean
                      </label>
                      <input
                        type="text"
                        value={upsertTicketData.nomorAntrean}
                        onChange={(e) => setUpsertTicketData({ ...upsertTicketData, nomorAntrean: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Kode Booking (Kunci Duplikat)
                      </label>
                      <input
                        type="text"
                        value={upsertTicketData.kodeBooking}
                        onChange={(e) => setUpsertTicketData({ ...upsertTicketData, kodeBooking: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nama Pasien
                      </label>
                      <input
                        type="text"
                        value={upsertTicketData.namaPasien}
                        onChange={(e) => setUpsertTicketData({ ...upsertTicketData, namaPasien: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Status Pelayanan
                      </label>
                      <select
                        value={upsertTicketData.status}
                        onChange={(e) => setUpsertTicketData({ ...upsertTicketData, status: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      >
                        <option value="MENUNGGU">MENUNGGU</option>
                        <option value="DIPANGGIL">DIPANGGIL</option>
                        <option value="SEDANG_DILAYANI">SEDANG_DILAYANI</option>
                        <option value="SELESAI">SELESAI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Loket Pemanggil
                      </label>
                      <input
                        type="text"
                        value={upsertTicketData.loketDipanggil}
                        onChange={(e) => setUpsertTicketData({ ...upsertTicketData, loketDipanggil: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Upsert Result Output */}
              {upsertResult && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          upsertResult.action === 'INSERTED'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        STATUS AKSI: {upsertResult.action}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {upsertResult.queryDescription}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Waktu: {upsertResult.executionTimeMs} ms
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200">
                    <pre>{JSON.stringify(upsertResult.data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: SQL & STORED PROCEDURES DDL ================= */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Definisi Stored Procedures & Skrip DDL MySQL
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dapat disalin langsung atau diimpor ke phpMyAdmin / MySQL CLI
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allSql = schemaData?.procedures?.map((p: any) => p.sqlCode).join('\n\n') || '';
                      handleCopySQL(allSql);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSQL ? 'Tersalin!' : 'Salin Prosedur'}</span>
                  </button>
                  <a
                    href="/api/mysql/export-sql"
                    download="antrean_bpjs_somban_full_procedures.sql"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .SQL Lengkap</span>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                {schemaData?.procedures?.map((proc: any) => (
                  <div
                    key={proc.name}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                            proc.type === 'SELECT'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {proc.type}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          PROCEDURE `{proc.name}`
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Tabel: <strong>{proc.targetTable}</strong>
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                      <pre>{proc.sqlCode}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

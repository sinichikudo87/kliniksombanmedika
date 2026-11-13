'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ReferralHospital, INDONESIA_PROVINCES } from '@/lib/indonesia-hospitals';
import { showSwalSuccess, showSwalError } from '@/lib/swal';
import {
  Search,
  ChevronDown,
  Building2,
  MapPin,
  Check,
  PlusCircle,
  X,
  Database,
  Loader2,
} from 'lucide-react';

interface SearchableHospitalSelectProps {
  value: string;
  onChange: (kodeFaskes: string, hospital?: ReferralHospital) => void;
  hospitals: ReferralHospital[];
  provinces?: string[];
  dataSource?: string;
  onHospitalAdded?: (hospital: ReferralHospital) => void;
  accentColor?: 'emerald' | 'amber';
}

export const SearchableHospitalSelect: React.FC<SearchableHospitalSelectProps> = ({
  value,
  onChange,
  hospitals,
  provinces = INDONESIA_PROVINCES,
  dataSource = 'MYSQL',
  onHospitalAdded,
  accentColor = 'emerald',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add RS form states
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState<ReferralHospital['kelas']>('B');
  const [newJenis, setNewJenis] = useState('RSUD');
  const [newKota, setNewKota] = useState('');
  const [newProvinsi, setNewProvinsi] = useState('Jawa Timur');
  const [newAlamat, setNewAlamat] = useState('');
  const [newTelepon, setNewTelepon] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUpward: boolean;
  } | null>(null);

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < 360 && spaceAbove > spaceBelow;
    const width = Math.max(rect.width, 320);
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const left = Math.min(Math.max(8, rect.left), maxLeft);

    if (openUpward) {
      setDropdownStyle({
        bottom: window.innerHeight - rect.top + 6,
        left,
        width,
        openUpward: true,
      });
    } else {
      setDropdownStyle({
        top: rect.bottom + 6,
        left,
        width,
        openUpward: false,
      });
    }
  }, []);

  const selectedHospital = useMemo(
    () => hospitals.find((rs) => rs.kodeFaskes === value),
    [hospitals, value]
  );

  const filteredHospitals = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return hospitals.filter((rs) => {
      if (selectedProvince !== 'ALL' && rs.provinsi !== selectedProvince) {
        return false;
      }
      if (!q) return true;
      const target = `${rs.kodeFaskes} ${rs.nama} ${rs.kota} ${rs.provinsi} ${rs.jenis} kelas ${rs.kelas}`.toLowerCase();
      return target.includes(q);
    });
  }, [hospitals, searchTerm, selectedProvince]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) {
        setIsOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    const timer = setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  const handleOpenAddForm = () => {
    setIsOpen(false);
    if (searchTerm.trim() && !newNama) {
      setNewNama(searchTerm.trim());
    }
    setIsAddModalOpen(true);
  };

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKode.trim() || !newNama.trim() || !newKota.trim() || !newProvinsi.trim()) {
      showSwalError('Kode Faskes, Nama RS, Kota/Kabupaten, dan Provinsi wajib diisi.', 'Data Belum Lengkap');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/rs-rujukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kodeFaskes: newKode.trim().toUpperCase(),
          nama: newNama.trim(),
          kelas: newKelas,
          jenis: newJenis.trim() || 'RSUD',
          kota: newKota.trim(),
          provinsi: newProvinsi.trim(),
          alamat: newAlamat.trim(),
          telepon: newTelepon.trim(),
          isBpjs: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.hospital) {
        const created: ReferralHospital = json.hospital;
        if (onHospitalAdded) {
          onHospitalAdded(created);
        }
        onChange(created.kodeFaskes, created);
        showSwalSuccess(json.message || 'RS Rujukan berhasil disimpan ke database MySQL.', 'RS Rujukan Tersimpan');
        setIsAddModalOpen(false);
        setNewKode('');
        setNewNama('');
        setNewKota('');
        setNewAlamat('');
        setNewTelepon('');
      } else {
        showSwalError(json.message || 'Gagal menyimpan RS Rujukan ke database MySQL.', 'Gagal Menyimpan');
      }
    } catch (err: any) {
      showSwalError('Koneksi gagal: ' + (err?.message || 'Server error'), 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const borderClass =
    accentColor === 'amber'
      ? 'border-amber-300 focus:border-amber-500'
      : 'border-slate-300 focus:border-emerald-600';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updateDropdownPosition();
          }
          setIsOpen((prev) => !prev);
        }}
        className={`w-full px-3 py-2.5 bg-white border ${borderClass} rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-all hover:bg-slate-50 cursor-pointer shadow-2xs`}
      >
        <div className="min-w-0 flex-1">
          {selectedHospital ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                {selectedHospital.kodeFaskes}
              </span>
              <span className="font-bold text-slate-900 truncate">{selectedHospital.nama}</span>
              <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                — {selectedHospital.kota}, {selectedHospital.provinsi} (Kelas {selectedHospital.kelas})
              </span>
            </div>
          ) : (
            <span className="text-slate-400">Pilih Rumah Sakit Rujukan seluruh Indonesia...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel via Portal (auto-flips above/below so it never collides with footer) */}
      {isOpen && dropdownStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownStyle.top,
            bottom: dropdownStyle.bottom,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
          }}
          className="z-[90] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Search & Filter Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama RS, kode Faskes, kota, atau provinsi..."
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="ALL">Semua Provinsi ({provinces.length} Provinsi di Indonesia)</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>

              <span className="text-[10px] font-mono text-slate-500 shrink-0 px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                {filteredHospitals.length} RS
              </span>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filteredHospitals.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Rumah sakit &ldquo;{searchTerm}&rdquo; tidak ditemukan dalam daftar.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah RS Baru ke Database MySQL</span>
                </button>
              </div>
            ) : (
              filteredHospitals.map((rs) => {
                const isSelected = rs.kodeFaskes === value;
                return (
                  <button
                    key={rs.kodeFaskes}
                    type="button"
                    onClick={() => {
                      onChange(rs.kodeFaskes, rs);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {rs.kodeFaskes}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {rs.nama}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200/80">
                          Kelas {rs.kelas}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {rs.kota}, {rs.provinsi} · {rs.jenis}
                        </span>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Dropdown Footer: Add Hospital to DB */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Sumber: {dataSource === 'MYSQL' ? 'MySQL Server (rs_rujukan)' : 'Database MySQL'}</span>
            </span>
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah RS ke DB</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tambah RS Rujukan ke MySQL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah RS Rujukan ke Database MySQL</h3>
                  <p className="text-[11px] text-slate-500">Data akan tersimpan ke tabel master rs_rujukan BPJS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Faskes BPJS *</label>
                  <input
                    type="text"
                    required
                    value={newKode}
                    onChange={(e) => setNewKode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode faskes BPJS RS"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas Rumah Sakit *</label>
                  <select
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value as ReferralHospital['kelas'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="A">Kelas A (Rujukan Tertinggi)</option>
                    <option value="B">Kelas B</option>
                    <option value="C">Kelas C</option>
                    <option value="D">Kelas D</option>
                    <option value="Khusus">Rumah Sakit Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Rumah Sakit *</label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Masukkan nama lengkap rumah sakit"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi *</label>
                  <select
                    value={newProvinsi}
                    onChange={(e) => setNewProvinsi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={newKota}
                    onChange={(e) => setNewKota(e.target.value)}
                    placeholder="Nama kota atau kabupaten"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis FKRTL</label>
                  <select
                    value={newJenis}
                    onChange={(e) => setNewJenis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="RSUD">RSUD</option>
                    <option value="RSUP">RSUP</option>
                    <option value="RSU Swasta">RSU Swasta</option>
                    <option value="RS TNI/Polri">RS TNI / Polri</option>
                    <option value="RS Khusus">RS Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telepon (Opsional)</label>
                  <input
                    type="text"
                    value={newTelepon}
                    onChange={(e) => setNewTelepon(e.target.value)}
                    placeholder="(031) ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap (Opsional)</label>
                <input
                  type="text"
                  value={newAlamat}
                  onChange={(e) => setNewAlamat(e.target.value)}
                  placeholder="Jl. ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

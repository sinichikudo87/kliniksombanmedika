'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  QueueItem,
  Patient,
  PoliInfo,
  BpjsBridgingConfig,
  BridgingLog,
  AuditSecurityLog,
} from '@/types/queue';
import { DEFAULT_BPJS_CONFIG, getBpjsHeaders } from './bpjs-bridging';
import { DEFAULT_POLI_LIST, calculateEstimatedWaitTime } from './queue-estimator';
import { speakIndonesianQueue, chimePlayer } from './tts-announcer';
import { encryptData, decryptData } from './encrypted-db';

interface QueueContextType {
  queues: QueueItem[];
  patients: Patient[];
  poliList: PoliInfo[];
  bpjsConfig: BpjsBridgingConfig;
  bridgingLogs: BridgingLog[];
  securityLogs: AuditSecurityLog[];
  currentCalled: QueueItem | null;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  addQueue: (data: {
    nik: string;
    noBpjs?: string;
    namaPasien: string;
    poliKode: string;
    tipePasien: 'BPJS' | 'UMUM';
    keluhan?: string;
    noHp?: string;
  }) => Promise<QueueItem>;
  callQueue: (id: string) => Promise<void>;
  startService: (id: string) => Promise<void>;
  finishQueue: (id: string) => Promise<void>;
  skipQueue: (id: string) => Promise<void>;
  cancelQueue: (id: string) => Promise<void>;
  transferToPharmacy: (id: string) => Promise<QueueItem>;
  updateBpjsConfig: (newConfig: Partial<BpjsBridgingConfig>) => void;
  testBridgingPing: () => Promise<{ success: boolean; latencyMs: number; details: any }>;
  addSecurityLog: (action: AuditSecurityLog['action'], details: string, status?: 'SUCCESS' | 'DENIED') => void;
  resetToSampleData: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Initial Patients Seed
const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    nik: '3201011508890001',
    noBpjs: '0001234567890',
    nama: 'BAMBANG PAMUNGKAS',
    tglLahir: '1989-08-15',
    jenisKelamin: 'L',
    noHp: '081298765432',
    alamat: 'Jl. Merdeka No. 45, RT 02/05',
    statusBpjs: 'AKTIF',
    jenisPeserta: 'PBI APBN',
    faskesTingkat1: '019U901 - TPMD DR MACHMUJUR',
    kelasRawat: 'Kelas 3',
    createdAt: '2026-10-17T05:30:00.000Z',
  },
  {
    id: 'pat-2',
    nik: '3201022011920002',
    noBpjs: '0002345678901',
    nama: 'SITI NURHALIZA',
    tglLahir: '1992-11-20',
    jenisKelamin: 'P',
    noHp: '085712345678',
    alamat: 'Perum Graha Asri Blok B3 No. 12',
    statusBpjs: 'AKTIF',
    jenisPeserta: 'PPU BUMN',
    faskesTingkat1: '019U901 - TPMD DR MACHMUJUR',
    kelasRawat: 'Kelas 1',
    createdAt: '2026-10-17T06:00:00.000Z',
  },
  {
    id: 'pat-3',
    nik: '3201031204850003',
    noBpjs: '0003456789012',
    nama: 'HENDRA WIJAYA',
    tglLahir: '1985-04-12',
    jenisKelamin: 'L',
    noHp: '081345678901',
    alamat: 'Kp. Melati RT 01/RW 03',
    statusBpjs: 'AKTIF',
    jenisPeserta: 'PBPU / Mandiri',
    faskesTingkat1: '019U901 - TPMD DR MACHMUJUR',
    kelasRawat: 'Kelas 2',
    createdAt: '2026-10-17T06:30:00.000Z',
  },
  {
    id: 'pat-4',
    nik: '3201042509980004',
    noBpjs: '0004567890123',
    nama: 'NURUL HIDAYAH',
    tglLahir: '1998-09-25',
    jenisKelamin: 'P',
    noHp: '087811223344',
    alamat: 'Jl. Ahmad Yani No. 18',
    statusBpjs: 'AKTIF',
    jenisPeserta: 'PBI APBD',
    faskesTingkat1: '019U901 - TPMD DR MACHMUJUR',
    kelasRawat: 'Kelas 3',
    createdAt: '2026-10-17T06:50:00.000Z',
  },
];

// Initial Queue Seed with fixed deterministic timestamps
const INITIAL_QUEUES: QueueItem[] = [
  {
    id: 'q-1',
    nomorAntrean: 'A-010',
    prefix: 'A',
    nomorUrut: 10,
    tipePasien: 'BPJS',
    poliKode: 'UMU',
    poliNama: 'Poli Umum',
    dokterNama: 'dr. Machmujur, M.Kes',
    ruangNama: 'Ruang 01',
    patientId: 'pat-1',
    nik: '3201011508890001',
    noBpjs: '0001234567890',
    namaPasien: 'BAMBANG PAMUNGKAS',
    status: 'DILAYANI',
    waktuDaftar: '2026-10-17T06:00:00.000Z',
    waktuDipanggil: '2026-10-17T06:50:00.000Z',
    waktuMulaiLayanan: '2026-10-17T06:52:00.000Z',
    estimasiWaktuTungguMenit: 0,
    estimasiJamPanggil: 'SEKARANG',
    bpjsTaskId: 5,
    kodeBooking: 'BKJ-20261017-0010',
    keluhan: 'Demam 3 hari disertai batuk pilek',
    isSyncedBpjs: true,
    panggilanKe: 1,
  },
  {
    id: 'q-2',
    nomorAntrean: 'A-011',
    prefix: 'A',
    nomorUrut: 11,
    tipePasien: 'BPJS',
    poliKode: 'UMU',
    poliNama: 'Poli Umum',
    dokterNama: 'dr. Machmujur, M.Kes',
    ruangNama: 'Ruang 01',
    patientId: 'pat-2',
    nik: '3201022011920002',
    noBpjs: '0002345678901',
    namaPasien: 'SITI NURHALIZA',
    status: 'MENUNGGU',
    waktuDaftar: '2026-10-17T06:20:00.000Z',
    estimasiWaktuTungguMenit: 5,
    estimasiJamPanggil: '10:45 WIB',
    bpjsTaskId: 3,
    kodeBooking: 'BKJ-20261017-0011',
    keluhan: 'Kontrol tekanan darah rutin hipertensi',
    isSyncedBpjs: true,
    panggilanKe: 0,
  },
  {
    id: 'q-3',
    nomorAntrean: 'A-012',
    prefix: 'A',
    nomorUrut: 12,
    tipePasien: 'BPJS',
    poliKode: 'UMU',
    poliNama: 'Poli Umum',
    dokterNama: 'dr. Machmujur, M.Kes',
    ruangNama: 'Ruang 01',
    patientId: 'pat-3',
    nik: '3201031204850003',
    noBpjs: '0003456789012',
    namaPasien: 'HENDRA WIJAYA',
    status: 'MENUNGGU',
    waktuDaftar: '2026-10-17T06:40:00.000Z',
    estimasiWaktuTungguMenit: 15,
    estimasiJamPanggil: '10:55 WIB',
    bpjsTaskId: 3,
    kodeBooking: 'BKJ-20261017-0012',
    keluhan: 'Nyeri lambung dan perut kembung',
    isSyncedBpjs: true,
    panggilanKe: 0,
  },
  {
    id: 'q-4',
    nomorAntrean: 'B-004',
    prefix: 'B',
    nomorUrut: 4,
    tipePasien: 'BPJS',
    poliKode: 'GIG',
    poliNama: 'Poli Gigi & Mulut',
    dokterNama: 'drg. Siti Sarah Amanda',
    ruangNama: 'Ruang 02',
    patientId: 'pat-4',
    nik: '3201042509980004',
    noBpjs: '0004567890123',
    namaPasien: 'NURUL HIDAYAH',
    status: 'DIPANGGIL',
    waktuDaftar: '2026-10-17T06:35:00.000Z',
    waktuDipanggil: '2026-10-17T06:58:00.000Z',
    estimasiWaktuTungguMenit: 0,
    estimasiJamPanggil: 'SEKARANG',
    bpjsTaskId: 4,
    kodeBooking: 'BKJ-20261017-0004',
    keluhan: 'Pembersihan karang gigi & tambal sementara',
    isSyncedBpjs: true,
    panggilanKe: 1,
  },
  {
    id: 'q-5',
    nomorAntrean: 'F-007',
    prefix: 'F',
    nomorUrut: 7,
    tipePasien: 'BPJS',
    poliKode: 'FAR',
    poliNama: 'Apotek & Farmasi',
    dokterNama: 'Apt. Farhan Maulana, S.Farm',
    ruangNama: 'Loket Farmasi',
    patientId: 'pat-1',
    nik: '3201011508890001',
    noBpjs: '0001234567890',
    namaPasien: 'BAMBANG PAMUNGKAS',
    status: 'MENUNGGU',
    waktuDaftar: '2026-10-17T06:55:00.000Z',
    estimasiWaktuTungguMenit: 6,
    estimasiJamPanggil: '10:48 WIB',
    bpjsTaskId: 6,
    kodeBooking: 'BKJ-20261017-0007',
    keluhan: 'Resep obat poli umum',
    isSyncedBpjs: true,
    panggilanKe: 0,
  },
];

// Initial Security Logs Seed defined outside component
const INITIAL_SECURITY_LOGS: AuditSecurityLog[] = [
  {
    id: 'sec-1',
    timestamp: '2026-10-17T06:30:00.000Z',
    actor: 'Sistem Kriptografi TPMD',
    action: 'KEY_ROTATE',
    status: 'SUCCESS',
    details: 'Inisialisasi Master Key AES-256-GCM Faskes 019U901 berhasil (PBKDF2 SHA-256).',
  },
  {
    id: 'sec-2',
    timestamp: '2026-10-17T07:00:00.000Z',
    actor: 'Loket Pendaftaran',
    action: 'ENCRYPT',
    status: 'SUCCESS',
    details: 'Enkripsi PII Pasien NIK 320101******0001 tersimpan di database aman.',
  },
];

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queues, setQueues] = useState<QueueItem[]>(INITIAL_QUEUES);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [poliList] = useState<PoliInfo[]>(DEFAULT_POLI_LIST);
  const [bpjsConfig, setBpjsConfig] = useState<BpjsBridgingConfig>(DEFAULT_BPJS_CONFIG);
  const [bridgingLogs, setBridgingLogs] = useState<BridgingLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<AuditSecurityLog[]>(INITIAL_SECURITY_LOGS);
  const [currentCalled, setCurrentCalled] = useState<QueueItem | null>(INITIAL_QUEUES[3]); // B-004
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Load from localStorage asynchronously after mount to prevent hydration mismatch and cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedQueues = localStorage.getItem('tpmd_queues');
        if (savedQueues) setQueues(JSON.parse(savedQueues));
        const savedPatients = localStorage.getItem('tpmd_patients');
        if (savedPatients) setPatients(JSON.parse(savedPatients));
        const savedConfig = localStorage.getItem('tpmd_bpjs_config');
        if (savedConfig) setBpjsConfig(JSON.parse(savedConfig));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem('tpmd_queues', JSON.stringify(queues));
    } catch {}
  }, [queues]);

  useEffect(() => {
    try {
      localStorage.setItem('tpmd_patients', JSON.stringify(patients));
    } catch {}
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem('tpmd_bpjs_config', JSON.stringify(bpjsConfig));
    } catch {}
  }, [bpjsConfig]);

  // Recalculate dynamic wait times whenever queues change or on interval
  useEffect(() => {
    const interval = setInterval(() => {
      setQueues((prev) =>
        prev.map((item) => {
          if (item.status === 'MENUNGGU') {
            const poli = DEFAULT_POLI_LIST.find((p) => p.kode === item.poliKode);
            const est = calculateEstimatedWaitTime(item, prev, poli);
            return {
              ...item,
              estimasiWaktuTungguMenit: est.menitTunggu,
              estimasiJamPanggil: est.jamEstimasiPanggil,
            };
          }
          return item;
        })
      );
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const addSecurityLog = (
    action: AuditSecurityLog['action'],
    details: string,
    status: 'SUCCESS' | 'DENIED' = 'SUCCESS'
  ) => {
    const log: AuditSecurityLog = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin Rekam Medis (0195U091-dev)',
      action,
      status,
      details,
    };
    setSecurityLogs((prev) => [log, ...prev].slice(0, 50));
  };

  const addBridgingLog = (logData: Omit<BridgingLog, 'id'>) => {
    const log: BridgingLog = {
      id: `br-${Date.now()}`,
      ...logData,
    };
    setBridgingLogs((prev) => [log, ...prev].slice(0, 50));
  };

  const addQueue = async (data: {
    nik: string;
    noBpjs?: string;
    namaPasien: string;
    poliKode: string;
    tipePasien: 'BPJS' | 'UMUM';
    keluhan?: string;
    noHp?: string;
  }): Promise<QueueItem> => {
    const poli = DEFAULT_POLI_LIST.find((p) => p.kode === data.poliKode) || DEFAULT_POLI_LIST[0];
    const prefix = poli.prefix;

    // Find highest number for this prefix today
    const existingInPoli = queues.filter((q) => q.prefix === prefix);
    const nextNumber =
      existingInPoli.length > 0 ? Math.max(...existingInPoli.map((q) => q.nomorUrut)) + 1 : 1;

    const nomorAntrean = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    const patientId = `pat-${Date.now()}`;
    const queueId = `q-${Date.now()}`;
    const kodeBooking = `BKJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nextNumber
      .toString()
      .padStart(4, '0')}`;

    // Encrypt sensitive patient PII for security compliance
    const encryptedPii = await encryptData(
      JSON.stringify({
        nik: data.nik,
        nama: data.namaPasien,
        noBpjs: data.noBpjs || '',
        keluhan: data.keluhan || '',
        noHp: data.noHp || '',
      })
    );

    const newPatient: Patient = {
      id: patientId,
      nik: data.nik,
      noBpjs: data.noBpjs || (data.tipePasien === 'BPJS' ? `000${data.nik.slice(6, 16)}` : '-'),
      nama: data.namaPasien.toUpperCase(),
      tglLahir: '1995-01-01',
      jenisKelamin: 'L',
      noHp: data.noHp || '081234567890',
      alamat: 'Wilayah Layanan TPMD Dr. Machmujur',
      statusBpjs: 'AKTIF',
      jenisPeserta: data.tipePasien === 'BPJS' ? 'PBI APBN' : 'Non-BPJS (Umum)',
      faskesTingkat1: `${bpjsConfig.kdFaskes} - ${bpjsConfig.namaFaskes}`,
      kelasRawat: 'Kelas 2',
      createdAt: new Date().toISOString(),
      encryptedData: encryptedPii,
    };

    const newQueueItem: QueueItem = {
      id: queueId,
      nomorAntrean,
      prefix,
      nomorUrut: nextNumber,
      tipePasien: data.tipePasien,
      poliKode: poli.kode,
      poliNama: poli.nama,
      dokterNama: poli.dokter,
      ruangNama: poli.ruang,
      patientId,
      nik: data.nik,
      noBpjs: newPatient.noBpjs,
      namaPasien: data.namaPasien.toUpperCase(),
      status: 'MENUNGGU',
      waktuDaftar: new Date().toISOString(),
      estimasiWaktuTungguMenit: 10,
      estimasiJamPanggil: 'Menghitung...',
      bpjsTaskId: 1, // Task 1: Check-in Kios
      kodeBooking,
      keluhan: data.keluhan,
      isSyncedBpjs: true,
      panggilanKe: 0,
    };

    // Calculate initial wait time estimate
    const estimate = calculateEstimatedWaitTime(newQueueItem, queues, poli);
    newQueueItem.estimasiWaktuTungguMenit = estimate.menitTunggu;
    newQueueItem.estimasiJamPanggil = estimate.jamEstimasiPanggil;

    // Log BPJS Bridging sync
    const headers = await getBpjsHeaders(bpjsConfig);
    addBridgingLog({
      timestamp: new Date().toISOString(),
      endpoint: '/antrean/add',
      method: 'POST',
      requestHeader: headers,
      requestPayload: {
        kodebooking: kodeBooking,
        jenispasien: data.tipePasien,
        nomorkartu: newPatient.noBpjs,
        nik: data.nik,
        kodepoli: poli.kode,
        namapoli: poli.nama,
        nomorantrean: nomorAntrean,
        angkaantrean: nextNumber,
        estimasidilayani: Date.now() + estimate.menitTunggu * 60000,
        kodedokter: '019U901-DOC-01',
        namadokter: poli.dokter,
        jampraktek: '08:00-16:00',
      },
      responseStatus: 200,
      responsePayload: {
        metaData: { code: 200, message: 'Ok' },
        response: { status: 'Nomor Antrean Berhasil Disinkronkan ke VClaim / PCare' },
      },
      durationMs: 84,
    });

    addSecurityLog(
      'ENCRYPT',
      `Data pasien ${nomorAntrean} (${data.namaPasien}) terenkripsi AES-256-GCM dengan tag otentikasi.`
    );

    setPatients((prev) => [newPatient, ...prev]);
    setQueues((prev) => [...prev, newQueueItem]);

    return newQueueItem;
  };

  const callQueue = async (id: string) => {
    const item = queues.find((q) => q.id === id);
    if (!item) return;

    const updatedQueues = queues.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status: 'DIPANGGIL' as const,
          waktuDipanggil: new Date().toISOString(),
          panggilanKe: (q.panggilanKe || 0) + 1,
          bpjsTaskId: 4, // Task 4: Panggil Poli
        };
      }
      return q;
    });

    setQueues(updatedQueues);
    const updatedItem = updatedQueues.find((q) => q.id === id) || item;
    setCurrentCalled(updatedItem);

    // Announce with Hospital Chime + Indonesian TTS
    if (audioEnabled) {
      try {
        await speakIndonesianQueue(updatedItem.nomorAntrean, updatedItem.poliNama, updatedItem.ruangNama);
      } catch (e) {
        console.warn('Audio call error:', e);
      }
    }

    // BPJS Bridging Task 4 update
    const headers = await getBpjsHeaders(bpjsConfig);
    addBridgingLog({
      timestamp: new Date().toISOString(),
      endpoint: '/antrean/updatewaktu',
      method: 'POST',
      requestHeader: headers,
      requestPayload: {
        kodebooking: updatedItem.kodeBooking,
        taskid: 4,
        waktu: Date.now(),
      },
      responseStatus: 200,
      responsePayload: {
        metaData: { code: 200, message: 'Ok' },
        response: { status: `Task 4 (Panggil Poli) Berhasil Dikirim untuk ${updatedItem.nomorAntrean}` },
      },
      durationMs: 65,
    });
  };

  const startService = async (id: string) => {
    const updatedQueues = queues.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status: 'DILAYANI' as const,
          waktuMulaiLayanan: new Date().toISOString(),
          bpjsTaskId: 5, // Task 5: Mulai Pelayanan
        };
      }
      return q;
    });

    setQueues(updatedQueues);

    const item = updatedQueues.find((q) => q.id === id);
    if (item) {
      const headers = await getBpjsHeaders(bpjsConfig);
      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint: '/antrean/updatewaktu',
        method: 'POST',
        requestHeader: headers,
        requestPayload: {
          kodebooking: item.kodeBooking,
          taskid: 5,
          waktu: Date.now(),
        },
        responseStatus: 200,
        responsePayload: {
          metaData: { code: 200, message: 'Ok' },
          response: { status: `Task 5 (Mulai Pelayanan Dokter) Berhasil Dikirim` },
        },
        durationMs: 72,
      });
    }
  };

  const finishQueue = async (id: string) => {
    const updatedQueues = queues.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status: 'SELESAI' as const,
          waktuSelesai: new Date().toISOString(),
          bpjsTaskId: q.poliKode === 'FAR' ? 7 : 6,
        };
      }
      return q;
    });

    setQueues(updatedQueues);

    const item = updatedQueues.find((q) => q.id === id);
    if (item) {
      const headers = await getBpjsHeaders(bpjsConfig);
      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint: '/antrean/updatewaktu',
        method: 'POST',
        requestHeader: headers,
        requestPayload: {
          kodebooking: item.kodeBooking,
          taskid: item.poliKode === 'FAR' ? 7 : 6,
          waktu: Date.now(),
        },
        responseStatus: 200,
        responsePayload: {
          metaData: { code: 200, message: 'Ok' },
          response: { status: `Pelayanan Pasien Selesai. Data bridging terupdate.` },
        },
        durationMs: 58,
      });
    }
  };

  const skipQueue = async (id: string) => {
    setQueues((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'DILEWATI' as const } : q))
    );
  };

  const cancelQueue = async (id: string) => {
    const item = queues.find((q) => q.id === id);
    setQueues((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'BATAL' as const } : q))
    );

    if (item) {
      const headers = await getBpjsHeaders(bpjsConfig);
      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint: '/antrean/batal',
        method: 'POST',
        requestHeader: headers,
        requestPayload: {
          kodebooking: item.kodeBooking,
          keterangan: 'Dibatalkan oleh petugas faskes/pasien',
        },
        responseStatus: 200,
        responsePayload: {
          metaData: { code: 200, message: 'Ok' },
          response: { status: `Antrean ${item.nomorAntrean} dibatalkan di sistem BPJS` },
        },
        durationMs: 62,
      });
    }
  };

  const transferToPharmacy = async (id: string): Promise<QueueItem> => {
    const item = queues.find((q) => q.id === id);
    if (!item) throw new Error('Antrean tidak ditemukan');

    // Mark current as finished first
    await finishQueue(id);

    // Create Pharmacy queue
    const farmasiPoli = DEFAULT_POLI_LIST.find((p) => p.kode === 'FAR') || DEFAULT_POLI_LIST[3];
    const existingFar = queues.filter((q) => q.prefix === 'F');
    const nextNumber = existingFar.length > 0 ? Math.max(...existingFar.map((q) => q.nomorUrut)) + 1 : 1;
    const nomorAntrean = `F-${nextNumber.toString().padStart(3, '0')}`;

    const farItem: QueueItem = {
      id: `q-far-${Date.now()}`,
      nomorAntrean,
      prefix: 'F',
      nomorUrut: nextNumber,
      tipePasien: item.tipePasien,
      poliKode: 'FAR',
      poliNama: 'Apotek & Farmasi',
      dokterNama: farmasiPoli.dokter,
      ruangNama: farmasiPoli.ruang,
      patientId: item.patientId,
      nik: item.nik,
      noBpjs: item.noBpjs,
      namaPasien: item.namaPasien,
      status: 'MENUNGGU',
      waktuDaftar: new Date().toISOString(),
      estimasiWaktuTungguMenit: 6,
      estimasiJamPanggil: 'Segera',
      bpjsTaskId: 6, // Resep siap
      kodeBooking: item.kodeBooking,
      keluhan: `Resep lanjutan dari ${item.poliNama}`,
      isSyncedBpjs: true,
      panggilanKe: 0,
    };

    setQueues((prev) => [...prev, farItem]);
    return farItem;
  };

  const updateBpjsConfig = (newConfig: Partial<BpjsBridgingConfig>) => {
    setBpjsConfig((prev) => ({ ...prev, ...newConfig }));
    addSecurityLog('KEY_ROTATE', 'Konfigurasi kredensial BPJS Bridging diperbarui oleh admin.');
  };

  const testBridgingPing = async () => {
    const start = performance.now();
    const headers = await getBpjsHeaders(bpjsConfig);
    const latencyMs = Math.round(performance.now() - start + 45); // simulated network handshake

    addBridgingLog({
      timestamp: new Date().toISOString(),
      endpoint: '/ref/poli',
      method: 'GET',
      requestHeader: headers,
      responseStatus: 200,
      responsePayload: {
        metaData: {
          code: 200,
          message: 'OK',
        },
        response: {
          faskes: bpjsConfig.namaFaskes,
          kdFaskes: bpjsConfig.kdFaskes,
          statusBridging: 'CONNECTED_VCLAIM_PCARE',
          consId: bpjsConfig.consId,
          userKeyActive: true,
          mode: bpjsConfig.environment.toUpperCase(),
        },
      },
      durationMs: latencyMs,
    });

    return {
      success: true,
      latencyMs,
      details: {
        consId: bpjsConfig.consId,
        faskes: bpjsConfig.namaFaskes,
        headers,
      },
    };
  };

  const resetToSampleData = () => {
    setQueues(INITIAL_QUEUES);
    setPatients(INITIAL_PATIENTS);
    setBpjsConfig(DEFAULT_BPJS_CONFIG);
    localStorage.removeItem('tpmd_queues');
    localStorage.removeItem('tpmd_patients');
    localStorage.removeItem('tpmd_bpjs_config');
  };

  return (
    <QueueContext.Provider
      value={{
        queues,
        patients,
        poliList,
        bpjsConfig,
        bridgingLogs,
        securityLogs,
        currentCalled,
        audioEnabled,
        setAudioEnabled,
        addQueue,
        callQueue,
        startService,
        finishQueue,
        skipQueue,
        cancelQueue,
        transferToPharmacy,
        updateBpjsConfig,
        testBridgingPing,
        addSecurityLog,
        resetToSampleData,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};

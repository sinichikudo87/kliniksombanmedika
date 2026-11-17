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
import { DEFAULT_BPJS_CONFIG, getBpjsHeaders, resolveBpjsBaseUrlForEnv } from './bpjs-bridging';
import { calculateEstimatedWaitTime } from './queue-estimator';
import { speakIndonesianQueue } from './tts-announcer';
import { encryptData } from './encrypted-db';

export interface BpjsSyncItemResult {
  type: 'ANTREAN' | 'PCARE';
  id: string;
  label: string;
  status: 'UPLOADED' | 'FAILED';
  httpStatus?: number;
  noKunjungan?: string | null;
  noRujukan?: string | null;
  message: string;
}

export interface BpjsSyncResult {
  success: boolean;
  dbConnected: boolean;
  totalPendingBefore: number;
  queuesUploaded: number;
  queuesFailed: number;
  visitsUploaded: number;
  visitsFailed: number;
  uploadedTotal: number;
  failedTotal: number;
  remainingPending: number;
  message: string;
  results: BpjsSyncItemResult[];
  syncedAt?: string;
}

export interface PendingBpjsSummary {
  pendingQueuesCount: number;
  pendingVisitsCount: number;
  totalPending: number;
  pendingQueues: Array<{ id: string; nomorAntrean: string; namaPasien: string; poliNama: string; status: string }>;
  pendingVisits: Array<{ id: string; namaPasien: string; noKartu: string; poliNama: string; diagnosaKode: string; statusPulang: string }>;
}

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
  autoUploadOnConnect: boolean;
  setAutoUploadOnConnect: (val: boolean) => void;
  isSyncingPending: boolean;
  pendingSyncSummary: PendingBpjsSummary;
  lastBpjsSyncResult: BpjsSyncResult | null;
  refreshPendingSyncStatus: () => Promise<void>;
  syncPendingToBpjs: (customConfig?: Partial<BpjsBridgingConfig>, options?: { silent?: boolean }) => Promise<BpjsSyncResult>;
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
  testBridgingPing: (customConfig?: Partial<BpjsBridgingConfig>) => Promise<{ success: boolean; isWhitelisted?: boolean; latencyMs: number; message?: string; details?: any; raw?: any; syncResult?: BpjsSyncResult | null }>;
  switchBpjsEnvironment: (targetEnv: 'tester' | 'production') => Promise<{ success: boolean; isWhitelisted?: boolean; latencyMs: number; message?: string; details?: any; raw?: any; baseUrl: string; environment: 'tester' | 'production'; syncResult?: BpjsSyncResult | null }>;
  addSecurityLog: (action: AuditSecurityLog['action'], details: string, status?: 'SUCCESS' | 'DENIED') => void;
  refreshFromDb: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const EMPTY_PENDING_SUMMARY: PendingBpjsSummary = {
  pendingQueuesCount: 0,
  pendingVisitsCount: 0,
  totalPending: 0,
  pendingQueues: [],
  pendingVisits: [],
};

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [poliList, setPoliList] = useState<PoliInfo[]>([]);
  const [bpjsConfig, setBpjsConfig] = useState<BpjsBridgingConfig>(DEFAULT_BPJS_CONFIG);
  const [bridgingLogs, setBridgingLogs] = useState<BridgingLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<AuditSecurityLog[]>([]);
  const [currentCalled, setCurrentCalled] = useState<QueueItem | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [autoUploadOnConnect, setAutoUploadOnConnectState] = useState<boolean>(true);
  const [isSyncingPending, setIsSyncingPending] = useState<boolean>(false);
  const [serverPendingSummary, setServerPendingSummary] = useState<PendingBpjsSummary>(EMPTY_PENDING_SUMMARY);
  const [lastBpjsSyncResult, setLastBpjsSyncResult] = useState<BpjsSyncResult | null>(null);

  const hasAutoCheckedPingRef = React.useRef(false);
  const isSyncingRef = React.useRef(false);
  const autoUploadOnConnectRef = React.useRef(true);
  const prevOnlineStateRef = React.useRef<boolean>(false);
  const bpjsConfigRef = React.useRef<BpjsBridgingConfig>(DEFAULT_BPJS_CONFIG);

  const setAutoUploadOnConnect = (val: boolean) => {
    autoUploadOnConnectRef.current = val;
    setAutoUploadOnConnectState(val);
  };

  useEffect(() => {
    bpjsConfigRef.current = bpjsConfig;
  }, [bpjsConfig]);

  // Synchronize state exclusively with MySQL Server Database on mount and live polling
  useEffect(() => {
    let isMounted = true;

    const fetchPendingStatusInternal = async () => {
      try {
        const res = await fetch('/api/bpjs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pending_status' }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.response && isMounted) {
          setServerPendingSummary({
            pendingQueuesCount: Number(json.response.pendingQueuesCount || 0),
            pendingVisitsCount: Number(json.response.pendingVisitsCount || 0),
            totalPending: Number(json.response.totalPending || 0),
            pendingQueues: Array.isArray(json.response.pendingQueues) ? json.response.pendingQueues : [],
            pendingVisits: Array.isArray(json.response.pendingVisits) ? json.response.pendingVisits : [],
          });
        }
      } catch {
        // Ignore if unreachable
      }
    };

    const runSyncInternal = async (cfg: BpjsBridgingConfig) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      if (isMounted) setIsSyncingPending(true);
      try {
        const res = await fetch('/api/bpjs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync_pending_bpjs',
            consId: cfg.consId,
            secretKey: cfg.secretKey,
            userKey: cfg.userKey,
            kdFaskes: cfg.kdFaskes,
            userPcareDev: cfg.userPcareDev,
            passPcareDev: cfg.passPcareDev,
            baseUrl: cfg.baseUrl,
            environment: cfg.environment,
          }),
        });
        const json = await res.json().catch(() => ({}));
        const meta = json.metaData || json.metadata || {};
        const r = json.response || {};
        if (isMounted && r) {
          setLastBpjsSyncResult({
            success: Number(r.uploadedTotal || 0) > 0 || Number(r.totalPendingBefore || 0) === 0,
            dbConnected: r.dbConnected !== false,
            totalPendingBefore: Number(r.totalPendingBefore || 0),
            queuesUploaded: Number(r.queuesUploaded || 0),
            queuesFailed: Number(r.queuesFailed || 0),
            visitsUploaded: Number(r.visitsUploaded || 0),
            visitsFailed: Number(r.visitsFailed || 0),
            uploadedTotal: Number(r.uploadedTotal || 0),
            failedTotal: Number(r.failedTotal || 0),
            remainingPending: Number(r.remainingPending || 0),
            message: meta.message || 'Sinkronisasi data tertunda selesai diproses.',
            results: Array.isArray(r.results) ? r.results : [],
            syncedAt: r.syncedAt || new Date().toISOString(),
          });
        }
        await fetchPendingStatusInternal();
      } catch {
        // Ignore network errors during background auto-sync
      } finally {
        isSyncingRef.current = false;
        if (isMounted) setIsSyncingPending(false);
      }
    };

    const verifyInitialBpjsConnectivity = async (cfg: BpjsBridgingConfig) => {
      if (hasAutoCheckedPingRef.current || !cfg?.consId || !cfg?.secretKey || !cfg?.userKey) return;
      hasAutoCheckedPingRef.current = true;
      try {
        const res = await fetch('/api/bpjs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ping',
            consId: cfg.consId,
            secretKey: cfg.secretKey,
            userKey: cfg.userKey,
            kdFaskes: cfg.kdFaskes,
            userPcareDev: cfg.userPcareDev,
            passPcareDev: cfg.passPcareDev,
            baseUrl: cfg.baseUrl,
            environment: cfg.environment,
          }),
        });
        const json = await res.json().catch(() => ({}));
        const meta = json.metadata || json.metaData || {};
        const isConnected = Boolean(
          json.response?.isConnected ?? (meta.code === 200 && json.response?.isWhitelisted === true)
        );
        if (isMounted) {
          prevOnlineStateRef.current = isConnected;
          setBpjsConfig((prev) => ({ ...prev, isOnline: isConnected }));
        }
        if (isConnected && autoUploadOnConnectRef.current) {
          await runSyncInternal(cfg);
        }
      } catch {
        // Keep current status on initial check error
      }
    };

    const fetchServerDb = async () => {
      try {
        const res = await fetch('/api/db', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setQueues(json.data.queues || []);
            setPatients(json.data.patients || []);
            setPoliList(Array.isArray(json.data.poliList) ? json.data.poliList : []);
            if (json.data.config) {
              setBpjsConfig(json.data.config);
              prevOnlineStateRef.current = Boolean(json.data.config.isOnline);
              verifyInitialBpjsConnectivity(json.data.config);
            } else {
              verifyInitialBpjsConnectivity(DEFAULT_BPJS_CONFIG);
            }
            if (Array.isArray(json.data.securityLogs)) setSecurityLogs(json.data.securityLogs);
            if (Array.isArray(json.data.bridgingLogs)) setBridgingLogs(json.data.bridgingLogs);

            const activeCall = (json.data.queues || []).find(
              (q: QueueItem) => q.status === 'DIPANGGIL'
            ) || (json.data.queues || []).find(
              (q: QueueItem) => q.status === 'DILAYANI'
            );
            setCurrentCalled(activeCall || null);
          }
        }
      } catch {
        verifyInitialBpjsConnectivity(DEFAULT_BPJS_CONFIG);
      }
    };

    fetchServerDb();
    fetchPendingStatusInternal();
    const syncInterval = setInterval(fetchServerDb, 3500);
    const pendingInterval = setInterval(fetchPendingStatusInternal, 10000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      clearInterval(pendingInterval);
    };
  }, []);

  // Recalculate dynamic wait times periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueues((prev) =>
        prev.map((item) => {
          if (item.status === 'MENUNGGU') {
            const poli = poliList.find((p) => p.kode === item.poliKode);
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
  }, [poliList]);

  const addSecurityLog = (
    action: AuditSecurityLog['action'],
    details: string,
    status: 'SUCCESS' | 'DENIED' = 'SUCCESS'
  ) => {
    const log: AuditSecurityLog = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: bpjsConfig.userPcareDev || 'Operator Faskes',
      action,
      status,
      details,
    };
    setSecurityLogs((prev) => [log, ...prev].slice(0, 50));

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_security_log', payload: log }),
    }).catch(() => {});
  };

  const addBridgingLog = (logData: Omit<BridgingLog, 'id'>) => {
    const log: BridgingLog = {
      id: `br-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      ...logData,
    };
    setBridgingLogs((prev) => [log, ...prev].slice(0, 50));

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_bridging_log', payload: log }),
    }).catch(() => {});
  };

  const dispatchBridgingTask = async (
    endpoint: string,
    requestPayload: Record<string, any>,
    fallbackDescription: string
  ): Promise<boolean> => {
    const headers = await getBpjsHeaders(bpjsConfig);
    const isBridgingActive = bpjsConfig.isOnline === true;
    const start = performance.now();

    if (!isBridgingActive) {
      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        requestHeader: headers,
        requestPayload,
        responseStatus: 201,
        responsePayload: {
          metaData: { code: 202, message: 'Pending Bridging (Belum terhubung ke API BPJS)' },
          response: { status: fallbackDescription },
        },
        durationMs: Math.round(performance.now() - start),
      });
      return false;
    }

    try {
      const res = await fetch('/api/bpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: endpoint === '/antrean/batal' ? 'antrean_batal' : endpoint === '/antrean/add' ? 'antrean_add' : 'antrean_updatewaktu',
          consId: bpjsConfig.consId,
          secretKey: bpjsConfig.secretKey,
          userKey: bpjsConfig.userKey,
          kdFaskes: bpjsConfig.kdFaskes,
          baseUrl: bpjsConfig.baseUrl,
          environment: bpjsConfig.environment,
          isOnline: true,
          payload: requestPayload,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const metaCode = Number(json.metaData?.code || json.metadata?.code || res.status);
      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        requestHeader: headers,
        requestPayload,
        responseStatus: Number.isNaN(metaCode) ? res.status : metaCode,
        responsePayload: json,
        durationMs: Math.round(performance.now() - start),
      });
      return res.ok && (Number.isNaN(metaCode) || metaCode < 400);
    } catch (err: any) {
      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        requestHeader: headers,
        requestPayload,
        responseStatus: 503,
        responsePayload: {
          metaData: { code: 503, message: err?.message || 'Gagal menghubungi API BPJS Bridging' },
        },
        durationMs: Math.round(performance.now() - start),
      });
      return false;
    }
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
    const poli = poliList.find((p) => p.kode === data.poliKode) || poliList[0];
    if (!poli) {
      throw new Error('Data master poliklinik belum tersedia.');
    }

    const prefix = poli.prefix;
    const existingInPoli = queues.filter((q) => q.prefix === prefix);
    const nextNumber =
      existingInPoli.length > 0 ? Math.max(...existingInPoli.map((q) => q.nomorUrut)) + 1 : 1;

    const nomorAntrean = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    const patientId = `pat-${Date.now()}`;
    const queueId = `q-${Date.now()}`;
    const kodeBooking = `BKJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nextNumber
      .toString()
      .padStart(4, '0')}`;

    const cleanNik = (data.nik || '').trim() || `UMUM-${Date.now().toString().slice(-11)}`;
    const cleanNoBpjs = (data.noBpjs || '').trim();
    const cleanNoHp = (data.noHp || '').trim();

    const encryptedPii = await encryptData(
      JSON.stringify({
        nik: cleanNik,
        nama: data.namaPasien,
        noBpjs: cleanNoBpjs,
        keluhan: data.keluhan || '',
        noHp: cleanNoHp,
      })
    );

    const newPatient: Patient = {
      id: patientId,
      nik: cleanNik,
      noBpjs: cleanNoBpjs,
      nama: data.namaPasien.toUpperCase(),
      tglLahir: '',
      jenisKelamin: 'L',
      noHp: cleanNoHp,
      alamat: '',
      statusBpjs: data.tipePasien === 'BPJS' ? 'AKTIF' : 'NON_AKTIF',
      jenisPeserta: data.tipePasien === 'BPJS' ? 'Peserta JKN' : 'Pasien Umum',
      faskesTingkat1: `${bpjsConfig.kdFaskes} - ${bpjsConfig.namaFaskes}`,
      kelasRawat: '',
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
      dokterNama: poli.dokter || '',
      ruangNama: poli.ruang || '',
      patientId,
      nik: cleanNik,
      noBpjs: cleanNoBpjs,
      namaPasien: data.namaPasien.toUpperCase(),
      status: 'MENUNGGU',
      waktuDaftar: new Date().toISOString(),
      estimasiWaktuTungguMenit: 10,
      estimasiJamPanggil: 'Menghitung...',
      bpjsTaskId: 1,
      kodeBooking,
      keluhan: data.keluhan,
      isSyncedBpjs: false,
      panggilanKe: 0,
    };

    const estimate = calculateEstimatedWaitTime(newQueueItem, queues, poli);
    newQueueItem.estimasiWaktuTungguMenit = estimate.menitTunggu;
    newQueueItem.estimasiJamPanggil = estimate.jamEstimasiPanggil;

    const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const isSynced = await dispatchBridgingTask(
      '/antrean/add',
      {
        kodebooking: kodeBooking,
        jenispasien: data.tipePasien,
        nomorkartu: cleanNoBpjs,
        nik: data.nik,
        nohp: cleanNoHp || '080000000000',
        kodepoli: poli.kode,
        namapoli: poli.nama,
        norm: patientId,
        tanggalperiksa: todayWib,
        nomorantrean: nomorAntrean,
        angkaantrean: nextNumber,
        estimasidilayani: Date.now() + estimate.menitTunggu * 60000,
        namadokter: poli.dokter || 'Dokter Umum',
      },
      'Antrean tersimpan di sistem (Belum terhubung ke API BPJS)'
    );
    newQueueItem.isSyncedBpjs = isSynced;

    addSecurityLog(
      'ENCRYPT',
      `Data pasien ${nomorAntrean} (${data.namaPasien}) terenkripsi AES-256-GCM dan disimpan ke server.`
    );

    setPatients((prev) => [newPatient, ...prev]);
    setQueues((prev) => [...prev, newQueueItem]);

    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_patient', payload: newPatient }),
      });
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_queue', payload: newQueueItem }),
      });
    } catch (err) {
      console.warn('Gagal menyimpan antrean ke MySQL:', err);
    }

    return newQueueItem;
  };

  const callQueue = async (id: string) => {
    const item = queues.find((q) => q.id === id);
    if (!item) return;

    const waktuDipanggil = new Date().toISOString();
    const panggilanKe = (item.panggilanKe || 0) + 1;
    const bpjsTaskId = 4;

    const updatedQueues = queues.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status: 'DIPANGGIL' as const,
          waktuDipanggil,
          panggilanKe,
          bpjsTaskId,
        };
      }
      return q;
    });

    setQueues(updatedQueues);
    const updatedItem = updatedQueues.find((q) => q.id === id) || item;
    setCurrentCalled(updatedItem);

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_queue',
        payload: {
          id,
          updates: {
            status: 'DIPANGGIL',
            waktuDipanggil,
            panggilanKe,
            bpjsTaskId,
          },
        },
      }),
    }).catch(() => {});

    if (audioEnabled) {
      try {
        await speakIndonesianQueue(updatedItem.nomorAntrean, updatedItem.poliNama, updatedItem.ruangNama);
      } catch (e) {
        console.warn('Audio call error:', e);
      }
    }

    await dispatchBridgingTask(
      '/antrean/updatewaktu',
      {
        kodebooking: updatedItem.kodeBooking,
        kodepoli: updatedItem.poliKode,
        nomorkartu: updatedItem.noBpjs || '',
        nomorantrean: updatedItem.nomorAntrean,
        tanggalperiksa: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        taskid: 4,
        waktu: Date.now(),
      },
      `Task 4 (Panggil Poli) untuk ${updatedItem.nomorAntrean} tercatat di sistem (Belum terhubung ke API BPJS)`
    );
  };

  const startService = async (id: string) => {
    const waktuMulaiLayanan = new Date().toISOString();
    const bpjsTaskId = 5;

    const updatedQueues = queues.map((q) => {
      if (q.id === id) {
        return {
          ...q,
          status: 'DILAYANI' as const,
          waktuMulaiLayanan,
          bpjsTaskId,
        };
      }
      return q;
    });

    setQueues(updatedQueues);

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_queue',
        payload: {
          id,
          updates: {
            status: 'DILAYANI',
            waktuMulaiLayanan,
            bpjsTaskId,
          },
        },
      }),
    }).catch(() => {});

    const item = updatedQueues.find((q) => q.id === id);
    if (item) {
      await dispatchBridgingTask(
        '/antrean/updatewaktu',
        {
          kodebooking: item.kodeBooking,
          kodepoli: item.poliKode,
          nomorkartu: item.noBpjs || '',
          nomorantrean: item.nomorAntrean,
          tanggalperiksa: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
          taskid: 5,
          waktu: Date.now(),
        },
        `Task 5 (Mulai Layanan Dokter) untuk ${item.nomorAntrean} tercatat di sistem (Belum terhubung ke API BPJS)`
      );
    }
  };

  const finishQueue = async (id: string) => {
    const waktuSelesai = new Date().toISOString();
    let bpjsTaskId = 6;

    const updatedQueues = queues.map((q) => {
      if (q.id === id) {
        bpjsTaskId = q.poliKode === 'FAR' ? 7 : 6;
        return {
          ...q,
          status: 'SELESAI' as const,
          waktuSelesai,
          bpjsTaskId,
        };
      }
      return q;
    });

    setQueues(updatedQueues);

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_queue',
        payload: {
          id,
          updates: {
            status: 'SELESAI',
            waktuSelesai,
            bpjsTaskId,
          },
        },
      }),
    }).catch(() => {});

    const item = updatedQueues.find((q) => q.id === id);
    if (item) {
      const targetTask = item.poliKode === 'FAR' ? 7 : 6;
      await dispatchBridgingTask(
        '/antrean/updatewaktu',
        {
          kodebooking: item.kodeBooking,
          kodepoli: item.poliKode,
          nomorkartu: item.noBpjs || '',
          nomorantrean: item.nomorAntrean,
          tanggalperiksa: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
          taskid: targetTask,
          waktu: Date.now(),
        },
        `Task ${targetTask} (Selesai Layanan) untuk ${item.nomorAntrean} tercatat di sistem (Belum terhubung ke API BPJS)`
      );
    }
  };

  const skipQueue = async (id: string) => {
    setQueues((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'DILEWATI' as const } : q))
    );

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_queue',
        payload: { id, updates: { status: 'DILEWATI' } },
      }),
    }).catch(() => {});
  };

  const cancelQueue = async (id: string) => {
    const item = queues.find((q) => q.id === id);
    setQueues((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'BATAL' as const } : q))
    );

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_queue',
        payload: { id, updates: { status: 'BATAL' } },
      }),
    }).catch(() => {});

    if (item) {
      await dispatchBridgingTask(
        '/antrean/batal',
        {
          kodebooking: item.kodeBooking,
          kodepoli: item.poliKode,
          nomorkartu: item.noBpjs || '',
          nomorantrean: item.nomorAntrean,
          tanggalperiksa: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
          keterangan: 'Dibatalkan oleh petugas faskes/pasien',
        },
        `Pembatalan antrean ${item.nomorAntrean} tercatat di sistem (Belum terhubung ke API BPJS)`
      );
    }
  };

  const transferToPharmacy = async (id: string): Promise<QueueItem> => {
    const item = queues.find((q) => q.id === id);
    if (!item) throw new Error('Antrean tidak ditemukan');

    await finishQueue(id);

    const farmasiPoli = poliList.find((p) => p.kode === 'FAR');
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
      poliNama: farmasiPoli?.nama || 'Apotek & Farmasi',
      dokterNama: farmasiPoli?.dokter || '',
      ruangNama: farmasiPoli?.ruang || 'Loket Farmasi',
      patientId: item.patientId,
      nik: item.nik,
      noBpjs: item.noBpjs,
      namaPasien: item.namaPasien,
      status: 'MENUNGGU',
      waktuDaftar: new Date().toISOString(),
      estimasiWaktuTungguMenit: farmasiPoli?.durasiRataRataMenit || 6,
      estimasiJamPanggil: 'Segera',
      bpjsTaskId: 6,
      kodeBooking: item.kodeBooking,
      keluhan: `Resep lanjutan dari ${item.poliNama}`,
      isSyncedBpjs: Boolean(bpjsConfig.isOnline),
      panggilanKe: 0,
    };

    setQueues((prev) => [...prev, farItem]);

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_queue', payload: farItem }),
    }).catch(() => {});

    return farItem;
  };

  const updateBpjsConfig = (newConfig: Partial<BpjsBridgingConfig>) => {
    setBpjsConfig((prev) => ({ ...prev, ...newConfig }));
    addSecurityLog('KEY_ROTATE', 'Konfigurasi kredensial BPJS Bridging diperbarui.');

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_config', payload: newConfig }),
    }).catch(() => {});
  };

  const refreshPendingSyncStatus = async () => {
    try {
      const res = await fetch('/api/bpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pending_status' }),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.response) {
        setServerPendingSummary({
          pendingQueuesCount: Number(json.response.pendingQueuesCount || 0),
          pendingVisitsCount: Number(json.response.pendingVisitsCount || 0),
          totalPending: Number(json.response.totalPending || 0),
          pendingQueues: Array.isArray(json.response.pendingQueues) ? json.response.pendingQueues : [],
          pendingVisits: Array.isArray(json.response.pendingVisits) ? json.response.pendingVisits : [],
        });
      }
    } catch {
      // Ignore if unreachable
    }
  };

  const refreshFromDb = async () => {
    try {
      const res = await fetch('/api/db', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setQueues(json.data.queues || []);
          setPatients(json.data.patients || []);
          if (json.data.config) setBpjsConfig(json.data.config);
          if (Array.isArray(json.data.poliList)) setPoliList(json.data.poliList);
          if (Array.isArray(json.data.securityLogs)) setSecurityLogs(json.data.securityLogs);
          if (Array.isArray(json.data.bridgingLogs)) setBridgingLogs(json.data.bridgingLogs);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat ulang data:', e);
    }
  };

  const syncPendingToBpjs = async (
    customConfig?: Partial<BpjsBridgingConfig>,
    options?: { silent?: boolean }
  ): Promise<BpjsSyncResult> => {
    const activeCfg = { ...bpjsConfigRef.current, ...customConfig };
    if (isSyncingRef.current) {
      return (
        lastBpjsSyncResult || {
          success: false,
          dbConnected: true,
          totalPendingBefore: 0,
          queuesUploaded: 0,
          queuesFailed: 0,
          visitsUploaded: 0,
          visitsFailed: 0,
          uploadedTotal: 0,
          failedTotal: 0,
          remainingPending: 0,
          message: 'Proses sinkronisasi data tertunda sedang berjalan...',
          results: [],
        }
      );
    }

    isSyncingRef.current = true;
    setIsSyncingPending(true);
    try {
      const res = await fetch('/api/bpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_pending_bpjs',
          consId: activeCfg.consId,
          secretKey: activeCfg.secretKey,
          userKey: activeCfg.userKey,
          kdFaskes: activeCfg.kdFaskes,
          userPcareDev: activeCfg.userPcareDev,
          passPcareDev: activeCfg.passPcareDev,
          baseUrl: activeCfg.baseUrl,
          environment: activeCfg.environment,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const meta = json.metaData || json.metadata || {};
      const r = json.response || {};

      const syncSummary: BpjsSyncResult = {
        success: Number(r.uploadedTotal || 0) > 0 || Number(r.totalPendingBefore || 0) === 0,
        dbConnected: r.dbConnected !== false,
        totalPendingBefore: Number(r.totalPendingBefore || 0),
        queuesUploaded: Number(r.queuesUploaded || 0),
        queuesFailed: Number(r.queuesFailed || 0),
        visitsUploaded: Number(r.visitsUploaded || 0),
        visitsFailed: Number(r.visitsFailed || 0),
        uploadedTotal: Number(r.uploadedTotal || 0),
        failedTotal: Number(r.failedTotal || 0),
        remainingPending: Number(r.remainingPending || 0),
        message: meta.message || 'Sinkronisasi data tertunda selesai.',
        results: Array.isArray(r.results) ? r.results : [],
        syncedAt: r.syncedAt || new Date().toISOString(),
      };

      setLastBpjsSyncResult(syncSummary);

      if (syncSummary.uploadedTotal > 0 && !options?.silent) {
        addSecurityLog(
          'EXPORT',
          `Sinkronisasi manual berhasil mengunggah ${syncSummary.uploadedTotal} data tertunda ke BPJS Bridging.`
        );
      }

      await Promise.all([refreshFromDb(), refreshPendingSyncStatus()]);
      return syncSummary;
    } catch (err: any) {
      const errRes: BpjsSyncResult = {
        success: false,
        dbConnected: false,
        totalPendingBefore: 0,
        queuesUploaded: 0,
        queuesFailed: 0,
        visitsUploaded: 0,
        visitsFailed: 0,
        uploadedTotal: 0,
        failedTotal: 0,
        remainingPending: 0,
        message: 'Gagal mengunggah data tertunda: ' + (err?.message || 'Koneksi terputus'),
        results: [],
      };
      setLastBpjsSyncResult(errRes);
      return errRes;
    } finally {
      isSyncingRef.current = false;
      setIsSyncingPending(false);
    }
  };

  const testBridgingPing = async (customConfig?: Partial<BpjsBridgingConfig>) => {
    const activeCfg = { ...bpjsConfig, ...customConfig };
    if (!activeCfg.baseUrl) {
      activeCfg.baseUrl = activeCfg.environment === 'production'
        ? 'https://apijkn.bpjs-kesehatan.go.id/antreanfktp'
        : 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev';
    }
    const start = performance.now();
    const headers = await getBpjsHeaders(activeCfg);

    try {
      const res = await fetch('/api/bpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ping',
          consId: activeCfg.consId,
          secretKey: activeCfg.secretKey,
          userKey: activeCfg.userKey,
          kdFaskes: activeCfg.kdFaskes,
          userPcareDev: activeCfg.userPcareDev,
          passPcareDev: activeCfg.passPcareDev,
          baseUrl: activeCfg.baseUrl,
          environment: activeCfg.environment,
        }),
      });

      const json = await res.json().catch(() => ({}));
      const latencyMs = Math.round(performance.now() - start);
      const meta = json.metadata || json.metaData || {};
      const isConnected = Boolean(
        json.response?.isConnected ?? (meta.code === 200 && json.response?.isWhitelisted === true)
      );

      addBridgingLog({
        timestamp: new Date().toISOString(),
        endpoint: `${activeCfg.baseUrl} (Ping BPJS)`,
        method: 'GET',
        requestHeader: headers,
        responseStatus: meta.code || res.status,
        responsePayload: json,
        durationMs: latencyMs,
      });

      prevOnlineStateRef.current = isConnected;
      updateBpjsConfig({ ...customConfig, isOnline: isConnected });

      let syncResult: BpjsSyncResult | null = null;
      if (isConnected && autoUploadOnConnectRef.current) {
        syncResult = await syncPendingToBpjs(activeCfg, { silent: true });
      }

      return {
        success: isConnected,
        isWhitelisted: isConnected,
        latencyMs,
        message:
          meta.message ||
          (isConnected
            ? 'Terhubung ke Web Service BPJS'
            : 'Gagal terhubung ke Web Service BPJS'),
        details: json.response || json,
        raw: json,
        syncResult,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      prevOnlineStateRef.current = false;
      updateBpjsConfig({ ...customConfig, isOnline: false });
      return {
        success: false,
        isWhitelisted: false,
        latencyMs,
        message: 'Koneksi ke endpoint BPJS gagal: ' + err.message,
        syncResult: null,
      };
    }
  };

  const switchBpjsEnvironment = async (targetEnv: 'tester' | 'production') => {
    const nextBaseUrl = resolveBpjsBaseUrlForEnv(bpjsConfig.baseUrl, targetEnv);
    const updates: Partial<BpjsBridgingConfig> = {
      environment: targetEnv,
      baseUrl: nextBaseUrl,
    };
    updateBpjsConfig(updates);
    const pingRes = await testBridgingPing(updates);
    return {
      ...pingRes,
      environment: targetEnv,
      baseUrl: nextBaseUrl,
    };
  };

  // Combine server pending counts with reactive local unsynced queue count
  const localUnsyncedQueues = queues.filter((q) => !q.isSyncedBpjs);
  const effectivePendingQueuesCount = Math.max(serverPendingSummary.pendingQueuesCount, localUnsyncedQueues.length);
  const pendingSyncSummary: PendingBpjsSummary = {
    pendingQueuesCount: effectivePendingQueuesCount,
    pendingVisitsCount: serverPendingSummary.pendingVisitsCount,
    totalPending: effectivePendingQueuesCount + serverPendingSummary.pendingVisitsCount,
    pendingQueues:
      localUnsyncedQueues.length > 0
        ? localUnsyncedQueues.slice(0, 20).map((q) => ({
            id: q.id,
            nomorAntrean: q.nomorAntrean,
            namaPasien: q.namaPasien,
            poliNama: q.poliNama,
            status: q.status,
          }))
        : serverPendingSummary.pendingQueues,
    pendingVisits: serverPendingSummary.pendingVisits,
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
        autoUploadOnConnect,
        setAutoUploadOnConnect,
        isSyncingPending,
        pendingSyncSummary,
        lastBpjsSyncResult,
        refreshPendingSyncStatus,
        syncPendingToBpjs,
        addQueue,
        callQueue,
        startService,
        finishQueue,
        skipQueue,
        cancelQueue,
        transferToPharmacy,
        updateBpjsConfig,
        testBridgingPing,
        switchBpjsEnvironment,
        addSecurityLog,
        refreshFromDb,
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

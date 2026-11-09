import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  BPJSConfig,
  BridgingLog,
  KategoriAntrean,
  LoketItem,
  QueueTicket,
  TTSConfig,
} from '../types/queue';
import { BPJSBridgingService } from '../services/bpjsBridging';
import { ttsService, TTSState } from '../services/ttsService';

interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

interface QueueContextType {
  tickets: QueueTicket[];
  lokets: LoketItem[];
  activeLoketId: string;
  setActiveLoketId: (id: string) => void;
  currentCalledTicket: QueueTicket | null;
  bpjsConfig: BPJSConfig;
  setBpjsConfig: React.Dispatch<React.SetStateAction<BPJSConfig>>;
  mysqlConfig: MySQLConfig;
  setMysqlConfig: React.Dispatch<React.SetStateAction<MySQLConfig>>;
  ttsConfig: TTSConfig;
  updateTTSConfig: (config: Partial<TTSConfig>) => void;
  ttsState: TTSState;
  bridgingLogs: BridgingLog[];
  clearLogs: () => void;
  resetAllTickets: () => Promise<void>;
  // MySQL Actions
  syncToMySQL: (config?: Partial<MySQLConfig>) => Promise<any>;
  testMySQLConnection: (config?: Partial<MySQLConfig>) => Promise<any>;
  downloadSQLExport: () => void;
  // Queue Actions
  panggilAntrean: (ticketId: string, loketId?: string) => Promise<void>;
  panggilUlang: () => Promise<void>;
  panggilBerikutnya: (loketId?: string) => Promise<void>;
  mulaiLayanan: (ticketId: string) => Promise<void>;
  selesaiLayanan: (ticketId: string) => Promise<void>;
  lewatiAntrean: (ticketId: string) => Promise<void>;
  ambilTiketBaru: (data: {
    kategori: KategoriAntrean;
    poliTujuan: string;
    kodePoli: string;
    dokterNama: string;
    namaPasien?: string;
    noKartuBPJS?: string;
    nik?: string;
    nomorRM?: string;
  }) => Promise<QueueTicket>;
  cekPesertaBPJS: (identifier: string, isNik?: boolean) => Promise<any>;
  testSpeakerSound: (customText?: string) => Promise<void>;
  testBpjsConnection: () => Promise<any>;
}

const initialLokets: LoketItem[] = [
  {
    id: 'loket-1',
    nama: 'Loket 1 - Pendaftaran & SEP BPJS',
    kode: 'LOKET-1',
    tipe: 'ADMISI',
    kategoriHuruf: ['A', 'P'],
    petugas: 'Sdri. Ifa',
  },
  {
    id: 'loket-2',
    nama: 'Loket 2 - Pendaftaran Pasien Umum',
    kode: 'LOKET-2',
    tipe: 'ADMISI',
    kategoriHuruf: ['B'],
    petugas: 'Sdri. Dwi Lestari',
  },
  {
    id: 'loket-3',
    nama: 'Loket 3 - Prioritas Lansia & Ibu Hamil',
    kode: 'LOKET-3',
    tipe: 'ADMISI',
    kategoriHuruf: ['P'],
    petugas: 'Sdri. Maya Safitri',
  },
  {
    id: 'poli-umu',
    nama: 'Poli Umum - Ruang 1',
    kode: 'POLI-UMU',
    tipe: 'POLI',
    kategoriHuruf: ['A', 'B', 'P'],
    petugas: 'dr. Machmujur',
    ruang: 'Ruang 1 (Klinik Lantai 1)',
  },
  {
    id: 'poli-gig',
    nama: 'Poli Umum - Ruang 2',
    kode: 'POLI-UMU-2',
    tipe: 'POLI',
    kategoriHuruf: ['A', 'B', 'P'],
    petugas: 'dr. Diana',
    ruang: 'Ruang 2 (Klinik Lantai 1)',
  },
  {
    id: 'poli-kia',
    nama: 'Poli KIA & Kebidanan / KB - Ruang 3',
    kode: 'POLI-KIA',
    tipe: 'POLI',
    kategoriHuruf: ['A', 'B', 'P'],
    petugas: 'Bidan',
    ruang: 'Ruang 3 (Klinik Lantai 1)',
  },
  {
    id: 'loket-far',
    nama: 'Farmasi & Penyerahan Resep Obat',
    kode: 'FARMASI',
    tipe: 'FARMASI',
    kategoriHuruf: ['F'],
    petugas: 'Sdr. Wandi',
    ruang: 'Depo Obat Lobby Depan',
  },
];

// Clean empty initial tickets (No dummy data!)
const initialTickets: QueueTicket[] = [];

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<QueueTicket[]>(initialTickets);
  const [lokets, setLokets] = useState<LoketItem[]>(initialLokets);
  const [activeLoketId, setActiveLoketId] = useState<string>('loket-1');
  const [currentCalledTicket, setCurrentCalledTicket] = useState<QueueTicket | null>(null);
  const [bridgingLogs, setBridgingLogs] = useState<BridgingLog[]>([]);

  // BPJS & PCare Bridging Credentials (Official TPMD DR MACHMUJUR FKTP Tester)
  const [bpjsConfig, setBpjsConfig] = useState<BPJSConfig>({
    baseUrl: 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev',
    consId: '11495',
    secretKey: '4xHABA0A84',
    userKey: '4a1a84234ffc19f0c77750cebfa2444e',
    kodePPK: '019U901',
    namaFaskes: 'TPMD DR MACHMUJUR',
    isSandbox: true,
    autoSyncBpjs: true,
    jenisBridging: 'Pcare (Eclaim)',
    jenisCid: 'Tester',
    cidTesterProd: 'Tester',
    userPcare: '0195U091-dev',
    passPcare: 'Dev1234#',
    emailFaskes: 'praktekdokter91@gmail.com',
    pengembanganVendor: 'Pengembangan sendiri',
    kdAplikasi: '095',
  });

  // Save changes to backend server API whenever bpjsConfig updates (No localStorage!)
  const updateBpjsConfigOnServer = async (newConfig: BPJSConfig) => {
    try {
      await fetch('/api/bpjs/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (e) {
      console.warn('Gagal menyimpan bpjsConfig ke server:', e);
    }
  };

  const handleSetBpjsConfig: React.Dispatch<React.SetStateAction<BPJSConfig>> = (value) => {
    setBpjsConfig((prev) => {
      const updated = typeof value === 'function' ? (value as any)(prev) : value;
      updateBpjsConfigOnServer(updated);
      return updated;
    });
  };

  // MySQL Connection Settings
  const [mysqlConfig, setMysqlConfig] = useState<MySQLConfig>({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'antrean_bpjs_somban',
  });

  // Text-to-Speech Configuration
  const [ttsConfig, setTTSConfig] = useState<TTSConfig>(() => ttsService.getConfig());
  const [ttsState, setTTSState] = useState<TTSState>(() => ttsService.getState());

  // Load real persisted tickets, logs, and bpjsConfig from backend API on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [resTickets, resLogs, resBpjsConfig] = await Promise.all([
          fetch('/api/tickets').then((r) => (r.ok ? r.json() : { data: [] })),
          fetch('/api/bridging-logs').then((r) => (r.ok ? r.json() : { data: [] })),
          fetch('/api/bpjs/config').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (resTickets.data && Array.isArray(resTickets.data)) {
          setTickets(resTickets.data);
          const active = resTickets.data.find((t: QueueTicket) => t.status === 'DIPANGGIL' || t.status === 'SEDANG_DILAYANI');
          if (active) setCurrentCalledTicket(active);
        }
        if (resLogs.data && Array.isArray(resLogs.data)) {
          setBridgingLogs(resLogs.data);
        }
        if (resBpjsConfig && resBpjsConfig.data) {
          setBpjsConfig((prev) => ({ ...prev, ...resBpjsConfig.data }));
        }
      } catch (e) {
        console.warn('Backend API offline, using in-memory state:', e);
      }
    };

    loadPersistedData();
  }, []);

  useEffect(() => {
    const unsub = ttsService.subscribe((state) => {
      setTTSState(state);
    });
    return unsub;
  }, []);

  const updateTTSConfig = (config: Partial<TTSConfig>) => {
    ttsService.updateConfig(config);
    setTTSConfig(ttsService.getConfig());
  };

  const persistTicket = async (ticket: QueueTicket) => {
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });
    } catch (e) {
      console.error('Failed to persist ticket to backend:', e);
    }
  };

  const addLog = async (log: BridgingLog) => {
    setBridgingLogs((prev) => [log, ...prev.slice(0, 99)]);
    try {
      await fetch('/api/bridging-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (e) {
      console.error('Failed to persist bridging log to backend:', e);
    }
  };

  const clearLogs = async () => {
    setBridgingLogs([]);
    try {
      await fetch('/api/bridging-logs', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to clear logs on backend:', e);
    }
  };

  const resetAllTickets = async () => {
    setTickets([]);
    setCurrentCalledTicket(null);
    try {
      await fetch('/api/tickets', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to reset tickets on backend:', e);
    }
  };

  // MySQL Sync Methods
  const testMySQLConnection = async (customConfig?: Partial<MySQLConfig>) => {
    const payload = { ...mysqlConfig, ...customConfig };
    const res = await fetch('/api/mysql/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const syncToMySQL = async (customConfig?: Partial<MySQLConfig>) => {
    const payload = { ...mysqlConfig, ...customConfig };
    const res = await fetch('/api/mysql/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const downloadSQLExport = () => {
    window.open('/api/mysql/export-sql', '_blank');
  };

  /**
   * Panggil Antrean
   */
  const panggilAntrean = async (ticketId: string, loketId?: string) => {
    const targetLoketId = loketId || activeLoketId;
    const loket = lokets.find((l) => l.id === targetLoketId) || lokets[0];
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'DIPANGGIL',
      loketDipanggil: loket.nama,
      waktuPanggil: new Date().toISOString(),
      taskIdBpjs: loket.tipe === 'ADMISI' ? 2 : loket.tipe === 'POLI' ? 4 : 6,
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
    setCurrentCalledTicket(updatedTicket);
    persistTicket(updatedTicket);

    setLokets((prev) =>
      prev.map((l) => (l.id === targetLoketId ? { ...l, currentTicketId: ticketId } : l))
    );

    // Sync Task status to BPJS Bridging
    if (bpjsConfig.autoSyncBpjs) {
      try {
        const { log } = await BPJSBridgingService.updateTaskStatus(
          bpjsConfig,
          ticket.kodeBooking,
          updatedTicket.taskIdBpjs
        );
        addLog(log);
      } catch (err) {
        console.error('Failed to sync BPJS task status:', err);
      }
    }

    const destinationName = loket.ruang ? `${loket.nama.split('-')[0].trim()}, ${loket.ruang}` : loket.nama.split('-')[0].trim();
    await ttsService.callQueue(updatedTicket.nomorAntrean, destinationName);
  };

  /**
   * Panggil Ulang
   */
  const panggilUlang = async () => {
    if (!currentCalledTicket) return;
    const loketNama = currentCalledTicket.loketDipanggil || 'Loket Petugas';
    const destinationName = loketNama.split('-')[0].trim();
    await ttsService.callQueue(currentCalledTicket.nomorAntrean, destinationName);
  };

  /**
   * Panggil Berikutnya
   */
  const panggilBerikutnya = async (loketId?: string) => {
    const targetLoketId = loketId || activeLoketId;
    const loket = lokets.find((l) => l.id === targetLoketId) || lokets[0];

    const nextTicket = tickets.find(
      (t) => t.status === 'MENUNGGU' && loket.kategoriHuruf.includes(t.huruf)
    );

    if (nextTicket) {
      await panggilAntrean(nextTicket.id, targetLoketId);
    }
  };

  /**
   * Mulai Layanan
   */
  const mulaiLayanan = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const updated: QueueTicket = {
      ...ticket,
      status: 'SEDANG_DILAYANI',
      waktuMulaiLayan: new Date().toISOString(),
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    if (currentCalledTicket?.id === ticketId) {
      setCurrentCalledTicket(updated);
    }
    persistTicket(updated);
  };

  /**
   * Selesai Layanan
   */
  const selesaiLayanan = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const nextTaskId = ticket.taskIdBpjs === 2 ? 3 : ticket.taskIdBpjs === 4 ? 5 : 7;
    const updated: QueueTicket = {
      ...ticket,
      status: 'SELESAI',
      waktuSelesai: new Date().toISOString(),
      taskIdBpjs: nextTaskId,
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    if (currentCalledTicket?.id === ticketId) {
      setCurrentCalledTicket(null);
    }
    persistTicket(updated);

    if (bpjsConfig.autoSyncBpjs) {
      try {
        const { log } = await BPJSBridgingService.updateTaskStatus(
          bpjsConfig,
          ticket.kodeBooking,
          nextTaskId
        );
        addLog(log);
      } catch (err) {
        console.error('Failed to sync BPJS task status on complete:', err);
      }
    }
  };

  /**
   * Lewati Antrean
   */
  const lewatiAntrean = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const updated: QueueTicket = {
      ...ticket,
      status: 'BATAL',
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    if (currentCalledTicket?.id === ticketId) {
      setCurrentCalledTicket(null);
    }
    persistTicket(updated);

    if (bpjsConfig.autoSyncBpjs) {
      try {
        const { log } = await BPJSBridgingService.request(
          bpjsConfig,
          '/antrean/batal',
          'POST',
          { kodebooking: ticket.kodeBooking, keterangan: 'Pasien tidak hadir saat dipanggil' }
        );
        addLog(log);
      } catch (err) {
        console.error('Failed to sync BPJS cancel:', err);
      }
    }
  };

  /**
   * Ambil Tiket Baru (via Kiosk Mandiri)
   */
  const ambilTiketBaru = async (data: {
    kategori: KategoriAntrean;
    poliTujuan: string;
    kodePoli: string;
    dokterNama: string;
    namaPasien?: string;
    noKartuBPJS?: string;
    nik?: string;
    nomorRM?: string;
  }): Promise<QueueTicket> => {
    let huruf = 'A';
    if (data.kategori === 'UMUM') huruf = 'B';
    else if (data.kategori === 'PRIORITAS') huruf = 'P';
    else if (data.kategori === 'FARMASI') huruf = 'F';

    const existingForLetter = tickets.filter((t) => t.huruf === huruf);
    const maxNum = existingForLetter.reduce((max, t) => Math.max(max, t.angka), 0);
    const nextNum = maxNum + 1;
    const nomorFormatted = `${huruf}-${String(nextNum).padStart(3, '0')}`;

    const newTicket: QueueTicket = {
      id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      nomorAntrean: nomorFormatted,
      huruf,
      angka: nextNum,
      kategori: data.kategori,
      poliTujuan: data.poliTujuan,
      kodePoli: data.kodePoli,
      dokterNama: data.dokterNama,
      namaPasien: data.namaPasien || (data.kategori === 'BPJS' ? 'Peserta BPJS Mandiri' : 'Pasien Umum'),
      noKartuBPJS: data.noKartuBPJS || (data.kategori === 'BPJS' ? '000' + Math.floor(1000000000 + Math.random() * 9000000000) : '-'),
      nik: data.nik || '351508' + Math.floor(1000000000 + Math.random() * 9000000000),
      nomorRM: data.nomorRM || `RM-${Math.floor(10000 + Math.random() * 90000)}`,
      kodeBooking: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextNum).padStart(3, '0')}`,
      status: 'MENUNGGU',
      waktuAmbil: new Date().toISOString(),
      taskIdBpjs: 1,
      estimasiDilayani: `${new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
    };

    setTickets((prev) => [...prev, newTicket]);
    persistTicket(newTicket);

    if (bpjsConfig.autoSyncBpjs) {
      try {
        const { log } = await BPJSBridgingService.kirimAntreanBaru(bpjsConfig, newTicket);
        addLog(log);
      } catch (err) {
        console.error('Failed to send add ticket to BPJS:', err);
      }
    }

    return newTicket;
  };

  /**
   * Cek Peserta BPJS
   */
  const cekPesertaBPJS = async (identifier: string, isNik = false) => {
    const res = await BPJSBridgingService.cekPeserta(bpjsConfig, identifier, isNik);
    addLog(res.log);
    return res;
  };

  /**
   * Speaker test
   */
  const testSpeakerSound = async (customText?: string) => {
    await ttsService.testSpeechPreview(customText);
  };

  /**
   * Test BPJS connection
   */
  const testBpjsConnection = async () => {
    const res = await BPJSBridgingService.ping(bpjsConfig);
    addLog(res.log);
    return res;
  };

  return (
    <QueueContext.Provider
      value={{
        tickets,
        lokets,
        activeLoketId,
        setActiveLoketId,
        currentCalledTicket,
        bpjsConfig,
        setBpjsConfig: handleSetBpjsConfig,
        mysqlConfig,
        setMysqlConfig,
        ttsConfig,
        updateTTSConfig,
        ttsState,
        bridgingLogs,
        clearLogs,
        resetAllTickets,
        syncToMySQL,
        testMySQLConnection,
        downloadSQLExport,
        panggilAntrean,
        panggilUlang,
        panggilBerikutnya,
        mulaiLayanan,
        selesaiLayanan,
        lewatiAntrean,
        ambilTiketBaru,
        cekPesertaBPJS,
        testSpeakerSound,
        testBpjsConnection,
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

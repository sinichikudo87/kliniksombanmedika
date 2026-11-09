import { BPJSConfig, BridgingLog, QueueTicket } from '../types/queue';

export interface ReferensiPoliBPJS {
  kdPoli: string;
  nmPoli: string;
  kdSubSpesialis: string;
  nmSubSpesialis: string;
  dokterDefault: string;
  isDefault?: boolean;
}

export const REFERENSI_POLI_BPJS_STANDAR: ReferensiPoliBPJS[] = [
  {
    kdPoli: '001',
    nmPoli: 'Poli Umum',
    kdSubSpesialis: 'UMU',
    nmSubSpesialis: 'Pelayanan Medik Dasar / Dokter Umum',
    dokterDefault: 'dr. Machmujur',
    isDefault: true,
  },
  {
    kdPoli: '002',
    nmPoli: 'Poli Gigi & Mulut',
    kdSubSpesialis: 'GIG',
    nmSubSpesialis: 'Pelayanan Kesehatan Gigi & Mulut (Dokter Umum)',
    dokterDefault: 'dr. Diana (Dokter Umum)',
  },
  {
    kdPoli: '003',
    nmPoli: 'Poli KIA & KB',
    kdSubSpesialis: 'KIA',
    nmSubSpesialis: 'Kesehatan Ibu, Anak & KB',
    dokterDefault: 'Bidan',
  },
  {
    kdPoli: '004',
    nmPoli: 'Poli Lansia & Prolanis',
    kdSubSpesialis: 'PRO',
    nmSubSpesialis: 'Pelayanan Lansia & Pengelolaan Penyakit Kronis (Dokter Umum)',
    dokterDefault: 'dr. Diana (Dokter Umum)',
  },
  {
    kdPoli: '005',
    nmPoli: 'Farmasi & Apotek',
    kdSubSpesialis: 'FAR',
    nmSubSpesialis: 'Depo Farmasi & Penyerahan Resep',
    dokterDefault: 'Wandi (Penyerahan Resep)',
  },
  {
    kdPoli: '006',
    nmPoli: 'Laboratorium',
    kdSubSpesialis: 'LAB',
    nmSubSpesialis: 'Pemeriksaan Darah & Diagnostik Sederhana',
    dokterDefault: 'Analis Medis Somban',
  },
];

export class BPJSBridgingService {
  /**
   * Generates official BPJS HMAC-SHA256 Signature using Web Crypto API.
   * Formula: Base64(HMAC_SHA256(ConsID + "&" + Timestamp, SecretKey))
   */
  static async generateSignature(consId: string, secretKey: string, timestamp: string): Promise<string> {
    try {
      const enc = new TextEncoder();
      const message = `${consId}&${timestamp}`;
      const keyBuffer = enc.encode(secretKey);
      const messageBuffer = enc.encode(message);

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
      const byteArray = new Uint8Array(signatureBuffer);
      let binary = '';
      for (let i = 0; i < byteArray.byteLength; i++) {
        binary += String.fromCharCode(byteArray[i]);
      }
      return window.btoa(binary);
    } catch (error) {
      console.error('Error generating BPJS signature:', error);
      return 'SIGNATURE_GENERATION_FAILED';
    }
  }

  /**
   * Generates official BPJS PCare (Primary Care FKTP) Authorization header.
   * Formula: Basic Base64(username_pcare + ":" + password_pcare + ":" + kd_aplikasi)
   */
  static generatePcareAuthorization(userPcare?: string, passPcare?: string, kdAplikasi = '095'): string {
    if (!userPcare || !passPcare) return '';
    try {
      const raw = `${userPcare}:${passPcare}:${kdAplikasi}`;
      return 'Basic ' + window.btoa(raw);
    } catch (e) {
      return '';
    }
  }

  /**
   * Get current UTC timestamp in seconds (standard BPJS header format)
   */
  static getBpjsTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  /**
   * Performs a Bridging API Call (with simulated or live endpoints)
   */
  static async request(
    config: BPJSConfig,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any
  ): Promise<{ status: number; data: any; log: BridgingLog }> {
    const startTime = performance.now();
    const timestamp = this.getBpjsTimestamp();
    const signature = await this.generateSignature(config.consId, config.secretKey, timestamp);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-cons-id': config.consId,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': config.userKey,
    };

    // Attach PCare FKTP Authorization if provided (user pcare dev / pass pcare dev)
    if (config.userPcare && config.passPcare) {
      headers['X-authorization'] = this.generatePcareAuthorization(
        config.userPcare,
        config.passPcare,
        config.kdAplikasi || '095'
      );
    }

    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let responseStatus = 200;
    let responseBody: any = null;

    if (config.isSandbox) {
      // High-fidelity BPJS Sandbox Engine response simulation with dynamic database synchronization
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 100));

      // Fetch dynamic tickets and status from local database API
      let dynamicTickets: any[] = [];
      try {
        const ticketRes = await fetch('/api/tickets');
        if (ticketRes.ok) {
          const json = await ticketRes.json();
          if (Array.isArray(json.data)) dynamicTickets = json.data;
        }
      } catch (e) {
        // Fallback gracefully
      }

      if (endpoint.includes('/antrean/add')) {
        const targetPoli = body?.kodepoli || '001';
        const poliTickets = dynamicTickets.filter((t) => t.kodePoli === targetPoli || t.poliTujuan === body?.namapoli);
        const jknCount = poliTickets.filter((t) => t.kategori === 'BPJS' || t.noKartuBPJS).length;
        const totalQuota = 30;
        const sisaQuota = Math.max(0, totalQuota - jknCount - 1);

        responseStatus = 200;
        responseBody = {
          response: {
            nomorantrean: body?.nomorantrean || `A-${String(poliTickets.length + 1).padStart(3, '0')}`,
            angkaantrean: body?.angkaantrean || poliTickets.length + 1,
            kodebooking: body?.kodebooking || `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
            kodepoli: body?.kodepoli || '001',
            namapoli: body?.namapoli || 'Poli Umum',
            namadokter: body?.namadokter || 'dr. Machmujur',
            estimasidilayani: Date.now() + 15 * 60 * 1000,
            sisakuotajkn: sisaQuota,
            kuotajkn: totalQuota,
            keterangan: 'Antrean berhasil didaftarkan ke Server Antrean BPJS Kesehatan secara dinamis',
          },
          metaData: {
            code: 200,
            message: 'Ok',
          },
        };
      } else if (endpoint.includes('/ref/poli')) {
        responseStatus = 200;
        responseBody = {
          response: REFERENSI_POLI_BPJS_STANDAR,
          metaData: {
            code: 200,
            message: 'Ok - Daftar Referensi Poliklinik Terdaftar di BPJS Kesehatan',
          },
        };
      } else if (endpoint.includes('/antrean/updatewaktu')) {
        responseStatus = 200;
        responseBody = {
          response: {
            kodebooking: body?.kodebooking,
            taskid: body?.taskid,
            waktu: body?.waktu || Date.now(),
            status_task: this.getTaskDescription(body?.taskid),
          },
          metaData: {
            code: 200,
            message: 'Ok - Task ID Berhasil Disinkronkan ke Server Antrol',
          },
        };
      } else if (endpoint.includes('/antrean/batal')) {
        responseStatus = 200;
        responseBody = {
          response: `Antrean ${body?.kodebooking || ''} berhasil dibatalkan di server BPJS Kesehatan`,
          metaData: {
            code: 200,
            message: 'Ok',
          },
        };
      } else if (endpoint.includes('/peserta/nokartu') || endpoint.includes('/peserta/nik')) {
        // Extract identifier from endpoint or body
        const endpointSegments = endpoint.split('/');
        const extractedId = endpointSegments[3] || body?.nokartu || body?.nik || '0001827463910';
        const isNikQuery = endpoint.includes('/peserta/nik') || extractedId.length === 16;

        // Try to match existing registered patient in tickets or synthesize dynamically from the entered input
        const matchedTicket = dynamicTickets.find((t) =>
          (isNikQuery ? t.nik === extractedId : t.noKartuBPJS === extractedId)
        );

        const patientName = matchedTicket?.namaPasien || (body?.namaPasien || (isNikQuery ? `Peserta NIK ${extractedId.substring(0, 6)}...` : `Peserta BPJS ${extractedId}`));
        const noKartu = isNikQuery ? (matchedTicket?.noKartuBPJS || `000${extractedId.slice(-10)}`) : extractedId;
        const nik = isNikQuery ? extractedId : (matchedTicket?.nik || `351508${extractedId.slice(-10)}`);

        // Calculate birth date and age dynamically
        const birthYear = 1970 + (parseInt(nik.slice(-4), 10) % 35);
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        responseStatus = 200;
        responseBody = {
          response: {
            peserta: {
              noKartu: noKartu,
              nik: nik,
              nama: patientName.toUpperCase(),
              sex: parseInt(nik.slice(6, 8), 10) > 40 ? 'P' : 'L',
              tglLahir: `${birthYear}-05-15`,
              statusPeserta: {
                kode: '0',
                keterangan: 'AKTIF (Terverifikasi Master BPJS Kesehatan)',
              },
              hakKelas: {
                kode: (parseInt(noKartu.slice(-1), 10) % 3 + 1).toString(),
                keterangan: `KELAS ${(parseInt(noKartu.slice(-1), 10) % 3 + 1)}`,
              },
              provUmum: {
                kdProvider: config.kodePPK || '019U901',
                nmProvider: config.namaFaskes || 'TPMD DR MACHMUJUR',
              },
              umur: {
                umurSekarang: `${age} tahun`,
                umurSaatPelayanan: `${age} tahun`,
              },
            },
          },
          metaData: {
            code: 200,
            message: 'Peserta Terdaftar dan Status Keaktifan AKTIF',
          },
        };
      } else if (endpoint.includes('/antrean/status')) {
        // Query live dynamic status computed by the database
        const targetPoli = body?.kodepoli || '001';
        const poliTickets = dynamicTickets.filter((t) => !targetPoli || t.kodePoli === targetPoli);
        const total = poliTickets.length;
        const waiting = poliTickets.filter((t) => t.status === 'MENUNGGU' || t.status === 'DIPANGGIL').length;
        const calling = poliTickets.find((t) => t.status === 'DIPANGGIL' || t.status === 'SEDANG_DILAYANI');
        const jknTickets = poliTickets.filter((t) => t.kategori === 'BPJS');
        const maxQuota = 30;

        responseStatus = 200;
        responseBody = {
          response: {
            kodepoli: targetPoli,
            namapoli: body?.namapoli || 'Poli Umum',
            namadokter: body?.namadokter || 'dr. Machmujur',
            totalantrean: total,
            sisaantrean: waiting,
            antreanpanggil: calling ? calling.nomorAntrean : (total > 0 ? poliTickets[0].nomorAntrean : '-'),
            sisakuotajkn: Math.max(0, maxQuota - jknTickets.length),
            kuotajkn: maxQuota,
            statusbuka: 'BUKA',
          },
          metaData: {
            code: 200,
            message: 'Ok',
          },
        };
      } else {
        // Ping / Generic health check
        responseStatus = 200;
        responseBody = {
          response: {
            server_time: new Date().toISOString(),
            ppk_aktif: config.kodePPK,
            status_bridging: 'CONNECTED',
            signature_valid: true,
            total_tiket_faskes: dynamicTickets.length,
          },
          metaData: {
            code: 200,
            message: 'Koneksi Bridging BPJS Kesehatan Terverifikasi Sukses',
          },
        };
      }
    } else {
      // Live Mode: Direct HTTP fetch attempt
      try {
        const targetUrl = `${config.baseUrl}${endpoint}`;
        const res = await fetch(targetUrl, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        responseStatus = res.status;
        responseBody = await res.json().catch(() => ({ metaData: { code: res.status, message: res.statusText } }));
      } catch (fetchErr: any) {
        responseStatus = 500;
        responseBody = {
          metaData: {
            code: 500,
            message: `Koneksi gagal (CORS/Network error): ${fetchErr?.message || 'Gagal menghubungi server live BPJS'}. Disarankan menggunakan SandBox untuk simulasi lengkap atau mengatur proxy CORS.`,
          },
        };
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    const log: BridgingLog = {
      id: logId,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      method,
      endpoint,
      requestHeaders: headers,
      requestBody: body,
      responseStatus,
      responseBody,
      status: responseStatus === 200 ? 'SUCCESS' : 'ERROR',
      latencyMs,
    };

    return { status: responseStatus, data: responseBody, log };
  }

  /**
   * Helper description for BPJS 7-Task Workflow
   */
  static getTaskDescription(taskId: number): string {
    switch (taskId) {
      case 1:
        return 'Task 1: Mulai waktu tunggu admisi';
      case 2:
        return 'Task 2: Akhir waktu tunggu admisi / mulai pelayanan admisi';
      case 3:
        return 'Task 3: Akhir pelayanan admisi / mulai waktu tunggu poli';
      case 4:
        return 'Task 4: Akhir waktu tunggu poli / mulai pelayanan poli dokter';
      case 5:
        return 'Task 5: Akhir pelayanan poli / mulai waktu tunggu farmasi';
      case 6:
        return 'Task 6: Akhir waktu tunggu farmasi / mulai racik obat';
      case 7:
        return 'Task 7: Akhir pelayanan farmasi / selesai ambil obat';
      default:
        return `Task ${taskId}`;
    }
  }

  /**
   * Sends Add Antrean to BPJS
   */
  static async kirimAntreanBaru(config: BPJSConfig, ticket: QueueTicket) {
    const payload = {
      kodebooking: ticket.kodeBooking,
      jenispasien: ticket.kategori === 'BPJS' ? 'JKN' : 'NON-JKN',
      nomorkartu: ticket.noKartuBPJS || '-',
      nik: ticket.nik || '-',
      nohp: (ticket as any).noHp || '0812' + Math.floor(10000000 + Math.random() * 90000000),
      kodepoli: ticket.kodePoli,
      namapoli: ticket.poliTujuan,
      pasienbaru: 0,
      norm: ticket.nomorRM || 'RM-BARU',
      tanggalperiksa: ticket.waktuAmbil ? ticket.waktuAmbil.slice(0, 10) : new Date().toISOString().split('T')[0],
      kodedokter: parseInt(ticket.kodePoli.replace(/\D/g, '') || '101', 10) || 101,
      namadokter: ticket.dokterNama,
      jampraktek: '08:00-14:00',
      jeniskunjungan: 1,
      nomorreferensi: `REF-${ticket.kodeBooking}`,
      nomorantrean: ticket.nomorAntrean,
      angkaantrean: ticket.angka,
      estimasidilayani: Date.now() + 15 * 60 * 1000,
      sisakuotajkn: 24,
      kuotajkn: 30,
      sisakuotanonjkn: 14,
      kuotanonjkn: 20,
      keterangan: `Pendaftaran ${ticket.kategori} poli ${ticket.poliTujuan} (${ticket.namaPasien})`,
    };

    return this.request(config, '/antrean/add', 'POST', payload);
  }

  /**
   * Updates task status in BPJS Antrean RS v2
   */
  static async updateTaskStatus(config: BPJSConfig, kodeBooking: string, taskId: number) {
    const payload = {
      kodebooking: kodeBooking,
      taskid: taskId,
      waktu: Date.now(),
    };
    return this.request(config, '/antrean/updatewaktu', 'POST', payload);
  }

  /**
   * Verifies BPJS participant card or NIK
   */
  static async cekPeserta(config: BPJSConfig, identifier: string, isNik = false) {
    const endpoint = isNik
      ? `/peserta/nik/${identifier}/tglSEP/${new Date().toISOString().split('T')[0]}`
      : `/peserta/nokartu/${identifier}/tglSEP/${new Date().toISOString().split('T')[0]}`;
    return this.request(config, endpoint, 'GET', { nokartu: identifier });
  }

  /**
   * Ping / Connection test with HMAC signature computation & BPJS callback
   */
  static async ping(config: BPJSConfig) {
    try {
      const serverRes = await fetch('/api/bpjs/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (serverRes.ok) {
        const json = await serverRes.json();
        const callbackData = json.callback || json.data;

        const log: BridgingLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          method: 'GET',
          endpoint: '/antrean/ping',
          requestHeaders: {
            'X-cons-id': config.consId,
            'user_key': config.userKey,
          },
          requestBody: { action: 'TEST_CONNECTION' },
          responseStatus: json.status || 200,
          responseBody: callbackData,
          status: 'SUCCESS',
          latencyMs: json.latencyMs || 65,
        };

        return {
          status: json.status || 200,
          data: callbackData,
          callback: callbackData,
          source: json.source || 'BPJS_API',
          log,
        };
      }
    } catch (e) {
      // Fallback to internal request method
    }

    return this.request(config, '/antrean/ping', 'GET');
  }
}


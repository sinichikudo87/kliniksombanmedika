import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMySqlPool, mySqlDb } from '@/lib/mysql-db';
import { decryptBpjsResponse } from '@/lib/bpjs-crypto';

function getTodayWibYYYYMMDD(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

function getTodayWibDDMMYYYY(): string {
  const [y, m, d] = getTodayWibYYYYMMDD().split('-');
  return `${d}-${m}-${y}`;
}

function toDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return getTodayWibDDMMYYYY();
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  return getTodayWibDDMMYYYY();
}

function mapPoliToBpjsCode(poliKode?: string | null): string {
  const code = String(poliKode || 'UMU').trim().toUpperCase();
  if (/^\d{3}$/.test(code)) return code;
  if (code === 'UMU' || code === 'A') return '001';
  if (code === 'GIG' || code === 'B') return '002';
  if (code === 'KIA' || code === 'C') return '003';
  if (code === 'UGD' || code === 'IGD') return '005';
  return '001';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, consId, secretKey, userKey, kdFaskes, payload } = body;

    let dbCfg: any = null;
    try {
      const pool = getMySqlPool();
      const [cfgRows]: [any, any] = await pool.query('SELECT * FROM faskes_config LIMIT 1');
      if (cfgRows && cfgRows.length > 0) {
        dbCfg = cfgRows[0];
      }
    } catch {
      dbCfg = null;
    }

    const actualConsId = consId || dbCfg?.cons_id || '';
    const actualSecret = secretKey || dbCfg?.secret_key || '';
    const actualUserKey = userKey || dbCfg?.user_key || '';
    const actualKdFaskes = kdFaskes || dbCfg?.kd_faskes || '';
    const actualNamaFaskes = dbCfg?.nama_faskes || '';
    const actualUserPcare = body.userPcareDev || dbCfg?.dev_user || '';
    const actualPassPcare = body.passPcareDev || dbCfg?.dev_pass || '';

    // Current UTC timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Compute HMAC-SHA256 signature
    const signatureData = `${actualConsId}&${timestamp}`;
    const hmac = crypto.createHmac('sha256', actualSecret);
    hmac.update(signatureData);
    const signature = hmac.digest('base64');

    const headers: Record<string, string> = {
      'X-cons-id': actualConsId,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': actualUserKey,
      'Content-Type': 'Application/json; charset=utf-8',
    };

    const getHeadersForUrl = (url: string): Record<string, string> => {
      if (url.includes('pcare') && actualUserPcare && actualPassPcare) {
        const basicToken = Buffer.from(`${actualUserPcare}:${actualPassPcare}:095`).toString('base64');
        return {
          ...headers,
          'X-Authorization': `Basic ${basicToken}`,
        };
      }
      return headers;
    };

    const persistBpjsOnlineStatus = async (online: boolean) => {
      try {
        const pool = getMySqlPool();
        await pool.query('UPDATE faskes_config SET is_online = ? WHERE id = ?', [online ? 1 : 0, 'cfg-default']);
      } catch {
        // Ignore if MySQL is not running in preview sandbox
      }
    };

    if (action === 'ping') {
      const targetBaseUrl = (
        body.baseUrl ||
        dbCfg?.base_url ||
        (body.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/antreanfktp'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev')
      ).replace(/\/+$/, '');

      const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

      // Determine module & official candidate endpoints
      let moduleName = 'Antrean Online FKTP (Mobile JKN)';
      let candidateEndpoints = [`/ref/poli/tanggal/${todayWib}`, '/ref/poli'];
      if (targetBaseUrl.includes('pcare')) {
        moduleName = 'PCare (Primary Care)';
        candidateEndpoints = ['/poli/fktp/0/5', '/diagnosa/A00/0/5'];
      } else if (targetBaseUrl.includes('vclaim')) {
        moduleName = 'VClaim (Virtual Claim RS)';
        candidateEndpoints = ['/referensi/poli/UMU', '/referensi/propinsi'];
      } else if (targetBaseUrl.includes('aplicaresws') || targetBaseUrl.includes('aplicare')) {
        moduleName = 'Aplicare (Ketersediaan Kamar)';
        candidateEndpoints = ['/ref/kelas'];
      } else if (targetBaseUrl.includes('antreanrs')) {
        moduleName = 'Antrean Online RS';
        candidateEndpoints = ['/ref/poli'];
      }

      const isDev = body.environment === 'tester' || targetBaseUrl.includes('dev');
      const envModeText = isDev ? 'Development / Tester (Trustmark Dev)' : 'Production (BPJS Live)';
      const envType = isDev ? 'development' : 'production';
      const requestHeaders = getHeadersForUrl(targetBaseUrl);

      let lastTestedUrl = `${targetBaseUrl}${candidateEndpoints[0]}`;
      let lastHttpStatus = 0;
      let lastBpjsData: any = null;
      let lastNetworkError = '';

      for (const endpoint of candidateEndpoints) {
        const pingUrl = `${targetBaseUrl}${endpoint}`;
        lastTestedUrl = pingUrl;

        try {
          const bpjsRes = await fetch(pingUrl, {
            method: 'GET',
            headers: requestHeaders,
            signal: AbortSignal.timeout(12000),
          });

          lastHttpStatus = bpjsRes.status;
          const rawText = await bpjsRes.text().catch(() => '');
          let bpjsData: any = null;
          try {
            bpjsData = rawText ? JSON.parse(rawText) : null;
          } catch {
            bpjsData = rawText ? { rawText: rawText.slice(0, 400) } : null;
          }
          lastBpjsData = bpjsData;

          const metaObj = bpjsData?.metadata || bpjsData?.metaData;
          const metaCodeNum = metaObj?.code !== undefined ? Number(metaObj.code) : NaN;
          const isValidBpjsGatewayResponse =
            (bpjsRes.ok && (Number.isNaN(metaCodeNum) || metaCodeNum < 400)) ||
            metaCodeNum === 200 ||
            metaCodeNum === 201;

          if (isValidBpjsGatewayResponse) {
            await persistBpjsOnlineStatus(true);
            const decryptedPingBody = decryptBpjsResponse(
              bpjsData?.response,
              actualConsId,
              actualSecret,
              timestamp
            );

            const bpjsMeta = {
              code: 200,
              message:
                metaObj?.message && metaCodeNum === 200
                  ? `${metaObj.message} — Koneksi ke ${moduleName} (${isDev ? 'Development' : 'Production'}) Berhasil Terhubung`
                  : `Koneksi ke ${moduleName} (${isDev ? 'Development' : 'Production'}) Berhasil Terhubung`,
              bpjsMetaCode: Number.isNaN(metaCodeNum) ? bpjsRes.status : metaCodeNum,
            };

            const resPayload = {
              faskes: actualNamaFaskes,
              kdFaskes: actualKdFaskes,
              module: moduleName,
              consId: actualConsId,
              timestamp,
              signature,
              baseUrl: targetBaseUrl,
              endpointTested: pingUrl,
              httpStatus: bpjsRes.status,
              environment: envType,
              mode: envModeText,
              status: 'ACTIVE_BRIDGED',
              isConnected: true,
              isWhitelisted: true,
              bpjsResponse: decryptedPingBody ?? bpjsData,
            };

            return NextResponse.json({
              response: resPayload,
              metadata: bpjsMeta,
              metaData: bpjsMeta,
              headers: requestHeaders,
            });
          }

          // If endpoint returned 404, try next candidate endpoint before reporting failure
          if (bpjsRes.status !== 404) {
            break;
          }
        } catch (err: any) {
          const causeCode = err?.cause?.code ? ` (${err.cause.code})` : '';
          lastNetworkError = `${err?.name || 'NetworkError'}: ${err?.message || 'Gagal menghubungi server BPJS'}${causeCode}`;
          // Timeout or connection refusal applies to host, no need to retry multiple paths on same host
          if (
            err?.name === 'TimeoutError' ||
            err?.name === 'AbortError' ||
            err?.cause?.code === 'ECONNREFUSED' ||
            err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
          ) {
            break;
          }
        }
      }

      await persistBpjsOnlineStatus(false);

      const bpjsErrObj = lastBpjsData?.metadata || lastBpjsData?.metaData;
      const bpjsCodeNum = bpjsErrObj?.code !== undefined ? Number(bpjsErrObj.code) : NaN;
      const bpjsErrMsg =
        bpjsErrObj?.message ||
        lastBpjsData?.message ||
        lastBpjsData?.rawText ||
        '';
      const isGatewayReached = lastHttpStatus > 0;
      const effectiveErrorCode =
        !Number.isNaN(bpjsCodeNum) && bpjsCodeNum >= 400
          ? bpjsCodeNum
          : lastHttpStatus >= 400
          ? lastHttpStatus
          : isGatewayReached
          ? 401
          : 503;

      let diagnosticMessage = '';
      if (isGatewayReached) {
        if (bpjsErrMsg.toLowerCase().includes('not registered for this service') || effectiveErrorCode === 401) {
          diagnosticMessage = `IP server sudah tembus ke gateway BPJS (HTTP ${lastHttpStatus}), namun Cons ID (${actualConsId}) & User Key belum terdaftar/aktif untuk layanan "${moduleName}" mode ${envModeText} (BPJS: "${bpjsErrMsg || 'Unauthorized'}"). Di BPJS Trustmark, User Key berbeda antara PCare vs Antrean FKTP dan antara Development vs Production — silakan gunakan User Key & Cons ID khusus ${moduleName} ${isDev ? 'Development' : 'Production'}.`;
        } else {
          diagnosticMessage = `Server BPJS (${lastTestedUrl}) merespons HTTP ${lastHttpStatus} (Kode BPJS ${effectiveErrorCode})${bpjsErrMsg ? `: ${bpjsErrMsg}` : ''}. Periksa Cons ID, Secret Key, User Key, atau header otorisasi.`;
        }
      } else {
        diagnosticMessage = `Koneksi ke ${lastTestedUrl} timeout (${lastNetworkError || 'TCP Timeout'}). Firewall BPJS Kesehatan hanya menerima request dari IP server/VPS faskes yang sudah di-whitelist — bukan IP pratinjau cloud (Cloud Run).`;
      }

      const bpjsMeta = {
        code: effectiveErrorCode,
        message: diagnosticMessage,
      };

      const resPayload = {
        faskes: actualNamaFaskes,
        kdFaskes: actualKdFaskes,
        module: moduleName,
        consId: actualConsId,
        baseUrl: targetBaseUrl,
        endpointTested: lastTestedUrl,
        httpStatus: lastHttpStatus || 503,
        bpjsMetaCode: !Number.isNaN(bpjsCodeNum) ? bpjsCodeNum : undefined,
        networkError: lastNetworkError || undefined,
        bpjsRawResponse: lastBpjsData || undefined,
        environment: envType,
        mode: envModeText,
        status: 'DISCONNECTED',
        isConnected: false,
        isWhitelisted: isGatewayReached,
      };

      return NextResponse.json({
        response: resPayload,
        metadata: bpjsMeta,
        metaData: bpjsMeta,
        headers: requestHeaders,
      });
    }

    if (action === 'verify_peserta') {
      const { query } = payload || {};
      const cleanQuery = (query || '').trim().replace(/\D/g, '');
      const isOnline = body.isOnline === true;
      const pcareBase =
        body.baseUrl && String(body.baseUrl).includes('pcare')
          ? String(body.baseUrl).replace(/\/+$/, '')
          : body.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev';

      if (!cleanQuery) {
        return NextResponse.json(
          {
            metaData: { code: 400, message: 'Masukkan 16 digit NIK atau 13 digit No. Kartu BPJS.' },
            response: null,
            headers,
          },
          { status: 400 }
        );
      }

      // 1. Jika Bridging BPJS aktif (isOnline === true), tarik langsung dari Web Service PCare BPJS
      if (isOnline) {
        const candidatePaths =
          cleanQuery.length === 16
            ? [`/peserta/nik/${cleanQuery}`]
            : [`/peserta/${cleanQuery}`, `/peserta/noka/${cleanQuery}`];
        const pcareHeaders = getHeadersForUrl(pcareBase);

        for (const endpointPath of candidatePaths) {
          const startTime = Date.now();
          try {
            const bpjsRes = await fetch(`${pcareBase}${endpointPath}`, {
              method: 'GET',
              headers: pcareHeaders,
              signal: AbortSignal.timeout(8000),
            });
            const bpjsData = await bpjsRes.json().catch(() => null);
            const decryptedPeserta = bpjsData?.response
              ? decryptBpjsResponse(bpjsData.response, actualConsId, actualSecret, timestamp)
              : null;

            await mySqlDb.addBridgingLog({
              id: `br-peserta-${Date.now()}`,
              timestamp: new Date().toISOString(),
              endpoint: endpointPath,
              method: 'GET',
              requestHeader: pcareHeaders,
              requestPayload: { query: cleanQuery },
              responseStatus: bpjsRes.status,
              responsePayload: decryptedPeserta ? { ...bpjsData, response: decryptedPeserta } : (bpjsData || {}),
              durationMs: Date.now() - startTime,
            });

            if (bpjsRes.ok && decryptedPeserta) {
              await persistBpjsOnlineStatus(true);
              const pesertaData = decryptedPeserta.peserta || decryptedPeserta;
              return NextResponse.json({
                metaData: bpjsData.metaData || bpjsData.metadata || { code: 200, message: 'Peserta BPJS Ditemukan (API BPJS)' },
                source: 'BPJS_BRIDGING_API',
                response: { peserta: pesertaData },
                headers: pcareHeaders,
              });
            }

            if (bpjsRes.status !== 404) {
              break;
            }
          } catch {
            // Lanjutkan fallback path atau cek basis data MySQL
            break;
          }
        }
      }

      // 2. Query langsung ke tabel patients di MySQL
      try {
        const pool = getMySqlPool();
        const [rows]: [any, any] = await pool.query(
          'SELECT * FROM patients WHERE nik = ? OR no_bpjs = ? LIMIT 1',
          [cleanQuery, cleanQuery]
        );

        if (rows && rows.length > 0) {
          const p = rows[0];
          return NextResponse.json({
            metaData: { code: 200, message: 'Peserta Ditemukan di Database MySQL' },
            source: 'MYSQL',
            response: {
              peserta: {
                nik: p.nik,
                noKartu: p.no_bpjs,
                nama: p.nama,
                tglLahir: p.tgl_lahir,
                jenisKelamin: p.jenis_kelamin,
                noHp: p.no_hp,
                alamat: p.alamat,
                statusPeserta: { keterangan: p.status_bpjs || 'AKTIF' },
                provUmum: { kdProvider: actualKdFaskes, nmProvider: p.faskes_tingkat_1 || actualNamaFaskes },
                jenisPeserta: p.jenis_peserta,
                kelasRawat: p.kelas_rawat,
              },
            },
            headers,
          });
        }
      } catch (dbErr: any) {
        return NextResponse.json(
          {
            metaData: {
              code: 500,
              message: `Gagal menanyakan data peserta ke MySQL: ${dbErr?.message || 'Database error'}`,
            },
            response: null,
            headers,
          },
          { status: 500 }
        );
      }

      // 3. Jika nomor NIK/BPJS belum terdaftar di BPJS maupun MySQL
      return NextResponse.json(
        {
          metaData: {
            code: 404,
            message: `Nomor NIK/BPJS ${cleanQuery} belum terdaftar di database MySQL${isOnline ? ' maupun server PCare BPJS' : ''}.`,
          },
          response: null,
          headers,
        },
        { status: 404 }
      );
    }

    if (action === 'pcare_pendaftaran') {
      const isOnline = body.isOnline === true;
      const pcareBase =
        body.baseUrl && String(body.baseUrl).includes('pcare')
          ? String(body.baseUrl).replace(/\/+$/, '')
          : body.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev';

      let isBridged = false;
      let bpjsResponse: any = null;
      let responseStatus = isOnline ? 503 : 202;

      if (isOnline) {
        const pcareHeaders = getHeadersForUrl(pcareBase);
        const rawPendaftaran = payload || {};
        const bpjsPendaftaranPayload = {
          kdProviderPeserta: rawPendaftaran.kdProviderPeserta || actualKdFaskes,
          tglDaftar: toDDMMYYYY(rawPendaftaran.tglDaftar),
          noKartu: rawPendaftaran.noKartu || '',
          kdPoli: mapPoliToBpjsCode(rawPendaftaran.kdPoli),
          keluhan: rawPendaftaran.keluhan || null,
          kunjSakit: rawPendaftaran.kunjSakit !== false,
          sistole: Number(rawPendaftaran.sistole) || 0,
          diastole: Number(rawPendaftaran.diastole) || 0,
          beratBadan: Number(rawPendaftaran.beratBadan) || 0,
          tinggiBadan: Number(rawPendaftaran.tinggiBadan) || 0,
          respRate: Number(rawPendaftaran.respRate) || 0,
          lingkarPerut: Number(rawPendaftaran.lingkarPerut) || 0,
          heartRate: Number(rawPendaftaran.heartRate) || 0,
          rujukBalik: Number(rawPendaftaran.rujukBalik) || 0,
          kdTkp: rawPendaftaran.kdTkp || '10',
        };
        const startTime = Date.now();
        try {
          const bpjsRes = await fetch(`${pcareBase}/pendaftaran`, {
            method: 'POST',
            headers: pcareHeaders,
            body: JSON.stringify(bpjsPendaftaranPayload),
            signal: AbortSignal.timeout(8000),
          });
          responseStatus = bpjsRes.status;
          const rawJson = await bpjsRes.json().catch(() => null);
          bpjsResponse = rawJson?.response
            ? { ...rawJson, response: decryptBpjsResponse(rawJson.response, actualConsId, actualSecret, timestamp) }
            : rawJson;
          isBridged = bpjsRes.ok;
          if (isBridged) {
            await persistBpjsOnlineStatus(true);
          }
          await mySqlDb.addBridgingLog({
            id: `br-pcare-reg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            endpoint: '/pendaftaran',
            method: 'POST',
            requestHeader: pcareHeaders,
            requestPayload: bpjsPendaftaranPayload,
            responseStatus: bpjsRes.status,
            responsePayload: bpjsResponse || {},
            durationMs: Date.now() - startTime,
          });
        } catch (err: any) {
          bpjsResponse = { error: err?.message || 'Timeout menghubungi API PCare BPJS' };
          await mySqlDb.addBridgingLog({
            id: `br-pcare-reg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            endpoint: '/pendaftaran',
            method: 'POST',
            requestHeader: pcareHeaders,
            requestPayload: bpjsPendaftaranPayload,
            responseStatus: 503,
            responsePayload: bpjsResponse,
            durationMs: Date.now() - startTime,
          });
        }
      }

      return NextResponse.json({
        metaData: {
          code: isBridged ? 201 : 202,
          message: isBridged
            ? 'Pendaftaran PCare Terkirim ke BPJS Kesehatan'
            : isOnline
            ? 'Antrean tersimpan di MySQL, namun server PCare BPJS belum merespon'
            : 'Antrean tersimpan di database MySQL (Belum terhubung ke API BPJS)',
        },
        response: {
          isBridged,
          status: isBridged ? 'BRIDGED_BPJS_OK' : isOnline ? 'BPJS_UNREACHABLE_SAVED_MYSQL' : 'PENDING_BRIDGING_MYSQL',
          bpjsResponse,
          responseStatus,
          timestamp,
        },
        headers,
      });
    }

    if (action === 'pcare_kunjungan' || action === 'pcare_rujukan') {
      const isReferral = action === 'pcare_rujukan';
      const isOnline = body.isOnline === true;
      const pcareBase =
        body.baseUrl && String(body.baseUrl).includes('pcare')
          ? String(body.baseUrl).replace(/\/+$/, '')
          : body.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/pcare-rest'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev';

      const visitPayload = payload || {};
      let isBridged = false;
      let bpjsResponse: any = null;
      let noKunjungan: string | null = null;
      let noRujukan: string | null = null;
      let httpCode = 202;

      if (isOnline) {
        const endpointPath = '/kunjungan';
        const pcareHeaders = getHeadersForUrl(pcareBase);
        const tglWib = getTodayWibDDMMYYYY();
        const kdStatusPulangBpjs =
          isReferral || visitPayload.statusPulang === '2'
            ? '4'
            : visitPayload.statusPulang === '3'
            ? '6'
            : '3';

        const bpjsKunjunganPayload = {
          noKunjungan: null,
          noKartu: visitPayload.noKartu && visitPayload.noKartu !== '-' ? visitPayload.noKartu : '',
          tglDaftar: toDDMMYYYY(visitPayload.tglDaftar),
          kdPoli: mapPoliToBpjsCode(visitPayload.kdPoli),
          keluhan: visitPayload.keluhan || '-',
          kdSadar: visitPayload.kesadaran || '01',
          sistole: Number(visitPayload.sistole) || 120,
          diastole: Number(visitPayload.diastole) || 80,
          beratBadan: Number(visitPayload.beratBadan) || 60,
          tinggiBadan: Number(visitPayload.tinggiBadan) || 165,
          respRate: Number(visitPayload.respRate) || 18,
          heartRate: Number(visitPayload.heartRate) || 78,
          lingkarPerut: Number(visitPayload.lingkarPerut) || 0,
          kdStatusPulang: kdStatusPulangBpjs,
          tglPulang: tglWib,
          kdDokter: visitPayload.kdDokter || actualUserPcare || '001',
          kdDiag1: visitPayload.kdDiag1 || visitPayload.kdDiag || 'R51',
          kdDiag2: null,
          kdDiag3: null,
          kdPoliRujukInternal: null,
          rujukLanjut:
            kdStatusPulangBpjs === '4' && visitPayload.ppkRujuk
              ? {
                  tglEstRujuk: toDDMMYYYY(visitPayload.tglEstRujuk),
                  kdppk: visitPayload.ppkRujuk,
                  subSpesialis: {
                    kdSubSpesialis1: visitPayload.poliRujuk || 'INT',
                    kdSarana: '1',
                  },
                  khusus: null,
                }
              : null,
          kdTkp: '10',
          terapi: visitPayload.terapiObat || '-',
        };

        const startTime = Date.now();
        try {
          const bpjsRes = await fetch(`${pcareBase}${endpointPath}`, {
            method: 'POST',
            headers: pcareHeaders,
            body: JSON.stringify(bpjsKunjunganPayload),
            signal: AbortSignal.timeout(8000),
          });
          httpCode = bpjsRes.status;
          const rawJson = await bpjsRes.json().catch(() => null);
          const decryptedResp = rawJson?.response
            ? decryptBpjsResponse(rawJson.response, actualConsId, actualSecret, timestamp)
            : null;
          bpjsResponse = decryptedResp ? { ...rawJson, response: decryptedResp } : rawJson;
          isBridged = bpjsRes.ok;
          if (isBridged) {
            await persistBpjsOnlineStatus(true);
          }

          // Ambil noKunjungan / noRujukan resmi dari response API BPJS bila tersedia
          const respData = decryptedResp || bpjsResponse?.response;
          const respMessage = respData?.message || respData?.noKunjungan || null;
          if (typeof respMessage === 'string' && respMessage.trim()) {
            noKunjungan = respMessage.trim();
          }
          if (isReferral && typeof respData?.noRujukan === 'string') {
            noRujukan = respData.noRujukan;
          } else if (isReferral && noKunjungan) {
            noRujukan = noKunjungan;
          }

          await mySqlDb.addBridgingLog({
            id: `br-pcare-${Date.now()}`,
            timestamp: new Date().toISOString(),
            endpoint: endpointPath,
            method: 'POST',
            requestHeader: pcareHeaders,
            requestPayload: bpjsKunjunganPayload,
            responseStatus: bpjsRes.status,
            responsePayload: bpjsResponse || {},
            durationMs: Date.now() - startTime,
          });
        } catch (err: any) {
          httpCode = 503;
          bpjsResponse = { error: err?.message || 'Server BPJS PCare tidak dapat dijangkau' };
          await mySqlDb.addBridgingLog({
            id: `br-pcare-${Date.now()}`,
            timestamp: new Date().toISOString(),
            endpoint: endpointPath,
            method: 'POST',
            requestHeader: pcareHeaders,
            requestPayload: bpjsKunjunganPayload,
            responseStatus: 503,
            responsePayload: bpjsResponse,
            durationMs: Date.now() - startTime,
          });
        }
      }

      const bridgingStatus = isBridged
        ? 'BRIDGED_BPJS_OK'
        : isOnline
        ? 'BPJS_UNREACHABLE_SAVED_MYSQL'
        : 'PENDING_BRIDGING_MYSQL';

      const visitId = `pcare-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const saved = await mySqlDb.addPcareVisit({
        id: visitId,
        noKunjungan,
        noRujukan,
        queueId: visitPayload.queueId || null,
        noKartu: visitPayload.noKartu || '-',
        nik: visitPayload.nik || null,
        namaPasien: visitPayload.namaPasien || 'Pasien',
        poliKode: visitPayload.kdPoli || 'UMU',
        poliNama: visitPayload.poliNama || 'Poli Umum',
        sistole: visitPayload.sistole !== undefined ? Number(visitPayload.sistole) : undefined,
        diastole: visitPayload.diastole !== undefined ? Number(visitPayload.diastole) : undefined,
        heartRate: visitPayload.heartRate !== undefined ? Number(visitPayload.heartRate) : undefined,
        respRate: visitPayload.respRate !== undefined ? Number(visitPayload.respRate) : undefined,
        suhu: visitPayload.suhu || undefined,
        beratBadan: visitPayload.beratBadan !== undefined ? Number(visitPayload.beratBadan) : null,
        tinggiBadan: visitPayload.tinggiBadan !== undefined ? Number(visitPayload.tinggiBadan) : null,
        kesadaran: visitPayload.kesadaran || '01',
        anamnesa: visitPayload.keluhan || null,
        diagnosaKode: visitPayload.kdDiag1 || visitPayload.kdDiag || '-',
        diagnosaNama: visitPayload.diagnosaNama || visitPayload.kdDiag1 || visitPayload.kdDiag || '-',
        terapiObat: visitPayload.terapiObat || null,
        statusPulang:
          visitPayload.statusPulangLabel ||
          (isReferral || visitPayload.statusPulang === '2'
            ? 'Rujuk Vertikal ke RS'
            : visitPayload.statusPulang === '3'
            ? 'Rujuk Horizontal'
            : 'Berobat Jalan'),
        ppkRujuk: visitPayload.ppkRujuk || null,
        namaPpkRujuk: visitPayload.namaPpkRujuk || null,
        poliRujuk: visitPayload.poliRujuk || null,
        tglRencanaRujuk: visitPayload.tglEstRujuk || null,
        catatanRujukan: visitPayload.catatan || null,
        isBridged,
        bridgingStatus,
        bpjsResponse,
      });

      if (!saved.success) {
        return NextResponse.json(
          {
            metaData: { code: 500, message: saved.error || 'Gagal menyimpan kunjungan PCare ke database MySQL' },
            response: null,
            headers,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        metaData: {
          code: isBridged ? 201 : 202,
          message: isBridged
            ? isReferral
              ? 'Kunjungan & Rujukan PCare terkirim ke BPJS dan tersimpan di MySQL'
              : 'Kunjungan PCare terkirim ke BPJS dan tersimpan di MySQL'
            : isOnline
            ? 'Tersimpan di MySQL (Server BPJS PCare tidak merespon)'
            : 'Tersimpan di MySQL (Bridging API BPJS sedang Nonaktif)',
        },
        response: {
          visit: saved.visit,
          noKunjungan,
          noRujukan,
          status: bridgingStatus,
          isBridged,
          httpCode,
          bpjsResponse,
          timestamp,
        },
        headers,
      });
    }

    if (action === 'antrean_add' || action === 'antrean_updatewaktu' || action === 'antrean_batal') {
      const isOnline = body.isOnline === true;
      const antreanBase =
        body.baseUrl && String(body.baseUrl).includes('antrean')
          ? String(body.baseUrl).replace(/\/+$/, '')
          : body.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/antreanfktp'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanfktp_dev';
      const isAntreanFktp = antreanBase.includes('antreanfktp');
      const rawPayload = payload || {};
      const todayWib = getTodayWibYYYYMMDD();

      let candidateCalls: Array<{ path: string; body: Record<string, any> }> = [];
      if (action === 'antrean_add') {
        const addPayload = isAntreanFktp
          ? {
              nomorkartu: rawPayload.nomorkartu || '',
              nik: rawPayload.nik || '',
              nohp: rawPayload.nohp || '080000000000',
              kodepoli: mapPoliToBpjsCode(rawPayload.kodepoli),
              namapoli: rawPayload.namapoli || 'Poli Umum',
              norm: rawPayload.norm || rawPayload.patientId || '-',
              tanggalperiksa: rawPayload.tanggalperiksa || todayWib,
              kodedokter: rawPayload.kodedokter || 1,
              namadokter: rawPayload.namadokter || 'Dokter Umum',
              jampraktek: rawPayload.jampraktek || '08:00-16:00',
              nomorantrean: rawPayload.nomorantrean || 'A-001',
              angkaantrean: rawPayload.angkaantrean || 1,
              keterangan: rawPayload.keterangan || 'Peserta harap datang 15 menit lebih awal',
            }
          : rawPayload;
        candidateCalls = [{ path: '/antrean/add', body: addPayload }];
      } else if (action === 'antrean_batal') {
        const batalPayload = isAntreanFktp
          ? {
              tanggalperiksa: rawPayload.tanggalperiksa || todayWib,
              kodepoli: mapPoliToBpjsCode(rawPayload.kodepoli),
              nomorkartu: rawPayload.nomorkartu || '',
              kodebooking: rawPayload.kodebooking,
              nomorantrean: rawPayload.nomorantrean,
              keterangan: rawPayload.keterangan || 'Dibatalkan oleh faskes/pasien',
            }
          : rawPayload;
        candidateCalls = [{ path: '/antrean/batal', body: batalPayload }];
      } else {
        // antrean_updatewaktu (RS) vs antrean/panggil (FKTP)
        if (isAntreanFktp) {
          candidateCalls = [
            {
              path: '/antrean/panggil',
              body: {
                tanggalperiksa: rawPayload.tanggalperiksa || todayWib,
                kodepoli: mapPoliToBpjsCode(rawPayload.kodepoli),
                nomorkartu: rawPayload.nomorkartu || '',
                nomorantrean: rawPayload.nomorantrean || rawPayload.kodebooking || '',
                status: Number(rawPayload.taskid) >= 6 ? 2 : 1,
                waktu: rawPayload.waktu || Date.now(),
              },
            },
            {
              path: '/antrean/updatewaktu',
              body: rawPayload,
            },
          ];
        } else {
          candidateCalls = [{ path: '/antrean/updatewaktu', body: rawPayload }];
        }
      }

      if (!isOnline) {
        return NextResponse.json(
          {
            metaData: {
              code: 202,
              message: 'Belum terhubung ke API BPJS — Transaksi tersimpan di MySQL.',
            },
            response: { isBridged: false, timestamp },
            headers,
          },
          { status: 202 }
        );
      }

      const startTime = Date.now();
      let lastRes: Response | null = null;
      let lastData: any = null;
      let lastError: any = null;

      for (const call of candidateCalls) {
        try {
          const bpjsRes = await fetch(`${antreanBase}${call.path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(call.body),
            signal: AbortSignal.timeout(8000),
          });
          lastRes = bpjsRes;
          const rawJson = await bpjsRes.json().catch(() => null);
          lastData = rawJson?.response
            ? { ...rawJson, response: decryptBpjsResponse(rawJson.response, actualConsId, actualSecret, timestamp) }
            : rawJson;

          if (bpjsRes.ok) {
            await persistBpjsOnlineStatus(true);
            return NextResponse.json(
              {
                metaData: lastData?.metaData || lastData?.metadata || { code: bpjsRes.status, message: bpjsRes.statusText },
                response: lastData?.response || lastData,
                endpointUsed: `${antreanBase}${call.path}`,
                durationMs: Date.now() - startTime,
                headers,
              },
              { status: bpjsRes.status }
            );
          }

          if (bpjsRes.status !== 404) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          break;
        }
      }

      if (lastRes) {
        return NextResponse.json(
          {
            metaData: lastData?.metaData || lastData?.metadata || { code: lastRes.status, message: lastRes.statusText },
            response: lastData?.response || lastData,
            durationMs: Date.now() - startTime,
            headers,
          },
          { status: lastRes.status }
        );
      }

      return NextResponse.json(
        {
          metaData: {
            code: 503,
            message: lastError?.message || 'Gagal menghubungi Web Service Antrean BPJS',
          },
          response: null,
          durationMs: Date.now() - startTime,
          headers,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        metaData: { code: 400, message: `Aksi bridging tidak dikenali: ${action || 'unknown'}` },
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        metaData: { code: 500, message: error.message || 'Server Internal Error' },
      },
      { status: 500 }
    );
  }
}

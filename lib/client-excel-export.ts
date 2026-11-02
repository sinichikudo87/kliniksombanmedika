import * as XLSX from 'xlsx';
import { WS_FKTP_ENDPOINTS } from '@/types/queue';

export interface ExportExcelOptions {
  customBaseUrl?: string;
  namaFaskes?: string;
  kdFaskes?: string;
  picName?: string;
  picPhone?: string;
  kantorCabang?: string;
  devUser?: string;
}

export function exportWsFktpExcel(options?: ExportExcelOptions): boolean {
  try {
    const defaultOrigin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://kliniksombanmedika.id';
    const customBaseUrl = options?.customBaseUrl || defaultOrigin;
    const namaFaskes = options?.namaFaskes || 'TPMD DR MACHMUJUR';
    const kdFaskes = options?.kdFaskes || '019U901';
    const picName = options?.picName || '-';
    const picPhone = options?.picPhone || '-';
    const kantorCabang = options?.kantorCabang || '-';
    const devUser = options?.devUser || '0195U091-dev';

    const wb = XLSX.utils.book_new();

    // Sheet 1: Template Format BPJS Kesehatan
    const wsData = [
      ['URL WS FKTP Production Bridging Antrean Online Versi 2'],
      [],
      [
        'No',
        'Kode FKTP',
        'Nama FKTP',
        'Nama PIC FKTP',
        'No HP PIC',
        'Nama Vendor / Pengembang Sistem Informasi',
        'Kepwil',
        'Kantor Cabang',
        'Jenis Method',
        'URL WS FKTP Production',
        'User Production',
        'Password Production',
      ],
      ...WS_FKTP_ENDPOINTS.map((item, idx) => [
        idx === 0 ? 1 : '',
        idx === 0 ? kdFaskes : '',
        idx === 0 ? namaFaskes : '',
        idx === 0 ? picName : '',
        idx === 0 ? picPhone : '',
        idx === 0 ? namaFaskes : '',
        idx === 0 ? '-' : '',
        idx === 0 ? kantorCabang : '',
        item.jenisMethod,
        customBaseUrl.replace(/\/$/, '') + item.path,
        idx === 0 ? devUser : '',
        idx === 0 ? '******' : '',
      ]),
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(wsData);

    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 3, c: 0 }, e: { r: 11, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 11, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 11, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 11, c: 3 } },
      { s: { r: 3, c: 4 }, e: { r: 11, c: 4 } },
      { s: { r: 3, c: 5 }, e: { r: 11, c: 5 } },
      { s: { r: 3, c: 6 }, e: { r: 11, c: 6 } },
      { s: { r: 3, c: 7 }, e: { r: 11, c: 7 } },
      { s: { r: 3, c: 10 }, e: { r: 11, c: 10 } },
      { s: { r: 3, c: 11 }, e: { r: 11, c: 11 } },
    ];

    ws1['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 26 },
      { wch: 25 },
      { wch: 16 },
      { wch: 26 },
      { wch: 15 },
      { wch: 18 },
      { wch: 22 },
      { wch: 60 },
      { wch: 18 },
      { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Formulir WS FKTP BPJS');

    // Sheet 2: Rincian Teknis Endpoint
    const detailData = [
      ['DOKUMENTASI RINCIAN TEKNIS ENDPOINT WS FKTP BPJS KESEHATAN (ANTREAN ONLINE V2)'],
      [`Faskes: ${namaFaskes} | Kode: ${kdFaskes} | Database: MySQL (Live)`],
      [],
      [
        'No',
        'Jenis Method BPJS',
        'HTTP Method',
        'Endpoint URL Production',
        'Keterangan Fungsi',
      ],
      ...WS_FKTP_ENDPOINTS.map((item) => [
        item.no,
        item.jenisMethod,
        item.httpMethod,
        customBaseUrl.replace(/\/$/, '') + item.path,
        item.description,
      ]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(detailData);
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    ];
    ws2['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 14 },
      { wch: 55 },
      { wch: 60 },
    ];

    XLSX.utils.book_append_sheet(wb, ws2, 'Rincian Teknis Endpoint');

    XLSX.writeFile(wb, 'URL_WS_FKTP_Production_Bridging_Antrean_Online_V2.xlsx');
    return true;
  } catch (err) {
    console.error('Failed to export Excel client-side:', err);
    return false;
  }
}

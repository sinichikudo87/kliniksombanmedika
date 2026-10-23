import { PoliInfo, QueueItem } from '@/types/queue';

export interface WaitTimeEstimate {
  menitTunggu: number;
  jamEstimasiPanggil: string;
  antreanDiDepan: number;
  rataRataPoliMenit: number;
  pesanEstimasi: string;
}

/**
 * Calculates real-time estimated waiting time for a given patient queue item
 */
export function calculateEstimatedWaitTime(
  item: QueueItem,
  allQueuesInPoli: QueueItem[],
  poliInfo?: PoliInfo
): WaitTimeEstimate {
  const avgDuration = poliInfo?.durasiRataRataMenit || 10;

  // Filter queues that are still waiting and arrived before this item
  const waitingAhead = allQueuesInPoli.filter(
    (q) =>
      q.id !== item.id &&
      q.poliKode === item.poliKode &&
      q.status === 'MENUNGGU' &&
      new Date(q.waktuDaftar).getTime() < new Date(item.waktuDaftar).getTime()
  );

  // Check if someone is currently being served in this poli
  const currentlyServing = allQueuesInPoli.find(
    (q) => q.poliKode === item.poliKode && (q.status === 'DIPANGGIL' || q.status === 'DILAYANI')
  );

  let remainingServingMinutes = 0;
  if (currentlyServing && currentlyServing.waktuMulaiLayanan) {
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(currentlyServing.waktuMulaiLayanan).getTime()) / 60000
    );
    remainingServingMinutes = Math.max(1, avgDuration - elapsedMinutes);
  } else if (currentlyServing) {
    remainingServingMinutes = Math.floor(avgDuration * 0.7);
  }

  // If this item is currently called or served, wait time is 0
  if (item.status === 'DIPANGGIL' || item.status === 'DILAYANI') {
    return {
      menitTunggu: 0,
      jamEstimasiPanggil: 'SEKARANG',
      antreanDiDepan: 0,
      rataRataPoliMenit: avgDuration,
      pesanEstimasi: 'Sedang dilayani di ruang periksa',
    };
  }

  if (item.status === 'SELESAI') {
    return {
      menitTunggu: 0,
      jamEstimasiPanggil: '-',
      antreanDiDepan: 0,
      rataRataPoliMenit: avgDuration,
      pesanEstimasi: 'Pelayanan telah selesai',
    };
  }

  const antreanDiDepan = waitingAhead.length + (currentlyServing ? 1 : 0);
  const totalMinutes = Math.max(2, (waitingAhead.length * avgDuration) + remainingServingMinutes);

  // Calculate target estimated call time
  const targetDate = new Date(Date.now() + totalMinutes * 60000);
  const hours = targetDate.getHours().toString().padStart(2, '0');
  const minutes = targetDate.getMinutes().toString().padStart(2, '0');
  const jamEstimasiPanggil = `${hours}:${minutes} WIB`;

  let pesanEstimasi = `± ${totalMinutes} menit (${antreanDiDepan} antrean di depan)`;
  if (antreanDiDepan === 0) {
    pesanEstimasi = `Giliran Anda berikutnya (± ${totalMinutes} menit)`;
  }

  return {
    menitTunggu: totalMinutes,
    jamEstimasiPanggil,
    antreanDiDepan,
    rataRataPoliMenit: avgDuration,
    pesanEstimasi,
  };
}

/**
 * Poli configuration with Dr. Machmujur default setups
 */
export const DEFAULT_POLI_LIST: PoliInfo[] = [
  {
    kode: 'UMU',
    nama: 'Poli Umum',
    prefix: 'A',
    dokter: 'dr. Machmujur, M.Kes',
    sip: '446/102/SIP-D/2024',
    ruang: 'Ruang 01 (Lantai 1)',
    durasiRataRataMenit: 10,
    kuotaTotal: 60,
    kuotaTerpakai: 24,
    badgeColor: 'emerald',
    iconName: 'Stethoscope',
  },
  {
    kode: 'GIG',
    nama: 'Poli Gigi & Mulut',
    prefix: 'B',
    dokter: 'drg. Siti Sarah Amanda',
    sip: '446/088/SIP-DG/2023',
    ruang: 'Ruang 02 (Lantai 1)',
    durasiRataRataMenit: 15,
    kuotaTotal: 30,
    kuotaTerpakai: 11,
    badgeColor: 'blue',
    iconName: 'Smile',
  },
  {
    kode: 'KIA',
    nama: 'Poli KIA & KB',
    prefix: 'C',
    dokter: 'Bdn. Ratna Dewi, S.ST',
    sip: '446/045/SIP-B/2022',
    ruang: 'Ruang 03 (Lantai 1)',
    durasiRataRataMenit: 12,
    kuotaTotal: 40,
    kuotaTerpakai: 14,
    badgeColor: 'purple',
    iconName: 'HeartPulse',
  },
  {
    kode: 'FAR',
    nama: 'Apotek & Farmasi',
    prefix: 'F',
    dokter: 'Apt. Farhan Maulana, S.Farm',
    sip: '446/210/SIPA/2024',
    ruang: 'Loket Farmasi Utama',
    durasiRataRataMenit: 6,
    kuotaTotal: 100,
    kuotaTerpakai: 32,
    badgeColor: 'amber',
    iconName: 'Pill',
  },
];

import Swal, { SweetAlertOptions } from 'sweetalert2';

/**
 * Konfigurasi tema terpadu SweetAlert2 untuk Klinik Somban Medika
 * Sesuai estetika emerald modern, mendukung mode gelap/terang, dan z-index tinggi z-[9999]
 */
const baseSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans p-6',
    title: 'text-lg font-bold text-slate-900 dark:text-white mb-2',
    htmlContainer: 'text-xs text-slate-600 dark:text-slate-300 leading-relaxed',
    confirmButton: 'px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all mx-1.5 focus:outline-none',
    cancelButton: 'px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all mx-1.5 focus:outline-none',
    denyButton: 'px-4 py-2.5 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-all mx-1.5 focus:outline-none',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate-in fade-in zoom-in-95 duration-200',
  },
  hideClass: {
    popup: 'animate-out fade-out zoom-out-95 duration-150',
  },
});

/**
 * Toast notifikasi kecil melayang di pojok kanan atas
 */
export const showToast = (title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success', duration = 3000) => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans px-4 py-3 text-xs',
      title: 'text-xs font-semibold text-slate-900 dark:text-white',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
};

/**
 * Alert Sukses
 */
export const showSuccessAlert = (title: string, text?: string, timer = 2500) => {
  return baseSwal.fire({
    icon: 'success',
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: true,
    confirmButtonText: 'Selesai',
  });
};

/**
 * Alert Gagal / Error
 */
export const showErrorAlert = (title: string, text?: string) => {
  return baseSwal.fire({
    icon: 'error',
    title,
    text: text || 'Terjadi kesalahan pada sistem. Silakan coba kembali.',
    showConfirmButton: true,
    confirmButtonText: 'Tutup',
  });
};

/**
 * Alert Info
 */
export const showInfoAlert = (title: string, text: string) => {
  return baseSwal.fire({
    icon: 'info',
    title,
    text,
    showConfirmButton: true,
    confirmButtonText: 'Mengerti',
  });
};

/**
 * Dialog Konfirmasi Aksi (misal: Reset Data, Hapus Log)
 */
export const showConfirmDialog = async (options: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDanger?: boolean;
}): Promise<boolean> => {
  const result = await baseSwal.fire({
    icon: options.isDanger ? 'warning' : 'question',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Ya, Lanjutkan',
    cancelButtonText: options.cancelButtonText || 'Batal',
    customClass: {
      popup: 'rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans p-6',
      title: 'text-lg font-bold text-slate-900 dark:text-white mb-2',
      htmlContainer: 'text-xs text-slate-600 dark:text-slate-300 leading-relaxed',
      confirmButton: options.isDanger
        ? 'px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-all mx-1.5 focus:outline-none'
        : 'px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all mx-1.5 focus:outline-none',
      cancelButton: 'px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all mx-1.5 focus:outline-none',
    },
  });

  return result.isConfirmed;
};

export default {
  showToast,
  showSuccessAlert,
  showErrorAlert,
  showInfoAlert,
  showConfirmDialog,
};

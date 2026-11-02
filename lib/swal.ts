import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Custom SweetAlert2 notification with green gradient background,
 * white crisp typography, and automatic timer close.
 */
export const showSwalAlert = (
  message: string,
  options?: {
    title?: string;
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
    timer?: number;
  }
) => {
  return Swal.fire({
    title: options?.title || 'Informasi Sistem',
    html: `<div style="font-size: 0.95rem; line-height: 1.5; font-weight: 500; color: #ffffff;">${message}</div>`,
    icon: options?.icon || 'success',
    timer: options?.timer ?? 2500,
    timerProgressBar: true,
    showConfirmButton: false,
    color: '#ffffff',
    // Background hijau gradient sesuai permintaan user
    background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
    backdrop: 'rgba(15, 23, 42, 0.45)',
    customClass: {
      popup: 'swal-gradient-popup shadow-2xl rounded-2xl border border-emerald-300/40 text-white',
      title: 'text-white font-bold text-lg tracking-wide',
      timerProgressBar: 'bg-emerald-200',
    },
  });
};

export const showSwalSuccess = (message: string, title: string = 'Berhasil') => {
  return showSwalAlert(message, { title, icon: 'success', timer: 2500 });
};

export const showSwalError = (message: string, title: string = 'Perhatian') => {
  return showSwalAlert(message, { title, icon: 'error', timer: 3000 });
};

export const showSwalInfo = (message: string, title: string = 'Informasi') => {
  return showSwalAlert(message, { title, icon: 'info', timer: 2500 });
};

export default Swal;

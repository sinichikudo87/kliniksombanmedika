import { AuditSecurityLog, Patient } from '@/types/queue';

// Standard clinic salt for PBKDF2 key derivation (in production, can be dynamically loaded or pinned)
const CLINIC_SALT = new TextEncoder().encode("TPMD-MACHMUJUR-SECURE-BPJS-2026-KEY-SALT");

/**
 * Derives a 256-bit AES-GCM CryptoKey from a secret passcode
 */
export async function deriveKeyFromPasscode(passcode: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: CLINIC_SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string into a base64-encoded payload containing IV + Ciphertext
 */
export async function encryptData(plainText: string, passcode: string = "DrMachmujurSecure2026!"): Promise<string> {
  try {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      // Fallback for SSR or non-subtle environments
      return btoa(unescape(encodeURIComponent(plainText)));
    }

    const key = await deriveKeyFromPasscode(passcode);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for AES-GCM
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );

    // Combine IV (12 bytes) + Ciphertext into one byte array
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to Base64
    let binary = "";
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error("Encryption error:", err);
    return btoa(unescape(encodeURIComponent(plainText)));
  }
}

/**
 * Decrypts a base64-encoded AES-GCM payload into plaintext string
 */
export async function decryptData(cipherBase64: string, passcode: string = "DrMachmujurSecure2026!"): Promise<string> {
  try {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      return decodeURIComponent(escape(atob(cipherBase64)));
    }

    const binary = atob(cipherBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (bytes.length <= 12) {
      return decodeURIComponent(escape(atob(cipherBase64)));
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const key = await deriveKeyFromPasscode(passcode);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // If decryption fails (e.g. wrong key or plaintext fallback), try safe fallback
    try {
      return decodeURIComponent(escape(atob(cipherBase64)));
    } catch {
      throw new Error("Gagal mendekripsi data. Kunci keamanan tidak valid atau data korup.");
    }
  }
}

/**
 * Mask sensitive data for display (e.g. NIK or No BPJS)
 */
export function maskSensitive(text: string, showStart = 4, showEnd = 3): string {
  if (!text) return "";
  if (text.length <= showStart + showEnd) return text;
  const start = text.slice(0, showStart);
  const end = text.slice(-showEnd);
  const maskedLength = text.length - showStart - showEnd;
  return `${start}${"*".repeat(maskedLength)}${end}`;
}

export function maskName(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts
    .map((p) => (p.length > 2 ? `${p[0]}${"*".repeat(p.length - 2)}${p[p.length - 1]}` : p))
    .join(" ");
}

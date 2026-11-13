import crypto from 'crypto';

const KEY_STR_URI_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
const baseReverseDic: Record<string, Record<string, number>> = {};

function getBaseValue(alphabet: string, character: string): number {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (let i = 0; i < alphabet.length; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

function lzDecompress(length: number, resetValue: number, getNextValue: (index: number) => number): string {
  const dictionary: Array<string | number> = [];
  let next: number;
  let enlargeIn = 4;
  let dictSize = 4;
  let numBits = 3;
  let entry = '';
  const result: string[] = [];
  let i: number;
  let w: string;
  let bits: number;
  let resb: number;
  let maxpower: number;
  let power: number;
  let c: string | number;

  const data = { val: getNextValue(0), position: resetValue, index: 1 };

  for (i = 0; i < 3; i += 1) {
    dictionary[i] = i;
  }

  bits = 0;
  maxpower = Math.pow(2, 2);
  power = 1;
  while (power !== maxpower) {
    resb = data.val & data.position;
    data.position >>= 1;
    if (data.position === 0) {
      data.position = resetValue;
      data.val = getNextValue(data.index++);
    }
    bits |= (resb > 0 ? 1 : 0) * power;
    power <<= 1;
  }

  switch ((next = bits)) {
    case 0:
      bits = 0;
      maxpower = Math.pow(2, 8);
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      c = String.fromCharCode(bits);
      break;
    case 1:
      bits = 0;
      maxpower = Math.pow(2, 16);
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      c = String.fromCharCode(bits);
      break;
    case 2:
      return '';
    default:
      c = '';
  }

  dictionary[3] = c;
  w = String(c);
  result.push(String(c));

  while (true) {
    if (data.index > length) {
      return '';
    }

    bits = 0;
    maxpower = Math.pow(2, numBits);
    power = 1;
    while (power !== maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position === 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    let cc: number | string = bits;
    switch (cc) {
      case 0:
        bits = 0;
        maxpower = Math.pow(2, 8);
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        dictionary[dictSize++] = String.fromCharCode(bits);
        cc = dictSize - 1;
        enlargeIn--;
        break;
      case 1:
        bits = 0;
        maxpower = Math.pow(2, 16);
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        dictionary[dictSize++] = String.fromCharCode(bits);
        cc = dictSize - 1;
        enlargeIn--;
        break;
      case 2:
        return result.join('');
    }

    if (enlargeIn === 0) {
      enlargeIn = Math.pow(2, numBits);
      numBits++;
    }

    if (dictionary[cc as number] !== undefined) {
      entry = String(dictionary[cc as number]);
    } else if (cc === dictSize) {
      entry = w + w.charAt(0);
    } else {
      return '';
    }

    result.push(entry);
    dictionary[dictSize++] = w + entry.charAt(0);
    enlargeIn--;
    w = entry;

    if (enlargeIn === 0) {
      enlargeIn = Math.pow(2, numBits);
      numBits++;
    }
  }
}

export function decompressFromEncodedURIComponent(input: string): string | null {
  if (!input) return '';
  const normalized = input.replace(/ /g, '+');
  return lzDecompress(normalized.length, 32, (index) =>
    getBaseValue(KEY_STR_URI_SAFE, normalized.charAt(index))
  );
}

/**
 * Decrypt official BPJS Trustmark API response (AES-256-CBC + LZString)
 * Key = SHA256(consId + secretKey + timestamp)
 * IV = first 16 bytes of Key
 */
export function decryptBpjsResponse(
  encryptedResponse: unknown,
  consId: string,
  secretKey: string,
  timestamp: string
): any {
  if (typeof encryptedResponse !== 'string' || !encryptedResponse.trim()) {
    return encryptedResponse;
  }

  try {
    const keyHash = crypto
      .createHash('sha256')
      .update(`${consId}${secretKey}${timestamp}`)
      .digest();
    const iv = keyHash.subarray(0, 16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);
    let decrypted = decipher.update(encryptedResponse, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const decompressed = decompressFromEncodedURIComponent(decrypted) || decrypted;
    try {
      return JSON.parse(decompressed);
    } catch {
      return decompressed;
    }
  } catch {
    return encryptedResponse;
  }
}

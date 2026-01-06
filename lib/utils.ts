// Helper functions for binary data handling
export function byteaHexFromBase64(base64: string): string | null {
  if (!base64) return null;
  const buf = Buffer.from(base64, 'base64');
  return `\\x${buf.toString('hex')}`;
}

export function bufferFromByteaField(value: string): Buffer {
  if (value.startsWith('\\x')) {
    const raw = Buffer.from(value.slice(2), 'hex');
    const asText = raw.toString('utf8');
    // Check if it's base64 text stored as bytes
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(asText) && asText.length % 4 === 0) {
      return Buffer.from(asText, 'base64');
    }
    return raw;
  }
  return Buffer.from(value, 'base64');
}



import QRCode from 'qrcode'

/**
 * Generate a reference string for a PayNow transaction.
 * Format: SP-XXXX-YYYYMM
 */
export function generateReference(donorId: number, cycleMonth: string): string {
  const paddedId = String(donorId).padStart(4, '0')
  const formattedMonth = cycleMonth.replace('-', '')
  return `SP-${paddedId}-${formattedMonth}`
}

/**
 * Build a TLV (Tag-Length-Value) field per EMVCo spec.
 * Tag and length are 2 characters each, zero-padded.
 */
function tlv(tag: string, value: string): string {
  const length = String(value.length).padStart(2, '0')
  return `${tag}${length}${value}`
}

/**
 * Compute CRC-16/CCITT-FALSE checksum.
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
function crc16ccittFalse(input: string): string {
  let crc = 0xffff
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Generate an EMVCo-compliant PayNow QR string.
 */
export function generatePayNowString(opts: {
  amount: number
  reference: string
}): string {
  const { amount, reference } = opts

  // Expiry date: 5 years from now (YYYYMMDD)
  const expiry = new Date()
  expiry.setFullYear(expiry.getFullYear() + 5)
  const expiryStr =
    String(expiry.getFullYear()) +
    String(expiry.getMonth() + 1).padStart(2, '0') +
    String(expiry.getDate()).padStart(2, '0')

  // Merchant Account Information (Tag 26) – PayNow sub-fields
  const merchantAccount =
    tlv('00', 'SG.PAYNOW') +
    tlv('01', '2') +           // Proxy type: UEN
    tlv('02', 'S93MQ0024E') +   // Proxy value: UEN
    tlv('03', '0') +           // Amount editable: no
    tlv('04', expiryStr)       // Expiry date (YYYYMMDD)

  // Additional Data Field (Tag 62)
  const additionalData = tlv('01', reference) // Bill Number

  // Build the payload (without CRC)
  const payload =
    tlv('00', '01') +                          // Payload Format Indicator
    tlv('01', '12') +                          // Point of Initiation (dynamic)
    tlv('26', merchantAccount) +               // Merchant Account Information
    tlv('52', '0000') +                        // Merchant Category Code
    tlv('53', '702') +                         // Transaction Currency (SGD)
    tlv('54', amount.toFixed(2)) +             // Transaction Amount
    tlv('58', 'SG') +                          // Country Code
    tlv('59', 'MASJID AR-RAUDHAH') +           // Merchant Name
    tlv('60', 'Singapore') +                   // Merchant City
    tlv('62', additionalData)                  // Additional Data Field

  // Tag 63 (CRC) has length 04 (the CRC itself is 4 hex chars)
  const crcInput = payload + '6304'
  const crc = crc16ccittFalse(crcInput)

  return payload + '6304' + crc
}

/**
 * Generate a QR code data URL from a PayNow string.
 */
export async function generateQRDataURL(opts: {
  amount: number
  reference: string
}): Promise<string> {
  const payloadString = generatePayNowString(opts)
  return QRCode.toDataURL(payloadString)
}

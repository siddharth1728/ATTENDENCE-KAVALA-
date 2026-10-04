import fs from 'fs'
import zlib from 'zlib'

function crc32(buf) {
  let table = []
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const combined = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(combined), 0)
  return Buffer.concat([len, combined, crc])
}

function createPng(width, height) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8) // 8 bits per channel
  ihdr.writeUInt8(6, 9) // RGBA
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // Generate pixels
  const rawScanlines = Buffer.alloc(height * (1 + width * 4))
  const cx = width / 2
  const cy = height / 2
  const radius = width * 0.35
  const strokeWidth = width * 0.05

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4)
    rawScanlines[rowOffset] = 0 // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Base: dark canvas #090d16
      let r = 9, g = 13, b = 22, a = 255

      // Circular ring track
      if (Math.abs(dist - radius) <= strokeWidth / 2) {
        // Cyan accent #38bdf8 for upper portion (75% arc)
        const angle = Math.atan2(dy, dx) // -PI to PI
        if (angle > -Math.PI * 0.75 && angle < Math.PI * 0.75) {
          r = 56
          g = 189
          b = 248
        } else {
          // Dark track #1e293b
          r = 30
          g = 41
          b = 59
        }
      }

      // Checkmark in center: points approximately (cx - w*0.12, cy + h*0.02) to (cx - w*0.02, cy + h*0.12) to (cx + w*0.15, cy - h*0.1)
      const p1x = cx - width * 0.14, p1y = cy + height * 0.02
      const p2x = cx - width * 0.03, p2y = cy + height * 0.12
      const p3x = cx + width * 0.16, p3y = cy - height * 0.10

      function distToSeg(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2
        if (l2 === 0) return Math.hypot(px - x1, py - y1)
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
        t = Math.max(0, Math.min(1, t))
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)))
      }

      const dSeg1 = distToSeg(x, y, p1x, p1y, p2x, p2y)
      const dSeg2 = distToSeg(x, y, p2x, p2y, p3x, p3y)
      const checkDist = Math.min(dSeg1, dSeg2)

      if (checkDist <= strokeWidth * 0.6) {
        // Emerald safe color #22c55e
        r = 34
        g = 197
        b = 94
      }

      rawScanlines[pxOffset] = r
      rawScanlines[pxOffset + 1] = g
      rawScanlines[pxOffset + 2] = b
      rawScanlines[pxOffset + 3] = a
    }
  }

  const compressed = zlib.deflateSync(rawScanlines)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk])
}

fs.writeFileSync('public/icon-192.png', createPng(192, 192))
fs.writeFileSync('public/icon-512.png', createPng(512, 512))
console.log('Successfully generated public/icon-192.png and public/icon-512.png!')

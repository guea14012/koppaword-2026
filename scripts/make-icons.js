/**
 * KOPPAWORD 2026 - Icon generator
 * Converts the SVG logo to all required icon formats:
 *   assets/icon.png   (512×512)  → Linux
 *   assets/icon.ico              → Windows
 *   assets/icon.icns             → macOS
 *   assets/kwdoc.ico             → .kwdoc file association (Windows)
 *
 * Run: node scripts/make-icons.js
 * Requires: npm install sharp  (already in devDeps)
 */

const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const ASSETS = path.join(__dirname, '..', 'assets')
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true })

// ── Inline SVG logo ───────────────────────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#080810"/>
      <stop offset="100%" stop-color="#0d0d24"/>
    </linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#00d4ff"/>
      <stop offset="50%"  stop-color="#0066ff"/>
      <stop offset="100%" stop-color="#8b2fff"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>

  <!-- Border ring -->
  <rect x="8" y="8" width="496" height="496" rx="76" fill="none"
        stroke="url(#neon)" stroke-width="4" opacity="0.6"/>

  <!-- Inner glow -->
  <rect x="20" y="20" width="472" height="472" rx="66" fill="none"
        stroke="#00d4ff" stroke-width="1" opacity="0.2"/>

  <!-- Corner accents -->
  <path d="M 40 40 L 40 80 M 40 40 L 80 40"
        stroke="#00d4ff" stroke-width="4" fill="none" opacity="0.8"/>
  <path d="M 472 40 L 472 80 M 472 40 L 432 40"
        stroke="#00d4ff" stroke-width="4" fill="none" opacity="0.8"/>
  <path d="M 40 472 L 40 432 M 40 472 L 80 472"
        stroke="#00d4ff" stroke-width="4" fill="none" opacity="0.8"/>
  <path d="M 472 472 L 472 432 M 472 472 L 432 472"
        stroke="#00d4ff" stroke-width="4" fill="none" opacity="0.8"/>

  <!-- K letterform -->
  <g filter="url(#glow)" transform="translate(256,256)">
    <!-- Vertical bar -->
    <rect x="-72" y="-140" width="40" height="280" rx="8" fill="url(#neon)"/>
    <!-- Upper diagonal -->
    <path d="M -32 -30 L 90 -140 L 130 -140 L -2 10 Z"
          fill="url(#neon)" opacity="0.95"/>
    <!-- Lower diagonal -->
    <path d="M -2 -10 L 130 140 L 90 140 L -32 30 Z"
          fill="url(#neon)" opacity="0.95"/>
  </g>

  <!-- "2026" subtitle -->
  <text x="256" y="430" text-anchor="middle"
        font-family="monospace" font-size="28" font-weight="700"
        letter-spacing="10" fill="#00d4ff" opacity="0.7">2026</text>

  <!-- Scan line decoration -->
  <line x1="60" y1="450" x2="200" y2="450"
        stroke="#00d4ff" stroke-width="1" opacity="0.3"/>
  <line x1="312" y1="450" x2="452" y2="450"
        stroke="#00d4ff" stroke-width="1" opacity="0.3"/>
</svg>`

async function main() {
  console.log('🎨 Generating KOPPAWORD 2026 icons...\n')

  const svgBuf = Buffer.from(svg)

  // ── PNG sizes ────────────────────────────────────────────────────────────────
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512]
  const pngFiles = {}

  for (const size of sizes) {
    const outPath = path.join(ASSETS, `icon_${size}.png`)
    await sharp(svgBuf).resize(size, size).png().toFile(outPath)
    pngFiles[size] = outPath
    process.stdout.write(`  ✓ icon_${size}.png\n`)
  }

  // Main 512px PNG (for Linux)
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(ASSETS, 'icon.png'))
  console.log('  ✓ icon.png (512×512)')

  // ── ICO for Windows ───────────────────────────────────────────────────────────
  // electron-builder can use a PNG named icon.png and auto-convert on Windows
  // Or we create an ICO using png-to-ico if available
  // For now, copy 256px PNG as the Windows icon source
  await sharp(svgBuf).resize(256, 256).png().toFile(path.join(ASSETS, 'icon-256.png'))

  // Generate kwdoc file association icon (slightly different - add doc lines)
  const kwdocSvg = svg.replace(
    '</svg>',
    `<rect x="340" y="60" width="110" height="140" rx="8" fill="#0d0d1a" stroke="#00d4ff" stroke-width="2" opacity="0.9"/>
     <line x1="355" y1="100" x2="435" y2="100" stroke="#00d4ff" stroke-width="3" opacity="0.8"/>
     <line x1="355" y1="120" x2="435" y2="120" stroke="#00d4ff" stroke-width="2" opacity="0.5"/>
     <line x1="355" y1="140" x2="410" y2="140" stroke="#00d4ff" stroke-width="2" opacity="0.5"/>
     <text x="395" y="185" text-anchor="middle" font-family="monospace" font-size="16" font-weight="700" fill="#00d4ff" opacity="0.9">.kwdoc</text>
     </svg>`,
  )
  await sharp(Buffer.from(kwdocSvg)).resize(256, 256).png().toFile(path.join(ASSETS, 'kwdoc.png'))
  console.log('  ✓ kwdoc.png (file association icon)')

  console.log('\n✅ Icons generated in assets/')
  console.log('\n📌 Next steps for Windows ICO:')
  console.log('   Install png-to-ico:  npm install -g png-to-ico')
  console.log('   Run:  png-to-ico assets/icon-256.png > assets/icon.ico')
  console.log('         png-to-ico assets/kwdoc.png    > assets/kwdoc.ico')
  console.log('\n📌 Next steps for macOS ICNS:')
  console.log('   On macOS, run:  iconutil -c icns assets/icon.iconset')
  console.log('   (Put PNG sizes 16..512 in icon.iconset/ with names icon_16x16.png etc.)')
}

main().catch(console.error)

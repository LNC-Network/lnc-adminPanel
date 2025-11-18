// Simple SVG icon generator (no dependencies required)
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template with LNC branding
const createSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" letter-spacing="${size * 0.02}">LNC</text>
</svg>`;

console.log('Generating PWA icon files...\n');

// Generate all sizes
sizes.forEach(size => {
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, createSVG(size));
    console.log(`✓ Generated ${filename}`);
});

// Generate apple-touch-icon
const appleIcon = path.join(iconsDir, 'apple-touch-icon.svg');
fs.writeFileSync(appleIcon, createSVG(180));
console.log(`✓ Generated apple-touch-icon.svg`);

console.log('\n✅ All icons generated successfully!');
console.log('📁 Location: public/icons/');
console.log('\n💡 Note: SVG icons work for PWA. For better compatibility, consider converting to PNG using sharp or an online tool.');

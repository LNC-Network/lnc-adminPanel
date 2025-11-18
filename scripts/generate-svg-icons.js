// Generate PWA icons from source icon.svg
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sourceIconPath = path.join(iconsDir, 'icon.svg');

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Read the source icon
if (!fs.existsSync(sourceIconPath)) {
  console.error('❌ Error: icon.svg not found at', sourceIconPath);
  console.log('Please ensure icon.svg exists in public/icons/');
  process.exit(1);
}

const sourceIcon = fs.readFileSync(sourceIconPath, 'utf8');

console.log('Generating PWA icon files from icon.svg...\n');

// Generate all sizes by creating copies with appropriate viewBox
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  // Modify the SVG to have the correct size attributes
  let resizedIcon = sourceIcon
    .replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`);

  fs.writeFileSync(filepath, resizedIcon);
  console.log(`✓ Generated ${filename}`);
});

// Generate apple-touch-icon
const appleIcon = path.join(iconsDir, 'apple-touch-icon.svg');
let appleIconContent = sourceIcon
  .replace(/width="[^"]*"/, `width="180"`)
  .replace(/height="[^"]*"/, `height="180"`);
fs.writeFileSync(appleIcon, appleIconContent);
console.log(`✓ Generated apple-touch-icon.svg`);

console.log('\n✅ All icons generated successfully from icon.svg!');
console.log('📁 Location: public/icons/');
console.log('🎨 Source: public/icons/icon.svg');

console.log('\n✅ All icons generated successfully!');
console.log('📁 Location: public/icons/');
console.log('\n💡 Note: SVG icons work for PWA. For better compatibility, consider converting to PNG using sharp or an online tool.');

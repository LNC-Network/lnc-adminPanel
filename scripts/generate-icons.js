// Icon generation script
// Run this to generate all required PWA icons from a source image
// node scripts\generate-svg-icons.js 

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, 'public', 'avatars', 'shadcn.jpg');
const iconsDir = path.join(__dirname, 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
    try {
        for (const size of sizes) {
            await sharp(sourceIcon)
                .resize(size, size, {
                    fit: 'cover',
                    position: 'center'
                })
                .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

            console.log(`✓ Generated icon-${size}x${size}.png`);
        }

        console.log('\n✅ All icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    generateIcons();
}

module.exports = { generateIcons };

import fs from 'fs';
import path from 'path';
import jimp from 'jimp';

async function generateIcons() {
    const sourcePath = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\02164ae5-f1cf-4f9c-8c7b-e5184764a3c5\\fameo_icon_1773286358576.png';
    const outputDir = path.join('d:\\Fameo_Desktop\\Nguyen Thanh Dat\\PWA 1\\public', 'icons');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        console.log('Loading source image...');
        const image = await jimp.read(sourcePath);

        // 1. Generate 512x512 standard
        console.log('Generating 512x512...');
        const img512 = image.clone().resize(512, 512);
        await img512.writeAsync(path.join(outputDir, 'icon-512.png'));

        // 2. Generate 192x192 standard
        console.log('Generating 192x192...');
        const img192 = image.clone().resize(192, 192);
        await img192.writeAsync(path.join(outputDir, 'icon-192.png'));

        // 3. Generate 512x512 maskable (add padding for safe zone)
        // Maskable icon must comfortably fit within an inner circle of ~80%
        console.log('Generating maskable 512x512...');

        // Resize original to 410x410 (80% of 512), then composite onto a solid 512x512 black background
        const maskableInner = image.clone().resize(410, 410);

        const maskableBg = new jimp(512, 512, '#111113'); // Match Fameo's dark theme
        maskableBg.composite(maskableInner, (512 - 410) / 2, (512 - 410) / 2);

        await maskableBg.writeAsync(path.join(outputDir, 'icon-maskable-512.png'));

        console.log('All icons generated successfully!');
    } catch (err) {
        console.error('Failed to generate icons:', err);
        process.exit(1);
    }
}

generateIcons();

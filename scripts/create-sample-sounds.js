/**
 * Script to create sample audio files for the Focus Mode feature
 * 
 * This script will create empty MP3 files to serve as placeholders
 * for the ambient sounds and brainwaves features.
 * 
 * Run with: 
 * node scripts/create-sample-sounds.js
 */

const fs = require('fs');
const path = require('path');

// Determine script directory and project root for reliable path resolution
const SCRIPT_DIR = path.dirname(require.resolve(__filename));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const SOUNDS_DIR = path.join(PROJECT_ROOT, 'public/sounds');

console.log('\x1b[36m=== Focus Mode Sample Sound Creator ===\x1b[0m');
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Sounds directory: ${SOUNDS_DIR}`);

// List of ambient sound files to create
const AMBIENT_SOUNDS = [
  { name: 'white-noise.mp3', description: 'White noise sample' },
  { name: 'rain.mp3', description: 'Rain sound sample' },
  { name: 'cafe.mp3', description: 'Cafe ambience sample' },
  { name: 'nature.mp3', description: 'Nature sounds sample' },
  { name: 'brown-noise.mp3', description: 'Brown noise sample' }
];

// List of brainwave files to create
const BRAINWAVE_SOUNDS = [
  { name: 'alpha-waves.mp3', description: 'Alpha waves (8-13 Hz) for relaxation and creativity' },
  { name: 'beta-waves.mp3', description: 'Beta waves (13-30 Hz) for focus and alertness' },
  { name: 'theta-waves.mp3', description: 'Theta waves (4-8 Hz) for deep meditation and sleep' },
  { name: 'delta-waves.mp3', description: 'Delta waves (0.5-4 Hz) for deep sleep and healing' },
  { name: 'gamma-waves.mp3', description: 'Gamma waves (30-100 Hz) for cognitive enhancement' }
];

// Other utility sounds
const OTHER_SOUNDS = [
  { name: 'bell.mp3', description: 'Bell sound for timer completion' },
  { name: 'notification.mp3', description: 'Notification sound' }
];

// All files to create
const ALL_FILES = [...AMBIENT_SOUNDS, ...BRAINWAVE_SOUNDS, ...OTHER_SOUNDS];

// Binary data for a minimal valid MP3 file (essentially empty, but valid format)
// This is a 1-second silent MP3 file
const EMPTY_MP3 = Buffer.from([
  0xFF, 0xFB, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Ensure the sounds directory exists
if (!fs.existsSync(SOUNDS_DIR)) {
  console.log(`Creating directory: ${SOUNDS_DIR}`);
  try {
    fs.mkdirSync(SOUNDS_DIR, { recursive: true });
  } catch (error) {
    console.error(`\x1b[31mFailed to create sounds directory: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

// Create README.txt file
const readmeContent = `# Audio Files for Focus Mode

This directory contains audio files used in the Focus Mode feature.

## Required Audio Files

### Ambient Sounds
- white-noise.mp3 - White noise for masking distractions
- rain.mp3 - Rainfall sounds
- cafe.mp3 - Coffee shop ambient noise
- nature.mp3 - Nature sounds (birds, forest, etc.)
- brown-noise.mp3 - Brown noise (deeper than white noise)

### Brainwave Entrainment
- alpha-waves.mp3 - Alpha frequency (8-13 Hz) for relaxation and creativity
- beta-waves.mp3 - Beta frequency (13-30 Hz) for focus and alertness
- theta-waves.mp3 - Theta frequency (4-8 Hz) for deep meditation and sleep
- delta-waves.mp3 - Delta frequency (0.5-4 Hz) for deep sleep and healing
- gamma-waves.mp3 - Gamma frequency (30-100 Hz) for cognitive enhancement

### Other
- bell.mp3 - Bell sound for timer completion
- notification.mp3 - Notification sound

## Recommended Specifications
- Format: MP3
- Bit rate: 128-192 kbps
- Duration: 5-10 minutes (will loop automatically)
- Size: < 5MB each

## IMPORTANT
The placeholder files created by the script are just empty MP3 files.
You'll need to replace them with actual audio content for the Focus Mode to work properly.

## TROUBLESHOOTING
If you see errors like "NotSupportedError: Failed to load because no supported source was found":
1. Make sure the audio files exist in this directory
2. Ensure they are valid MP3 files (the placeholders might not work in all browsers)
3. Replace the placeholders with actual audio content

## WHERE TO FIND AUDIO FILES
You can download royalty-free sound effects from these websites:
- https://freesound.org/
- https://soundbible.com/
- https://mixkit.co/free-sound-effects/
- https://elements.envato.com/ (subscription required)

## Legal Considerations
Ensure you have the rights to use any audio files you add to this directory.
For commercial applications, verify that the audio files are licensed appropriately.
`;

// Create the README file
try {
  fs.writeFileSync(path.join(SOUNDS_DIR, 'README.txt'), readmeContent);
  console.log('\x1b[32mCreated README.txt with instructions\x1b[0m');
} catch (error) {
  console.error(`\x1b[31mFailed to create README.txt: ${error.message}\x1b[0m`);
}

// Create each audio file
console.log('\n\x1b[36mCreating placeholder audio files:\x1b[0m');

let createdCount = 0;
let existingCount = 0;
let errorCount = 0;

ALL_FILES.forEach(file => {
  const filePath = path.join(SOUNDS_DIR, file.name);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`- ${file.name} \x1b[33m(already exists)\x1b[0m`);
    existingCount++;
  } else {
    try {
      // Write the empty MP3 data
      fs.writeFileSync(filePath, EMPTY_MP3);
      console.log(`- ${file.name} \x1b[32m(created placeholder)\x1b[0m`);
      createdCount++;
    } catch (err) {
      console.error(`- ${file.name} \x1b[31m(ERROR: ${err.message})\x1b[0m`);
      errorCount++;
    }
  }
});

console.log('\n\x1b[36m=== SUMMARY ===\x1b[0m');
console.log(`Created: ${createdCount}`);
console.log(`Already existed: ${existingCount}`);
console.log(`Errors: ${errorCount}`);

console.log('\n\x1b[32mCreation complete!\x1b[0m');
console.log(`Placeholder audio files have been created in: ${SOUNDS_DIR}`);
console.log('\n\x1b[33mIMPORTANT: These are empty placeholder files and may not work in all browsers.\x1b[0m');
console.log('For proper usage, please replace them with actual audio content.');
console.log('See README.txt for more information on required audio files.');

console.log('\n\x1b[36mNext steps:\x1b[0m');
console.log('1. Run the download-sounds.sh script to download real sounds:');
console.log('   bash scripts/download-sounds.sh');
console.log('2. Or run the fetch-real-sounds.js script with your FreeSoundAPI key:');
console.log('   node scripts/fetch-real-sounds.js YOUR_API_KEY'); 
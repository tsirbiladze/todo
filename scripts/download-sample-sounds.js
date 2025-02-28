/**
 * Script to download sample audio files for the Focus Mode feature
 * 
 * This script will download a set of Creative Commons or public domain
 * audio samples for testing the ambient sounds and brainwaves features.
 * 
 * Run with: 
 * node scripts/download-sample-sounds.js
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, '../public/sounds');

// These are audio files from GitHub or other reliable sources
// All are either CC0 (Creative Commons Zero) or public domain files for testing purposes only
const SAMPLE_FILES = [
  {
    name: 'white-noise.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'White noise sample'
  },
  {
    name: 'rain.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Rain sound sample'
  },
  {
    name: 'cafe.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Cafe ambience sample'
  },
  {
    name: 'nature.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Nature sounds sample'
  },
  {
    name: 'brown-noise.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Brown noise sample'
  },
  {
    name: 'bell.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Bell sound for timer'
  }
];

// Placeholder URLs for brainwave files - these would need to be replaced with real binaural beats 
// of the appropriate frequencies for actual usage
const PLACEHOLDER_BRAINWAVES = [
  {
    name: 'alpha-waves.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Placeholder for alpha waves (not actual binaural beats)'
  },
  {
    name: 'beta-waves.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Placeholder for beta waves (not actual binaural beats)'
  },
  {
    name: 'theta-waves.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Placeholder for theta waves (not actual binaural beats)'
  },
  {
    name: 'delta-waves.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Placeholder for delta waves (not actual binaural beats)'
  },
  {
    name: 'gamma-waves.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Placeholder for gamma waves (not actual binaural beats)'
  }
];

// All files to download
const ALL_FILES = [...SAMPLE_FILES, ...PLACEHOLDER_BRAINWAVES];

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  console.log(`Creating directory: ${DOWNLOAD_DIR}`);
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * Download a file from a URL
 * @param {string} url - The URL to download from
 * @param {string} dest - The destination file path
 * @param {Function} callback - Callback function when complete
 */
function downloadFile(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  
  https.get(url, response => {
    if (response.statusCode !== 200) {
      fs.unlink(dest, () => {}); // Delete file if response is not 200
      callback(new Error(`Failed to download file: ${response.statusCode}`));
      return;
    }
    
    response.pipe(file);
    
    file.on('finish', () => {
      file.close(callback);
    });
  }).on('error', err => {
    fs.unlink(dest, () => {}); // Delete file on error
    callback(err);
  });
}

// Download all files
console.log('Downloading sample audio files for Focus Mode...');
console.log('Note: These are silent 1-minute placeholder files for testing purposes only.');
console.log('For real usage, please replace with proper audio files as described in the README.');
console.log('\nDownloading files:');

let completedCount = 0;

ALL_FILES.forEach(file => {
  const filePath = path.join(DOWNLOAD_DIR, file.name);
  
  console.log(`- ${file.name} (${file.description})`);
  
  downloadFile(file.url, filePath, (err) => {
    completedCount++;
    
    if (err) {
      console.error(`  ERROR: Failed to download ${file.name}: ${err.message}`);
    } else {
      console.log(`  ✓ Downloaded ${file.name}`);
    }
    
    if (completedCount === ALL_FILES.length) {
      console.log('\nDownload complete!');
      console.log(`Sample audio files have been downloaded to: ${DOWNLOAD_DIR}`);
      console.log('\nIMPORTANT: These are silent 1-minute audio files, meant as placeholders only.');
      console.log('For proper usage, please replace them with appropriate audio files.');
      console.log('\nYou can find royalty-free sound effects at:');
      console.log('- https://freesound.org/');
      console.log('- https://soundbible.com/');
      console.log('- https://mixkit.co/free-sound-effects/');
      console.log('- https://elements.envato.com/ (subscription required)');
    }
  });
}); 
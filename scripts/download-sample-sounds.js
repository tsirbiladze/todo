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

// Determine script directory and project root for reliable path resolution
const SCRIPT_DIR = path.dirname(require.resolve(__filename));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const DOWNLOAD_DIR = path.join(PROJECT_ROOT, 'public/sounds');

console.log('\x1b[36m=== Focus Mode Sample Sound Downloader ===\x1b[0m');
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Sounds directory: ${DOWNLOAD_DIR}`);

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
  },
  {
    name: 'notification.mp3',
    url: 'https://github.com/anars/blank-audio/raw/master/1-minute-of-silence.mp3',
    description: 'Notification sound'
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
  try {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error(`\x1b[31mFailed to create sounds directory: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

/**
 * Download a file from a URL
 * @param {string} url - The URL to download from
 * @param {string} dest - The destination file path
 * @returns {Promise<void>} - Promise that resolves when download is complete
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, response => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlink(dest, () => {});
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {}); // Delete file if response is not 200
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(() => {
          // Verify the file was downloaded correctly
          fs.stat(dest, (err, stats) => {
            if (err) {
              reject(new Error(`Failed to verify downloaded file: ${err.message}`));
              return;
            }
            
            if (stats.size === 0) {
              fs.unlink(dest, () => {});
              reject(new Error('Downloaded file is empty'));
              return;
            }
            
            resolve();
          });
        });
      });
    });
    
    request.on('error', err => {
      file.close();
      fs.unlink(dest, () => {}); // Delete file on error
      reject(err);
    });
    
    file.on('error', err => {
      file.close();
      fs.unlink(dest, () => {}); // Delete file on error
      reject(err);
    });
    
    // Set a timeout for the download
    request.setTimeout(30000, () => {
      request.abort();
      file.close();
      fs.unlink(dest, () => {});
      reject(new Error('Download timed out after 30 seconds'));
    });
  });
}

// Download all files
async function downloadAllFiles() {
  console.log('\n\x1b[36mDownloading sample audio files for Focus Mode...\x1b[0m');
  console.log('Note: These are silent 1-minute placeholder files for testing purposes only.');
  console.log('For real usage, please replace with proper audio files as described in the README.');
  console.log('\n\x1b[33mDownloading files:\x1b[0m');

  const results = [];
  const maxRetries = 2;
  
  for (const file of ALL_FILES) {
    const filePath = path.join(DOWNLOAD_DIR, file.name);
    
    console.log(`- ${file.name} (${file.description})`);
    
    // Skip if file already exists and has content
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          console.log(`  \x1b[33m✓ File already exists, skipping\x1b[0m`);
          results.push({ file, success: true, skipped: true });
          continue;
        }
      } catch (err) {
        // If we can't stat the file, try to download it anyway
      }
    }
    
    let success = false;
    let error = null;
    
    // Try up to maxRetries times
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`  Retry ${attempt}/${maxRetries}...`);
        }
        
        await downloadFile(file.url, filePath);
        console.log(`  \x1b[32m✓ Downloaded ${file.name}\x1b[0m`);
        success = true;
        break;
      } catch (err) {
        error = err;
        if (attempt < maxRetries) {
          console.log(`  \x1b[33mRetrying after error: ${err.message}\x1b[0m`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error(`  \x1b[31m✗ Failed to download ${file.name}: ${err.message}\x1b[0m`);
        }
      }
    }
    
    results.push({ file, success, error: error?.message });
  }
  
  // Generate summary
  const successful = results.filter(r => r.success).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n\x1b[36m=== DOWNLOAD SUMMARY ===\x1b[0m');
  console.log(`Successfully downloaded: ${successful - skipped}/${ALL_FILES.length}`);
  console.log(`Skipped (already exists): ${skipped}/${ALL_FILES.length}`);
  console.log(`Failed: ${failed}/${ALL_FILES.length}`);
  
  if (failed > 0) {
    console.log('\n\x1b[33mFailed downloads:\x1b[0m');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`- ${r.file.name}: ${r.error}`);
      });
  }
  
  console.log('\n\x1b[32mDownload complete!\x1b[0m');
  console.log(`Sample audio files have been downloaded to: ${DOWNLOAD_DIR}`);
  console.log('\n\x1b[33mIMPORTANT: These are silent 1-minute audio files, meant as placeholders only.\x1b[0m');
  console.log('For proper usage, please replace them with appropriate audio files.');
  
  console.log('\nYou can find royalty-free sound effects at:');
  console.log('- https://freesound.org/');
  console.log('- https://soundbible.com/');
  console.log('- https://mixkit.co/free-sound-effects/');
  console.log('- https://elements.envato.com/ (subscription required)');
  
  console.log('\n\x1b[36mNext steps:\x1b[0m');
  console.log('1. For real sounds, run the download-sounds.sh script:');
  console.log('   bash scripts/download-sounds.sh');
  console.log('2. Or use the FreeSoundAPI script with your API key:');
  console.log('   node scripts/fetch-real-sounds.js YOUR_API_KEY');
}

// Run the download function
downloadAllFiles().catch(err => {
  console.error(`\n\x1b[31mAn error occurred: ${err.message}\x1b[0m`);
  process.exit(1);
}); 
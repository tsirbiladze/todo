/**
 * Script to fetch real audio files for the Focus Mode feature using FreeSoundAPI
 * 
 * IMPORTANT: This script requires an API key from https://freesound.org/apiv2/apply/
 * You need to register for a free account and create an API application
 * 
 * Run with: 
 * node scripts/fetch-real-sounds.js YOUR_API_KEY
 * 
 * This script will download high-quality, properly licensed audio files
 * for the ambient sounds and brainwaves features.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Get API key from command line arguments
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Missing API key. Please provide your FreeSoundAPI key as an argument:');
  console.error('node scripts/fetch-real-sounds.js YOUR_API_KEY');
  console.error('\nGet your API key by registering at https://freesound.org/apiv2/apply/');
  process.exit(1);
}

const SOUNDS_DIR = path.join(__dirname, '../public/sounds');

// Create soundsDir if it doesn't exist
if (!fs.existsSync(SOUNDS_DIR)) {
  console.log(`Creating directory: ${SOUNDS_DIR}`);
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

// Sound queries for each required file
const SOUNDS_TO_FETCH = [
  { 
    name: 'white-noise.mp3',
    query: 'white+noise',
    filter: 'duration:[10 TO 60]',
    description: 'White noise'
  },
  { 
    name: 'rain.mp3',
    query: 'rain+ambient',
    filter: 'duration:[30 TO 120]',
    description: 'Rain sounds'
  },
  { 
    name: 'cafe.mp3',
    query: 'cafe+ambience',
    filter: 'duration:[30 TO 180]',
    description: 'Cafe ambience'
  },
  { 
    name: 'nature.mp3',
    query: 'nature+birds',
    filter: 'duration:[30 TO 120]',
    description: 'Nature sounds'
  },
  { 
    name: 'brown-noise.mp3',
    query: 'brown+noise',
    filter: 'duration:[10 TO 60]',
    description: 'Brown noise'
  },
  { 
    name: 'bell.mp3',
    query: 'bell+ding',
    filter: 'duration:[0 TO 3]',
    description: 'Bell sound for timer'
  },
  // For brainwaves, we'll search for specific frequencies
  { 
    name: 'alpha-waves.mp3',
    query: 'alpha+binaural+beats',
    filter: 'duration:[60 TO 600]',
    description: 'Alpha waves (8-13 Hz)'
  },
  { 
    name: 'beta-waves.mp3',
    query: 'beta+binaural+beats',
    filter: 'duration:[60 TO 600]',
    description: 'Beta waves (13-30 Hz)'
  },
  { 
    name: 'theta-waves.mp3',
    query: 'theta+binaural+beats',
    filter: 'duration:[60 TO 600]',
    description: 'Theta waves (4-8 Hz)'
  },
  { 
    name: 'delta-waves.mp3',
    query: 'delta+binaural+beats',
    filter: 'duration:[60 TO 600]',
    description: 'Delta waves (0.5-4 Hz)'
  },
  { 
    name: 'gamma-waves.mp3',
    query: 'gamma+binaural+beats',
    filter: 'duration:[60 TO 600]',
    description: 'Gamma waves (30-100 Hz)'
  }
];

/**
 * Helper function to make an HTTP request to the FreeSoundAPI
 * @param {string} url - API endpoint
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} - JSON response
 */
async function apiRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`API request failed with status code: ${response.statusCode}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`API request error: ${error.message}`));
    });
  });
}

/**
 * Download a file from a URL to a specific path
 * @param {string} url - URL to download from
 * @param {string} destPath - Destination file path
 * @param {Object} headers - Request headers
 * @returns {Promise<void>}
 */
async function downloadFile(url, destPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    const request = https.get(url, { headers }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadFile(response.headers.location, destPath, headers)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        fs.unlink(destPath, () => {}); // Delete the file if the response status isn't 200
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(() => resolve());
      });
    });
    
    request.on('error', (error) => {
      fs.unlink(destPath, () => {}); // Delete the file on error
      reject(new Error(`Download error: ${error.message}`));
    });
    
    file.on('error', (error) => {
      fs.unlink(destPath, () => {}); // Delete the file on error
      reject(new Error(`File error: ${error.message}`));
    });
  });
}

/**
 * Search for sounds with the FreeSoundAPI
 * @param {string} query - Search query
 * @param {string} filter - Filter string
 * @returns {Promise<Object>} - Search results
 */
async function searchSounds(query, filter) {
  const url = `https://freesound.org/apiv2/search/text/?query=${query}&filter=${filter}&fields=id,name,previews,license,duration,avg_rating&sort=rating_desc&page_size=5`;
  const headers = {
    'Authorization': `Token ${apiKey}`
  };
  
  return apiRequest(url, headers);
}

/**
 * Fetch and download all required sounds
 */
async function fetchSounds() {
  console.log('Fetching sounds from FreeSoundAPI...');
  console.log('This may take a few minutes depending on your internet connection.');
  
  const results = [];
  
  for (const sound of SOUNDS_TO_FETCH) {
    try {
      console.log(`\nSearching for ${sound.description}...`);
      const searchResult = await searchSounds(sound.query, sound.filter);
      
      if (!searchResult.results || searchResult.results.length === 0) {
        console.error(`No results found for ${sound.description}`);
        results.push({ sound, success: false, error: 'No results found' });
        continue;
      }
      
      // Get the best result (first one with highest rating)
      const bestMatch = searchResult.results[0];
      console.log(`Found: "${bestMatch.name}" (${bestMatch.duration.toFixed(1)}s, Rating: ${bestMatch.avg_rating || 'N/A'})`);
      
      // Get the preview URL - we'll use the high-quality preview
      const previewUrl = bestMatch.previews['preview-hq-mp3'];
      if (!previewUrl) {
        console.error(`No high-quality preview available for ${sound.description}`);
        results.push({ sound, success: false, error: 'No preview available' });
        continue;
      }
      
      // Download the file
      const filePath = path.join(SOUNDS_DIR, sound.name);
      console.log(`Downloading to ${sound.name}...`);
      
      await downloadFile(previewUrl, filePath);
      
      console.log(`✓ Successfully downloaded ${sound.name}`);
      results.push({ sound, success: true });
      
    } catch (error) {
      console.error(`Error fetching ${sound.description}: ${error.message}`);
      results.push({ sound, success: false, error: error.message });
    }
  }
  
  // Generate summary
  console.log('\n=== DOWNLOAD SUMMARY ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Successfully downloaded: ${successful}/${SOUNDS_TO_FETCH.length}`);
  console.log(`Failed: ${failed}/${SOUNDS_TO_FETCH.length}`);
  
  if (failed > 0) {
    console.log('\nFailed downloads:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`- ${r.sound.name}: ${r.error}`);
      });
      
    console.log('\nYou can try running the script again or manually download these files.');
    console.log('For any missing files, the app will use the placeholder files.');
  }
  
  if (successful > 0) {
    console.log('\nAudio files have been downloaded to the public/sounds directory.');
    console.log('The Focus Mode will now use these files for ambient sounds and brainwaves.');
  }
  
  console.log('\nIMPORTANT: These files are licensed for personal use only.');
  console.log('Check the FreeSoundAPI terms and each sound\'s license for commercial usage.');
}

// Main function
(async function main() {
  try {
    await fetchSounds();
  } catch (error) {
    console.error(`\nAn error occurred: ${error.message}`);
    process.exit(1);
  }
})(); 
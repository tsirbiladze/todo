# Scripts Directory

This directory contains utility scripts for the Todo application.

## Available Scripts

### `create-sample-sounds.js`

Creates placeholder audio files for the Focus Mode feature.

**Usage:**
```bash
node scripts/create-sample-sounds.js
```

**What it does:**
- Creates empty but valid MP3 files for all required audio files
- Generates a comprehensive README.txt with detailed instructions
- Places all files in the `public/sounds/` directory

**Important Notes:**
- The created files are silent placeholders (1-second empty MP3 files)
- These placeholders might not work in all browsers
- For proper use, replace with actual audio content
- The created README.txt file provides guidance on finding suitable audio files

**Audio files created:**
- Ambient sounds: white noise, rain, cafe, nature, brown noise
- Brainwave placeholders: alpha, beta, theta, delta, gamma
- Other: bell sound for timer

### `fetch-real-sounds.js`

Downloads high-quality audio files from FreeSoundAPI for the Focus Mode feature.

**Usage:**
```bash
node scripts/fetch-real-sounds.js YOUR_API_KEY
```

**What it does:**
- Searches FreeSoundAPI for high-quality, properly licensed audio files that match our requirements
- Downloads the best-rated results for each sound type
- Places all files in the `public/sounds/` directory with the correct names

**Important Notes:**
- Requires a FreeSoundAPI key (get one at https://freesound.org/apiv2/apply/)
- Downloads actual audio content (not just placeholders)
- Searches for appropriate binaural beats for brainwave entrainment
- Checks audio file duration and quality before downloading
- Downloaded files are licensed for personal use only

**Audio files downloaded:**
- Ambient sounds: white noise, rain, cafe, nature, brown noise (with duration filters)
- Brainwave files: alpha, beta, theta, delta, gamma (searching for actual binaural beats)
- Other: bell sound for timer (short duration)

### `download-sample-sounds.js`

Downloads sample audio files for the Focus Mode feature.

**Usage:**
```bash
node scripts/download-sample-sounds.js
```

**What it does:**
- Attempts to download audio samples for testing the ambient sounds feature
- Attempts to download placeholder audio files for the brainwaves feature
- Places all files in the `public/sounds/` directory

**Important Notes:**
- This script may encounter download restrictions depending on the environment
- The `create-sample-sounds.js` script is the recommended alternative
- The brainwave audio files are NOT actual binaural beats - they are just placeholders
- For proper use, consider replacing with appropriate audio files

**Audio files downloaded:**
- Ambient sounds: white noise, rain, cafe, nature, brown noise
- Brainwave placeholders: alpha, beta, theta, delta, gamma
- Other: bell sound for timer

## Technical Details

The scripts use Node.js built-in modules:
- `fs` for file system operations
- `https` for downloading files (download-sample-sounds.js and fetch-real-sounds.js only)
- `path` for handling file paths

No external dependencies are required to run these scripts. 
#!/bin/bash

# Script to trim all sound files in the public/sounds directory to 10 minutes
# Excluding notification sounds

# Determine script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOUNDS_DIR="$PROJECT_ROOT/public/sounds"
OUTPUT_DIR="$SOUNDS_DIR/trimmed"
DURATION="600" # 10 minutes in seconds

echo "Sound Trimmer for Focus Mode"
echo "======================================"
echo "This script will trim audio files to $DURATION seconds (10 minutes)"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it first."
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if sounds directory exists
if [ ! -d "$SOUNDS_DIR" ]; then
    echo "Error: Sounds directory not found at $SOUNDS_DIR"
    echo "Please run download-sounds.sh or fetch-real-sounds.js first"
    exit 1
fi

# Count MP3 files
MP3_COUNT=$(find "$SOUNDS_DIR" -maxdepth 1 -name "*.mp3" | wc -l)
if [ "$MP3_COUNT" -eq 0 ]; then
    echo "Error: No MP3 files found in $SOUNDS_DIR"
    echo "Please run download-sounds.sh or fetch-real-sounds.js first"
    exit 1
fi

echo "Found $MP3_COUNT MP3 files to process"

# Process each MP3 file
for file in "$SOUNDS_DIR"/*.mp3; do
    filename=$(basename "$file")
    
    # Skip notification sounds
    if [[ "$filename" == *"notification"* ]] || [[ "$filename" == *"bell"* ]]; then
        echo "Skipping $filename (notification sound)"
        continue
    fi
    
    echo "Processing $filename..."
    
    # Trim the file to 10 minutes
    ffmpeg -i "$file" -t "$DURATION" -c copy "$OUTPUT_DIR/$filename" -y 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to trim $filename"
        continue
    fi
    
    # Check if output file exists and has content
    if [ ! -f "$OUTPUT_DIR/$filename" ] || [ ! -s "$OUTPUT_DIR/$filename" ]; then
        echo "Error: Trimming $filename failed or produced an empty file"
        continue
    fi
    
    echo "Successfully trimmed $filename"
done

echo "Trimming complete. Trimmed files are in $OUTPUT_DIR"
echo "Moving trimmed files to replace the originals..."

# Move trimmed files to replace originals
for file in "$OUTPUT_DIR"/*.mp3; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Move the trimmed file to replace the original
        mv "$file" "$SOUNDS_DIR/$filename"
        
        echo "Replaced $filename"
    fi
done

# Remove temporary directory if it's empty
if [ -d "$OUTPUT_DIR" ] && [ -z "$(ls -A "$OUTPUT_DIR")" ]; then
    rmdir "$OUTPUT_DIR"
    echo "Removed temporary directory"
else
    echo "Warning: Some files could not be processed. Check $OUTPUT_DIR"
fi

echo "All sound files have been trimmed to 10 minutes." 
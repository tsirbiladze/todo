#!/bin/bash

# Script to trim all sound files in the public/sounds directory to 10 minutes
# Excluding notification-soft.mp3

SOUNDS_DIR="public/sounds"
OUTPUT_DIR="public/sounds/trimmed"
DURATION="600" # 10 minutes in seconds

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Process each MP3 file
for file in "$SOUNDS_DIR"/*.mp3; do
  filename=$(basename "$file")
  
  # Skip notification-soft.mp3
  if [ "$filename" = "notification-soft.mp3" ]; then
    echo "Skipping $filename"
    continue
  fi
  
  echo "Processing $filename..."
  
  # Trim the file to 10 minutes
  ffmpeg -i "$file" -t "$DURATION" -c copy "$OUTPUT_DIR/$filename" -y
done

echo "Trimming complete. Trimmed files are in $OUTPUT_DIR"
echo "Moving trimmed files to replace the originals..."

# Move trimmed files to replace originals
for file in "$OUTPUT_DIR"/*.mp3; do
  filename=$(basename "$file")
  
  # Move the trimmed file to replace the original
  mv "$file" "$SOUNDS_DIR/$filename"
  
  echo "Replaced $filename"
done

# Remove temporary directory
rmdir "$OUTPUT_DIR"

echo "All sound files have been trimmed to 10 minutes." 
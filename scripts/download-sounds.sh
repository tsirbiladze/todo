#!/bin/bash
echo "!!! WARNING - DEVELOPMENT USE ONLY !!!"
echo "This script is for development purposes only."
echo "Do NOT distribute these audio files with any production app!"
echo "For production, use scripts/fetch-real-sounds.js with proper licensing."
echo ""
echo "Focus Mode Sound Downloader"
echo "======================================"

# Determine script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOUNDS_DIR="$PROJECT_ROOT/public/sounds"

# Create sounds directory if it doesn't exist
mkdir -p "$SOUNDS_DIR"

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "yt-dlp is not installed. Please install it first:"
    echo "pip install yt-dlp"
    exit 1
fi

# Function to download sound with error handling
download_sound() {
    local name="$1"
    local url="$2"
    local output="$SOUNDS_DIR/$name"
    
    echo "Downloading $name..."
    yt-dlp -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:10:00" -o "$output" "$url"
    
    if [ $? -ne 0 ]; then
        echo "Failed to download $name"
        return 1
    fi
    
    # Check if file exists and has content
    if [ ! -f "$output" ] || [ ! -s "$output" ]; then
        echo "Download of $name failed or produced an empty file"
        return 1
    fi
    
    echo "Successfully downloaded $name"
    return 0
}

# Creative Commons sources - still use with caution
SOUNDS=(
    "white-noise.mp3|https://www.youtube.com/watch?v=aXNzUc2Ib0A"
    "rain.mp3|https://www.youtube.com/watch?v=at7Wh_AJ5_A"
    "cafe.mp3|https://www.youtube.com/watch?v=MMBh-JLGgIU"
    "nature.mp3|https://www.youtube.com/watch?v=TYXQbLFYr2c"
    "brown-noise.mp3|https://www.youtube.com/watch?v=RqzGzwTY-6w"
)

# Binaural beats - use with extreme caution, consider creating your own
BRAINWAVES=(
    "alpha-waves.mp3|https://www.youtube.com/watch?v=WPni755-Krg"
    "beta-waves.mp3|https://www.youtube.com/watch?v=KjgYCUMnf1E"
    "theta-waves.mp3|https://www.youtube.com/watch?v=dGcbEGksyqM"
    "delta-waves.mp3|https://www.youtube.com/watch?v=xQ6xgDI7Whc"
    "gamma-waves.mp3|https://www.youtube.com/watch?v=lmjy_NI8EQ0"
)

# Notification sound
NOTIFICATIONS=(
    "bell.mp3|https://www.youtube.com/watch?v=V3D1H3JKEew"
)

echo "Downloading ambient sounds..."
for sound in "${SOUNDS[@]}"; do
    IFS="|" read -r name url <<< "$sound"
    download_sound "$name" "$url"
done

echo "Downloading brainwave entrainment sounds..."
for sound in "${BRAINWAVES[@]}"; do
    IFS="|" read -r name url <<< "$sound"
    download_sound "$name" "$url"
done

echo "Downloading notification sounds..."
for sound in "${NOTIFICATIONS[@]}"; do
    IFS="|" read -r name url <<< "$sound"
    download_sound "$name" "$url"
done

echo ""
echo "Download complete!"
echo "Check the $SOUNDS_DIR directory for the downloaded files."
echo ""
echo "IMPORTANT REMINDER: These files are for development purposes only."
echo "For production, use free-to-use sounds from Freesound.org or similar sources with proper licensing."
echo "Run scripts/fetch-real-sounds.js with your FreeSoundAPI key for production use."

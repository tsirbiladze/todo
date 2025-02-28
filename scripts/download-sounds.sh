#!/bin/bash
echo "YouTube Sound Downloader for Focus Mode"
echo "======================================"

echo "Downloading white-noise.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/white-noise.mp3" "https://www.youtube.com/watch?v=nMfPqeZjc2c"
if [ $? -ne 0 ]; then
  echo "Failed to download white-noise.mp3"
fi

echo "Downloading rain.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/rain.mp3" "https://www.youtube.com/watch?v=q76bMs-NwRk"
if [ $? -ne 0 ]; then
  echo "Failed to download rain.mp3"
fi

echo "Downloading cafe.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/cafe.mp3" "https://www.youtube.com/watch?v=uiMXGIG_DQo"
if [ $? -ne 0 ]; then
  echo "Failed to download cafe.mp3"
fi

echo "Downloading nature.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/nature.mp3" "https://www.youtube.com/watch?v=eKFTSSKCzWA"
if [ $? -ne 0 ]; then
  echo "Failed to download nature.mp3"
fi

echo "Downloading brown-noise.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/brown-noise.mp3" "https://www.youtube.com/watch?v=0GDfOAuUvQ0"
if [ $? -ne 0 ]; then
  echo "Failed to download brown-noise.mp3"
fi

echo "Downloading alpha-waves.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/alpha-waves.mp3" "https://www.youtube.com/watch?v=GEgSBuYlSoA"
if [ $? -ne 0 ]; then
  echo "Failed to download alpha-waves.mp3"
fi

echo "Downloading beta-waves.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/beta-waves.mp3" "https://www.youtube.com/watch?v=YWIhyOWxKPw"
if [ $? -ne 0 ]; then
  echo "Failed to download beta-waves.mp3"
fi

echo "Downloading theta-waves.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/theta-waves.mp3" "https://www.youtube.com/watch?v=KcU6w1Pr5gc"
if [ $? -ne 0 ]; then
  echo "Failed to download theta-waves.mp3"
fi

echo "Downloading delta-waves.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/delta-waves.mp3" "https://www.youtube.com/watch?v=njHvGxZgTPk"
if [ $? -ne 0 ]; then
  echo "Failed to download delta-waves.mp3"
fi

echo "Downloading gamma-waves.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/gamma-waves.mp3" "https://www.youtube.com/watch?v=vLEek3I3wac"
if [ $? -ne 0 ]; then
  echo "Failed to download gamma-waves.mp3"
fi

echo "Downloading bell.mp3..."
youtube-dl -x --audio-format mp3 --audio-quality 128K --postprocessor-args "-ss 00:00:00 -to 00:30:00" -o "/home/remedios/Documents/Projects/todo/public/sounds/bell.mp3" "https://www.youtube.com/watch?v=keoC-poCEwA"
if [ $? -ne 0 ]; then
  echo "Failed to download bell.mp3"
fi

echo ""
echo "Download complete!"
echo "Check the public/sounds directory for the downloaded files."

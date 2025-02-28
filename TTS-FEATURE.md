# Text-to-Speech Feature for Focus Coach

This document explains how to set up and use the new text-to-speech (TTS) feature in the ADHD-Friendly Todo App's Focus Coach.

## Overview

The Focus Coach now includes a text-to-speech feature that can read reminders and messages aloud. This feature uses OpenAI's TTS API to generate natural-sounding speech, providing an additional modality for receiving reminders during focus sessions.

## Features

- **Voice Toggle**: Enable or disable the TTS feature with a single click
- **Voice Selection**: Choose from 6 different voices (Nova, Alloy, Echo, Fable, Onyx, Shimmer)
- **Manual Speaking**: Click the "Speak" button to have the current message read aloud
- **Auto-Speaking**: When enabled, messages are automatically read aloud when they appear
- **Stop Button**: Easily stop speech playback at any time

## Setup

To use the TTS feature, you need to set up an OpenAI API key:

1. Sign up for an OpenAI account at [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Generate an API key at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Create a `.env.local` file in the root of the project (or copy from `.env.example`)
4. Add your OpenAI API key to the `.env.local` file:
   ```
   OPENAI_API_KEY="your-openai-api-key"
   ```
5. Restart the development server

## Usage

1. Navigate to the Focus Mode page
2. The Focus Coach appears in the left column
3. Click the microphone icon to enable text-to-speech
4. Use the "Voice settings" link to select your preferred voice
5. Messages will be read aloud automatically, or you can click the "Speak" button

## Technical Implementation

The TTS feature consists of several components:

- **TTSService**: A client-side service that manages TTS requests and audio playback
- **TTS API Endpoint**: A server-side API route that securely communicates with OpenAI's API
- **UI Components**: Buttons and settings for controlling the TTS feature

The implementation uses data URLs to avoid storing audio files on the server, and includes caching to minimize API calls for repeated messages.

## Limitations

- The OpenAI TTS API requires an API key and has usage limits
- Initial audio playback may require user interaction due to browser autoplay policies
- Audio quality depends on the user's internet connection

## Troubleshooting

If you encounter issues with the TTS feature:

1. Check that your OpenAI API key is correctly set in the `.env.local` file
2. Ensure you have sufficient credits in your OpenAI account
3. Try clicking anywhere on the page before enabling TTS (to satisfy browser autoplay policies)
4. Check the browser console for any error messages

## Future Improvements

Planned enhancements for the TTS feature:

- Voice speed adjustment
- Volume control specific to TTS
- Offline TTS fallback using browser's built-in speech synthesis
- More customization options for voice characteristics 
# ADHD-Friendly Todo App

A sophisticated task management application specifically designed for individuals with ADHD. This app combines best practices in productivity, cognitive support, and mental health awareness to create a powerful, user-friendly solution.

## Features

- **Hierarchical Task Organization**: Projects > Goals > Tasks > Subtasks
- **Smart Task Management**: Flexible categorization, priority levels, and due dates
- **Focus Mode**: Minimize distractions while working on tasks
  - **Pomodoro Timer**: Built-in time management technique for improved focus
  - **Ambient Sounds**: Background noises to mask distractions (white noise, rain, cafe, etc.)
  - **Brainwave Entrainment**: Audio frequencies designed to enhance specific mental states (alpha, beta, theta, etc.)
- **Visual Task Organization**: Color-coded categories and priority levels
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, HeadlessUI
- **State Management**: Zustand
- **Database**: SQLite (via Prisma)
- **API**: Next.js API Routes

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Quick Setup

For a complete setup, you can use the setup script which will install dependencies, set up the database, and create placeholder audio files:

```bash
npm run setup
```

This is equivalent to running the following commands in sequence:
```bash
npm install
npx prisma generate
npx prisma db push
npm run create-sounds
```

### Manual Installation

If you prefer to set up steps manually:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd todo
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up the database:
   ```bash
   npx prisma db push
   ```

4. Create placeholder audio files for Focus Mode:
   ```bash
   npm run create-sounds
   # or directly
   node scripts/create-sample-sounds.js
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run create-sounds` - Create placeholder audio files for Focus Mode
- `npm run fetch-sounds YOUR_API_KEY` - Download real audio files from FreeSoundAPI
- `npm run setup` - Complete setup (install, db setup, create sounds)

## Development

### Database Schema

The application uses Prisma as the ORM with the following main models:
- User
- Project
- Goal
- Task
- Category
- FocusSession

### Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   └── page.tsx     # Main page
├── components/       # React components
├── lib/             # Utilities and configurations
└── styles/          # Global styles
scripts/             # Utility scripts
├── create-sample-sounds.js  # Script to create placeholder audio files for Focus Mode
├── fetch-real-sounds.js     # Script to download real audio files from FreeSoundAPI
├── download-sample-sounds.js  # Script to download audio files for Focus Mode
public/
└── sounds/          # Directory for Focus Mode audio files
```

### Key Components

- `Task.tsx`: Individual task display with completion toggle
- `TaskList.tsx`: List of tasks with filtering capabilities
- `AddTaskForm.tsx`: Form for creating new tasks
- `FocusMode.tsx`: Focus environment with Pomodoro timer, ambient sounds, and brainwaves
- `store.ts`: Global state management with Zustand

## Audio Files for Focus Mode

The Focus Mode feature requires audio files to be placed in the `public/sounds/` directory:

1. **Option 1**: Run the placeholder creation script:
   ```bash
   npm run create-sounds
   ```
   This creates empty MP3 files as placeholders. You'll need to replace them with actual audio content.

2. **Option 2**: Download real audio files using FreeSoundAPI:
   ```bash
   npm run fetch-sounds YOUR_API_KEY
   ```
   Get your API key by registering at https://freesound.org/apiv2/apply/

   This downloads high-quality, properly licensed audio files for all required sounds.

3. **Option 3**: Try the download script (may not work in all environments):
   ```bash
   node scripts/download-sample-sounds.js
   ```

4. **Option 4**: Add your own audio files as described in the `public/sounds/README.txt` file

Note: The placeholder audio files are just that - placeholders. For proper functionality, replace them with actual audio content from sources mentioned in the README.txt file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by ADHD management best practices
- Built with modern web technologies
- Designed for accessibility and ease of use

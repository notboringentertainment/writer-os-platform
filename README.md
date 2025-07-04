# AuthenticVoice Platform

A personalized AI-powered screenwriting platform that helps writers develop their unique creative voice through assessments, story structuring tools, and collaborative writing features.

## Features

- **Voice Assessment**: Free and Pro assessments to understand your creative voice
- **Story Structure**: Interactive beat sheets for 8+ famous screenplay frameworks
- **Character Builder**: Deep character development tools with psychology profiles
- **Story Bible**: Comprehensive world-building and series management
- **Writers Room**: AI-powered brainstorming and collaboration space
- **Screenplay Editor**: Professional formatting with AI assistance

## Tech Stack

- **Frontend**: Next.js 15.3.4, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenRouter API (Claude, GPT-4, Gemini)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/authenticvoice-platform.git
cd authenticvoice-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
- Get Supabase credentials from your project settings
- Get OpenRouter API key from https://openrouter.ai/

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── api/          # API routes
│   ├── assessment/   # Assessment flows
│   ├── writing/      # Writing tools
│   └── ...
├── components/       # Reusable components
├── contexts/         # React contexts
├── services/         # External services
└── utils/           # Utility functions
```

## Key Features

### Assessment System
- Free assessment for new users
- Comprehensive pro assessment with multi-AI analysis
- Personalized AI writing partner calibration

### Story Structure Tool
- 8 screenplay frameworks (Save the Cat, Hero's Journey, etc.)
- Visual timeline and list views
- Click-to-load movie examples
- Progress tracking and export

### Character Builder
- Deep psychological profiling
- Relationship mapping
- Character arc tracking
- Conflict matrices

### Writing Tools
- Story Bible for world-building
- Synopsis generator
- Outline creator
- Screenplay formatter

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Blake Snyder for Save the Cat methodology
- Christopher Vogler for The Hero's Journey
- All the screenwriting theorists whose frameworks are included
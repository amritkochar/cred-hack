# CA Uncle Bot - Voice-First Financial Advisor

A modern, sleek, voice-first financial advisor bot built with Next.js and OpenAI's Realtime API. This application allows users to have natural voice conversations with a financial advisor AI that can help them make better money decisions.

## Features

- **Voice-First Interaction**: Start talking with the CA Uncle Bot using your microphone
- **Push-to-Talk Mode**: For noisy environments, enable push-to-talk mode
- **Financial Tools**: The bot can calculate compound interest, loan payments, and more
- **Modern UI**: Clean, minimal design inspired by CRED
- **Mobile-First**: Responsive design that works well on all devices

## Getting Started

### Prerequisites

- Node.js 18.x or later
- An OpenAI API key with access to the Realtime API

### Installation

1. Clone the repository (if you haven't already)

2. Navigate to the project directory
```bash
cd frontend
```

3. Install dependencies
```bash
npm install
```

4. Create a `.env.local` file based on the example
```bash
cp .env.local.example .env.local
```

5. Add your OpenAI API key to the `.env.local` file
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Click the "Connect" button to establish a connection with the Realtime API
2. Allow microphone access when prompted
3. Start speaking with CA Uncle Bot
4. For noisy environments, toggle "Push to Talk Mode" and use the microphone button

## Architecture

- **Next.js**: React framework for the frontend
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling
- **WebRTC**: For real-time audio communication
- **OpenAI Realtime API**: For voice-based AI interactions

## Project Structure

- `/src/app`: Next.js app router pages and API routes
- `/src/components`: React components
- `/src/contexts`: React context providers
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility functions
- `/src/types`: TypeScript type definitions
- `/src/config`: Application configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

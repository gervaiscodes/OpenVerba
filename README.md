# OpenVerba

**OpenVerba** is a language-learning application that helps you learn new languages through text translation, word-by-word breakdowns and audio pronunciation.

## Features

- 📝 **Text Translation**: Translate texts between multiple languages
- 🔤 **Word-by-Word Breakdown**: See individual word translations and their meanings
- 🤖 **AI Text Generation**: Generate new texts based on your known vocabulary
- 🔊 **Audio Pronunciation**: Listen to sentences and words with natural-sounding voices
- 📊 **Word Tracking**: Track word frequency and usage across all your texts
- 💾 **Persistent Storage**: All translations and audio files are saved locally

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Polish (pl)
- Dutch (nl)

## Prerequisites

- Docker and Docker Compose (for Docker setup)
- Node.js 20+ (for local development)
- OpenAI API key
- AWS credentials (for Polly text-to-speech)

## Environment Variables

The application requires environment variables to be configured:

### Backend Environment Variables

Configure these in `backend/.env`:

| Variable                | Description                                  | Example     |
| ----------------------- | -------------------------------------------- | ----------- |
| `OPENAI_API_KEY`        | Your OpenAI API key for translation services | `sk-...`    |
| `AWS_REGION`            | AWS region for Polly service                 | `us-east-1` |
| `AWS_ACCESS_KEY_ID`     | AWS access key ID for Polly                  | `AKIA...`   |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key for Polly              | `...`       |

### Frontend Environment Variables

Configure these in `frontend/.env`:

| Variable       | Description     | Required | Example                 |
| -------------- | --------------- | -------- | ----------------------- |
| `VITE_API_URL` | Backend API URL | Yes      | `http://localhost:3000` |

**Note:** The frontend needs to know where the backend API is running. Set this to match your backend URL.


### Getting API Keys

**OpenAI API Key:**

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again)

**AWS Credentials:**

1. Visit [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM user or use existing one
3. Attach the `AmazonPollyFullAccess` policy
4. Create access keys for the user
5. Copy the Access Key ID and Secret Access Key

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone <repository-url>
cd OpenVerba
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the .env file with your actual credentials
nano backend/.env
```

### 3. Start the Application

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at:

- **Frontend:** <http://localhost>
- **Backend API:** <http://localhost:3000>

### Data Persistence

Docker volumes are configured to persist:

- **Database:** `backend/database.db` - All translations and word data
- **Audio Files:** `backend/public/audio/` - Generated pronunciation files

These files will persist even if you restart or recreate the Docker containers.


## Local Development Setup

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# (Default value http://localhost:3000 should work for local development)

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```


## Testing

Both the frontend and backend include test suites using [Vitest](https://vitest.dev/).

### Frontend Tests

The frontend includes specs for React components and utilities.

```bash
cd frontend

# Run all tests once
yarn test --run

# Run tests in watch mode (re-runs on file changes)
yarn test

# Run a specific test file
yarn test --run Words.spec.tsx

# Run tests with coverage
yarn test --run --coverage
```

**Test Files Location:** `frontend/src/**/*.spec.tsx`

**Available Specs:**
- `Submit.spec.tsx` - Submit form component tests
- `Text.spec.tsx` - Text display component tests
- `Words.spec.tsx` - Words list component tests

### Backend Tests

The backend includes specs for core library functions, services, and controllers. Tests run against an isolated in-memory SQLite database.

```bash
cd backend

# Run all tests once
yarn test --run

# Run tests in watch mode
yarn test

# Run a specific test file
yarn test --run translate.spec.ts

# Run tests with coverage
yarn test --run --coverage
```

**Test Files Location:** `backend/lib/**/*.spec.ts`

**Available Specs:**
- `translate.spec.ts` - Translation logic tests
- `generate.spec.ts` - AI text generation tests
- `audio.spec.ts` - Audio generation tests

### Test Configuration

Both projects use:
- **Test Framework:** Vitest
- **Test Environment:** jsdom (frontend), node (backend)
- **Database (Backend):** In-memory SQLite (`better-sqlite3`) for isolated integration tests
- **Mocking:** Vitest's built-in `vi` mocking utilities

### Writing New Tests

When adding new features, follow these patterns:

**Frontend Component Tests:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**Backend Function Tests:**
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('yourFunction', () => {
  it('returns expected result', () => {
    const result = yourFunction();
    expect(result).toBe(expectedValue);
  });
});
```



## Project Structure

```
OpenVerba/
├── backend/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── lib/            # Shared utilities (translation, audio)
│   ├── public/         # Static assets (audio files)
│   ├── index.ts        # Main server entry point
│   ├── database.db     # SQLite database
│   ├── Dockerfile
│   └── .env            # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route components
│   │   ├── context/    # React Context providers
│   │   ├── config/     # Configuration files
│   │   ├── utils/      # Utility functions
│   │   ├── App.tsx     # Main App component
│   │   └── main.tsx    # Entry point
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## API Endpoints

### POST `/api/texts`
Create a new translation

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "source_language": "en",
  "target_language": "es"
}
```

### GET `/api/texts`
Get all translations

### GET `/api/texts/:id`
Get a specific translation by ID

### DELETE `/api/texts/:id`
Delete a translation

### POST `/api/generate`
Generate a new text based on known words

**Request Body:**
```json
{
  "source_language": "es",
  "target_language": "en",
  "topic": "travel"
}
```

### GET `/api/words`
Get all words grouped by language with frequency counts

## Database Schema

The application uses SQLite with the following tables:

- **texts**: Stores original texts and metadata
- **sentences**: Stores translated sentences
- **words**: Stores unique word translations
- **sentence_words**: Links words to sentences

## Technology Stack

### Backend
- **Fastify**: Fast and low overhead web framework
- **TypeScript**: Type-safe JavaScript
- **better-sqlite3**: SQLite database
- **OpenAI API**: GPT-4 for translations
- **AWS Polly**: Neural text-to-speech

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool
- **TailwindCSS v4**: Utility-first CSS
- **React Router**: Client-side routing
- **Lucide React**: Icon set

## Troubleshooting

### Docker Issues

**Containers won't start:**
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose up --build
```

**Database or audio files not persisting:**
- Ensure the volume mounts in `docker-compose.yml` are correct
- Check file permissions on the host machine

### API Issues

**Translation fails:**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has credits
- Review backend logs: `docker-compose logs backend`

**Audio generation fails:**
- Verify AWS credentials are correct
- Ensure IAM user has Polly permissions
- Check AWS region is supported
- Review backend logs for specific errors

### Development Issues

**Port already in use:**
```bash
# Change ports in docker-compose.yml or stop conflicting services
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
lsof -ti:80 | xargs kill -9    # Kill process on port 80
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

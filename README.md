# OpenVerba

**OpenVerba** is a language-learning application that helps you learn new languages through text translation, word-by-word breakdowns and audio pronunciation.

## Features

- 👤 **User Accounts**: Secure signup and login with JWT authentication
- 📝 **Text Translation**: Translate texts between multiple languages
- 🔤 **Word-by-Word Breakdown**: See individual word translations and their meanings
- 🤖 **AI Text Generation**: Generate new texts based on your known vocabulary
- 🔊 **Audio Pronunciation**: Listen to sentences and words with natural-sounding voices (generated asynchronously in the background)
- 📊 **Word Tracking**: Track word frequency and usage across all your texts, with separate counts for writing and speaking practice
- ✏️ **Cloze Completion Practice**: Practice vocabulary with interactive cloze exercises where you complete words by typing missing letters
- 🎤 **Pronunciation Practice**: Practice speaking with real-time speech recognition and accuracy scoring
- 🔥 **Streak Tracking**: Track your daily practice streak to stay motivated with live updates (click the streak counter to view detailed statistics)
- 📈 **Practice Statistics**: View completion trends with a visual graph showing your practice activity over the last 30 days
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

| Variable                | Description                                  | Example                    |
| ----------------------- | -------------------------------------------- | -------------------------- |
| `OPENAI_API_KEY`        | Your OpenAI API key for translation services | `sk-...`                   |
| `AWS_REGION`            | AWS region for Polly service                 | `us-east-1`                |
| `AWS_ACCESS_KEY_ID`     | AWS access key ID for Polly                  | `AKIA...`                  |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key for Polly              | `...`                      |
| `COOKIE_SECRET`         | Secret key for JWT cookie encryption         | `random-secret-key-change` |

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

- **Frontend:** <http://localhost:5173>
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
yarn install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run in development mode (with hot reload)
yarn dev

# Build for production
yarn build

# Run production build
yarn start
```

### Frontend

```bash
cd frontend

# Install dependencies
yarn install

# Copy environment file
cp .env.example .env
# (Default value http://localhost:3000 should work for local development)

# Run in development mode
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
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
- `ClozeWord.spec.tsx` - Cloze word completion component tests
- `StreakCounter.spec.tsx` - Streak counter component tests
- `CompletionGraph.spec.tsx` - Completion statistics graph component tests

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

**Test Files Location:** `backend/**/*.spec.ts`

**Available Specs:**
- `lib/translate.spec.ts` - Translation logic tests
- `lib/generate.spec.ts` - AI text generation tests
- `lib/audio.spec.ts` - Audio generation tests
- `services/wordService.spec.ts` - Word service tests
- `services/completionService.spec.ts` - Completion service tests
- `controllers/completionController.spec.ts` - Completion controller tests
- `controllers/wordController.spec.ts` - Word controller tests
- `controllers/textController.spec.ts` - Text controller tests

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

## Learning Flow

Each text follows a structured 6-step learning process:

1. **Read Target**: Read the translation in your native language
2. **Listen**: Listen to the audio pronunciation while reading the translation
3. **Dual**: View both source and target languages side-by-side with word-by-word alignment
4. **Read Source**: Read the original text in the language you're learning
5. **Write**: Complete cloze exercises where you type the missing letters of each word (only the first letter is shown)
6. **Speak**: Practice pronunciation with real-time speech recognition and accuracy scoring

The Write step (step 5) uses cloze completion exercises:
- Each word displays only its first letter
- You type the remaining letters to complete the word
- Correct completions trigger a celebration animation
- Completions in this step are tracked as "writing" practice
- The streak counter (🔥) in the navigation bar updates live and shows your consecutive days of practice
- Click the streak counter to view detailed statistics and completion trends

The Speak step (step 6) uses speech recognition for pronunciation practice:
- Click the record button to start recording your pronunciation
- Speak the sentence shown on screen
- The app uses the Web Speech API to recognize your speech
- You'll receive an accuracy score comparing your pronunciation to the target text
- Correctly pronounced words are automatically tracked as "speaking" practice
- Scores above 80% are considered excellent, 50-80% are good, and below 50% need improvement

**Statistics Page:**
- Accessible by clicking the streak counter in the navigation bar
- Displays a completion trends graph showing your practice activity over the last 30 days
- Shows total completions and maximum completions per day

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

**Note:** Sets an HTTP-only cookie with JWT token for authentication.

#### POST `/api/auth/login`
Login to an existing account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Logged in successfully"
}
```

**Note:** Sets an HTTP-only cookie with JWT token for authentication.

#### POST `/api/auth/logout`
Logout from the current session

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** Clears the authentication cookie.

#### GET `/api/auth/me`
Get current user information (requires authentication)

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

### Text Endpoints

**Note:** All text endpoints require authentication.

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

**Response:**
```json
{
  "id": 1,
  "translation": { ... },
  "usage": { ... },
  "audio_status": "processing",
  "message": "Text saved successfully"
}
```

**Note:** Audio generation happens asynchronously in the background. The `audio_status` field indicates the current status:
- `pending`: Waiting to start
- `processing`: Currently generating audio files
- `completed`: All audio files ready
- `failed`: Audio generation encountered an error

### GET `/api/texts`
Get all translations

### GET `/api/texts/:id`
Get a specific translation by ID

### GET `/api/texts/:id/audio-status`
Check the audio generation status for a specific text

**Response:**
```json
{
  "audio_status": "completed"
}
```

Use this endpoint to poll for completion status after creating a new text.

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
Get all words grouped by language with frequency counts and completion counts

**Response:**
```json
{
  "en": [
    {
      "id": 1,
      "source_word": "hello",
      "target_word": "hola",
      "source_language": "en",
      "occurrence_count": 5,
      "writing_count": 2,
      "speaking_count": 1,
      "audio_url": "/audio/hello.mp3"
    }
  ]
}
```

### POST `/api/completions`
Record a word completion (used when user successfully completes a cloze exercise or pronunciation practice)

**Request Body:**
```json
{
  "word_id": 123,
  "method": "writing"  // or "speaking"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET `/api/completions/streak`
Get the current practice streak (consecutive days with completions)

**Response:**
```json
{
  "streak": 5
}
```

### GET `/api/completions/stats`
Get completion statistics grouped by date

**Response:**
```json
{
  "stats": [
    {
      "date": "2025-11-30",
      "count": 10
    },
    {
      "date": "2025-11-29",
      "count": 5
    }
  ]
}
```

## Database Schema

The application uses SQLite with the following tables:

- **texts**: Stores original texts and metadata (includes `audio_status` field to track async audio generation: 'pending', 'processing', 'completed', or 'failed')
- **sentences**: Stores translated sentences
- **words**: Stores unique word translations
- **sentence_words**: Links words to sentences
- **completions**: Tracks word completions for practice streaks (stores `word_id`, `method` ('writing' or 'speaking'), and `completed_at` timestamp)

### Database Indexes

The database includes optimized indexes for query performance:

**Foreign Key Indexes (High Priority):**
- `idx_sentences_text_id` - Optimizes sentence lookups by text
- `idx_sentence_words_sentence_id` - Optimizes word lookups by sentence
- `idx_sentence_words_word_id` - Optimizes word occurrence counts
- `idx_completions_word_id` - Optimizes completion counts

**Ordering Indexes (Medium Priority):**
- `idx_completions_completed_at` - Optimizes streak calculations
- `idx_texts_created_at` - Optimizes text list ordering

**Additional Indexes (Low Priority):**
- `idx_words_source_language` - Optimizes word grouping by language
- `idx_sentences_order_in_text` - Optimizes sentence ordering
- `idx_sentence_words_order` - Optimizes word ordering within sentences

These indexes significantly improve query performance, especially for:
- Loading text lists (50-200x faster with many texts)
- Retrieving individual texts with all sentences and words
- Calculating word occurrence counts
- Computing practice streaks

**Index Maintenance:** Indexes are automatically created on startup using the `CREATE INDEX IF NOT EXISTS` pattern for safe schema evolution.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

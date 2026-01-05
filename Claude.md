# Claude.md - Development Best Practices for OpenVerba

This file contains best practices and conventions that Claude should follow when working on this project.

## Package Management

**IMPORTANT: Always use `yarn` for package management, NOT `npm`.**

```bash
# Install dependencies
yarn install

# Add a package
yarn add <package>

# Add a dev dependency
yarn add -D <package>

# Remove a package
yarn remove <package>

# Run scripts
yarn dev
yarn build
yarn test
```

## Node.js Version

Check `.nvmrc` for the required Node.js version.

For frontend, the file is located at `frontend/.nvmrc`.

For backend, the file is located at `backend/.nvmrc`.

To use the correct version:
```bash
nvm use
```

## Project Structure

This is a monorepo with two main directories:

- `backend/` - Fastify API server (TypeScript, ES modules)
- `frontend/` - React 19 application (TypeScript, Vite, TailwindCSS v4)

### Backend Structure
```
backend/
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── lib/             # Shared utilities (translation, audio, db)
├── middleware/      # Fastify middleware (auth, etc.)
├── public/          # Static assets (audio files)
├── index.ts         # Server entry point
└── database.db      # SQLite database (not in git)
```

### Frontend Structure
```
frontend/src/
├── components/      # Reusable UI components (PascalCase)
├── pages/           # Route/page components (PascalCase)
├── context/         # React Context providers
├── config/          # Configuration files
├── utils/           # Utility functions
├── App.tsx          # Main App component
└── main.tsx         # Entry point
```

## TypeScript Configuration

### ES Modules
Both frontend and backend use ES modules (`"type": "module"`).

**Backend imports must use `.js` extensions** (even for `.ts` files):
```typescript
// Correct
import { TextController } from "./controllers/textController.js";

// Wrong
import { TextController } from "./controllers/textController";
```

### Path Aliases
Frontend uses path aliases configured in `tsconfig.json`:
```typescript
// Use @/* to reference src directory
import { Button } from "@/components/Button";
```

Backend uses relative imports (no path aliases).

## Code Style

### Prettier Configuration
The project uses Prettier with these settings (`.prettierrc`):
- Double quotes (`"`)
- 2-space indentation
- Semicolons required
- Trailing commas (ES5 style)
- 80 character line width
- Arrow function parentheses: always

**Always run formatting before committing:**
```bash
# Format all files
yarn format

# Check formatting
yarn format:check
```

### File Naming Conventions
- **React components**: PascalCase (e.g., `ClozeWord.tsx`, `SentenceAlignment.tsx`)
- **Services/Controllers**: camelCase (e.g., `wordService.ts`, `textController.ts`)
- **Utilities/Libraries**: camelCase (e.g., `translate.ts`, `audio.ts`)
- **Test files**: Same name as source + `.spec.ts` or `.spec.tsx` (e.g., `translate.spec.ts`)

### Code Organization
- Place test files alongside their source files
- Group related functionality in the same directory
- Keep controllers thin - business logic belongs in services
- Shared utilities go in `lib/` (backend) or `utils/` (frontend)

## Testing

The project uses **Vitest** for testing both frontend and backend.

### Running Tests
```bash
# Run tests in watch mode
yarn test

# Run tests once (CI mode)
yarn test --run

# Run specific test file
yarn test --run translate.spec.ts

# Run with coverage
yarn test --run --coverage
```

### Test File Patterns
- Backend tests: `**/*.spec.ts`
- Frontend tests: `**/*.spec.tsx`

### Writing Tests
Use Vitest's describe/it/expect syntax:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('functionName', () => {
  it('should do something', () => {
    const result = functionName();
    expect(result).toBe(expectedValue);
  });
});
```

For React components:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Database

- **Database**: SQLite with `better-sqlite3`
- **Location**: `backend/database.db` (not committed to git)
- **Migrations**: None - schema created on startup in `lib/db.ts`
- **Testing**: Tests use in-memory SQLite (`:memory:`)

### Key Tables
- `texts` - Translated texts with metadata
- `sentences` - Individual sentences
- `words` - Unique word translations
- `sentence_words` - Links words to sentences
- `completions` - Practice tracking
- `users` - User accounts

## API Development

### Framework: Fastify
- Type-safe request/reply handling
- Plugin-based architecture
- Built-in validation support

### Authentication
- JWT tokens stored in HTTP-only cookies
- `requireAuth` middleware for protected routes
- User ID available in `request.userId` after auth

### Controllers Pattern
```typescript
export class ControllerName {
  static async methodName(request: FastifyRequest, reply: FastifyReply) {
    // Handle request
    return { data: result };
  }
}
```

## Frontend Development

### Framework: React 19
- Use functional components with hooks
- TypeScript for all components
- React Router for navigation

### Styling: TailwindCSS v4
- Utility-first CSS
- Use `cn()` helper from `utils/cn.ts` for conditional classes
- Component variants with `class-variance-authority`

### State Management
- React Context for global state (auth, settings)
- Local state with `useState` for component state
- No Redux or external state library

## Environment Variables

### Backend (`backend/.env`)
```bash
OPENAI_API_KEY=sk-...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
COOKIE_SECRET=random-secret-key
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:3000
```

**Never commit `.env` files**. Use `.env.example` as templates.

## Development Workflow

### Starting Development Servers
```bash
# Backend (runs on port 3000)
cd backend
yarn dev

# Frontend (runs on port 5173)
cd frontend
yarn dev
```

### Before Committing
1. Run linter: `yarn lint` or `yarn lint:fix`
2. Run formatter: `yarn format`
3. Run tests: `yarn test --run`
4. Build to verify: `yarn build`

## Common Patterns

### Error Handling
- Use try/catch blocks
- Return proper HTTP status codes
- Log errors with Fastify's logger

### Async/Await
- Prefer async/await over promises
- Always handle errors in async functions
- Use `Promise.all()` for parallel operations

### Type Safety
- Define interfaces for all data structures
- Avoid `any` type
- Use TypeScript's strict mode

## Scripts

### Backend
- `yarn dev` - Development with hot reload (tsx watch)
- `yarn build` - Build TypeScript to JavaScript
- `yarn start` - Run production build
- `yarn test` - Run tests with Vitest
- `yarn lint` - Check for linting errors
- `yarn lint:fix` - Fix linting errors
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check formatting

### Frontend
- `yarn dev` - Development server (Vite)
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn test` - Run tests with Vitest
- `yarn lint` - Check for linting errors
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check formatting

## Documentation

### README.md
**IMPORTANT: Always keep the README.md up to date when making significant changes.**

Update the README when you:
- Add new features or functionality
- Add new API endpoints
- Change environment variables or configuration
- Modify the project structure
- Add new dependencies or change the tech stack
- Update setup or installation steps
- Change testing procedures

The README is the primary documentation for users and developers. Keep it accurate and comprehensive.

## Additional Notes

- Keep dependencies up to date
- Write tests for new features
- Document complex logic with comments
- Use semantic commit messages
- Don't over-engineer - keep solutions simple

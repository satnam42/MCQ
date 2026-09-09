# Punjabi Lecturer Cadre Daily MCQ Preparation Platform

A complete, production-quality **React + Node.js (Express) + Sequelize + MySQL** web application built for candidates preparing for the **Punjabi Lecturer Cadre** competitive examination.

The platform delivers a persistent daily 50-question mock test (20 Easy, 20 Medium, 10 Tough) selected intelligently from a database of authentic Punjabi MCQs written in Gurmukhi script. Candidates can track progress, practice weak topics, review detailed explanations, and review test history. Admins can manage questions, import CSV files, detect duplicates, and preview future AI-generated questions.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, TailwindCSS, Lucide Icons, Google Fonts (Noto Sans Gurmukhi).
- **Backend**: Node.js, Express.js, Sequelize ORM, MySQL 8.0, JWT Authentication, bcryptjs, Joi, Multer, csv-parser, express-rate-limit.
- **Testing**: Jest, Supertest.

---

## 2. Folder Structure

```
personal/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & JWT configuration
│   │   ├── controllers/     # Auth, Daily Quiz, Tests, Topics, Progress, Questions
│   │   ├── middleware/      # Auth (JWT & Role Guard), Error Handler
│   │   ├── models/          # Sequelize models (User, Topic, Subtopic, Question, DailyQuiz, DailyQuizQuestion, TestAttempt, TestAnswer)
│   │   ├── routes/          # Express REST API endpoints
│   │   ├── services/        # DailyQuizService, DuplicateDetectorService, QuestionImportService, QuestionGeneratorService
│   │   ├── utils/           # Normalizer, ResponseFormatter
│   │   └── validators/      # Joi input validation schemas
│   ├── seeders/             # 100+ authentic Punjabi MCQs & default users
│   ├── tests/               # Jest backend unit tests
│   ├── server.js            # Main backend entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, QuestionCard, QuestionNavigator, QuizTimer, ProgressBar, ResultSummaryModal
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Candidate & Admin pages
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 3. Environment Configuration

### Backend `.env` (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=punjabi_lecturer_db
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=punjabi_lecturer_cadre_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
DAILY_TOTAL_QUESTIONS=50
DAILY_EASY_COUNT=20
DAILY_MEDIUM_COUNT=20
DAILY_TOUGH_COUNT=10
RECENT_QUIZ_EXCLUSION_DAYS=7
```

### Frontend `.env` (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 4. Database Setup & Seeding

1. Ensure MySQL server is running.
2. Create database `punjabi_lecturer_db` if not exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS punjabi_lecturer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run backend seed command to populate 110+ Punjabi MCQs, topics, admin, and candidate accounts:
   ```bash
   cd backend
   npm run seed
   ```

---

## 5. Running the Application

### Backend Server
```bash
cd backend
npm install
npm run dev
# Server starts at http://localhost:5000
```

### Frontend Web App
```bash
cd frontend
npm install
npm run dev
# Web app starts at http://localhost:3000
```

---

## 6. Credentials for Testing

### Candidate Account
- **Email**: `candidate@punjabi.com`
- **Password**: `Candidate@12345`

### Admin Account
- **Email**: `admin@punjabi.com`
- **Password**: `Admin@12345`

---

## 7. How Daily Quiz Generation Works (`dailyQuizService.js`)

1. **Identification**: Checks today's date (`YYYY-MM-DD`).
2. **Persistence**: Queries `daily_quizzes` table. If a quiz for today's date exists, returns the persisted set of 50 questions in assigned order.
3. **Selection**: If absent for today:
   - Queries recent quizzes in past 7 days and excludes recently used `question_id`s.
   - Selects 20 Easy, 20 Medium, and 10 Tough questions from the available pool.
   - Shuffles question and option order.
   - Persists in a database transaction (`daily_quizzes` & `daily_quiz_questions`).
4. **Guarantee**: Every candidate sees the exact same daily quiz on refreshes for that date.

---

## 8. CSV Question Import & Duplicate Protection

Admins can upload CSV files containing question data:
- **Mandatory columns**: `question`, `optionA`, `optionB`, `optionC`, `optionD`, `correctOption`, `topic`.
- **Normalization**: Text is normalized by stripping punctuation and diacritics before matching.
- **Duplicate Check**: Prevents duplicate insertion via exact normalized hash matching & Levenshtein similarity check (>90%).

---

## 9. Future AI Question Integration Architecture

The system implements the **Strategy Pattern** for AI question generation (`questionGeneratorService.js`):
- `LocalQuestionGeneratorStrategy`: Active default (offline, MySQL question database).
- `OpenAIQuestionGeneratorStrategy`: Statically typed strategy interface ready for OpenAI API key injection.
- **Review Workflow**: AI-generated questions are marked as `is_verified = false` for admin review before publishing.

---

## 10. API Endpoints Reference

### Auth
- `POST /api/auth/register` - Candidate / Admin Registration
- `POST /api/auth/login` - User Login
- `GET /api/auth/me` - Current User Profile

### Daily Quiz
- `GET /api/daily-quiz` - Get Today's 50-Question Test
- `GET /api/daily-quiz/:date` - Get Quiz for Specific Date

### Tests & Attempts
- `POST /api/tests/start` - Start Test Attempt
- `POST /api/tests/:attemptId/submit` - Submit Answers & Calculate Score
- `GET /api/tests/history` - User Test Attempt History
- `GET /api/tests/:attemptId/result` - Detailed Test Result & Review

### Topics & Progress
- `GET /api/topics` - List All Topics
- `GET /api/topics/:topicId/questions` - Custom Topic Practice Questions
- `GET /api/progress` - User Progress, Score Trends & Weak Topics

### Admin Questions Management
- `GET /api/questions` - List Questions with Filters & Pagination (Admin)
- `POST /api/questions` - Create Question (Admin)
- `PUT /api/questions/:id` - Update Question (Admin)
- `DELETE /api/questions/:id` - Delete Question (Admin)
- `POST /api/questions/import` - Bulk CSV Import (Admin)
- `POST /api/questions/generate-preview` - AI Question Generator Preview (Admin)

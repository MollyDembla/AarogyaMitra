# AarogyaMitra
> **"Your Intelligent Companion for Holistic Well-Being"**

AarogyaMitra is an Agentic AI-based multimodal wellness assessment and personalized guidance platform. It provides non-diagnostic evaluations, domain-specific insights, and structured, explainable navigation through specialized health agents to support users in physical, psychological, and lifestyle recovery.

---

## 1. Project Overview & Problem Statement
Modern lifestyles have introduced multi-dimensional well-being challenges: elevated workplace stress, prolonged sitting times, irregular diet routines, and sleep disturbances. While screening tools like PHQ-9, GAD-7, and PSS-10 exist, users are often left to interpret raw scores without actionable guidance, or are routed into generic wellness content that does not consider their medical context or physical limitations.

AarogyaMitra solves this by providing a unified, privacy-first wellness profile. It calculates standardized screening scores and passes them through a central **Wellness Assessment Agent**. A **Reasoning and Decision-Making Agent** then analyzes the findings to coordinate a customized, sequential journey across specialized agents.

---

## 2. Key Features
- **Standardized Multi-Step Screening**: Validated psychological indexes (WHO-5, PSS-10, GAD-7, PHQ-9).
- **Holistic Lifestyle Tracking**: Physical activity frequency, sedentary hours, meal quality, water intake, screen duration, and sleep quality.
- **Explainable Reasoning Engine**: Rules-based routing logic that selects the next best wellness action based on scores, risk flags, and limitations.
- **Isolated Specialized Agents**:
  - **Physical Activity Agent**: Assess movements/yoga poses (designed for future TensorFlow.js / MoveNet integration).
  - **Psychological Support Agent**: Offers supportive, non-clinical wellness chats and self-reflection exercises.
  - **Recovery and Wellness Agent**: Generates tailored routines, relaxation plans, and AYUSH-oriented well-being recommendations.
  - **Professional Support Pathway**: Guides users toward medical help if safety triggers are crossed.

---

## 3. Complete Application Flow & Agentic AI Loop
The application works in a continuous closed loop:
1. **Observe**: Collect demographics, medical conditions, lifestyles, and questionnaire responses.
2. **Assess**: The Wellness Assessment Agent processes inputs to compute domain scores.
3. **Explain**: Generate a templates/paragraphs based supportive report.
4. **Reason**: The Reasoning and Decision-Making Agent runs configurable rules on scores and risks.
5. **Decide**: Determine the primary agent sequence and assign the next step.
6. **Act**: The user undergoes specialized interaction (e.g. pose analysis, chat, routine planning).
7. **Update**: Results of the interaction are written back to the User Profile.
8. **Re-evaluate**: Journey logic runs again to determine completion or the next best agent route.

```
       [ USER DATA COLLECTION ]
                  │
                  ▼
    [ WELLNESS ASSESSMENT AGENT ]
                  │ (Score & Report)
                  ▼
   [ REASONING & DECISION AGENT ]
                  │ (Routes user based on priorities)
                  ▼
         [ SPECIALIZED AGENTS ]
    ┌─────────────┼──────────────┼─────────────┐
    ▼             ▼              ▼             ▼
[Physical]   [Psychology]   [Recovery]    [Professional]
    │             │              │             │
    └─────────────┼──────────────┼─────────────┘
                  ▼
    [ UPDATE WELLNESS PROFILE ]
                  │
                  ▼
     [ RE-EVALUATE & RE-ROUTE ]
```

---

## 4. User Input Categories
- **Psychometric Assessment**: Responses and computed scores for WHO-5, PSS-10, GAD-7, and PHQ-9.
- **Lifestyle & Behavioral**: Physical activity frequency/duration, sitting hours, dietary quality, water, screen usage.
- **Personal Information**: Age, gender, height, weight, BMI, education, occupation, work pattern (hybrid, student, sedentary, shift, etc.).
- **Medical Context**: Chronic illnesses, current medications, physical limitations, allergies, and placeholder physiological indicators (pulse, blood pressure) for wearable integrations.

---

## 5. Technology Stack
The application is built on a modular **MERN** workspace:
- **Frontend**: React.js (built with Vite), Tailwind CSS, React Router.
- **Backend**: Node.js (with native ES modules), Express.js, JWT Authentication.
- **Database**: MongoDB (object mapping via Mongoose).
- **ML Stub Service**: Python FastAPI (integrated for future training/inference).

---

## 6. Folder Structure
```
aarogya-mitra/
├── client/                     # React Frontend Web App
│   ├── public/
│   ├── src/
│   │   ├── components/         # Common UI Components
│   │   ├── features/           # Modular Domain Features
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── pages/              # 14 Initial Screen Views
│   │   ├── services/           # Axios HTTP Client Integration
│   │   ├── utils/              # Helper utilities
│   │   ├── App.jsx             # Main Router Setup
│   │   ├── index.css           # Styling with Tailwind imports
│   │   └── main.jsx            # Vite DOM renderer
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── server/                     # Express Backend API Server
│   ├── src/
│   │   ├── config/             # DB & Env Configurations
│   │   ├── middleware/         # Auth, Error & Validator handlers
│   │   ├── models/             # 12 Mongoose Schemas
│   │   ├── controllers/        # Express Route Handlers
│   │   ├── routes/             # REST Route mappings
│   │   ├── rules/              # Configurable Routing rules
│   │   ├── agents/             # Isolated Agent logic modules
│   │   ├── services/           # Report generator, etc.
│   │   ├── utils/              # Scoring helpers, logging
│   │   └── index.js            # Node HTTP server launcher
│   └── package.json
│
├── ml-service/                 # FastAPI Service Stub (Python)
│   ├── app/
│   │   └── main.py             # FastAPI entry
│   └── requirements.txt
│
├── docs/                       # Architecture and API Docs
│   ├── architecture.md
│   ├── agent-flow.md
│   └── api-design.md
│
├── package.json                # Monorepo workspaces config
├── .gitignore
├── .env.example
└── README.md
```

---

## 7. Installation & Configuration

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB running locally (default: `mongodb://localhost:27017/aarogya_mitra`) or MongoDB Atlas string.
- Python 3.9+ (optional, for ML service stub)

### Environment Setup
Create a file named `.env` in the root folder, copying the variables from `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aarogya_mitra
JWT_SECRET=your_jwt_signing_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

### Install Dependencies
Run from the root directory:
```bash
# Installs workspace dependencies concurrently
npm run install:all
```

---

## 8. How to Run the Application

### 1. Launching client and server concurrently
From the root workspace folder:
```bash
npm run dev
```
This runs the frontend React app on `http://localhost:5173` and the backend server on `http://localhost:5000`.

### 2. Launching the Python ML Service Stub (Optional)
From the root folder:
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

---

## 9. API Overview

### Authentication
- `POST /api/auth/register` - Create user credentials and initialize an empty profile.
- `POST /api/auth/login` - Verify user credentials and return JWT bearer token.

### Profile
- `GET /api/profile` - Fetch demographic variables.
- `PUT /api/profile` - Update demographics & health preferences.

### Assessment & Journey
- `POST /api/assessment/start` - Creates a new draft assessment tracking progress steps.
- `PUT /api/assessment/:id/personal-info` - Update step 1 demographics.
- `PUT /api/assessment/:id/psychometric` - Save questionnaire choices & score indicators.
- `PUT /api/assessment/:id/lifestyle` - Save step 6 lifestyle inputs.
- `PUT /api/assessment/:id/medical` - Save step 7 medical history and submit.
- `POST /api/wellness/evaluate` - Triggers assessment evaluation agent, generates score + wellness category.
- `POST /api/reasoning/next-action` - Executes configurable rules on scores to choose next agent.
- `POST /api/reasoning/re-evaluate` - Complete current specialized agent, record outputs, and select next.

### Agent Actions
- `POST /api/agents/physical-activity/evaluate` - Evaluates selected body movements (such as Mountain Pose, Tree Pose).
- `POST /api/agents/psychological-support/session` - Provides supportive coping strategies, self-reflections.
- `POST /api/agents/recovery-wellness/plan` - Generates a 4-week recovery calendar, AYUSH recommendations.
- `POST /api/agents/professional-support/evaluate` - Provides crisis counseling numbers, professional navigation.

---

## 10. Database Schema Overview
The database uses 12 interconnected Mongoose collections:
1. **User**: Authentication credentials.
2. **UserProfile**: Demographics, BMI calculations, and consent details.
3. **WellnessAssessment**: Master assessment lifecycle tracking.
4. **PsychometricAssessment**: Answers & scores for WHO-5, GAD-7, PHQ-9, and PSS-10.
5. **LifestyleBehavioralInput**: Behavioral traits (sedentary time, substance use, diet).
6. **MedicalHealthProfile**: Diagnoses, limitations, medications, and future wearables biomarkers.
7. **WellnessResult**: Computed domain and wellness category results.
8. **WellnessReport**: Narrative wellness guidance paragraphs.
9. **AgentJourney**: Current navigation step, completed agents, routing logic logs.
10. **AgentResult**: Raw and structured outcomes of specialized agent workflows.
11. **Recommendation**: Targeted actions from assessments.
12. **ProgressRecord**: Historical scores for progress charts.

---

## 11. Safety & Ethical Considerations
- **Non-Diagnostic Policy**: AarogyaMitra is a wellness companion and **MUST NOT** be presented as a medical diagnosis utility.
- **Neutrality Guardrails**: Text templates are descriptive rather than diagnostic (e.g. "elevated mood symptoms" instead of "depression").
- **Clinical Escalation**: If PHQ-9 / GAD-7 scores cross severe thresholds, user routing is directed to the **Professional Support Pathway** containing helpline resources.
- **Privacy Controls**: All substance use and medical context questions are optional and stored securely.

---

## 12. Contributors
- Developed by Antigravity AI Assistant & google-deepmind.

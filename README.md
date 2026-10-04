# AarogyaMitra — Stateful Multi-Agent Wellness Platform (LangGraph Engine)

> **"Your Intelligent Companion for Holistic Well-Being"**

AarogyaMitra is a real stateful multi-agent wellness platform powered by **LangGraph** as its core orchestration framework. It translates multimodal user inputs (psychometric screening, lifestyle behavior, demographics, medical context, and real-time MoveNet posture telemetry) into an adaptive, closed-loop agentic workflow.

---

## 1. Overall Platform Architecture

```
                         USER
                          │
                          ▼
                    REACT FRONTEND (Vite, Tailwind CSS, Lucide)
                          │
                          ▼
             EXPRESS / NODE.JS API SERVER (REST APIs, Auth Middleware)
                          │
                          ▼
                 LANGGRAPH ENGINE (StateGraph Orchestrator)
                          │
                          ▼
                  SHARED GRAPH STATE (State Channels & Reducers)
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 WELLNESS             RECOVERY          PHYSICAL
 ASSESSMENT           & WELLNESS        ACTIVITY
 AGENT                AGENT             AGENT
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
                    REASSESSMENT
                          │
                          ▼
                   REASONING ROUTER
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
     PSYCHOLOGICAL              PROFESSIONAL
     SUPPORT AGENT              CARE NAVIGATION
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                   WELLNESS PLAN GENERATOR
                          │
                          ▼
                  MONGODB PERSISTENCE & ML SERVICE
```

---

## 2. Dynamic Agentic Loop

The system operates on an iterative **OBSERVE → REASON → ACT → OBSERVE → REASON → ACT** loop:

1. **OBSERVE**: Collect screening scores (WHO-5, PSS-10, GAD-7, PHQ-9), physical activity, lifestyle metrics, and medical profile.
2. **REASON (LangGraph Router)**: Evaluates the shared state, domain scores, and safety flags to dynamically choose the highest priority agent node.
3. **ACT**: The selected agent node executes (e.g. Recovery planning, MoveNet pose estimation, CBT psychoeducation chat, or Professional Care escalation).
4. **UPDATE SHARED STATE**: The agent returns a structured output patch that updates the shared state and records an `AgentExecution` entry.
5. **REASSESS**: The graph loops to the Reassessment Engine and Router to determine if further interventions are needed or if the final Wellness Plan should be synthesized.

---

## 3. Core Technologies

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
* **Backend**: Node.js (ES Modules), Express.js, JWT Authentication, Mongoose ODM.
* **Orchestration**: **LangGraph** (`@langchain/langgraph` StateGraph engine, conditional edges, checkpointing, and Human-in-the-Loop pause/resume). *No Redis / No BullMQ*.
* **Database**: MongoDB (Local or MongoDB Atlas string).
* **Machine Learning**: Python FastAPI (`domain_regressor.joblib` multi-output regressor) + TensorFlow.js MoveNet (Thunder variant, 17 keypoints).

---

## 4. LangGraph Shared State Schema

The shared graph state is governed by `StateGraph` channels and annotations (`server/src/langgraph/state.js`):

```javascript
{
  sessionId: String,
  userId: String,
  userName: String,
  assessmentData: Object,
  assessmentId: String,
  
  // Domain Scores (0-100 continuous)
  mmwbi: Number,
  riskLevel: String,
  userFacingRiskLabel: String,
  domainScores: {
    physicalHealth: Number,
    recoveryWellness: Number,
    psychologicalWellbeing: Number,
    socialWellbeing: Number,
    lifestyleBalance: Number,
    stressResilience: Number
  },
  psychometricScores: Object,
  attentionFlags: Array,
  safetyFlags: Array,
  
  // Domain Agent Outputs
  recoveryWellness: Object,
  physicalActivity: Object,
  psychologicalSupport: Object,
  careNavigation: Object,
  wellnessPlan: Object,
  
  // Graph Control & Safety
  activeAgent: String,
  completedAgents: Array,
  triggeredEvents: Array,
  detectedFlags: Array,
  highRiskDetected: Boolean,
  crisisDetected: Boolean,
  nextAction: String,
  routerDecision: Object,
  journeyStatus: String,
  
  // Human-in-the-Loop (HITL) Interruption
  requiresUserAction: Boolean,
  userActionType: String, // 'physical_activity' | 'psych_conversation'
  userActionPayload: Object,
  userActionResult: Object,
  
  // Loop Control
  iterationCount: Number,
  maxIterations: Number,
  reassessmentCount: Number,
  
  recommendations: Array,
  journeyId: String,
  error: String
}
```

---

## 5. Agent Responsibilities & Topology

1. **Wellness Assessment Agent (`wellness_assessment`)**: Computes initial Multimodal Well-Being Index (MMWBI) across 6 domains and extracts psychometric & safety flags.
2. **Reasoning & Router Agent (`reasoning_router`)**: Dynamic decision engine evaluating domain score deficits, completed agent history, and safety overrides.
3. **Recovery & Wellness Agent (`recovery_wellness`)**: Evaluates sleep hygiene, circadian rhythm, daily fatigue, and calculates Recovery Wellness Index (RWI).
4. **Physical Activity Agent (`physical_activity`)**: Evaluates physical movement & posture stability using real-time MoveNet keypoint analysis across *Savasana*, *Balasana*, and *Viparita Karani*.
5. **Psychological Support Agent (`psychological_support`)**: Provides CBT-informed psychoeducation, supportive chat, and mood reflection. Features a deterministic safety gate for crisis escalation.
6. **Professional Care Navigation Agent (`professional_care`)**: Safety-critical, deterministic pathway for urgent medical/psychiatric referral when acute risk flags are triggered.
7. **Reassessment Loop Engine (`reassessment`)**: Evaluates post-intervention state to decide whether to loop back to the router or finish.
8. **Wellness Plan Generator (`wellness_plan`)**: Terminal node synthesizing outputs into a comprehensive personal wellness plan.

---

## 6. MongoDB Data Models

* `User`: Authentication credentials.
* `UserProfile`: User demographics, BMI, work pattern, education.
* `WellnessSession`: Active LangGraph execution session, status, and serialized state snapshot.
* `AgentExecution`: Structured log of every node execution (`agentName`, `nodeName`, `status`, `inputSummary`, `outputSummary`).
* `AgentEvent`: Asynchronous event log for cross-agent signals (`CRISIS_DETECTED`, `HIGH_STRESS`, etc.).
* `WellnessPlan`: Final synthesized multi-agent wellness plan.
* `WellnessAssessment` & `WellnessResult`: Raw input responses and calculated domain scores.
* `PsychometricAssessment`: Scores & individual item answers for WHO-5, PSS-10, GAD-7, PHQ-9.
* `LifestyleBehavioralInput`: Physical activity minutes, sitting hours, diet, water intake.
* `MedicalHealthProfile`: Chronic conditions, medications, physical limitations, physiological biomarkers.
* `RecoveryProfile`: Detailed recovery metrics and RWI score log.
* `PsychSupportSession`: Psychoeducation chat history & risk classification log.
* `AgentJourney`: MongoDB navigation journey record.

---

## 7. API Endpoints Reference

### Agentic & LangGraph Orchestration
* `POST /api/agentic/start-session` — Initializes a new LangGraph wellness session.
* `GET /api/agentic/session/:sessionId` — Retrieves current active graph state.
* `POST /api/agentic/session/:sessionId/resume` — Resumes an interrupted graph step with user input.
* `GET /api/agentic/session/:sessionId/timeline` — Returns real agent execution history from MongoDB.
* `GET /api/langgraph/topology` — Returns DAG node & edge topology for visualizers.

### Physical Activity & MoveNet Telemetry
* `POST /api/physical-activity/report` — Stores MoveNet pose evaluation results and updates graph state.
* `GET /api/physical-activity/history` — Retrieves historical pose assessment sessions.

### Assessment & Journey
* `POST /api/wellness/evaluate` — Triggers Wellness Assessment Agent & LangGraph workflow.
* `GET /api/wellness/latest` — Fetches latest wellness assessment result, report, and journey.

---

## 8. Environment Variables

Create a `.env` file in the root workspace (copying from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aarogya_mitra
JWT_SECRET=your_jwt_signing_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

---

## 9. How to Run the Application

### 1. Launch Client & Server Concurrently
From the root workspace directory:
```bash
npm run dev
```
* **React Frontend**: Runs on `http://localhost:5173`
* **Express Backend**: Runs on `http://localhost:5000`

### 2. Launch Python ML Service (Optional)
From the root directory:
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

## 10. Testing Dynamic Journeys

1. **Healthy User Journey**: High domain scores $\rightarrow$ `wellness_assessment` $\rightarrow$ `reasoning_router` $\rightarrow$ `recovery_wellness` $\rightarrow$ `wellness_plan`.
2. **Elevated Stress & Poor Sleep**: Low recovery score $\rightarrow$ `recovery_wellness` $\rightarrow$ `reassessment` $\rightarrow$ `psychological_support` $\rightarrow$ `wellness_plan`.
3. **Safety Override Scenario**: Severe PHQ-9 Q9 trigger or crisis phrase in chat $\rightarrow$ Safety Gate sets `crisisDetected=true` $\rightarrow$ Immediate override to `professional_care` (Professional Care Navigation).

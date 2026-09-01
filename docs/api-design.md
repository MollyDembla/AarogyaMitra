# REST API Design Specification

## Endpoints Summary

### Auth (`/api/auth`)
- `POST /register`: Registers new user and initializes profile
- `POST /login`: Authenticates user and returns JWT token
- `GET /me`: Fetches active session user details

### Profile (`/api/profile`)
- `GET /`: Retrieves profile demographics
- `PUT /`: Updates profile demographics

### Assessment (`/api/assessment`)
- `POST /start`: Begins draft assessment
- `PUT /:id/personal-info`: Saves step 1
- `PUT /:id/psychometric`: Saves screening scores
- `PUT /:id/lifestyle`: Saves lifestyle habits
- `PUT /:id/medical`: Saves medical context & submits
- `GET /history`: Lists past completed assessments

### Wellness Agent (`/api/wellness`)
- `POST /evaluate`: Triggers central Wellness Assessment Agent
- `GET /latest`: Fetches latest score and report

### Reasoning Agent (`/api/reasoning`)
- `POST /next-action`: Evaluates rules and assigns primary agent

### Specialized Agents (`/api/agents`)
- `POST /physical-activity/evaluate`: Pose evaluation
- `POST /psychological-support/session`: Supportive conversation
- `POST /professional-support/evaluate`: Guidance resources
- `POST /recovery-wellness/plan`: Personalized recovery plan

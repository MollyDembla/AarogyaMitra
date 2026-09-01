# Agentic AI Navigation Flow

## Sequential Agent Journey Architecture

```
  [1. USER DATA INPUT] ──> Demographics, WHO-5, PSS-10, GAD-7, PHQ-9, Lifestyle, Medical
            │
            v
  [2. ASSESS & EVALUATE] ──> Wellness Assessment Agent computes multidimensional domain scores
            │
            v
  [3. EXPLAIN & REPORT] ──> Report Generator Service creates non-clinical narrative summary
            │
            v
  [4. REASON & DECIDE] ──> Reasoning & Decision-Making Agent applies rules to pick Next Agent
            │
            v
  [5. SPECIALIZED ACT] ──> User enters assigned Specialized Agent (Physical / Psych / Recovery / Pro)
            │
            v
  [6. UPDATE PROFILE] ──> AgentResult written to DB & AgentJourney updated
            │
            v
  [7. RE-EVALUATE] ──> Re-evaluates next best agent or journey completion
```

## Rule Priority Logic
- **Safety Triggers**: High PHQ-9 / GAD-7 flags route directly to **Professional Support Pathway**.
- **Psychological Concerns**: Moderate stress routes to **Psychological Support Agent**.
- **Movement Needs**: Inactivity without physical limits routes to **Physical Activity Agent**.
- **Routine Imbalance**: High sitting hours or sleep distress routes to **Recovery and Wellness Agent**.

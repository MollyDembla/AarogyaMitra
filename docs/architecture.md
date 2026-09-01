# AarogyaMitra — System Architecture Document

## Overview
AarogyaMitra uses a decoupled monorepo full-stack MERN architecture with an Agentic AI decision layer.

```
+-------------------------------------------------------------+
|                      Client (React + Vite)                  |
|     - 14 UI Pages (Dashboard, Assessment, Agents, Reports)  |
+------------------------------+------------------------------+
                               | REST API (Axios + JWT)
                               v
+-------------------------------------------------------------+
|                     Backend (Express + Node.js)             |
|  +--------------------+  +-------------------------------+  |
|  | Wellness Agent     |  | Reasoning & Decision Agent    |  |
|  +--------------------+  +-------------------------------+  |
|  | 4 Specialized Agents (Physical, Psychological, etc.)  |  |
+------------------------------+------------------------------+
                               | Mongoose ODM
                               v
+-------------------------------------------------------------+
|                         MongoDB Database                    |
|                12 Collections for Longitudinal Profile      |
+-------------------------------------------------------------+
```

## Modular Design Principles
1. **Isolated Agents**: Each specialized agent (Physical Activity, Psychological Support, Recovery and Wellness, Professional Support) operates independently with clear input/output JSON contracts.
2. **Central User Profile**: All assessment scores, answers, and agent interaction outcomes return to update the central user profile.
3. **Replaceable ML Models**: Central scoring functions can be seamlessly connected to external Python ML models (`ml-service`) without changing REST endpoints or frontend code.

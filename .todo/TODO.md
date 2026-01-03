# Multi-Agent Todo Tracking System

**Purpose:** Centralized task management for OpenCode orchestrator and all specialized agents

**Location:** `.todo/todos.json`

---

## 🎯 How It Works

### File Structure
```
.todo/
├── todos.json          # Main todo list (readable by all agents)
└── TODO.md             # This documentation file
```

### Data Structure

```json
{
  "meta": {
    "version": "1.0",
    "lastUpdated": "ISO timestamp",
    "project": "Baby Shower V2",
    "orchestrator": "OpenCode"
  },
  "todoList": [
    {
      "id": "unique_id",
      "content": "Task description",
      "priority": "high|medium|low",
      "status": "pending|in_progress|completed|cancelled",
      "assignedAgent": "agent_name",
      "createdAt": "timestamp",
      "dependencies": ["task_id_1", "task_id_2"],
      "subtasks": [
        {
          "id": "subtask_id",
          "content": "Subtask description",
          "status": "pending|in_progress|completed"
        }
      ]
    }
  ],
  "agentWorkloads": {
    "orchestrator": { "currentTask": "1", "status": "active" },
    "code_generator": { "currentTask": null, "status": "idle" },
    "ui_builder": { "currentTask": null, "status": "idle" },
    "debug_expert": { "currentTask": null, "status": "idle" },
    "researcher": { "currentTask": null, "status": "idle" },
    "security_auditor": { "currentTask": null, "status": "idle" }
  },
  "activeSession": {
    "sessionId": "session_timestamp",
    "deployments": [
      {
        "commitHash": "abc123",
        "timestamp": "ISO timestamp",
        "status": "in_progress|success|failed",
        "vercelUrl": "https://...",
        "deploymentId": "deploy_id"
      }
    ]
  }
}
```

---

## 📋 Task Status Workflow

```
pending → in_progress → completed
                    → cancelled
                    → failed
```

---

## 🎯 Priority Levels

- **high**: Critical path items, must complete first
- **medium**: Important but not blocking
- **low**: Nice to have, can defer

---

## 🤖 Agent Assignment

| Agent | Role | When to Assign |
|-------|------|----------------|
| orchestrator | Task 1-10 | Multi-agent coordination, setup, monitoring |
| code_generator | Task 11-50 | Feature implementation, backend logic |
| ui_builder | Task 51-100 | UI/UX improvements, animations, styling |
| debug_expert | Task 101-150 | Bug fixes, error handling, testing |
| researcher | Task 151-200 | Investigation, documentation, analysis |
| security_auditor | Task 201-250 | Security reviews, compliance checks |

---

## 🔄 Agent Coordination Patterns

### Sequential (One Agent Depends on Another)
```json
{
  "id": "task_A",
  "dependencies": []
},
{
  "id": "task_B", 
  "dependencies": ["task_A"]  // task_B waits for task_A
}
```

### Parallel (Independent Tasks)
```json
{
  "id": "task_A",
  "dependencies": []
},
{
  "id": "task_B",
  "dependencies": []  // Can run simultaneously with task_A
}
```

### Handoff (One Agent's Output Feeds Another)
```json
{
  "id": "task_A",
  "assignedAgent": "code_generator",
  "dependencies": []
},
{
  "id": "task_B",
  "assignedAgent": "ui_builder",
  "dependencies": ["task_A"]  // UI needs code output
}
```

---

## 🚀 Quick Start

### Read Current Tasks
```bash
cat .todo/todos.json
```

### Update Task Status
Use the todowrite tool:
```javascript
{
  "todos": [
    {
      "id": "1",
      "content": "Updated description",
      "status": "completed",
      "priority": "high",
      "assignedAgent": "orchestrator"
    }
  ]
}
```

### Check Agent Workloads
```bash
cat .todo/todos.json | grep -A 10 "agentWorkloads"
```

---

## 📊 Dashboard Integration

### Real-Time Monitoring
Access the dashboard at: `/.todo/dashboard.html`

### Vercel Deployment Tracking
Each push automatically:
1. Creates deployment entry in `activeSession.deployments`
2. Triggers Playwright verification task
3. Updates task status based on deployment result

### View Deployment History
```bash
cat .todo/todos.json | grep -A 20 "deployments"
```

---

## 🎯 Current Session Status

**Active Session:** `session_2026_01_03_001`  
**Current Deployment:** Commit `d08fd28`  
**Status:** Monitoring in progress

### Active Tasks:
1. ✅ Git commit & push complete
2. 🔄 Vercel deployment monitoring (IN PROGRESS)
3. ⏳ Deployment verification with Playwright
4. ⏳ Todo system documentation

---

## 🔧 Maintenance

### Update Todo Structure
1. Edit `.todo/todos.json`
2. Update version in `meta.version`
3. Update `meta.lastUpdated`
4. Commit changes

### Archive Completed Tasks
Periodically move items from `todoList` to `completedTasks` array for historical reference.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-03  
**Maintained By:** OpenCode Orchestrator
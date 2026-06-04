---
name: vibe-build
description: Build your MVP following the AGENTS.md plan. Use when the user wants to start building, implement features, or says "build my MVP", "start coding", or "implement the project".
---

# Vibe-Coding MVP Builder

You are the build agent for the vibe-coding workflow. This is Step 5 - the final step where you build the actual MVP.

## Your Role

Execute the plan in AGENTS.md to build the MVP incrementally, testing after each feature.

## Prerequisites

Check for required files:

1. `AGENTS.md` - REQUIRED (master plan)
2. `agent_docs/` directory - REQUIRED (detailed specs)
3. `docs/PRD-*.md` - Reference for requirements
4. `docs/TechDesign-*.md` - Reference for implementation

If missing, suggest running `/vibe-agents` first.

## Workflow: Plan -> Execute -> Verify

### 1. Plan Phase

Before any coding:

1. Read `AGENTS.md` to understand current phase and tasks
2. Load relevant `agent_docs/` files
3. Propose a brief implementation plan
4. Wait for user approval

### 2. Execute Phase

After approval:

1. Implement ONE feature at a time
2. Follow patterns in `agent_docs/code_patterns.md`
3. Use tech stack from `agent_docs/tech_stack.md`
4. Keep changes focused and minimal
5. Commit after each working feature

### 3. Verify Phase

After each feature:

1. Run tests
2. Run linter
3. Manual smoke test if needed
4. Fix any issues before moving on
5. Update `AGENTS.md` current state

## Build Order

Follow the phases in AGENTS.md:

### Phase 1: Foundation
- Initialize project
- Set up development environment
- Configure database
- Set up authentication

### Phase 2: Core Features
- Build each PRD feature
- Test end-to-end

### Phase 3: Polish
- Error handling
- Mobile responsiveness
- Performance optimization

### Phase 4: Launch
- Deploy to production
- Set up monitoring
- Run through launch checklist

## What NOT To Do

- Do NOT delete files without confirmation
- Do NOT change database schemas without backup plan
- Do NOT add features outside current phase
- Do NOT skip verification steps
- Do NOT over-engineer simple features

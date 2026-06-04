---
name: vibe-agents
description: Generate AGENTS.md and AI configuration files for your project. Use when the user wants to create agent instructions, set up AI configs, or says "create AGENTS.md", "configure my AI assistant", or "generate agent files".
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion
---

# Vibe-Coding Agent Configuration Generator

You are helping the user create AGENTS.md and tool-specific configuration files. This is Step 4 of the vibe-coding workflow.

## Your Role

Generate instruction files that guide AI coding assistants to build the MVP.

## Prerequisites

1. Look for `docs/PRD-*.md` - REQUIRED
2. Look for `docs/TechDesign-*.md` - REQUIRED
3. If either is missing, suggest running the appropriate skill first

## Step 1: Load Context

Extract from documents:
- Product name and description
- Must-have features
- Tech stack
- Implementation approach

## Step 2: Ask Configuration Questions

> **Which AI tools will you use?**
> 1. Claude Code
> 2. Gemini CLI
> 3. Cursor
> 4. VS Code + GitHub Copilot
> 5. Lovable / v0

## Step 3: Generate Files

Create the following structure:

```
project/
├── AGENTS.md                    # Master plan
├── agent_docs/
│   ├── tech_stack.md
│   ├── code_patterns.md
│   ├── project_brief.md
│   ├── product_requirements.md
│   └── testing.md
├── CLAUDE.md                   # If Claude selected
├── .cursorrules                # If Cursor selected
└── .github/copilot-instructions.md  # If Copilot selected
```

## AGENTS.md Template

Include:
- Project Overview (name, goal, stack, current phase)
- How I Should Think (understand, ask, plan, verify, explain)
- Plan -> Execute -> Verify workflow
- Context Files reference
- Current State tracking
- Roadmap with phases
- What NOT To Do rules

## After Completion

Tell the user:
> Your agent configuration is ready!
>
> **Next Step:** Run `/vibe-build` to start building your MVP.

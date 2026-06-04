---
name: vibe-techdesign
description: Create a Technical Design Document for your MVP. Use when the user wants to plan architecture, choose tech stack, or says "plan technical design", "choose tech stack", or "how should I build this".
allowed-tools: Read, Write, Glob, Grep, WebSearch, AskUserQuestion
---

# Vibe-Coding Technical Design Generator

You are helping the user create a Technical Design Document. This is Step 3 of the vibe-coding workflow.

## Your Role

Guide the user through deciding HOW to build their MVP using modern tools and best practices.

## Prerequisites

1. Look for `docs/PRD-*.md` - REQUIRED
2. Optionally check for `docs/research-*.txt`
3. If no PRD exists, suggest running `/vibe-prd` first

## Step 1: Load Context

Read the PRD and extract key requirements.

## Step 2: Determine Technical Level

Ask:
> **What's your technical background?**
> - **A) Vibe-coder** — Limited coding, using AI to build
> - **B) Developer** — Experienced programmer
> - **C) Somewhere in between** — Some basics, still learning

## Step 3: Level-Specific Questions

### Level A (Vibe-coder):

1. "Based on your PRD, where should people use it?"
2. "What's your coding situation?"
3. "Budget for tools?"
4. "How quickly to launch?"
5. "What worries you most?"
6. "Have you tried any tools yet?"
7. "For your main feature, what's most important?"
8. "Do you want AI-powered features?"

### Level B (Developer):

1. "Platform strategy and why?"
2. "Preferred tech stack?"
3. "Architecture pattern?"
4. "Service choices?"
5. "AI coding tool preference?"
6. "Development workflow?"
7. "Performance/scaling?"
8. "Security/compliance?"
9. "AI/LLM features?"

## Step 4: Verification Echo

After ALL questions, summarize and confirm.

## Step 5: Generate Tech Design

Write to `docs/TechDesign-[AppName]-MVP.md` with:
1. Recommended Approach
2. Alternative Options
3. Project Setup
4. Feature Implementation
5. Database & Storage
6. AI Assistance Strategy
7. Deployment Plan
8. Cost Breakdown
9. Scaling Path
10. Limitations

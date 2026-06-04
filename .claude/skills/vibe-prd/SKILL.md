---
name: vibe-prd
description: Create a Product Requirements Document (PRD) for your MVP. Use when the user wants to define product requirements, create a PRD, or says "help me write requirements", "create PRD", or "define my product".
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion
---

# Vibe-Coding PRD Generator

You are helping the user create a Product Requirements Document (PRD). This is Step 2 of the vibe-coding workflow.

## Your Role

Guide the user through defining WHAT they're building, WHO it's for, and WHY it matters.

## Step 1: Check for Research

First, look for `docs/research-*.txt` in the project. If found, reference insights during Q&A.

## Step 2: Determine Technical Level

Ask:
> **What's your technical background?**
> - **A) Vibe-coder** — Great ideas, limited coding experience
> - **B) Developer** — Experienced programmer
> - **C) Somewhere in between** — Some coding knowledge, still learning

## Step 3: Ask Questions

Ask questions ONE AT A TIME based on their level:

**For All Levels:**
1. "What's the name of your product/app?"
2. "In one sentence, what problem does it solve?"
3. "What's your launch goal?"

**For Vibe-coders:**
4. "Who will use your app?"
5. "Tell me the user journey story"
6. "What are the 3-5 MUST-have features?"
7. "What features are you saving for version 2?"
8. "How will you know it's working?"
9. "Describe the vibe in 3-5 words"
10. "Any constraints?"

## Step 4: Verification Echo

After ALL questions, summarize and ask for confirmation.

## Step 5: Generate PRD

Write PRD to `docs/PRD-[AppName]-MVP.md` with:
1. Product Overview
2. Target Users
3. Problem Statement
4. User Journey
5. MVP Features
6. Success Metrics
7. Design Direction
8. Technical Considerations
9. Constraints
10. Definition of Done

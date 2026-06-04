# Claude Code Integration for Vibe-Workflow

> 💡 **Skills and hooks for Claude Code users**  
> These files enhance Claude Code with Vibe-Coding workflow skills.

## Available Skills

| Command | Description | Time |
|---------|-------------|------|
| `/vibe-workflow` | Complete guided workflow from idea to MVP | Full |
| `/vibe-research` | Deep research and market validation | 20 min |
| `/vibe-prd` | Create Product Requirements Document | 15 min |
| `/vibe-techdesign` | Plan technical architecture | 15 min |
| `/vibe-agents` | Generate AGENTS.md and AI configs | 10 min |
| `/vibe-build` | Build your MVP following the plan | 1-3 hrs |

## Pre-configured Hooks

This includes hooks that run automatically:

### PreToolUse Hooks

**File Protection** - Blocks accidental modifications to:
- `.env` files (secrets)
- `package-lock.json` (use npm instead)
- `.git/` directory

**Destructive Command Prevention** - Blocks dangerous bash commands:
- `rm -rf /` and similar
- `DROP DATABASE`
- `TRUNCATE`

### PostToolUse Hooks

**Auto-formatting** - After file edits:
- Runs Prettier on `.ts`, `.tsx`, `.js`, `.jsx` files

### Stop Hooks

**Session Summary** - When Claude finishes:
- Shows what was accomplished
- Lists files modified
- Suggests next steps

## Quick Start

1. Copy the `.claude/` folder to your project root
2. Open Claude Code in your project
3. Type `/vibe-workflow` to start the guided process

## Customization

Edit individual skill files in `.claude/skills/[skill-name]/SKILL.md` to customize behavior.

Edit `.claude/hooks/hooks.json` to modify or disable automation hooks.

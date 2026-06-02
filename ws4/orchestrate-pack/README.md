# orchestrate-pack

Run a deterministic **Plan → Refine → Implement → Review** multi-agent pipeline from
your **Claude Code terminal** — no extra CLI, no web UI, no Node, no `claude`
subprocess. git is the only requirement.

## Install

Unzip this folder into your repo's `.claude/` so you get:

```
<your-repo>/.claude/skills/orchestrate/SKILL.md
<your-repo>/.claude/skills/orchestrate/references/models.md
<your-repo>/.claude/agents/maestro-planner.md
<your-repo>/.claude/agents/maestro-plan-refiner.md
<your-repo>/.claude/agents/maestro-implementer.md
<your-repo>/.claude/agents/maestro-code-reviewer.md
```

From the bundle root:

```bash
cp -R skills/orchestrate "<your-repo>/.claude/skills/"
cp agents/maestro-*.md   "<your-repo>/.claude/agents/"
```

(Create `<your-repo>/.claude/skills` and `<your-repo>/.claude/agents` first if absent.)

## Use

Open Claude Code in your repo and type:

```
/orchestrate add rate limiting to the public API
```

What happens:
1. **Clarify** — the planner asks up to 4 high-impact questions (3 options + free
   text); answer them inline.
2. **Plan** — a build-ready plan with real code snippets is written under
   `ai-artifacts/plans/`.
3. **Refine** — a refiner tightens the plan, looping until no critical/major issues
   (cap 5; then it asks you whether to continue).
4. **Implement** — an implementer follows the latest plan with strict TDD.
5. **Review** — a reviewer checks the `git diff`; the implementer fixes flagged
   critical/major issues, looping until clean (cap 5; then it asks you).

Artifacts (plans, reviews, audit) land under `ai-artifacts/`.

## Models

All four agents default to **Opus**. Effort is whatever your Claude Code session is
set to (use `high` or `max`). Override per run, e.g. "use sonnet for the
implementer". See `skills/orchestrate/references/models.md`.


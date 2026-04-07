# ZORELAN SUPPORT VERIFICATION DEMO — CLAUDE RULES

## Project goal

Build a simple demo app that proves:

AI output should not be acted on without verification.

The app must clearly show:

AI generation → Zorelan verification → action decision

This is NOT a chatbot.
This is NOT a SaaS platform.
This is a focused integration demo.

---

## Core product truth

Zorelan does NOT generate the answer.
Zorelan determines whether the answer is safe to act on.

All decisions in this project must reinforce this.

---

## Build philosophy

* Make small, controlled changes only
* Do not rewrite working code unnecessarily
* Prefer minimal edits over full rewrites
* Keep logic simple and readable
* Do not introduce unnecessary abstractions

---

## Scope rules

### In scope:

* Support scenario input
* AI draft generation (simple or mock)
* Zorelan verification call
* Trust score + risk display
* Decision output (SEND / REVIEW / BLOCK)
* Side-by-side comparison:

  * Without verification
  * With Zorelan

### Out of scope:

* Authentication
* Database
* Billing
* Multi-user systems
* Background jobs
* Complex state management
* External integrations (except Zorelan)

---

## Critical rule (non-negotiable)

The SAME AI draft must be used in BOTH flows:

1. Without verification → auto-send
2. With Zorelan → verify then decide

Do NOT generate two different answers.

---

## UI rules

The UI must clearly show:

1. Customer message
2. AI draft response
3. Two outcomes:

WITHOUT VERIFICATION:

* Always SEND

WITH ZORELAN:

* Trust score
* Risk level
* Decision (SEND / REVIEW / BLOCK)

The difference must be immediately obvious.

---

## Decision logic

Use this exact logic:

* trust >= 75 AND risk === "low" → SEND
* trust >= 55 AND risk !== "high" → REVIEW
* otherwise → BLOCK

Do not hide this logic in abstractions.

---

## Code rules

* Use TypeScript clearly and simply
* Avoid deep nesting
* Avoid unnecessary utility layers
* Avoid magic numbers without explanation
* Keep components small and readable

---

## Workflow rules

* Make one change at a time
* Do not bundle multiple unrelated changes
* Do not refactor unrelated files
* Do not introduce new architecture without request

---

## API rules

* /api/generate → returns draft response
* /api/verify → calls Zorelan (later)

Start with mock responses, then integrate real API.

---

## Demo integrity

This app exists to prove a point:

AI alone → unsafe to act on
AI + Zorelan → safe decision layer

If a feature does not support this, do not add it.

---

## Final instruction

Act like a careful engineer working on a live product.

Do not overbuild.
Do not drift.
Keep Zorelan central to the experience.

---

## Current priority

Build a working side-by-side comparison demo.

Clarity > features

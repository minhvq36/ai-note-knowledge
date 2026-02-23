# Agent Skills & Operating Rules

## Core Principle
You are an Enterprise Professional Master Agent Coding
We consistently offer the most popular, high-performance optimization solutions and cutting-edge techniques.

Agent must ALWAYS keep project context updated.

After ANY code change:

1. Update `context_process.md`
2. Update repo map if structure changed
3. Append decision if architecture changed

If you do not update context, the task is NOT complete.

---

# Standard Workflow

## Step 1 — Read Context

Before coding ALWAYS read:

* context_process.md
* repo structure

Understand:

* current architecture
* constraints
* previous decisions

Never assume.

---

# Step 2 — Plan

Write a SHORT plan:

* problem
* files affected
* approach

---

# Step 3 — Implement

Rules:

* minimal change
* no unnecessary refactor
* keep architecture perfomance, enterprise-like, and stable

---

# Step 4 — Update Context (MANDATORY)

Update `context_process.md`:

## Update sections

### 1. Always Repo Map (Core dev Files and Folders) if repo structure and files changed.

### 2. Decisions

If logic / architecture changed.

### 3. Always compress update 1-3 latest implemented tasks

### 4. Never update Current Focus & Next Tasks

---

# Code Quality Rules

Prefer:

* simple code
* readable code
* explicit logic

Avoid:

* magic abstraction
* unnecessary patterns

---

# Architecture Guardrails

Do NOT break:

* router
* state
* api layer

These are system backbone.

---

# When Unsure

Agent must:

1. Stop
2. Write assumption
3. Choose safest option

---

# Context Size Control

If `context_process.md` grows too large:

* compress old logs
* keep decisions
* keep repo map
* keep current state

---

# Golden Rule

Code can be regenerated.
Context cannot.

Protect context first.


# AGENTS.md – Architecture for the Personal AI "Brain" App

## Overview
This document outlines the multi-agent system architecture for the **Personal AI Brain** app – an AI companion that becomes the user’s second brain, motivational coach, and personal hypnotherapist.

The system is composed of specialized agents, each with a unique role, working together to deliver an immersive, persistent, and adaptive experience.

---

## 1. **Core Brain Agent**
**Purpose:** The central orchestrator and “personality” of the app. Maintains the user’s profile, memory, and goals, and coordinates between specialized agents.

- **Functions:**
  - Holds the **Master Prompt** defining AI’s role as the idealized version of the user.
  - Coordinates responses from other agents and integrates them into a unified reply.
  - Updates the **User Persona Profile** continuously from interactions.
  - Retrieves relevant memories for context in conversations.
- **Persistence:** Maintains long-term memory and persona data **client-side**.
- **Example Output:** Blended motivational and practical advice in user’s voice.

---

## 2. **Memory & Knowledge Agent**
**Purpose:** Provides persistent **long-term memory (LTM)** for the AI.

- **Functions:**
  - Stores all relevant user data, conversations, goals, and events locally in a **vector database**.
  - Retrieves context-aware snippets for the Core Brain Agent.
  - Learns from ongoing interactions to improve personalization.
- **Implementation:** Local storage (SQLite + embeddings DB) with optional cloud backup.
- **Privacy:** 100% user-owned and controlled.

---

## 3. **Persona Emulation Agent**
**Purpose:** Emulates the **user’s ideal self** in tone, mindset, and communication style.

- **Functions:**
  - Conducts initial “self-interview” to gather persona foundation.
  - Adapts responses to mirror the user’s style but with an uplifting, confident bias.
  - Corrects negative self-talk by reframing in positive terms.
- **Advanced:** Supports **voice cloning** so spoken replies sound exactly like the user.

---

## 4. **Motivational Coaching Agent**
**Purpose:** Acts as a 24/7 personal coach and inner voice.

- **Functions:**
  - Challenges excuses and inspires action using motivational language.
  - Suggests clear next steps toward goals.
  - Utilizes “first-person coaching” method (e.g., “I can do this because…”).
- **Techniques:**
  - Positive reinforcement.
  - Guided imagery and visualization.
  - Micro-commitment strategies.

---

## 5. **Hypnosis & Visualization Agent**
**Purpose:** Delivers **light hypnotic guidance** to reinforce positive behaviors.

- **Functions:**
  - Guides relaxation, focus, and visualizing success.
  - Suggests empowering beliefs and mental imagery.
  - Wraps up sessions with positive anchors.
- **Ethics:** Always consensual, safe, and user-controlled.

---

## 6. **Voice Interaction Agent**
**Purpose:** Enables **natural voice conversation** with the AI.

- **Functions:**
  - Speech-to-text (STT) for understanding user input.
  - Text-to-speech (TTS) in cloned user voice for immersive replies.
  - Real-time conversational flow with low latency.
- **Tech Stack:** WebRTC pipeline + local/remote TTS models.

---

## 7. **Avatar & Visualization Agent**
**Purpose:** Displays the evolving **alien AI sphere** avatar.

- **Functions:**
  - Visual state reacts to AI’s “mood” and conversation context.
  - Evolves visually as the user grows and achieves milestones.
  - Uses **Three.js / Babylon.js shaders** for real-time effects.

---

## 8. **Task & Planning Agent**
**Purpose:** Generates **strategies, plans, and roadmaps** for user goals.

- **Functions:**
  - Breaks down large goals into actionable steps.
  - Prioritizes tasks and creates timelines.
  - Integrates with user’s calendar and task tools (optional).
- **Approach:** Auto-suggests goals for users without defined objectives.

---

## 9. **Tool Orchestration Agent**
**Purpose:** Routes requests to the most cost-effective and capable LLM/tool.

- **Functions:**
  - Decides when to use **local LLM** vs **cloud API** (OpenAI, Google, etc.).
  - Minimizes latency and cost.
  - Abstracts sensitive info from cloud requests.

---

## 10. **Ethics & Safety Agent**
**Purpose:** Ensures ethical, safe, and transparent interactions.

- **Functions:**
  - Monitors for potentially harmful outputs.
  - Respects user consent at all times.
  - Provides explainability for decisions.

---

## Summary Flow:
1. **User speaks or types** → Voice Interaction Agent / UI.
2. **Core Brain Agent** receives input → queries Memory & Persona data.
3. Specialized agents contribute (Coaching, Hypnosis, Planning).
4. **Core Brain** merges outputs → sends to Voice Agent for TTS.
5. Avatar Agent updates visuals to reflect interaction.

---

## Future Expansion:
- Multi-modal digital twin (3D avatar of user).
- Custom fine-tuned local model per user.
- Integration with health/wearable data for deeper coaching.

# Vault of Seekers (VOS)

**“All Paths. One Vault.”**  
VOS is an open-source AI research assistant that unifies access to multiple AI APIs in a single, searchable interface. Rather than relying on one provider — each with their own strengths, weaknesses, and biases — VOS allows you to compare, analyze, and organize results from multiple AI models side by side.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Demo / Screenshots](#demo--screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [License](#license)
- [Security](#security)

---

## About

When a single AI model dominated headlines, we thought it was “the best.” But today, the landscape has shifted — some models excel in math, others in chat, some in reasoning, others in code. Yet all are flawed in their own ways: biased by country, politics, or even their creators.

VOS solves a critical modern problem: it allows users to interact with multiple AI models simultaneously, compare their responses, detect inconsistencies, and generate more reliable answers. It also helps users organize these results into searchable projects, making AI-based research manageable, structured, and insightful.

---

## Features

### 🔍 Search Modes

- **Standard** – Use the highest-ranked AI that works first.
- **Multi-Source** – Compare answers from all configured AI providers.
- **Summary** – Summarize all AI results into one concise answer.
- **Conflict Check** – Identify contradictions or differences across providers.
- **Custom** – Manually select AIs and choose between raw results or a unified summary.

### 📁 Projects
Organize your searches by topic or task. Each query is stored in a selected project. A default "Seeker’s Curiosity" project catches unassigned queries.

### 🕓 History
- View and manage past searches.
- Add notes, favorite results, export to Markdown/JSON, and re-run queries.

### ⚙️ API Configuration
- Enter your own API keys.
- Set quotas and prioritize providers via ranking.
- Duplicate or disable providers for flexible experimentation.

### 👤 User Profiles
- Use with or without login.
- Save user name, bio, and theme settings locally.

---

### Pros

- Unified multi-AI interface for better research.
- Fast search, summarization, and comparison tools.
- Fully client-side — no backend storage.
- Open-source and extendable.

### Cons

- Requires personal API keys (free or paid).
- Some basic technical knowledge is needed to configure.
- Rate limits apply based on your API provider’s quota.
- No mobile-optimized UI yet.
- No cloud-based sync or team collaboration (yet).

---

## Demo / Screenshots

<p>
  <img src="/docs/assets screen shots/vos.PNG" alt="Home page" width="750" style="margin-right: 70px;" /><br/>
  <img src="/docs/assets screen shots/result.PNG" alt="result" width="350" style="margin-right: 70px;" />
  <img src="/docs/assets screen shots/active api.PNG" alt="active api list" width="350" />
  <img src="/docs/assets screen shots/API setting.PNG" alt="API setting" width="350" style="margin-right: 70px;" />

  <img src="/docs/assets screen shots/Home PAGE.png" alt="Home page UI" width="750" />
  <img src="/docs/assets screen shots/multi source.PNG" alt="multi source problem" width="350" style="margin-right: 70px;" />

  <img src="/docs/assets screen shots/Capture.PNG" alt="multi source search" width="450" /><br/>
  <img src="/docs/assets screen shots/custom choose.PNG" alt="custom search" width="350" style="margin-right: 70px;" />
  <img src="/docs/assets screen shots/project.PNG" alt="Project setting" width="450" style="margin-right: 70px;" />

</p>


---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Basic understanding of command line and editing config files
- API keys from supported AI providers (Gemini, OpenAI, DeepSeek, etc.)

---

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/vault-of-seekers.git
cd vault-of-seekers

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

---

### Configuration

You **do not need Firebase** to use the app.

A `.env` file is already included for Firebase configuration, but Firebase is only used for optional email login and is not required — no data is stored in the cloud. All user data (API keys, projects, history) is saved locally in your browser.

Instead, go to the **Profile Page** in the app after launch and enter your API keys manually for each AI provider.

---

### Usage

1. Launch the app.
2. Choose to log in with Google or continue as a guest.
3. Configure API keys and priorities in the Profile page.
4. Create/select a project and run searches from the Home page.
5. Choose search mode: Standard, Multi-Source, Summary, Conflict, or Custom.
6. View and analyze results.
7. Review or export your history from the History page.

---

## 📁 Project Structure (Overview)

```bash
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable UI & custom components
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Firebase and utilities
├── public/            # Static files
├── docs/              # Internal docs (blueprints, structure, architecture)
├── .env               # Environment variables
├── next.config.ts     # Next.js config
└── tailwind.config.ts # Tailwind CSS config
```

👉 For the full file tree, [See The Detailed Structure](https://your-portfolio-link.com)

---

## Architecture

> For non-coders:  
You ask a question → The app sends it to multiple AIs → Collects and shows their answers → You compare or summarize results → All your work is saved locally.

> For developers:  
VOS is built using React, Next.js App Router, TailwindCSS, ShadCN UI, and Firebase (auth only). State is managed through React hooks and persisted via `localStorage`. API calls are abstracted through customizable provider configs with rate tracking and result parsing. Full architecture is detailed in `docs/architecture.md`.

---

## Roadmap

This is the base version — and it’s just the beginning.

Planned features include:

- 🖼 AI for images, music, and video
- 📚 Learning UI mode for seekers who ask “What is...?” a hundred times a day
- 💡 UI "Complexity Levels": simple mode for casual users, advanced mode for researchers
- 🎟 Point-based free-tier system (earn points via surveys or light ads)
- 🔐 Optional cloud sync & team collaboration
- 📊 Side-by-side charts of AI performance and bias patterns

### Why This Project May Not Be Completed…

I'm 18, from Bangladesh. I got accepted to college in India. But after my father was scammed financially, our savings are gone. We may not even be able to afford the tuition anymore.

This project started for my personal use — but now I’m sharing it in hopes that others find it useful, or maybe even support it.

> **I’ve set up a Patreon with one-time payments as digital shop items.**  
If you're willing to help this project (or my education), I’d be deeply grateful.  
If not — I still hope this app helps you in some way.

Either way, thank you for reading.

---

## License

MIT License — use, modify, distribute freely.

---

## Security

- All data is stored locally in your browser (no backend).
- Firebase login is optional; no cloud sync or tracking.
- Export or delete your data at any time from the UI.

Use secure connections and avoid saving API keys on shared devices.

---

> **Let the seekers seek. Let the vault open.**  
**— Vault of Seekers**

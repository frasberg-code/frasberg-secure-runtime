# Annual Release Cadence for Sofia Core

**Applies to:** Sofia Core, EmeraldOrbit, Emerald Estates, EWF, and SEFAA

## Table of Contents

- [Overview](#-overview)
- [Badges](#-badges)
- [Release Types](#-release-types)
- [Annual Release Gantt Chart](#-annual-release-gantt-chart)
- [Visual Calendar Layout](#️-visual-calendar-layout)
- [Contributor Windows](#-contributor-windows)
- [Contributor Workflow Process](#-contributor-workflow-process)
- [Governance Sync Points](#-governance-sync-points)
- [Mermaid Timeline View](#-mermaid-timeline-view)
- [Release Intensity Heatmap](#-release-intensity-heatmap)
- [Purpose](#-purpose)
- [Quick Reference](#-quick-reference)

## 📅 Overview

This document defines the predictable annual rhythm for patch, minor, and major releases.

This cadence ensures:
- **Stability** — Consistent, reliable release patterns
- **Contributor clarity** — Predictable windows for contributions
- **Roadmap alignment** — Synchronized with architectural milestones
- **Unified‑field coherence** — Identity-preserving evolution
- **Zero‑surprise evolution** — Planned, ceremonial change management

All dates use a **Monday‑based cadence** for maximum contributor clarity.

## 📛 Release Status Badges

Current release and cadence information at a glance:

![Current Version](https://img.shields.io/badge/Current-v1.1.x-blue)
![Next Major](https://img.shields.io/badge/Next%20Major-Q2%202026-orange)
![Days to Minor](https://img.shields.io/badge/Next%20Minor-1st%20Monday-green)

**Release Cadence:**

![Patch Release](https://img.shields.io/badge/Patch-Weekly%20Monday-blue)
![Minor Release](https://img.shields.io/badge/Minor-1st%20Monday-green)
![Major Release](https://img.shields.io/badge/Major-Quarterly-orange)
![Meta Release](https://img.shields.io/badge/Meta-December%202nd%20Monday-red)

**Contributor Window Status:**

![Window Status](https://img.shields.io/badge/Status-Active-success)
![Contributor Window](https://img.shields.io/badge/Window-Open-brightgreen)
![Freeze Status](https://img.shields.io/badge/Freeze-None-lightgrey)

> **Note:** These badges provide a quick visual reference for release timing and contributor activity windows. During freeze windows (end of quarters), the status badges will reflect restricted merge activity.

---

## 🏷️ Badges

![Release Cadence](https://img.shields.io/badge/Releases-Weekly%20%7C%20Monthly%20%7C%20Quarterly-blue?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.2-green?style=flat-square)
![Contribution Status](https://img.shields.io/badge/contributions-welcome-brightgreen?style=flat-square)
![Governance](https://img.shields.io/badge/governance-unified%20field-purple?style=flat-square)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Badges](#-badges)
- [Release Types](#-release-types)
- [Visual Calendar Layout](#️-visual-calendar-layout)
- [Annual Release Timeline (Gantt Chart)](#-annual-release-timeline-gantt-chart)
- [Contributor Workflow Process](#-contributor-workflow-process)
- [Contributor Windows](#-contributor-windows)
- [Governance Sync Points](#-governance-sync-points)
- [Mermaid Timeline View](#-mermaid-timeline-view)
- [Release Intensity Heatmap](#-release-intensity-heatmap)
- [Purpose](#-purpose)
- [Quick Reference](#-quick-reference)

---

## 🏷️ Badges

![Release Cadence](https://img.shields.io/badge/Releases-Weekly%20%7C%20Monthly%20%7C%20Quarterly-blue?style=flat-square)
![Contribution Status](https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-informational?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 🔄 Release Types

### 1. Patch Releases — Weekly

**Schedule:** Every Monday

**Purpose:**
- Bug fixes
- Stability improvements
- Documentation updates
- Small internal refinements

This keeps the field clean and responsive without disrupting larger cycles.

### 2. Minor Releases — Monthly

**Schedule:** First Monday of every month

**Purpose:**
- New features
- New identity behaviors
- Non‑breaking enhancements
- Module‑level improvements

This gives contributors a predictable window to target.

### 3. Major Releases — Quarterly

**Schedule:** First Monday of January, April, July, October

**Purpose:**
- Breaking changes
- Structural shifts
- New identity layers
- Runtime redesigns
- Architectural evolution

This aligns with roadmap phases and ensures major changes land with ceremony and preparation.

### 4. Annual Meta‑Release — December

**Schedule:** Second Monday of December

**Purpose:**
- Year‑end consolidation
- Documentation harmonization
- Deprecations
- Long‑term roadmap reset
- Unified‑field alignment review

This is the "architectural audit" moment — the field's annual reset.

---

## 📊 Annual Release Gantt Chart

This Gantt chart visualizes the complete annual release schedule, showing the relationship between different release types and key windows throughout the year:

```mermaid
gantt
    title Sofia Core Annual Release Cadence Timeline
    dateFormat YYYY-MM-DD
    axisFormat %b
    
    section Q1 Releases
    Major Release Q1 (Jan 1st Mon)    :milestone, m1, 2026-01-05, 0d
    Minor Release (Feb 1st Mon)       :milestone, m2, 2026-02-02, 0d
    Minor Release (Mar 1st Mon)       :milestone, m3, 2026-03-02, 0d
    Q1 Freeze Window                  :crit, f1, 2026-03-23, 7d
    
    section Q2 Releases
    Major Release Q2 (Apr 1st Mon)    :milestone, m4, 2026-04-06, 0d
    Minor Release (May 1st Mon)       :milestone, m5, 2026-05-04, 0d
    Minor Release (Jun 1st Mon)       :milestone, m6, 2026-06-01, 0d
    Q2 Freeze Window                  :crit, f2, 2026-06-22, 7d
    
    section Q3 Releases
    Major Release Q3 (Jul 1st Mon)    :milestone, m7, 2026-07-06, 0d
    Minor Release (Aug 1st Mon)       :milestone, m8, 2026-08-03, 0d
    Minor Release (Sep 1st Mon)       :milestone, m9, 2026-09-07, 0d
    Q3 Freeze Window                  :crit, f3, 2026-09-21, 7d
    
    section Q4 Releases
    Major Release Q4 (Oct 1st Mon)    :milestone, m10, 2026-10-05, 0d
    Minor Release (Nov 1st Mon)       :milestone, m11, 2026-11-02, 0d
    Minor Release (Dec 1st Mon)       :milestone, m12, 2026-12-07, 0d
    Annual Meta-Release (Dec 2nd Mon) :milestone, meta, 2026-12-14, 0d
    Q4 Freeze Window                  :crit, f4, 2026-12-14, 14d
    
    section Weekly Cadence
    Patch Releases (Every Monday)     :active, patches, 2026-01-05, 360d
```

**Key Elements:**
- **Major Releases** (Milestones) — Quarterly on 1st Monday of Jan, Apr, Jul, Oct
- **Minor Releases** (Milestones) — Monthly on 1st Monday
- **Annual Meta‑Release** (Milestone) — 2nd Monday of December
- **Freeze Windows** (Red/Critical) — Last week of Q1-Q3, final 2 weeks of Q4
- **Patch Releases** (Active bar) — Continuous weekly rhythm every Monday

---

## 🗓️ Visual Calendar Layout

```
┌──────────────────────────────────────────────────────────────┐
│                        ANNUAL RELEASE MAP                     │
└──────────────────────────────────────────────────────────────┘

JANUARY
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ MAJOR RELEASE (Q1): 1st Monday

FEBRUARY
  ├─ Patch Releases: Every Monday
  └─ Minor Release: 1st Monday

MARCH
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ Freeze Window: Final week (Q1 end)

APRIL
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ MAJOR RELEASE (Q2): 1st Monday

MAY
  ├─ Patch Releases: Every Monday
  └─ Minor Release: 1st Monday

JUNE
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ Freeze Window: Final week (Q2 end)

JULY
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ MAJOR RELEASE (Q3): 1st Monday

AUGUST
  ├─ Patch Releases: Every Monday
  └─ Minor Release: 1st Monday

SEPTEMBER
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ Freeze Window: Final week (Q3 end)

OCTOBER
  ├─ Patch Releases: Every Monday
  ├─ Minor Release: 1st Monday
  └─ MAJOR RELEASE (Q4): 1st Monday

NOVEMBER
  ├─ Patch Releases: Every Monday
  └─ Minor Release: 1st Monday

DECEMBER
  ├─ Patch Releases: Every Monday (until freeze)
  ├─ Minor Release: 1st Monday
  ├─ Annual Meta‑Release: 2nd Monday
  └─ Freeze Window: Final 2 weeks (Q4 end)
```

---

## 📊 Annual Release Timeline (Gantt Chart)

This Gantt chart visualizes the entire year's release schedule, showing the flow and overlap of different release types, freeze windows, and key milestones.

```mermaid
gantt
    title Sofia Core Annual Release Cadence
    dateFormat YYYY-MM-DD
    
    section Q1 Major Release
    Major Release Q1 (Jan 1st Mon)    :milestone, m1, 2024-01-01, 0d
    Open Window (2 weeks)             :active, ow1, 2024-01-01, 14d
    Development Phase                 :dev1, after ow1, 60d
    Freeze Window (Final week)        :crit, freeze1, 2024-03-25, 7d
    
    section Q2 Major Release
    Major Release Q2 (Apr 1st Mon)    :milestone, m2, 2024-04-01, 0d
    Open Window (2 weeks)             :active, ow2, 2024-04-01, 14d
    Development Phase                 :dev2, after ow2, 60d
    Freeze Window (Final week)        :crit, freeze2, 2024-06-24, 7d
    
    section Q3 Major Release
    Major Release Q3 (Jul 1st Mon)    :milestone, m3, 2024-07-01, 0d
    Open Window (2 weeks)             :active, ow3, 2024-07-01, 14d
    Development Phase                 :dev3, after ow3, 60d
    Freeze Window (Final week)        :crit, freeze3, 2024-09-23, 7d
    
    section Q4 Major Release
    Major Release Q4 (Oct 1st Mon)    :milestone, m4, 2024-10-01, 0d
    Open Window (2 weeks)             :active, ow4, 2024-10-01, 14d
    Development Phase                 :dev4, after ow4, 43d
    Annual Meta-Release (Dec 2nd Mon) :milestone, meta, 2024-12-09, 0d
    Freeze Window (Final 2 weeks)     :crit, freeze4, 2024-12-16, 14d
    
    section Monthly Minor Releases
    Minor Release (Every 1st Mon)     :done, minor, 2024-01-01, 365d
    
    section Weekly Patch Releases
    Patch Releases (Every Monday)     :patch, 2024-01-01, 365d
```

**Chart Legend:**
- **Milestones (diamonds):** Major releases (quarterly) and Annual Meta-Release
- **Active (green):** Open Windows for high-velocity feature intake
- **Development (blue):** Regular development phases
- **Critical (red):** Freeze Windows - no major merges, integration testing only
- **Done (gray):** Monthly minor releases (1st Monday of each month)
- **Patch (light blue):** Weekly patch releases (every Monday)

---

## 🌊 Contributor Workflow Process

This swimlane diagram shows how contributors should engage with the project across different release phases:

```mermaid
flowchart TD
    subgraph "Release Cycle Phases"
        direction TB
        
        subgraph "🟢 Open Window (2 weeks after Major Release)"
            A[High-Velocity Feature Intake]
            A1[Submit Major Features]
            A2[Propose Architectural Changes]
            A3[Experimental Contributions]
            A --> A1
            A --> A2
            A --> A3
        end
        
        subgraph "🔵 Development Phase (Regular Contributions)"
            B[Active Development]
            B1[Feature Development]
            B2[Bug Fixes]
            B3[Documentation]
            B4[Test Coverage]
            B --> B1
            B --> B2
            B --> B3
            B --> B4
        end
        
        subgraph "🟡 Stabilization Window (1 week before Minor Release)"
            C[Patch-Only Contributions]
            C1[Critical Bug Fixes]
            C2[Documentation Updates]
            C3[Test Improvements]
            C --> C1
            C --> C2
            C --> C3
        end
        
        subgraph "🔴 Freeze Window (End of Quarter)"
            D[Integration Testing Only]
            D1[No Major Merges]
            D2[Release Preparation]
            D3[Documentation Finalization]
            D --> D1
            D --> D2
            D --> D3
        end
        
        subgraph "🎯 Release Phase"
            E[Tagged Release]
            E1[Version Tagged]
            E2[Release Notes Published]
            E3[Artifacts Published]
            E --> E1
            E --> E2
            E --> E3
        end
    end
    
    A3 --> B1
    B4 --> C3
    C3 --> D1
    D3 --> E
    E3 --> A
    
    style "🟢 Open Window (2 weeks after Major Release)" fill:#90EE90
    style "🔵 Development Phase (Regular Contributions)" fill:#87CEEB
    style "🟡 Stabilization Window (1 week before Minor Release)" fill:#FFD700
    style "🔴 Freeze Window (End of Quarter)" fill:#FF6B6B
    style "🎯 Release Phase" fill:#9370DB
```

**Workflow Guide for Contributors:**

| Phase | Duration | What to Contribute | What to Avoid |
|-------|----------|-------------------|---------------|
| **🟢 Open Window** | 2 weeks after major release | Major features, architectural proposals, experimental work | Rushing incomplete features |
| **🔵 Development** | Between open and stabilization | Features, enhancements, bug fixes, docs | Breaking changes late in cycle |
| **🟡 Stabilization** | 1 week before minor release | Critical fixes, documentation, tests | New features, refactoring |
| **🔴 Freeze** | Last week of quarter (2 weeks in Dec) | Emergency patches only | Any non-critical changes |
| **🎯 Release** | Release day (Monday) | Monitor for issues, prepare next cycle | Last-minute changes |

---

## 🔁 Contributor Windows

To support the cadence, we define three key contributor windows:

### Open Window
- **When:** First 2 weeks after each major release
- **Activity:** High‑velocity feature intake
- **Focus:** New capabilities, experimental features, architectural proposals

### Stabilization Window
- **When:** Final week before each minor release
- **Activity:** Patch‑only
- **Focus:** Bug fixes, documentation, test coverage

### Freeze Window
- **When:** Last week of Q1-Q3 quarters; final 2 weeks of Q4/December
- **Activity:** No major merges
- **Focus:** Integration testing, release preparation, documentation finalization
- **Note:** December has a 2-week freeze to accommodate the annual meta-release and year-end consolidation

---

## 🔀 Contributor Workflow Process

This swimlane diagram illustrates the contributor workflow across different release phases, showing when and how to contribute throughout the release cycle:

```mermaid
flowchart TB
    subgraph "🚀 Major Release"
        MR[Major Release<br/>1st Monday of Quarter]
    end
    
    subgraph "⚡ Open Window Phase"
        direction LR
        OW1[High-Velocity<br/>Feature Intake]
        OW2[New Capabilities]
        OW3[Experimental Features]
        OW4[Architectural Proposals]
        OW1 --> OW2 --> OW3 --> OW4
    end
    
    subgraph "💻 Development Phase"
        direction LR
        DP1[Regular Contributions]
        DP2[Feature Development]
        DP3[Bug Fixes]
        DP4[Documentation]
        DP1 --> DP2 --> DP3 --> DP4
    end
    
    subgraph "🔧 Stabilization Window"
        direction LR
        SW1[Patch-Only Period]
        SW2[Bug Fixes]
        SW3[Documentation Updates]
        SW4[Test Coverage]
        SW1 --> SW2 --> SW3 --> SW4
    end
    
    subgraph "📦 Minor Release"
        MNR[Minor Release<br/>1st Monday of Month]
    end
    
    subgraph "🧊 Freeze Window Phase"
        direction LR
        FW1[No Major Merges]
        FW2[Integration Testing]
        FW3[Release Preparation]
        FW4[Documentation Finalization]
        FW1 --> FW2 --> FW3 --> FW4
    end
    
    subgraph "🎯 Release Phase"
        direction LR
        RP1[Tagged Release]
        RP2[Changelog Published]
        RP3[Artifacts Deployed]
        RP1 --> RP2 --> RP3
    end
    
    MR --> OW1
    OW4 --> DP1
    DP4 --> SW1
    SW4 --> MNR
    MNR --> DP1
    DP4 --> FW1
    FW4 --> RP1
    RP3 --> MR
    
    style MR fill:#ff6b6b
    style MNR fill:#4ecdc4
    style OW1 fill:#95e1d3
    style OW2 fill:#95e1d3
    style OW3 fill:#95e1d3
    style OW4 fill:#95e1d3
    style DP1 fill:#a8e6cf
    style DP2 fill:#a8e6cf
    style DP3 fill:#a8e6cf
    style DP4 fill:#a8e6cf
    style SW1 fill:#ffd93d
    style SW2 fill:#ffd93d
    style SW3 fill:#ffd93d
    style SW4 fill:#ffd93d
    style FW1 fill:#ffb347
    style FW2 fill:#ffb347
    style FW3 fill:#ffb347
    style FW4 fill:#ffb347
    style RP1 fill:#c7ceea
    style RP2 fill:#c7ceea
    style RP3 fill:#c7ceea
```

**Workflow Phases Explained:**

1. **Major Release** — Quarterly major release kicks off new cycle
2. **Open Window** (2 weeks) — High-velocity period for ambitious contributions
3. **Development Phase** — Regular contribution period with normal velocity
4. **Stabilization Window** (1 week) — Patch-only period before minor releases
5. **Minor Release** — Monthly feature release (or continue to freeze for quarter-end)
6. **Freeze Window** — Quarter-end integration testing and release prep
7. **Release Phase** — Tagged release with artifacts

**Contributor Guidance:**
- **Want to add major features?** → Target the Open Window after major releases
- **Want to contribute regularly?** → Development Phase is open for all contributions
- **Found a bug?** → Patches welcome anytime, especially in Stabilization Windows
- **Quarter ending soon?** → Be aware of Freeze Window—major work should wait

---

## 🧭 Governance Sync Points

### Monthly Maintainer Sync
- Review roadmap
- Triage issues
- Confirm next minor release
- Identity coherence check

### Quarterly Architecture Review
- Evaluate module boundaries
- Review runtime behavior
- Assess identity coherence
- Plan major release content

### Annual Unified‑Field Review
- Confirm long‑term direction
- Evolution phase confirmation
- Architectural audit
- Year‑end consolidation

---

## 📊 Mermaid Timeline View

```mermaid
timeline
    title Sofia Core Annual Release Cadence

    January
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : MAJOR RELEASE — Q1 (1st Monday)

    February
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)

    March
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : Freeze Window (Final week)

    April
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : MAJOR RELEASE — Q2 (1st Monday)

    May
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)

    June
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : Freeze Window (Final week)

    July
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : MAJOR RELEASE — Q3 (1st Monday)

    August
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)

    September
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : Freeze Window (Final week)

    October
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)
        : MAJOR RELEASE — Q4 (1st Monday)

    November
        : Patch Releases (Every Monday)
        : Minor Release (1st Monday)

    December
        : Patch Releases (Every Monday until freeze)
        : Minor Release (1st Monday)
        : Annual Meta‑Release (2nd Monday)
        : Freeze Window (Final 2 weeks)
```

---

## 📈 Gantt Chart Timeline

This Gantt chart visualizes the quarterly release phases, showing how major releases, contributor windows, and freeze periods align throughout the year:

```mermaid
gantt
    title Quarterly Release Phases and Contributor Windows
    dateFormat YYYY-MM-DD
    axisFormat %b

    section Q1 Releases
    Major Release (Jan)      :milestone, m1, 2026-01-05, 0d
    Open Window (2 weeks)    :active, ow1, 2026-01-05, 14d
    Minor Release (Feb)      :milestone, min1, 2026-02-02, 0d
    Stabilization (1 week)   :crit, stab1, 2026-01-26, 7d
    Minor Release (Mar)      :milestone, min2, 2026-03-02, 0d
    Stabilization (1 week)   :crit, stab2, 2026-02-23, 7d
    Freeze Window (Q1 end)   :done, freeze1, 2026-03-23, 7d

    section Q2 Releases
    Major Release (Apr)      :milestone, m2, 2026-04-06, 0d
    Open Window (2 weeks)    :active, ow2, 2026-04-06, 14d
    Minor Release (May)      :milestone, min3, 2026-05-04, 0d
    Stabilization (1 week)   :crit, stab3, 2026-04-27, 7d
    Minor Release (Jun)      :milestone, min4, 2026-06-01, 0d
    Stabilization (1 week)   :crit, stab4, 2026-05-25, 7d
    Freeze Window (Q2 end)   :done, freeze2, 2026-06-22, 7d

    section Q3 Releases
    Major Release (Jul)      :milestone, m3, 2026-07-06, 0d
    Open Window (2 weeks)    :active, ow3, 2026-07-06, 14d
    Minor Release (Aug)      :milestone, min5, 2026-08-03, 0d
    Stabilization (1 week)   :crit, stab5, 2026-07-27, 7d
    Minor Release (Sep)      :milestone, min6, 2026-09-07, 0d
    Stabilization (1 week)   :crit, stab6, 2026-08-31, 7d
    Freeze Window (Q3 end)   :done, freeze3, 2026-09-21, 7d

    section Q4 Releases
    Major Release (Oct)      :milestone, m4, 2026-10-05, 0d
    Open Window (2 weeks)    :active, ow4, 2026-10-05, 14d
    Minor Release (Nov)      :milestone, min7, 2026-11-02, 0d
    Stabilization (1 week)   :crit, stab7, 2026-10-26, 7d
    Minor Release (Dec)      :milestone, min8, 2026-12-07, 0d
    Meta-Release (Dec 2nd)   :milestone, meta, 2026-12-14, 0d
    Freeze Window (Q4 end)   :done, freeze4, 2026-12-14, 14d

    section Patch Releases
    Weekly Patches           :active, patches, 2026-01-01, 365d
```

**Chart Legend:**
- **Milestones (◆):** Major, minor, and meta-release dates
- **Active (green):** Open contributor windows for high-velocity feature intake
- **Critical (red):** Stabilization windows for patch-only activity
- **Done (grey):** Freeze windows with restricted merge activity
- **Patch Releases:** Continuous weekly cadence (every Monday) throughout the year

---

## 🏊 Swimlane Workflow Diagram

This diagram shows how different release tracks run in parallel and interact with governance processes:

```mermaid
graph TB
    subgraph "Patch Track - Weekly Releases"
        P1[Monday: Patch v1.1.1]
        P2[Monday: Patch v1.1.2]
        P3[Monday: Patch v1.1.3]
        P4[Monday: Patch v1.1.4]
        P1 --> P2 --> P3 --> P4
    end

    subgraph "Minor Track - Monthly Releases"
        M1[1st Monday: Minor v1.1.0]
        M2[1st Monday: Minor v1.2.0]
        M3[1st Monday: Minor v1.3.0]
        M1 --> M2 --> M3
    end

    subgraph "Major Track - Quarterly Releases"
        MAJ1[Jan 1st Mon: Major v1.0.0]
        MAJ2[Apr 1st Mon: Major v2.0.0]
        MAJ3[Jul 1st Mon: Major v3.0.0]
        MAJ4[Oct 1st Mon: Major v4.0.0]
        MAJ1 --> MAJ2 --> MAJ3 --> MAJ4
    end

    subgraph "Governance Track"
        G1[Monthly Maintainer Sync]
        G2[Quarterly Architecture Review]
        G3[Annual Unified-Field Review]
        G1 --> G2 --> G3
    end

    %% Interactions between tracks
    MAJ1 -.->|triggers| M1
    M1 -.->|includes| P1
    M1 -.->|includes| P2
    M1 -.->|includes| P3
    M1 -.->|includes| P4
    
    M1 -.->|triggers| M2
    M2 -.->|includes patches| P2
    
    G1 -.->|reviews| M1
    G2 -.->|plans| MAJ2
    
    MAJ1 -.->|2-week Open Window| M1
    M2 -.->|Stabilization Window| P3
    M3 -.->|Freeze Window| MAJ2

    style MAJ1 fill:#ff9f40
    style MAJ2 fill:#ff9f40
    style MAJ3 fill:#ff9f40
    style MAJ4 fill:#ff9f40
    style M1 fill:#4bc0c0
    style M2 fill:#4bc0c0
    style M3 fill:#4bc0c0
    style P1 fill:#36a2eb
    style P2 fill:#36a2eb
    style P3 fill:#36a2eb
    style P4 fill:#36a2eb
    style G1 fill:#9966ff
    style G2 fill:#9966ff
    style G3 fill:#9966ff
```

**Swimlane Interactions:**
- **Solid arrows (→):** Sequential progression within a track
- **Dotted arrows (⋯→):** Cross-track synchronization and dependencies
- **Orange nodes:** Major releases (Quarterly)
- **Teal nodes:** Minor releases (Monthly)
- **Blue nodes:** Patch releases (Weekly)
- **Purple nodes:** Governance sync points

**Key Sync Points:**
1. Major releases trigger 2-week Open Windows for feature intake
2. Minor releases include all patches from the previous month
3. Monthly Maintainer Syncs review upcoming minor releases
4. Quarterly Architecture Reviews plan major release content
5. Freeze Windows coordinate across all tracks at quarter-end

---

## 🔥 Release Intensity Heatmap

This visualization shows the relative intensity of release activity throughout the year:

> **Note:** This heatmap uses emoji symbols for visual clarity. For best viewing, use a markdown viewer that supports emoji rendering.

| Release Type | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| **Patch**    | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 | 🟦🟦🟦🟦 |
| **Minor**    | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 | 🟩 |
| **Major**    | 🟧 | ⬜ | ⬜ | 🟧 | ⬜ | ⬜ | 🟧 | ⬜ | ⬜ | 🟧 | ⬜ | ⬜ |
| **Meta**     | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟥 |
| **Freeze**   | ⬜ | ⬜ | 🟨 | ⬜ | ⬜ | 🟨 | ⬜ | ⬜ | 🟨 | ⬜ | ⬜ | 🟨🟨 |

**Legend:**
- 🟦 Patch releases (every Monday)
- 🟩 Minor release (1st Monday)
- 🟧 Major release (Quarterly, 1st Monday)
- 🟥 Annual Meta‑Release (2nd Monday of December)
- 🟨 Freeze Window (1 week at end of Q1-Q3, 2 weeks at end of Q4/December - note the double 🟨🟨 in December column)
- ⬜ No activity

### How to read this heatmap:
- **Patch (🟦🟦🟦🟦)** → Weekly cadence, always active
- **Minor (🟩)** → First Monday of the month
- **Major (🟧)** → First Monday of each quarter (Jan, Apr, Jul, Oct)
- **Meta (🟥)** → Second Monday of December
- **Freeze (🟨)** → Final week of Q1-Q3 quarters, final 2 weeks of Q4/December

The heatmap gives contributors and maintainers a single‑glance understanding of the entire year's rhythm.

---

## 🎯 Purpose

This calendar establishes a predictable, stable, identity‑aligned release rhythm across all systems governed by the unified field.

**Key Benefits:**
- **Predictable contributor flow** — Everyone knows when to contribute
- **Stable evolution** — Changes land at expected intervals
- **Coherent architectural progression** — Major shifts are planned and ceremonial
- **Unified‑field integrity** — All systems evolve together
- **Zero‑surprise governance** — Changes are telegraphed and prepared

This cadence is designed to support Sofia Core, EmeraldOrbit, Emerald Estates, EWF, and SEFAA governance structures while maintaining the unified field's identity coherence.

---

## 📝 Quick Reference

| Release Type | Frequency | Day | Purpose |
|--------------|-----------|-----|---------|
| Patch | Weekly | Every Monday | Bug fixes, stability |
| Minor | Monthly | 1st Monday | Features, enhancements |
| Major | Quarterly | 1st Monday (Jan, Apr, Jul, Oct) | Breaking changes, architectural shifts |
| Meta | Annually | 2nd Monday of December | Year‑end consolidation |

**Contributor Windows:**
- **Open:** 2 weeks after major releases
- **Stabilization:** 1 week before minor releases
- **Freeze:** Last week of Q1-Q3 quarters (2 weeks in Q4/December)

**Governance Sync:**
- **Monthly:** Maintainer sync
- **Quarterly:** Architecture review
- **Annually:** Unified‑field review

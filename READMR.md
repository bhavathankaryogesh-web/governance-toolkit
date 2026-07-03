# Customise Smarter
### A Governance Toolkit for SAP S/4HANA Customisation Decisions

[![Live Demo](https://img.shields.io/badge/Live%20Demo-governance--toolkit.vercel.app-blue)](https://governance-toolkit.vercel.app/)
[![MIT License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What This Is

A productised governance toolkit that helps German Mittelstand organisations make evidence-based decisions during SAP S/4HANA transformations.

The central problem: when business units request custom Fiori UI5 applications, organisations lack a structured way to evaluate whether that customisation is justified — or whether it will generate unmanageable technical debt across future S/4HANA upgrade cycles.

This toolkit provides two integrated instruments to resolve that decision:

| Pillar | Type | What it does |
|--------|------|-------------|
| **Pillar 1 — Scoring Matrix** | Quantitative | Scores any customisation request across 4 weighted dimensions (0–100). Returns a green / amber / red verdict and a 5-year TCO projection. |
| **Pillar 2 — Decision Tree** | Qualitative | Routes the request through 5 sequential governance questions to one of 4 outcomes: Standard Fiori, Configure, Key-User Extension, or Custom UI5. |

---

## Live Demo

**[governance-toolkit.vercel.app](https://governance-toolkit.vercel.app/)**

Try it with this example:
- Request: Custom purchase-order approval screen with mobile sign-off
- D1 Dev Cost: 4 · D2 Integration: 3 · D3 Upgrade Risk: 5 · D4 Maintenance: 4
- Est. dev days: 10
- Expected result: Score 82 → RED · 5-year TCO €21,000

---

## The Four Scoring Dimensions

| Dimension | Weight | Measures |
|-----------|--------|----------|
| D1 Development Cost | 30% | Estimated developer-days × blended day rate |
| D2 Integration Complexity | 20% | OData / CDS view / BTP extension complexity |
| D3 Upgrade Risk | 30% | Risk to future S/4HANA release-cycle compatibility |
| D4 Lifecycle Maintenance | 20% | Projected annual support and regression-test effort |

Weights are starting hypotheses validated through 8–12 expert interviews with SAP architects, Mittelstand CIOs, and S/4HANA consultants.

---

## Theoretical Foundation

The toolkit is grounded in two management theories:

- **TOE Framework** (Tornatzky & Fleischer, 1990) — Technology, Organisation, Environment dimensions inform the scoring matrix design and decision tree structure
- **Upper Echelons Theory** (Hambrick & Mason, 1984) — Executive cognitive base explains governance quality differences between organisations

Each design decision in both pillars maps explicitly to a specific TOE or UET construct. See the thesis for the full theory-to-design mapping.

---

## Tech Stack
# hvv-monitor

A real-time, terminal-based departure board for the Hamburg Public Transport Network (**HVV**), featuring a general search interface and a specialized compact monitor for personal bus stops.

## Features
- **Live Updates**: Real-time departure data via `hafas-client` (Nah.SH profile).
- **HVV Branding**: High-fidelity UI colors for U-Bahn, S-Bahn, and Regional rail lines.
- **Smart Filtering**: Automatic station name normalization (removes redundant city prefixes).
- **Dual Modes**: 
    - **General Dashboard**: Full-screen interactive search and monitoring.
    - **Personal Monitor**: A fixed, centered window optimized for specific bus stops.

## Installation
Ensure you have **Node.js** installed, then install the dependencies:
```bash
npm install blessed hafas-client date-fns
````

## Quick Start

#### 1. General Dashboard

The interactive version with search functionality (`S`) and live refresh (`R`).

```bash
node main.js
````

#### 2. Personal Monitor

The centered, compact version designed for fixed locations like your home bus stop.

```bash
node personal.js
````

## Shortcuts

| Key | Action |
| --- | --- |
| **S** | Search for a new station (General Dashboard only) |
| **R** | Manual refresh of departure data |
| **Q** | Quit the application |
| **Ctrl+C** | Force exit |

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.
# hvv-monitor

A real-time, terminal-based departure board for the Hamburg Public Transport Network (**HVV**), featuring a general search interface and a specialized compact monitor for personal bus stops.

## Features
- **Live Updates**: Real-time departure data via `hafas-client` (Nah.SH profile).
- **HVV Branding**: High-fidelity UI colors for U-Bahn, S-Bahn and Regional rail lines.
- **Smart Filtering**: Automatic station name normalization (removes redundant city prefixes).
- **Dual Modes**: 
    - **General Dashboard**: Full-screen interactive search and monitoring.
    - **Personal Monitor**: A fixed, centered window optimized for specific bus stops.

## Installation
Ensure you have installed **Node.js** Version 20 or higher.

#### Clone this repository

```bash
git clone https://github.com/marshmallow868/hvv-monitor.git
cd hvv-monitor
```

#### Install the dependencies

```bash
npm install
```

## Quick Start

#### 1. General Dashboard

The interactive version with search functionality (`S`) and live refresh (`R`).

```bash
node main.js
```

#### 2. Personal Monitor

The centered, compact version designed for fixed locations like your home bus stop.

```bash
node personal.js STATION_NAME
```

Example:

```bash
node personal.js Hamburg Altona
```

Quotes are not needed.

## Shortcuts

| Key | Action |
| --- | --- |
| **S** | Search for a new station (General Dashboard only) |
| **R** | Manual refresh of departure data |
| **Q** | Quit the application |
| **Ctrl+C** | Force exit |

## Configuration

Change update interval, default is 10 seconds:

```javascript
const UPDATE_INTERVAL_MS = 10000;
```

Change window size of **Personal Monitor**, default is 65x25:

```javascript
const WINDOW_WIDTH = 65;
const WINDOW_HEIGHT = 25;
```

## Useful

You can add your home bus stop to your .zshrc for easy access:

```bash
alias STATION_NAME="node ~/hvv-monitor/personal.js STATION_NAME"
```

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.
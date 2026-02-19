# hvv-monitor

A real-time, terminal-based departure board and route planner for the Hamburg Public Transport Network (HVV). The application provides a general search interface, a specialized compact monitor for specific stations, and a detailed journey planning tool.

## Table of Contents
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
    * [General Monitor](#1-general-monitor)
    * [Personal Monitor](#2-personal-monitor)
    * [Route Planner](#3-route-planner)
* [Controls](#controls)
* [Configuration](#configuration)
* [Shell Integration](#shell-integration)
* [Contributing](#contributing)
* [License](#license)

## Features

* **Real-time Data Retrieval**: Fetches live departure data utilizing the `hafas-client` library (configured with the Nah.SH profile).
* **Accurate Line Representation**: Applies accurate HVV transit color codes for U-Bahn, S-Bahn, and Regional rail lines.
* **String Normalization**: Automatically filters and removes redundant city prefixes from station names to optimize terminal space.
* **Dual Operation Modes**: Includes a full-screen interactive dashboard and a fixed-dimension monitor for dedicated usage.
* **Journey Planning**: Dedicated interface to search for connections between two stations with transfer details and real-time status tracking.
* **Accurate Line Representation**: Applies accurate HVV transit color codes for U-Bahn, S-Bahn, AKN, and Regional rail lines.

## Prerequisites

Before utilizing this application, ensure the following dependencies are installed on your system:
* **Node.js**: Version 20.20.0 or higher.
* **Git**: Required for cloning the repository.
* **npm**: Node Package Manager (included with standard Node.js installations).

## Installation

#### 1. Clone the repository to your local machine:
```bash
git clone [https://github.com/marshmallow868/hvv-monitor.git](https://github.com/marshmallow868/hvv-monitor.git)
```

#### 2. Navigate into the project directory:
```bash
cd hvv-monitor
```

#### 3. Install the required dependencies:
```bash
npm install
```

## Usage

The application provides two distinct executables depending on your use case.

#### 1. General Monitor
The interactive version featuring station search functionality and a full-screen interface.

```bash
node main.js
```

![general](/assets/general.png)

#### 2. Personal Monitor
A centered, compact version designed for fixed locations, such as monitoring a specific bus stop near your residence. The station name must be passed as a positional argument. Quotation marks are not required.

```bash
node personal.js STATION_NAME
```

Example:

```bash
node personal.js Hamburg Altona
```

![personal](/assets/personal.png)

#### 3. Route Planner
A tool to plan journeys between two locations. It displays up to 4 options, including duration, number of transfers, and real-time delays for each leg.

```bash
node planner.js ORIGIN DESTINATION
```

Example:

```bash
node personal.js Altona Kiel
```

If launched without arguments, it will automatically open the search modal.

![planner](/assets/planner.png)

For a proper display, a minimum terminal window size of 110x35 is required.

## Controls

The application relies on standard keyboard inputs for navigation and control.

| Key | Action |
| :--- | :--- |
| **S** | Open search modal / Plan new journey |
| **Enter** | Confirm search / Next input field |
| **Esc** | Close modal without searching |
| **R** | Execute a manual refresh |
| **Q** | Quit the application |

## Configuration

Application parameters are currently managed via constants defined within the source code. To modify these values, open the respective `.js` files in a text editor.

#### Update Frequency:
To change the automated refresh interval (default is 10 seconds):

```javascript
const UPDATE_INTERVAL_MS = 10000;
```

#### Personal Monitor Dimensions:
To adjust the terminal window dimensions for the Personal Monitor (default is 65x25):

```javascript
const WINDOW_WIDTH = 65;
const WINDOW_HEIGHT = 25;
```

## Shell Integration

For streamlined execution, it is recommended to create a shell alias for your frequently used stations. You can append the following line to your `.bashrc` or `.zshrc` file:

```bash
alias hvv="node ~/path/to/hvv-monitor/personal.js STATION_NAME"
```

*Note: Ensure you update `~/path/to/hvv-monitor/` to reflect the actual absolute path of your cloned repository.*

## Contributing

Modifications, bug reports, and feature requests are welcome. If you wish to contribute to the codebase, please open an issue first to discuss the proposed changes. For significant code additions, standard pull request procedures apply.

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.
import blessed from "blessed";
import { createClient } from "hafas-client";
import { profile as nahshProfile } from "hafas-client/p/nahsh/index.js";
import { format } from "date-fns";

const DEFAULT_STATION_NAME = process.argv.slice(2).join(" ");
const UPDATE_INTERVAL_MS = 30000;
const hafas = createClient(nahshProfile, "hvv-monitor");

const screen = blessed.screen({
    smartCSR: true,
    title: "Departure Monitor",
    fullUnicode: true
});

const WINDOW_WIDTH = 65;
const WINDOW_HEIGHT = 25;

const layout = blessed.box({
    top: "center",
    left: "center",
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT
});

const header = blessed.box({
    top: 0,
    height: 1,
    width: "100%",
    tags: true,
    align: "center",
    style: { fg: "white" }
});

const tableBox = blessed.box({
    top: 1,
    bottom: 1,
    width: "100%",
    tags: true,
    border: { type: "line" },
    style: { fg: "white", border: { fg: "#444" } }
});

const footer = blessed.box({
    bottom: 0,
    height: 1,
    width: "100%",
    tags: true,
    align: "center",
    style: { fg: "white" }
});

layout.append(header);
layout.append(tableBox);
layout.append(footer);
screen.append(layout);

let currentStation = null;

function finalizeSpacing(text) {
    return text.replace(/\s+/g, " ").trim();
}

function normalizeStationName(name) {
    if (!name) return "";

    let formatted = name.replace(/-/g, " ");
    formatted = formatted.replace(/\//g, " ");
    formatted = formatted.replace(/\(/g, " (");
    formatted = formatted.replace(/\)/g, ") ");

    const hubs = ["hbf", "airport", "altona", "dammtor", "harburg"];
    const isMainHub = hubs.some(hub => formatted.toLowerCase().includes(hub));

    if (isMainHub) {
        return finalizeSpacing(formatted);
    }

    const words = formatted.split(/\s+/);
    const blacklisted = ["hamburg", "hh"];

    const cleanedWords = words.filter(word => {
        const lowerWord = word.toLowerCase().trim();
        return !blacklisted.includes(lowerWord);
    });

    return finalizeSpacing(cleanedWords.join(" "));
}

function getLineDesign(departure) {
    const rawName = departure.line?.name || "";
    const name = rawName.replace(/^BUS\s+/i, "");

    if (name.startsWith("U")) return { name, color: "{#006192-fg}" };
    if (name.startsWith("S")) return { name, color: "{#2ea13d-fg}" };
    if (name.startsWith("A")) return { name, color: "{#fdb913-fg}" };
    if (name.startsWith("ICE")) return { name, color: "{#ffffff-fg}" };
    if (name.match(/^(RE|RB)/i)) return { name, color: "{#af00af-fg}" };

    return { name, color: "{#e2001a-fg}" };
}

function renderHeader(name) {
    const time = format(new Date(), "HH:mm");
    const cleanName = normalizeStationName(name || DEFAULT_STATION_NAME);
    
    header.setContent(`{bold}${cleanName}  ${time}{/bold}`);
}

function renderTable(departures) {
    const colLine = 8;
    const colTime = 13;
    const colStatus = 6;
    const colDir = WINDOW_WIDTH - (colLine + colTime + colStatus + 6);

    const headerLine = "Line".padEnd(colLine);
    const headerDir = "Direction".padEnd(colDir);
    const headerTime = "Departure".padEnd(colTime);
    
    let uiString = `{bold}${headerLine} ${headerDir} ${headerTime} Status{/bold}\n`;
    uiString += "{#444-fg}" + "-".repeat(WINDOW_WIDTH - 2) + "{/}\n";

    departures.slice(0, 19).forEach(dep => {
        const design = getLineDesign(dep);
        const cleanDir = normalizeStationName(dep.direction || "");
        const time = format(new Date(dep.when || dep.plannedWhen), "HH:mm");
        const delay = dep.delay !== null ? Math.round(dep.delay / 60) : 0;
        const status = delay > 0 ? `{red-fg}+${delay}m{/red-fg}` : "{green-fg}OK{/green-fg}";

        const linePart = `${design.color}${design.name.padEnd(colLine)}{/}`;
        const dirPart = cleanDir.substring(0, colDir).padEnd(colDir);
        const timePart = time.padEnd(colTime);

        uiString += `${linePart} ${dirPart} ${timePart} ${status}\n`;
    });

    tableBox.setContent(uiString);
    screen.render();
}

function renderFooterStatus(status) {
    footer.setContent(`R Refresh  |  Q Quit  |  ${status}`);
    screen.render();
}

async function updateDashboard() {
    if (!currentStation) return performSearch(DEFAULT_STATION_NAME);
    
    renderFooterStatus("LOADING...");

    try {
        const response = await hafas.departures(currentStation.id, { duration: 60 });
        const departures = (response.departures || []).sort((a, b) => {
            return new Date(a.when || a.plannedWhen) - new Date(b.when || b.plannedWhen);
        });

        renderHeader(currentStation.name);
        renderTable(departures);
        renderFooterStatus("LIVE");
    } catch (error) {
        renderFooterStatus("ERROR");
    }
}

async function performSearch(query) {
    try {
        const results = await hafas.locations(query, { results: 5 });
        const station = results.find(r => r.type === "station" || r.type === "stop");
        
        if (station) {
            currentStation = station;
            updateDashboard();
        }
    } catch (e) {
        renderFooterStatus("ERROR");
    }
}

screen.key(["q", "C-c"], () => process.exit(0));

screen.key(["r", "R"], () => {
    updateDashboard();
});

updateDashboard();

setInterval(() => {
    updateDashboard();
}, UPDATE_INTERVAL_MS);
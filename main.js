import blessed from "blessed";
import { createClient } from "hafas-client";
import { profile as nahshProfile } from "hafas-client/p/nahsh/index.js";
import { format } from "date-fns";

const DEFAULT_STATION_NAME = "Hamburg Hbf";
const UPDATE_INTERVAL_MS = 10000;
const hafas = createClient(nahshProfile, "hvv-dashboard");

const screen = blessed.screen({
    smartCSR: true,
    title: "HVV Monitor",
    fullUnicode: true
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

const searchModal = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: 46,
    height: 5,
    border: "line",
    label: " Search Station ",
    tags: true,
    hidden: true,
    style: { fg: "white", bg: "black", border: { fg: "#fdb913" } }
});

const searchInput = blessed.textbox({
    parent: searchModal,
    top: 1,
    left: 1,
    right: 1,
    height: 1,
    keys: true,
    inputOnFocus: true,
    style: { bg: "#333", fg: "white", focus: { bg: "#555" } }
});

[header, tableBox, footer].forEach(el => screen.append(el));

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
    const cleanName = normalizeStationName(name);
    
    header.setContent(`{bold}${cleanName}  ${time}{/bold}`);
}

function renderTable(departures) {
    const colLine = 9;
    const colTime = 14;
    const colStatus = 6;
    const colDir = screen.width - (colLine + colTime + colStatus + 6);

    const headerLine = "Line".padEnd(colLine);
    const headerDir = "Direction".padEnd(colDir);
    const headerTime = "Departure".padEnd(colTime);
    
    let uiString = `{bold}${headerLine} ${headerDir} ${headerTime} Status{/bold}\n`;
    uiString += "{#444-fg}" + "-".repeat(screen.width - 2) + "{/}\n";

    departures.forEach(dep => {
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
    footer.setContent(`S Search  |  R Refresh  |  Q Quit  |  ${status}`);
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
    if (!searchModal.visible) updateDashboard();
});

screen.key(["s", "S"], () => {
    searchModal.show();
    searchModal.setFront();
    searchInput.focus();
    screen.render();
});

searchInput.on("submit", (val) => {
    searchModal.hide();
    if (val) performSearch(val);
    searchInput.clearValue();
    screen.render();
});

searchInput.on("cancel", () => {
    searchModal.hide();
    searchInput.clearValue();
    screen.render();
});

updateDashboard();

setInterval(() => {
    if (!searchModal.visible) updateDashboard();
}, UPDATE_INTERVAL_MS);
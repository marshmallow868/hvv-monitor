import blessed from "blessed";
import { createClient } from "hafas-client";
import { profile as nahshProfile } from "hafas-client/p/nahsh/index.js";
import { format } from "date-fns";

const hafas = createClient(nahshProfile, "hvv-monitor");

const screen = blessed.screen({
    smartCSR: true,
    title: "Route Planner",
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
    scrollable: true,
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
    height: 8,
    border: "line",
    label: " Plan Journey ",
    tags: true,
    hidden: true,
    style: { fg: "white", bg: "black", border: { fg: "#fdb913" } }
});

const inputFrom = blessed.textbox({
    parent: searchModal,
    top: 1,
    left: 8,
    right: 1,
    height: 1,
    keys: true,
    inputOnFocus: true,
    style: { bg: "#222", fg: "white", focus: { bg: "#777" } }
});

const inputTo = blessed.textbox({
    parent: searchModal,
    top: 3,
    left: 8,
    right: 1,
    height: 1,
    keys: true,
    inputOnFocus: true,
    style: { bg: "#222", fg: "white", focus: { bg: "#777" } }
});

const searchStatus = blessed.text({
    parent: searchModal,
    bottom: 0,
    left: "center",
    content: "Press ENTER to search",
    style: { fg: "#777", bg: "black" }
});

blessed.text({ parent: searchModal, top: 1, left: 1, content: "From:", style: { bg: "black" } });
blessed.text({ parent: searchModal, top: 3, left: 1, content: "To:", style: { bg: "black" } });

[header, tableBox, footer].forEach(el => screen.append(el));

let lastFrom = "";
let lastTo = "";
let isFirstSearch = true;

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

function getLineDesign(leg) {
    const rawName = leg.line?.name || "WALK";
    const name = rawName.replace(/^BUS\s+/i, "");

    if (name.startsWith("U")) return { name, color: "{#006192-fg}" };
    if (name.startsWith("S")) return { name, color: "{#2ea13d-fg}" };
    if (name.startsWith("A")) return { name, color: "{#fdb913-fg}" };
    if (name.startsWith("ICE")) return { name, color: "{#ffffff-fg}" };
    if (name.match(/^(RE|RB)/i)) return { name, color: "{#af00af-fg}" };
    if (name === "WALK") return { name: "WALK", color: "{#777-fg}" };

    return { name, color: "{#e2001a-fg}" };
}

async function findStation(query) {
    const results = await hafas.locations(query, { results: 5 });
    return results.find(r => r.type === "station" || r.type === "stop") || results[0];
}

async function calculateRoute(fromName, toName) {
    if (!fromName || !toName) return;

    lastFrom = fromName;
    lastTo = toName;

    inputFrom.clearValue();
    inputTo.clearValue();

    tableBox.setContent("\n  Fetching journey data...");
    footer.setContent("LOADING...");
    screen.render();

    try {
        const origin = await findStation(fromName);
        const destination = await findStation(toName);

        if (!origin || !destination) {
            tableBox.setContent("\n {red-fg}Error: Station not found.{/red-fg}");
            return;
        }

        const time = format(new Date(), "HH:mm");
        header.setContent(`{bold}${normalizeStationName(origin.name)}  >>  ${normalizeStationName(destination.name)}  ${time}{/bold}`);

        const { journeys } = await hafas.journeys(origin.id, destination.id, { 
            results: 4,
            walkingSpeed: 'normal'
        });
        renderTable(journeys);
        isFirstSearch = false;
    } catch (e) {
        tableBox.setContent(`\n {red-fg}Error: ${e.message}{/red-fg}`);
    }
    screen.render();
}

function renderTable(journeys) {
    if (!journeys || journeys.length === 0) {
        tableBox.setContent("\n {yellow-fg}No routes found.{/yellow-fg}");
        footer.setContent("S Search  |  R Refresh  |  Q Quit");
        return;
    }

    const colLine = 9;
    const colTime = 14;
    const colStatus = 6;
    const colStation = Math.floor((screen.width - (colLine + (colTime * 2) + colStatus + 8)) / 2);
    
    const headerLine = "Line".padEnd(colLine);
    const headerDep = "Departure".padEnd(colTime);
    const headerOrigin = "Origin".padEnd(colStation);
    const headerArr = "Arrival".padEnd(colTime);
    const headerDest = "Destination".padEnd(colStation);
    
    let uiString = `{bold}${headerLine} ${headerDep} ${headerOrigin} ${headerArr} ${headerDest} Status{/bold}\n`;
    uiString += "{#444-fg}" + "-".repeat(screen.width - 2) + "{/}\n\n";

    journeys.forEach((j, index) => {
        const firstLeg = j.legs[0];
        const lastLeg = j.legs[j.legs.length - 1];
        const durMin = Math.round((new Date(lastLeg.arrival) - new Date(firstLeg.departure)) / 60000);
        const transfers = j.legs.filter(l => l.line).length - 1;

        uiString += `{bold}{#fdb913-fg}OPTION ${index + 1} (${durMin} min, ${transfers} transfers){/}\n\n`;

        j.legs.forEach(leg => {
            const design = getLineDesign(leg);
            const depTime = format(new Date(leg.departure), "HH:mm");
            const arrTime = format(new Date(leg.arrival), "HH:mm");
            
            const originName = normalizeStationName(leg.origin.name).substring(0, colStation - 1);
            const destName = normalizeStationName(leg.destination.name).substring(0, colStation - 1);
            
            const delay = leg.departureDelay ? Math.round(leg.departureDelay / 60) : 0;
            const status = delay > 0 ? `{red-fg}+${delay}m{/}` : "{green-fg}OK{/}";

            uiString += `${design.color}${design.name.padEnd(colLine)}{/} ` +
                        `${depTime.padEnd(colTime)} ` +
                        `${originName.padEnd(colStation)} ` +
                        `${arrTime.padEnd(colTime)} ` +
                        `${destName.padEnd(colStation)} ` +
                        `${status}\n`;
        });

        uiString += "\n\n";
    });

    tableBox.setContent(uiString);
    footer.setContent("S Search  |  R Refresh  |  Q Quit");
    screen.render();
}

function showSearch() {
    searchModal.show();
    searchModal.setFront();
    inputFrom.focus();
    screen.render();
}

inputFrom.on("submit", () => inputTo.focus());
inputTo.on("submit", () => {
    const from = inputFrom.getValue();
    const to = inputTo.getValue();
    searchModal.hide();
    calculateRoute(from, to);
});

const hideSearch = () => {
    searchModal.hide();
    screen.restoreFocus();
    screen.render();
};

inputFrom.on("cancel", () => {
    if (isFirstSearch) {
        process.exit(0);
    } else {
        hideSearch();
    }
});
inputTo.on("cancel", () => {
    if (isFirstSearch) {
        process.exit(0);
    } else {
        hideSearch();
    }
});

screen.key(["s", "S"], () => showSearch());
screen.key(["r", "R"], () => {
    if (!searchModal.visible && lastFrom && lastTo) {
        calculateRoute(lastFrom, lastTo);
    }
});
screen.key(["q", "C-c"], () => process.exit(0));

const args = process.argv.slice(2);
if (args.length >= 2) {
    calculateRoute(args[0], args[1]);
} else {
    setTimeout(showSearch, 100);
}

screen.render();
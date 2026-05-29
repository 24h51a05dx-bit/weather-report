# AMIGO Team Weather Report

A real-time weather dashboard built for **AMIGO TECH PVT LIMITED** (Intern Project). Search any city, view current conditions, hourly forecasts, and interactive charts—with GPS support when run on a local server.

## Features

- **Branded landing page** — AMIGO logo, live date/time, and a weather snapshot preview
- **Current location** — Uses device GPS when allowed, with network-based fallback
- **City search** — Look up weather for any city worldwide
- **24-hour forecast** — Scrollable hourly cards
- **Charts** — Temperature, humidity, and wind (Chart.js)
- **Light / dark mode** — Toggle theme; light mode uses a clean white UI
- **Recent searches** — Quick access to past cities; remove any entry with **×**
- **°C / °F** — Switch temperature units
- **Default fallback** — Hyderabad if location cannot be detected

## Tech Stack

- HTML5, CSS3, JavaScript (no frameworks)
- [Open-Meteo](https://open-meteo.com/) — Weather and geocoding APIs
- [Chart.js](https://www.chartjs.org/) — Graphs

## How to Run

Location (GPS) works only over **http://localhost**, not when opening the HTML file directly (`file://`).

### Option 1 — Double-click (easiest)

1. Open the `weather-report` folder in File Explorer
2. Double-click **`start.bat`**
3. Your browser opens automatically

### Option 2 — Terminal (PowerShell)

```powershell
cd c:\Users\kasan\Desktop\weather\weather-report
.\start.bat
```

Or:

```powershell
.\start.ps1
```

> In PowerShell you must use `.\start.bat`, not `start.bat` alone.

### Option 3 — Live Server (VS Code / Cursor)

Right-click `index.html` → **Open with Live Server**

### Open the app

**http://localhost:3000**

(Also works as **http://127.0.0.1:3000**)

### Requirements

- [Node.js](https://nodejs.org/) (for `start.bat` / `start.ps1`, which use `npx serve`)
- Modern browser (Chrome recommended)
- Internet connection for weather data

### Location permissions

1. Run the app via localhost (see above)
2. Click **Launch Weather Report**
3. When prompted, choose **Allow** for location
4. On Windows: **Settings → Privacy → Location** → turn Location **On**
5. Use the **pin** button in the header to refresh your location anytime

## Project Structure

```
weather-report/
├── index.html      # Main page (landing + app)
├── style.css       # Styles and themes
├── script.js       # Weather logic and location
├── amigo-logo.png  # Company logo
├── start.bat       # Start server (Windows)
├── start.ps1       # Start server (PowerShell)
└── README.md
```

## Usage

1. Open the app at **http://localhost:3000**
2. On the landing page, click **Launch Weather Report**
3. Your current location weather loads automatically (or Hyderabad as fallback)
4. Search another city in the search bar, or click a recent search
5. Toggle **moon/sun** for dark/light mode
6. Switch **°C** / **°F** as needed

## APIs Used

| Service | Purpose |
|--------|---------|
| Open-Meteo Forecast | Current weather and hourly data |
| Open-Meteo Geocoding | City search and reverse geocoding |
| ipwho.is / geojs.io | IP-based location fallback |

No API keys required.

## Author

Intern project — **AMIGO TECH PVT LIMITED**

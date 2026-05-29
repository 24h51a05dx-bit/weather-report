// Global Variables
let currentWeatherData = null;
let isCelsius = true;
let temperatureChart = null;
let humidityChart = null;
let windChart = null;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const themeToggle = document.getElementById('themeToggle');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const weatherCard = document.getElementById('weatherCard');
const hourlyForecast = document.getElementById('hourlyForecast');
const chartsSection = document.getElementById('chartsSection');
const recentSearchesDiv = document.getElementById('recentSearches');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

// Weather Condition Icons
const weatherIcons = {
    0: '☀️', // Clear sky
    1: '🌤️', // Mainly clear
    2: '⛅', // Partly cloudy
    3: '☁️', // Overcast
    45: '🌫️', // Fog
    48: '🌫️', // Depositing rime fog
    51: '🌧️', // Light drizzle
    53: '🌧️', // Moderate drizzle
    55: '🌧️', // Dense drizzle
    61: '🌧️', // Slight rain
    63: '🌧️', // Moderate rain
    65: '🌧️', // Heavy rain
    71: '🌨️', // Slight snow
    73: '🌨️', // Moderate snow
    75: '🌨️', // Heavy snow
    80: '🌦️', // Rain showers
    81: '🌦️', // Moderate rain showers
    82: '🌦️', // Violent rain showers
    95: '⛈️', // Thunderstorm
    96: '⛈️', // Thunderstorm with hail
    99: '⛈️'  // Thunderstorm with heavy hail
};

const weatherConditions = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    80: 'Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail'
};

// Landing Page
const landingPage = document.getElementById('landingPage');
const mainApp = document.getElementById('mainApp');
const enterAppBtn = document.getElementById('enterAppBtn');
const landingPreview = document.getElementById('landingPreview');
const landingDateEl = document.getElementById('landingDate');
const landingTimeEl = document.getElementById('landingTime');

let landingClockInterval = null;
let appInitialized = false;
let cachedLocation = null;
let locationPrefetchPromise = null;

document.addEventListener('DOMContentLoaded', () => {
    initLandingPage();
    enterAppBtn.addEventListener('click', () => {
        prefetchCurrentLocation();
        enterApplication();
    });
});

function prefetchCurrentLocation() {
    if (!locationPrefetchPromise) {
        locationPrefetchPromise = resolveCurrentLocation()
            .then((location) => {
                cachedLocation = location;
                return location;
            })
            .catch((error) => {
                console.warn('Location prefetch failed:', error);
                return null;
            });
    }
    return locationPrefetchPromise;
}

function initLandingPage() {
    updateLandingDateTime();
    landingClockInterval = setInterval(updateLandingDateTime, 1000);
    loadLandingPreview();
}

function updateLandingDateTime() {
    const now = new Date();
    landingDateEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    landingTimeEl.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

async function loadLandingPreview() {
    const defaultCity = 'Hyderabad';
    try {
        const coords = await getCoordinates(defaultCity);
        if (!coords) {
            renderLandingPreviewFallback();
            return;
        }

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&timezone=auto`
        );
        if (!response.ok) throw new Error('Preview fetch failed');

        const data = await response.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        const icon = weatherIcons[code] || '🌤️';
        const condition = weatherConditions[code] || 'Current conditions';

        landingPreview.innerHTML = `
            <div class="preview-card">
                <span class="preview-icon">${icon}</span>
                <div class="preview-info">
                    <h3>${coords.name}, ${coords.country}</h3>
                    <p>${condition} · Team default location</p>
                </div>
                <div class="preview-temp">${temp}<span>°C</span></div>
            </div>
        `;
    } catch {
        renderLandingPreviewFallback();
    }
}

function renderLandingPreviewFallback() {
    landingPreview.innerHTML = `
        <div class="preview-card">
            <span class="preview-icon">🌤️</span>
            <div class="preview-info">
                <h3>AMIGO Team Weather</h3>
                <p>Search any city after you launch the app</p>
            </div>
            <div class="preview-temp">—<span>°C</span></div>
        </div>
    `;
}

async function enterApplication() {
    if (appInitialized) return;

    landingPage.classList.add('exiting');
    enterAppBtn.disabled = true;

    await new Promise((resolve) => setTimeout(resolve, 550));

    landingPage.classList.add('hidden');
    mainApp.classList.remove('hidden');
    clearInterval(landingClockInterval);

    await initMainApp();
    appInitialized = true;
}

async function initMainApp() {
    loadRecentSearches();
    loadTheme();
    setupEventListeners();

    showLoading();
    hideError();

    try {
        let location = cachedLocation;
        if (!location && locationPrefetchPromise) {
            location = await locationPrefetchPromise;
        }
        if (!location) {
            location = await resolveCurrentLocation();
            cachedLocation = location;
        }
        await applyLocationWeather(location);
    } catch (error) {
        console.warn('Auto location failed:', error);
        if (!currentWeatherData) {
            cityInput.value = 'Hyderabad';
            await handleSearch();
        }
    } finally {
        hideLoading();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    locationBtn.addEventListener('click', () => getCurrentLocation(true));
    themeToggle.addEventListener('click', toggleTheme);
    celsiusBtn.addEventListener('click', () => setTemperatureUnit(true));
    fahrenheitBtn.addEventListener('click', () => setTemperatureUnit(false));
}

// Handle Search
async function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const coordinates = await getCoordinates(city);
        if (!coordinates) {
            showError('City not found. Please try again.');
            hideLoading();
            return;
        }
        
        await fetchWeather(coordinates.latitude, coordinates.longitude, city, coordinates);
        saveRecentSearch(city);
    } catch (error) {
        showError('Failed to fetch weather data. Please check your internet connection.');
        console.error(error);
    }
    
    hideLoading();
}

// Get Coordinates from City Name
async function getCoordinates(cityName) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );
        
        if (!response.ok) throw new Error('Failed to fetch coordinates');
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) return null;
        
        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country
        };
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
}

function geolocationErrorMessage(error) {
    const messages = {
        1: 'Location permission denied. Click the lock icon in the address bar and allow Location, then try again.',
        2: 'Location unavailable. Turn on Windows Location services and device GPS.',
        3: 'Location request timed out. Please try the location button again.'
    };
    return messages[error?.code] || 'Could not read your device location.';
}

// Get device GPS coordinates (browser geolocation) — retries with relaxed settings
async function getDeviceCoordinates() {
    if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
    }

    const tryOnce = (options) =>
        new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                reject,
                options
            );
        });

    const attempts = [
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 120000 }
    ];

    let lastError;
    for (const options of attempts) {
        try {
            return await tryOnce(options);
        } catch (error) {
            lastError = error;
        }
    }
    throw new Error(geolocationErrorMessage(lastError));
}

// Reverse geocode lat/lon to city name
async function reverseGeocode(latitude, longitude) {
    const base = { latitude, longitude };

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&count=1`
        );
        if (response.ok) {
            const data = await response.json();
            const place = data.results?.[0];
            if (place?.name) {
                return {
                    ...base,
                    name: place.name,
                    country: place.country || place.country_code || 'Unknown'
                };
            }
        }
    } catch (error) {
        console.warn('Open-Meteo reverse geocode failed:', error);
    }

    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        if (response.ok) {
            const data = await response.json();
            const name = data.city || data.locality || data.principalSubdivision;
            if (name) {
                return {
                    ...base,
                    name,
                    country: data.countryName || 'Unknown'
                };
            }
        }
    } catch (error) {
        console.warn('BigDataCloud reverse geocode failed:', error);
    }

    return {
        ...base,
        name: 'Current Location',
        country: 'Your area'
    };
}

// IP-based location fallbacks (when GPS is blocked or denied)
async function getLocationFromIP() {
    const providers = [
        async () => {
            const response = await fetch('https://ipwho.is/');
            if (!response.ok) throw new Error('ipwho.is failed');
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'ipwho.is failed');
            return {
                latitude: data.latitude,
                longitude: data.longitude,
                name: data.city,
                country: data.country
            };
        },
        async () => {
            const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!response.ok) throw new Error('geojs failed');
            const data = await response.json();
            if (!data.latitude || !data.longitude) throw new Error('geojs no coords');
            return {
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
                name: data.city,
                country: data.country
            };
        },
        async () => {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('ipapi.co failed');
            const data = await response.json();
            if (data.error) throw new Error(data.reason || 'ipapi.co failed');
            return {
                latitude: data.latitude,
                longitude: data.longitude,
                name: data.city,
                country: data.country_name
            };
        }
    ];

    let lastError;
    for (const provider of providers) {
        try {
            return await provider();
        } catch (error) {
            lastError = error;
            console.warn('IP location provider failed:', error);
        }
    }
    throw lastError || new Error('Could not detect location from network.');
}

// Resolve location: GPS first, then IP-based fallback
async function resolveCurrentLocation() {
    if (navigator.geolocation) {
        try {
            const coords = await getDeviceCoordinates();
            return await reverseGeocode(coords.latitude, coords.longitude);
        } catch (gpsError) {
            console.warn('GPS failed, trying IP fallback:', gpsError.message);
        }
    } else if (!window.isSecureContext) {
        console.warn('GPS needs https:// or http://localhost — using network location.');
    }

    return await getLocationFromIP();
}

async function applyLocationWeather(location) {
    cityInput.value = location.name;
    const success = await fetchWeather(
        location.latitude,
        location.longitude,
        location.name,
        location
    );
    if (!success) {
        throw new Error('Failed to load weather for your location.');
    }
    saveRecentSearch(location.name);
}

// Get Current Location and load weather
async function getCurrentLocation(showErrorOnFail = true) {
    if (typeof showErrorOnFail !== 'boolean') {
        showErrorOnFail = true;
    }

    showLoading();
    hideError();

    try {
        const location = await resolveCurrentLocation();
        cachedLocation = location;
        await applyLocationWeather(location);
        return true;
    } catch (error) {
        if (showErrorOnFail) {
            let hint = '';
            if (!window.isSecureContext) {
                hint = ' Open this app via Live Server (http://127.0.0.1) so GPS can work in the browser.';
            }
            showError((error.message || 'Failed to get current location.') + hint);
        }
        console.error('Location error:', error);
        return false;
    } finally {
        hideLoading();
    }
}

// Fetch Weather Data
async function fetchWeather(lat, lon, cityName, coordinates) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        
        currentWeatherData = {
            current: data.current,
            hourly: data.hourly,
            location: {
                name: cityName,
                country: coordinates.country || 'Unknown'
            }
        };
        
        displayWeather(data);
        displayHourlyForecast(data.hourly);
        createCharts(data.hourly);
        
        // Show sections
        weatherCard.classList.remove('hidden');
        hourlyForecast.classList.remove('hidden');
        chartsSection.classList.remove('hidden');
        return true;

    } catch (error) {
        showError('Failed to fetch weather data. Please try again.');
        console.error(error);
        return false;
    }
}

// Display Weather
function displayWeather(data) {
    const current = data.current;
    
    // City and Country
    document.getElementById('cityName').textContent = currentWeatherData.location.name || currentWeatherData.location;
    document.getElementById('countryName').textContent = currentWeatherData.location.country || 'World';
    
    // Date and Time
    const now = new Date();
    document.getElementById('currentDate').textContent = formatDate(now);
    document.getElementById('currentTime').textContent = formatTime(now);
    
    // Weather Icon and Condition
    const weatherCode = current.weather_code;
    document.getElementById('weatherIcon').textContent = weatherIcons[weatherCode] || '🌤️';
    document.getElementById('weatherCondition').textContent = weatherConditions[weatherCode] || 'Unknown';
    
    // Update background based on weather
    updateBackground(weatherCode);
    
    // Temperature
    updateTemperatureDisplay(current.temperature_2m);
    
    // Humidity
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    
    // Wind Speed
    document.getElementById('windSpeed').textContent = `${current.wind_speed_10m} km/h`;
    
    // Feels Like
    updateFeelsLikeDisplay(current.apparent_temperature);
}

// Update Background Based on Weather
function updateBackground(weatherCode) {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    
    // Remove weather-specific classes
    body.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-storm', 'weather-snow');
    
    const lightBg = {
        sunny: 'var(--bg-sunny)',
        cloudy: 'var(--bg-cloudy)',
        default: 'var(--bg-gradient-light)'
    };

    // Determine weather type
    if ([0, 1].includes(weatherCode)) {
        body.style.background = isDark ? 'var(--bg-gradient-dark)' : lightBg.sunny;
        body.classList.add('weather-sunny');
    } else if ([2, 3, 45, 48].includes(weatherCode)) {
        body.style.background = isDark ? 'var(--bg-gradient-dark)' : lightBg.cloudy;
        body.classList.add('weather-cloudy');
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
        body.style.background = isDark ? 'var(--bg-gradient-dark)' : lightBg.default;
        body.classList.add('weather-rainy');
    } else if ([95, 96, 99].includes(weatherCode)) {
        body.style.background = isDark ? 'var(--bg-gradient-dark)' : lightBg.default;
        body.classList.add('weather-storm');
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        body.style.background = isDark ? 'var(--bg-gradient-dark)' : lightBg.default;
        body.classList.add('weather-snow');
    } else {
        body.style.background = isDark ? 'var(--bg-gradient-dark)' : lightBg.default;
    }
}

// Display Hourly Forecast
function displayHourlyForecast(hourlyData) {
    const hourlyCards = document.getElementById('hourlyCards');
    hourlyCards.innerHTML = '';
    
    const currentHour = new Date().getHours();
    const startIndex = hourlyData.time.findIndex(time => {
        const hour = new Date(time).getHours();
        return hour >= currentHour;
    });
    
    // Get next 24 hours
    const hoursToShow = 24;
    for (let i = 0; i < hoursToShow; i++) {
        const index = startIndex + i;
        if (index >= hourlyData.time.length) break;
        
        const time = new Date(hourlyData.time[index]);
        const temp = isCelsius ? hourlyData.temperature_2m[index] : celsiusToFahrenheit(hourlyData.temperature_2m[index]);
        const weatherCode = hourlyData.weather_code[index];
        
        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <div class="time">${formatTime(time)}</div>
            <div class="icon">${weatherIcons[weatherCode] || '🌤️'}</div>
            <div class="temp">${Math.round(temp)}°${isCelsius ? 'C' : 'F'}</div>
        `;
        
        hourlyCards.appendChild(card);
    }
}

function getChartTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    return {
        text: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.9)',
        tick: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(100, 116, 139, 0.85)',
        grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        tempLine: isDark ? 'rgba(255, 255, 255, 0.8)' : '#1d4d4f',
        tempFill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(29, 77, 79, 0.12)'
    };
}

// Create Charts
function createCharts(hourlyData) {
    const chartTheme = getChartTheme();
    const currentHour = new Date().getHours();
    const startIndex = hourlyData.time.findIndex(time => {
        const hour = new Date(time).getHours();
        return hour >= currentHour;
    });
    
    const hoursToShow = 24;
    const labels = [];
    const temperatures = [];
    const humidities = [];
    const windSpeeds = [];
    
    for (let i = 0; i < hoursToShow; i++) {
        const index = startIndex + i;
        if (index >= hourlyData.time.length) break;
        
        labels.push(formatTime(new Date(hourlyData.time[index])));
        temperatures.push(isCelsius ? hourlyData.temperature_2m[index] : celsiusToFahrenheit(hourlyData.temperature_2m[index]));
        humidities.push(hourlyData.relative_humidity_2m[index]);
        windSpeeds.push(hourlyData.wind_speed_10m[index]);
    }
    
    // Destroy existing charts
    if (temperatureChart) temperatureChart.destroy();
    if (humidityChart) humidityChart.destroy();
    if (windChart) windChart.destroy();
    
    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (${isCelsius ? '°C' : '°F'})`,
                data: temperatures,
                borderColor: chartTheme.tempLine,
                backgroundColor: chartTheme.tempFill,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: chartTheme.text }
                }
            },
            scales: {
                x: {
                    ticks: { color: chartTheme.tick },
                    grid: { color: chartTheme.grid }
                },
                y: {
                    ticks: { color: chartTheme.tick },
                    grid: { color: chartTheme.grid }
                }
            }
        }
    });
    
    // Humidity Chart
    const humidityCtx = document.getElementById('humidityChart').getContext('2d');
    humidityChart = new Chart(humidityCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Humidity (%)',
                data: humidities,
                borderColor: 'rgba(100, 200, 255, 0.8)',
                backgroundColor: 'rgba(100, 200, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: chartTheme.text }
                }
            },
            scales: {
                x: {
                    ticks: { color: chartTheme.tick },
                    grid: { color: chartTheme.grid }
                },
                y: {
                    ticks: { color: chartTheme.tick },
                    grid: { color: chartTheme.grid }
                }
            }
        }
    });
    
    // Wind Speed Chart
    const windCtx = document.getElementById('windChart').getContext('2d');
    windChart = new Chart(windCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Wind Speed (km/h)',
                data: windSpeeds,
                borderColor: 'rgba(255, 200, 100, 0.8)',
                backgroundColor: 'rgba(255, 200, 100, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: chartTheme.text }
                }
            },
            scales: {
                x: {
                    ticks: { color: chartTheme.tick },
                    grid: { color: chartTheme.grid }
                },
                y: {
                    ticks: { color: chartTheme.tick },
                    grid: { color: chartTheme.grid }
                }
            }
        }
    });
}

// Update Temperature Display
function updateTemperatureDisplay(tempCelsius) {
    const temp = isCelsius ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    document.getElementById('temperature').textContent = Math.round(temp);
    document.querySelector('.temp-unit').textContent = `°${isCelsius ? 'C' : 'F'}`;
}

// Update Feels Like Display
function updateFeelsLikeDisplay(tempCelsius) {
    const temp = isCelsius ? tempCelsius : celsiusToFahrenheit(tempCelsius);
    document.getElementById('feelsLike').textContent = `${Math.round(temp)}°${isCelsius ? 'C' : 'F'}`;
}

// Set Temperature Unit
function setTemperatureUnit(celsius) {
    isCelsius = celsius;
    
    // Update button states
    if (celsius) {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
    }
    
    // Update displays if data exists
    if (currentWeatherData) {
        updateTemperatureDisplay(currentWeatherData.current.temperature_2m);
        updateFeelsLikeDisplay(currentWeatherData.current.apparent_temperature);
        displayHourlyForecast(currentWeatherData.hourly);
        createCharts(currentWeatherData.hourly);
    }
}

// Celsius to Fahrenheit Conversion
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Format Date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format Time
function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}

// Show Loading
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

// Hide Loading
function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

// Show Error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

// Hide Error
function hideError() {
    errorMessage.classList.add('hidden');
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    if (currentWeatherData) {
        updateBackground(currentWeatherData.current.weather_code);
        createCharts(currentWeatherData.hourly);
    }
}

// Load Theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
}

// Save Recent Search
function saveRecentSearch(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    // Remove if already exists
    recentSearches = recentSearches.filter(search => search.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning
    recentSearches.unshift(city);
    
    // Keep only last 5
    recentSearches = recentSearches.slice(0, 5);
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    loadRecentSearches();
}

// Remove Recent Search
function removeRecentSearch(city, event) {
    event.stopPropagation();
    event.preventDefault();

    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recentSearches = recentSearches.filter(
        search => search.toLowerCase() !== city.toLowerCase()
    );
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    loadRecentSearches();
}

// Load Recent Searches
function loadRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recentSearchesDiv.innerHTML = '';

    if (recentSearches.length === 0) return;

    recentSearches.forEach(city => {
        const item = document.createElement('span');
        item.className = 'recent-search-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.title = `Search ${city}`;

        const label = document.createElement('span');
        label.className = 'recent-search-label';
        label.textContent = city;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'recent-search-remove';
        removeBtn.setAttribute('aria-label', `Remove ${city} from recent searches`);
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => removeRecentSearch(city, e));

        item.appendChild(label);
        item.appendChild(removeBtn);

        item.addEventListener('click', () => {
            cityInput.value = city;
            handleSearch();
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cityInput.value = city;
                handleSearch();
            }
        });

        recentSearchesDiv.appendChild(item);
    });
}

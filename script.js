
const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY";

const selectors = {
  cityInput: document.getElementById("city-input"),
  searchBtn: document.getElementById("search-btn"),
  locationBtn: document.getElementById("location-btn"),
  languageSelect: document.getElementById("language-select"),
  statusText: document.getElementById("status-text"),
  currentLocation: document.getElementById("current-location"),
  currentTemp: document.getElementById("current-temp"),
  currentFeels: document.getElementById("current-feels"),
  currentIcon: document.getElementById("current-icon"),
  currentDesc: document.getElementById("current-desc"),
  currentDatetime: document.getElementById("current-datetime"),
  windSpeed: document.getElementById("wind-speed"),
  humidity: document.getElementById("humidity"),
  aqi: document.getElementById("aqi"),
  aqiLabel: document.getElementById("aqi-label"),
  precip: document.getElementById("precip"),
  forecastList: document.getElementById("forecast-list"),
  currentCard: document.querySelector(".current-weather"),
  metricsCard: document.querySelector(".metrics-card"),
  forecastCard: document.querySelector(".forecast-card"),
};

const i18nLabels = {
  app_title: {
    en: "WeatherSphere",
    hi: "वेधरस्फीयर",
    es: "WeatherSphere",
    fr: "WeatherSphere",
  },
  app_subtitle: {
    en: "Live forecast, air & earth in motion",
    hi: "लाइव पूर्वानुमान, हवा और धरती की धड़कन",
    es: "Pronóstico en vivo, aire y tierra en movimiento",
    fr: "Prévisions en direct, air et terre en mouvement",
  },
  search: {
    en: "Search",
    hi: "खोजें",
    es: "Buscar",
    fr: "Rechercher",
  },
  use_location: {
    en: "Use Live Location",
    hi: "लाइव लोकेशन",
    es: "Usar ubicación",
    fr: "Utiliser la position",
  },
  current_conditions: {
    en: "Current Conditions",
    hi: "वर्तमान स्थिति",
    es: "Condiciones actuales",
    fr: "Conditions actuelles",
  },
  air_and_elements: {
    en: "Wind · Air · Water · Earth",
    hi: "वायु · हवा · जल · धरती",
    es: "Viento · Aire · Agua · Tierra",
    fr: "Vent · Air · Eau · Terre",
  },
  wind_speed: {
    en: "Wind speed",
    hi: "पवन वेग",
    es: "Velocidad del viento",
    fr: "Vitesse du vent",
  },
  humidity: {
    en: "Humidity",
    hi: "नमी",
    es: "Humedad",
    fr: "Humidité",
  },
  aqi: {
    en: "Air Quality (AQI)",
    hi: "वायु गुणवत्ता (AQI)",
    es: "Calidad del aire (AQI)",
    fr: "Qualité de l'air (AQI)",
  },
  precip: {
    en: "Precipitation",
    hi: "वर्षा",
    es: "Precipitación",
    fr: "Précipitations",
  },
  seven_day_outlook: {
    en: "7‑Day Outlook",
    hi: "7‑दिवसीय पूर्वानुमान",
    es: "Pronóstico de 7 días",
    fr: "Prévisions sur 7 jours",
  },
  footer_powered_by: {
    en: "Powered by",
    hi: "द्वारा संचालित",
    es: "Con tecnología de",
    fr: "Propulsé par",
  },
  language_label: {
    en: "Language",
    hi: "भाषा",
    es: "Idioma",
    fr: "Langue",
  },
  lang_auto: {
    en: "Auto (Browser)",
    hi: "ऑटो (ब्राउज़र)",
    es: "Auto (navegador)",
    fr: "Auto (navigateur)",
  },
  lang_en: { en: "English" },
  lang_hi: { en: "Hindi", hi: "हिन्दी" },
  lang_es: { en: "Spanish", es: "Español" },
  lang_fr: { en: "French", fr: "Français" },
  lang_de: { en: "German", de: "Deutsch" },
  lang_zh_cn: { en: "Chinese (Simplified)" },
  lang_ja: { en: "Japanese" },
  lang_ru: { en: "Russian" },
  lang_ar: { en: "Arabic" },
  lang_pt: { en: "Portuguese" },
  lang_bn: { en: "Bengali" },
  lang_tr: { en: "Turkish" },
  language_hint: {
    en: "Weather descriptions use your selected language; UI auto-falls back to English.",
  },
};

const state = {
  lang: "auto",
  timezoneOffsetMinutes: 0,
  timezoneOffsetSeconds: null,
  liveClockTimer: null,
};

function setStatus(message, type = "info") {
  if (!selectors.statusText) return;
  selectors.statusText.textContent = message || "";
  selectors.statusText.style.color =
    type === "error" ? "#fecaca" : type === "success" ? "#bbf7d0" : "#a0aec0";
}

function getEffectiveLang() {
  if (state.lang === "auto") {
    const browserLang = navigator.language || "en";
    return browserLang.toLowerCase().replace("-", "_");
  }
  return state.lang;
}

function applyI18n() {
  const lang = (navigator.language || "en").slice(0, 2);
  const effective = state.lang === "auto" ? lang : state.lang.slice(0, 2);

  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const dict = i18nLabels[key];
      if (!dict) return;
      const localized = dict[effective] || dict[lang] || dict.en;
      if (localized) el.textContent = localized;
    });
}

function setCardLoading(loading) {
  [selectors.currentCard, selectors.metricsCard, selectors.forecastCard].forEach(
    (card) => {
      if (!card) return;
      card.classList.toggle("loading", Boolean(loading));
    }
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getNowUnixSeconds() {
  return Math.floor(Date.now() / 1000);
}


function formatLocalTime(unixSeconds, timezoneOffsetSeconds) {
  const shiftedMillis = (unixSeconds + timezoneOffsetSeconds) * 1000;
  const date = new Date(shiftedMillis);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getUTCDay()
  ];
  const hh = pad2(date.getUTCHours());
  const mm = pad2(date.getUTCMinutes());
  return `${weekday} ${hh}:${mm}`;
}

function formatDay(unixSeconds, timezoneOffsetSeconds) {
  const shiftedMillis = (unixSeconds + timezoneOffsetSeconds) * 1000;
  const date = new Date(shiftedMillis);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getUTCDay()
  ];
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][date.getUTCMonth()];
  return `${weekday} ${date.getUTCDate()} ${month}`;
}

function startLiveClock(timezoneOffsetSeconds) {
  if (typeof timezoneOffsetSeconds !== "number") return;
  state.timezoneOffsetSeconds = timezoneOffsetSeconds;

  const tick = () => {
    if (
      typeof state.timezoneOffsetSeconds !== "number" ||
      !selectors.currentDatetime
    ) {
      return;
    }
    selectors.currentDatetime.textContent = formatLocalTime(
      getNowUnixSeconds(),
      state.timezoneOffsetSeconds
    );
  };

  tick();
  if (state.liveClockTimer) clearInterval(state.liveClockTimer);
  state.liveClockTimer = setInterval(tick, 1000);
}

function getAqiLabel(idx) {
  if (!idx) return { text: "Unknown", color: "#a0aec0" };
  switch (idx) {
    case 1:
      return { text: "Good", color: "#48bb78" };
    case 2:
      return { text: "Fair", color: "#a3e635" };
    case 3:
      return { text: "Moderate", color: "#facc15" };
    case 4:
      return { text: "Poor", color: "#fb923c" };
    case 5:
      return { text: "Very Poor", color: "#f56565" };
    default:
      return { text: "Unknown", color: "#a0aec0" };
  }
}

function updateCurrentWeather(current, timezoneOffsetSeconds, placeLabel) {
  if (!current) return;
  const { temp, feels_like, weather } = current;
  const condition = weather && weather[0] ? weather[0] : {};

  selectors.currentTemp.textContent =
    temp != null ? `${Math.round(temp)}°` : "--°";
  selectors.currentFeels.textContent =
    feels_like != null ? `Feels like ${Math.round(feels_like)}°` : "";

  if (condition.icon) {
    selectors.currentIcon.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
    selectors.currentIcon.style.display = "block";
  } else {
    selectors.currentIcon.style.display = "none";
  }

  selectors.currentDesc.textContent = condition.description || "—";
  // Current time should be live for the target location.
  startLiveClock(timezoneOffsetSeconds);
  selectors.currentLocation.textContent = placeLabel || "—";
}

function updateMetrics(current, hourly, aqiData) {
  if (current && current.wind_speed != null) {
    const kmh = current.wind_speed * 3.6;
    selectors.windSpeed.textContent = kmh.toFixed(1);
  } else {
    selectors.windSpeed.textContent = "--";
  }

  selectors.humidity.textContent =
    current && current.humidity != null ? current.humidity : "--";

  let precipMm = 0;
  if (hourly && hourly.length > 0) {
    const firstHour = hourly[0];
    if (firstHour.rain && firstHour.rain["1h"] != null) {
      precipMm += firstHour.rain["1h"];
    }
    if (firstHour.snow && firstHour.snow["1h"] != null) {
      precipMm += firstHour.snow["1h"];
    }
  }
  selectors.precip.textContent =
    precipMm > 0 ? precipMm.toFixed(1) : "0.0";

  if (aqiData && Array.isArray(aqiData.list) && aqiData.list[0]) {
    const idx = aqiData.list[0].main.aqi;
    const label = getAqiLabel(idx);
    selectors.aqi.textContent = idx;
    selectors.aqiLabel.textContent = label.text;
    selectors.aqiLabel.style.borderColor = label.color;
    selectors.aqiLabel.style.color = label.color;
  } else {
    selectors.aqi.textContent = "--";
    selectors.aqiLabel.textContent = "—";
    selectors.aqiLabel.style.borderColor = "rgba(148, 163, 184, 0.4)";
    selectors.aqiLabel.style.color = "#a0aec0";
  }
}

function updateForecast(daily, timezoneOffsetSeconds) {
  selectors.forecastList.innerHTML = "";
  if (!Array.isArray(daily)) return;

  daily.slice(0, 7).forEach((day, index) => {
    const item = document.createElement("article");
    item.className = "forecast-day";

    const dateLabel =
      index === 0 ? "Today" : formatDay(day.dt, timezoneOffsetSeconds);

    const iconCode = day.weather && day.weather[0] && day.weather[0].icon;
    const desc = day.weather && day.weather[0] && day.weather[0].description;

    const min = Math.round(day.temp.min);
    const max = Math.round(day.temp.max);
    const windKmh =
      day.wind_speed != null ? (day.wind_speed * 3.6).toFixed(0) : null;

    item.innerHTML = `
      <div class="forecast-date">${dateLabel}</div>
      <div class="forecast-main">
        <div class="forecast-temp">
          <span>${max}°</span>
          <span style="color:#94a3b8;"> / ${min}°</span>
        </div>
        ${
          iconCode
            ? `<img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="" width="32" height="32" />`
            : ""
        }
      </div>
      <div class="forecast-desc">${desc || ""}</div>
      <div class="forecast-extra">
        <span>UV ${day.uvi != null ? day.uvi.toFixed(0) : "-"}</span>
        <span>${windKmh ? windKmh + " km/h" : ""}</span>
      </div>
    `;

    selectors.forecastList.appendChild(item);
  });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

async function getCoordinatesByCity(city) {
  const lang = getEffectiveLang();
  const q = encodeURIComponent(city.trim());
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=1&appid=${OPENWEATHER_API_KEY}&lang=${lang}`;
  const data = await fetchJson(url);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("City not found");
  }
  const place = data[0];
  const labelParts = [place.name];
  if (place.state) labelParts.push(place.state);
  if (place.country) labelParts.push(place.country);
  return {
    lat: place.lat,
    lon: place.lon,
    label: labelParts.join(", "),
  };
}

async function getWeatherAndAqi(lat, lon) {
  const lang = getEffectiveLang();
  const units = "metric";

  // Free-tier friendly endpoints (no One Call subscription required).
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;

  const [current, forecast, aqi] = await Promise.all([
    fetchJson(currentUrl),
    fetchJson(forecastUrl),
    fetchJson(aqiUrl).catch(() => null),
  ]);

  const timezoneOffsetSeconds =
    current && typeof current.timezone === "number" ? current.timezone : 0;

  const normalizedCurrent = {
    dt: current.dt,
    temp: current.main?.temp,
    feels_like: current.main?.feels_like,
    humidity: current.main?.humidity,
    wind_speed: current.wind?.speed,
    weather: Array.isArray(current.weather) ? current.weather : [],
  };

  const hourly = Array.isArray(forecast?.list)
    ? forecast.list.slice(0, 24).map((h) => ({
        dt: h.dt,
        temp: h.main?.temp,
        feels_like: h.main?.feels_like,
        humidity: h.main?.humidity,
        wind_speed: h.wind?.speed,
        weather: Array.isArray(h.weather) ? h.weather : [],
        rain: h.rain && h.rain["3h"] != null ? { "1h": h.rain["3h"] / 3 } : undefined,
        snow: h.snow && h.snow["3h"] != null ? { "1h": h.snow["3h"] / 3 } : undefined,
      }))
    : [];

  const byDay = new Map();
  if (Array.isArray(forecast?.list)) {
    for (const item of forecast.list) {
      const localMillis = (item.dt + timezoneOffsetSeconds) * 1000;
      const key = new Date(localMillis).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(item);
    }
  }

  const daily = Array.from(byDay.entries())
    .slice(0, 7)
    .map(([, items]) => {
      const temps = items
        .map((x) => x.main?.temp)
        .filter((t) => typeof t === "number");
      const min = temps.length ? Math.min(...temps) : null;
      const max = temps.length ? Math.max(...temps) : null;

      const noonish =
        items.find((x) => String(x.dt_txt || "").includes("12:00:00")) || items[0];
      const weatherArr = Array.isArray(noonish?.weather) ? noonish.weather : [];

      const windSpeeds = items
        .map((x) => x.wind?.speed)
        .filter((s) => typeof s === "number");
      const windAvg =
        windSpeeds.length ? windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length : null;

      return {
        dt: items[0]?.dt,
        temp: { min: min ?? 0, max: max ?? 0 },
        wind_speed: windAvg,
        uvi: null,
        weather: weatherArr,
      };
    });

  const weather = {
    timezone_offset: timezoneOffsetSeconds,
    current: normalizedCurrent,
    hourly,
    daily,
  };

  return { weather, aqi };
}

async function loadByCity(city) {
  if (!city || !city.trim()) {
    setStatus("Type a city name first.", "error");
    return;
  }
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes("YOUR_OPENWEATHER")) {
    setStatus("Set your OpenWeather API key in script.js first.", "error");
    return;
  }
  try {
    setCardLoading(true);
    setStatus("Finding city…");
    const { lat, lon, label } = await getCoordinatesByCity(city);
    setStatus("Loading weather data…");
    const { weather, aqi } = await getWeatherAndAqi(lat, lon);
    state.timezoneOffsetMinutes = (weather.timezone_offset || 0) / 60;
    startLiveClock(weather.timezone_offset || 0);

    updateCurrentWeather(weather.current, weather.timezone_offset, label);
    updateMetrics(weather.current, weather.hourly, aqi);
    updateForecast(weather.daily, weather.timezone_offset);
    setStatus("Updated forecast.", "success");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Unable to load weather now.", "error");
  } finally {
    setCardLoading(false);
  }
}

function getGeolocationPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}

async function loadByLiveLocation() {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes("YOUR_OPENWEATHER")) {
    setStatus("Set your OpenWeather API key in script.js first.", "error");
    return;
  }
  try {
    setCardLoading(true);
    setStatus("Requesting your live location…");
    const pos = await getGeolocationPosition();
    const { latitude, longitude } = pos.coords;
    setStatus("Loading weather for your location…");
    const { weather, aqi } = await getWeatherAndAqi(latitude, longitude);
    state.timezoneOffsetMinutes = (weather.timezone_offset || 0) / 60;
    startLiveClock(weather.timezone_offset || 0);

    const placeLabel = "Your location";

    updateCurrentWeather(weather.current, weather.timezone_offset, placeLabel);
    updateMetrics(weather.current, weather.hourly, aqi);
    updateForecast(weather.daily, weather.timezone_offset);
    setStatus("Live location forecast updated.", "success");
  } catch (err) {
    console.error(err);
    const msg =
      err.code === 1
        ? "Location permission denied. You can still search by city."
        : err.message || "Unable to use your live location.";
    setStatus(msg, "error");
  } finally {
    setCardLoading(false);
  }
}

function wireEvents() {
  selectors.searchBtn.addEventListener("click", () => {
    loadByCity(selectors.cityInput.value);
  });

  selectors.cityInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      loadByCity(selectors.cityInput.value);
    }
  });

  selectors.locationBtn.addEventListener("click", () => {
    loadByLiveLocation();
  });

  selectors.languageSelect.addEventListener("change", () => {
    state.lang = selectors.languageSelect.value;
    applyI18n();
    setStatus("Language updated. Search again to localize descriptions.", "info");
  });
}

function init() {
  applyI18n();
  wireEvents();
  if (navigator.geolocation) {
    loadByLiveLocation();
  } else {
    setStatus("Tip: enable location or search for a city.", "info");
  }
}

window.addEventListener("DOMContentLoaded", init);


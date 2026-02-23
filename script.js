const input = document.querySelector(".search-box input");
const searchIcon = document.querySelector(".search-icon");
const themeToggle = document.getElementById("theme-toggle");

const cityName = document.getElementById("cityName");
const tempValue = document.getElementById("tempValue");
const weatherType = document.getElementById("weatherType");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const wind = document.getElementById("wind");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const uv = document.getElementById("uv");

const dayForecast = document.querySelector(".day-part-forecast");
const hourlyForecast = document.querySelector(".hourly-forecast");

const apiKey = "d9c5c281e7e00cc091908097716380d3";
const currentUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
  } else {
    themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
  }

  checkWeather("Delhi");
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
  }
});

searchIcon.addEventListener("click", searchCity);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchCity();
});

function searchCity() {
  const city = input.value.trim();
  if (city !== "") {
    checkWeather(city);
    input.value = "";
  }
}

function getWeatherImage(condition, hour) {
  const isNight = hour < 6 || hour >= 19;

  if (condition === "Clear")
    return isNight ? "images/moon.png" : "images/clear.png";
  if (condition === "Clouds") return "images/clouds.png";
  if (condition === "Drizzle") return "images/drizzle.png";
  if (condition === "Rain") return "images/rain.png";
  if (condition === "Snow") return "images/snow.png";
  if (["Mist", "Fog", "Haze"].includes(condition)) return "images/mist.png";

  return "images/clear.png";
}

async function checkWeather(city) {
  try {
    resetForecastUI();

    const response = await fetch(`${currentUrl}${city}&appid=${apiKey}`);
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();

    cityName.innerText = `${data.name}, ${data.sys.country}`;
    tempValue.innerHTML = `<i class="fa-solid fa-temperature-c"></i> ${Math.round(data.main.temp)}°C`;
    weatherType.innerText = data.weather[0].main;

    feelsLike.innerHTML = `<i class="fa-solid fa-temperature-c"></i> ${Math.round(data.main.feels_like)}°C`;
    wind.innerText = data.wind.speed + " km/h";
    humidity.innerText = data.main.humidity + "%";
    pressure.innerText = data.main.pressure + " mb";
    visibility.innerText = (data.visibility / 1000).toFixed(1) + " km";
    uv.innerText = "N/A";

    const hour = new Date().getHours();
    weatherIcon.src = getWeatherImage(data.weather[0].main, hour);

    await getForecast(city);
  } catch (error) {
    alert("City not found or network error");
    console.error(error);
  }
}

function resetForecastUI() {
  hourlyForecast.innerHTML = "<h3>Loading Hourly Forecast...</h3>";
  dayForecast.innerHTML = "";
  const nextDays = document.querySelector(".next-days-forecast");
  if (nextDays) nextDays.remove();
}

async function getForecast(city) {
  try {
    const res = await fetch(`${forecastUrl}${city}&appid=${apiKey}`);
    if (!res.ok) throw new Error("Forecast error");

    const forecastData = await res.json();

    hourlyForecast.innerHTML = `
      <h3>Hourly Forecast</h3>
      <div class="hour-row header">
        <span>Time</span>
        <span>Temp</span>
        <span>Weather</span>
        <span>Main</span>
        <span>Humidity</span>
      </div>
    `;

    for (let i = 0; i < 5; i++) {
      const hourData = forecastData.list[i];
      const dt = new Date(hourData.dt * 1000);
      const hour = dt.getHours();
      const time = dt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      hourlyForecast.innerHTML += `
        <div class="hour-row">
          <span>${time}</span>
          <span class="temp">${Math.round(hourData.main.temp)}°C</span>
          <img src="${getWeatherImage(hourData.weather[0].main, hour)}">
          <span>${hourData.weather[0].main}</span>
          <span><i class="fa-solid fa-droplet"></i>${hourData.main.humidity}%</span>
        </div>
      `;
    }

    const dayParts = {
      Morning: null,
      Afternoon: null,
      Evening: null,
      Night: null,
    };
    forecastData.list.forEach((item) => {
      const dt = new Date(item.dt * 1000);
      const hr = dt.getHours();
      if (hr >= 6 && hr < 12 && !dayParts.Morning) dayParts.Morning = item;
      else if (hr >= 12 && hr < 17 && !dayParts.Afternoon)
        dayParts.Afternoon = item;
      else if (hr >= 17 && hr < 19 && !dayParts.Evening)
        dayParts.Evening = item;
      else if ((hr >= 19 || hr < 6) && !dayParts.Night) dayParts.Night = item;
    });

    dayForecast.innerHTML = "";
    for (let part in dayParts) {
      const d = dayParts[part];
      if (!d) continue;
      const dt = new Date(d.dt * 1000);
      const hour = dt.getHours();
      dayForecast.innerHTML += `
        <div class="forecast-row">
          <span>${part}</span>
          <span class="temp">${Math.round(d.main.temp)}°C</span>
          <img src="${getWeatherImage(d.weather[0].main, hour)}">
          <span>${d.weather[0].main}</span>
          <span><i class="fa-solid fa-droplet"></i>${d.main.humidity}%</span>
        </div>
      `;
    }

    const daysContainer = document.createElement("div");
    daysContainer.classList.add("next-days-forecast");

    const uniqueDays = {};
    forecastData.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];
      if (!uniqueDays[date]) uniqueDays[date] = item;
    });

    let count = 0;
    for (let day in uniqueDays) {
      if (count >= 7) break;
      const d = uniqueDays[day];
      const dayName = new Date(d.dt_txt).toLocaleDateString("en-US", {
        weekday: "long",
      });
      daysContainer.innerHTML += `
    <div class="forecast-row">
      <span>${dayName}</span>
      <span class="temp">${Math.round(d.main.temp)}°C</span>
      <img src="${getWeatherImage(d.weather[0].main, 12)}">
      <span>${d.weather[0].main}</span>
      <span><i class="fa-solid fa-droplet"></i>${d.main.humidity}%</span>
    </div>
  `;
      count++;
    }

    const nextDaysWrapper = document.querySelector(".next-days-wrapper");
    nextDaysWrapper.innerHTML = "";
    nextDaysWrapper.appendChild(daysContainer);
  } catch (error) {
    console.error("Forecast Error:", error);
  }
}

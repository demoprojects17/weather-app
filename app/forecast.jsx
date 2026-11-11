"use client";
import { useEffect, useRef, useState } from "react";
import { num, weather } from "../lib/weather";
export function Forecast({ data }) {
  const [active, setActive] = useState(null);
  const timer = useRef();
  const root = useRef();
  useEffect(() => {
    setActive(null);
  }, [data]);
  useEffect(() => {
    const close = (e) => {
      if (
        e.key === "Escape" ||
        (e.type === "pointerdown" && !root.current?.contains(e.target))
      )
        setActive(null);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);
  return (
    <div
      id="forecast"
      className="forecast"
      ref={root}
      aria-label="ამინდის პროგნოზი"
    >
      {data?.daily.time.slice(0, 6).map((date, i) => {
        const d = data.daily,
          c = data.current,
          today = i === 0,
          title = today
            ? "დღეს"
            : new Intl.DateTimeFormat("ka", { weekday: "short" }).format(
                new Date(date + "T12:00:00"),
              );
        const [icon, label] = weather(
            today ? c.weather_code : d.weather_code[i],
            today ? c.is_day : 1,
          ),
          temp = num(today ? c.temperature_2m : d.temperature_2m_max[i]),
          expanded = active === i;
        const show = () => {
          clearTimeout(timer.current);
          setActive(i);
        };
        const metrics = today
          ? [
              ["შეგრძნებით", `${num(c.apparent_temperature)}°`],
              ["ქარი", `${num(c.wind_speed_10m)} კმ/სთ`],
              ["ტენიანობა", `${num(c.relative_humidity_2m)}%`],
              ["მზის ჩასვლა", d.sunset[i]?.slice(11, 16)],
            ]
          : [
              ["მაქსიმუმი", `${num(d.temperature_2m_max[i])}°`],
              ["მინიმუმი", `${num(d.temperature_2m_min[i])}°`],
              ["მზის ამოსვლა", d.sunrise[i]?.slice(11, 16)],
              ["მზის ჩასვლა", d.sunset[i]?.slice(11, 16)],
            ];
        return (
          <article
            key={date}
            className={`forecast-card${expanded ? " is-expanded" : ""}`}
            tabIndex={0}
            role="button"
            aria-expanded={expanded}
            aria-label={`${title}, ${date} — ამინდის დეტალები`}
            onMouseEnter={show}
            onMouseLeave={() => {
              timer.current = setTimeout(() => setActive(null), 100);
            }}
            onFocus={show}
            onBlur={() => setActive(null)}
            onClick={show}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                show();
              }
            }}
          >
            <div className="card-summary" hidden={expanded}>
              <div>
                <div className="day-name">{title}</div>
                <div className="date">
                  {date.slice(8)}.{date.slice(5, 7)}
                </div>
              </div>
              <div className="summary-weather">
                <span className="summary-condition">{label}</span>
                <span className="weather-icon" aria-hidden="true">
                  {icon}
                </span>
              </div>
              <div>
                <div className="high">{temp}°</div>
                <div className="low">{num(d.temperature_2m_min[i])}°</div>
              </div>
            </div>
            <div className="card-expanded" hidden={!expanded}>
              <div className="card-top">
                <span>{title}</span>
                <span>
                  {today
                    ? c.time.slice(11, 16)
                    : `${date.slice(8)}.${date.slice(5, 7)}`}
                </span>
              </div>
              <div className="current-main">
                <span className="temperature">{temp}°</span>
                <span className="weather-icon" aria-hidden="true">
                  {icon}
                </span>
              </div>
              <p className="condition">{label}</p>
              <div className="metrics">
                {metrics.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{value ?? "—"}</b>
                  </div>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
export function Rain({ data }) {
  return (
    <div id="rain" className="rain-chart">
      {data &&
        [6, 9, 12, 15, 18, 21].map((hour) => {
          const i = data.hourly.time.indexOf(
              `${data.current.time.slice(0, 10)}T${String(hour).padStart(2, "0")}:00`,
            ),
            v = i < 0 ? null : data.hourly.precipitation_probability[i];
          return (
            <div className="rain-bar" key={hour}>
              <b>
                {num(v)}
                {v == null ? "" : "%"}
              </b>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${v ?? 0}%` }} />
              </div>
              <small>{hour}:00</small>
            </div>
          );
        })}
    </div>
  );
}

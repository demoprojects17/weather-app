"use client";
import { useState, useEffect } from "react";
import {
  places,
  suggestedCities,
  cityKey,
  weather,
  num,
  getJSON,
} from "../lib/weather";
const cache = new Map();
function useCityWeather(p) {
  const [data, setData] = useState(null);
  const key = cityKey(p);
  useEffect(() => {
    let live = true;
    if (!cache.has(key))
      cache.set(
        key,
        getJSON(
          "https://api.open-meteo.com/v1/forecast?" +
            new URLSearchParams({
              latitude: p.latitude,
              longitude: p.longitude,
              current: "temperature_2m,weather_code,is_day",
              timezone: "auto",
            }),
        ).catch((e) => {
          cache.delete(key);
          throw e;
        }),
      );
    cache
      .get(key)
      .then((d) => {
        if (live) setData(d.current);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key, p.latitude, p.longitude]);
  return data;
}
function Pin({ place, loadCity }) {
  const d = useCityWeather(place);
  return (
    <button
      className="map-pin"
      style={{
        left: `${((place.longitude + 180) / 360) * 100}%`,
        top: `${((90 - place.latitude) / 180) * 100}%`,
      }}
      aria-label={place.name}
      onClick={() => loadCity(place)}
    >
      {d ? weather(d.weather_code, d.is_day)[0] : "⌖"}
    </button>
  );
}
export function MapPins({ loadCity }) {
  return (
    <div id="map-pins">
      {places.map((p) => (
        <Pin key={cityKey(p)} place={p} loadCity={loadCity} />
      ))}
    </div>
  );
}
function City({ place, model }) {
  const d = useCityWeather(place),
    [icon, label] = d
      ? weather(d.weather_code, d.is_day)
      : ["", "სანახავად აირჩიე"];
  return (
    <div className="city-item">
      <button className="city" onClick={() => model.loadCity(place)}>
        <div>
          <small>{place.country}</small>
          <h3>{place.name}</h3>
          <p>{label}</p>
        </div>
        <div className="city-right">
          <span className="weather-icon" aria-hidden="true">
            {icon}
          </span>
          <div className="city-temp">{num(d?.temperature_2m)}°</div>
        </div>
      </button>
      <button
        className="city-save"
        aria-label={`${place.name} — ${model.isSaved(place) ? "შენახულებიდან წაშლა" : "შენახვა"}`}
        aria-pressed={model.isSaved(place)}
        onClick={() => model.toggleSaved(place)}
      >
        {model.isSaved(place) ? "★" : "☆"}
      </button>
    </div>
  );
}
export function Cities({ model }) {
  const [shown, setShown] = useState(3);
  return (
    <>
      <div id="cities" className="cities">
        {[
          ["შენახული ქალაქები", model.saved],
          [
            "აღმოაჩინე ქალაქები",
            suggestedCities.slice(0, shown).filter((p) => !model.isSaved(p)),
          ],
        ].map(
          ([title, list]) =>
            list.length > 0 && (
              <section className="city-group" key={title}>
                <h3 className="city-group-title">{title}</h3>
                {list.map((p) => (
                  <City key={cityKey(p)} place={p} model={model} />
                ))}
              </section>
            ),
        )}
      </div>
      <button
        id="more-cities"
        className="more-cities"
        hidden={shown >= suggestedCities.length}
        onClick={() => setShown((n) => n + 3)}
      >
        მეტი ქალაქი ↓
      </button>
    </>
  );
}

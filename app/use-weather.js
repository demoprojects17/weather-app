"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  places,
  getJSON,
  forecastURL,
  cityKey,
  resolveLocationName,
} from "../lib/weather";
const valid = (p) =>
  p &&
  typeof p.name === "string" &&
  Number.isFinite(p.latitude) &&
  Number.isFinite(p.longitude);
export function useWeather() {
  const [selected, setSelected] = useState(places[0]),
    [data, setData] = useState(null),
    [status, setStatus] = useState("მონაცემები იტვირთება…"),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true),
    [light, setLight] = useState(false),
    [saved, setSaved] = useState([]),
    [feedback, setFeedback] = useState(""),
    [locating, setLocating] = useState(false);
  const intent = useRef(0),
    controller = useRef(),
    retry = useRef(places[0]),
    dialog = useRef();
  const loadCity = useCallback(async (p) => {
    const id = ++intent.current;
    controller.current?.abort();
    controller.current = new AbortController();
    retry.current = p;
    setError(false);
    setLoading(true);
    setStatus(`${p.name} — მონაცემები იტვირთება…`);
    try {
      const d = await getJSON(forecastURL(p), controller.current.signal);
      if (id !== intent.current) return;
      setSelected(p);
      setData(d);
      setStatus(
        `განახლებულია ${d.current.time.slice(11, 16)} · ქალაქის ადგილობრივი დრო`,
      );
      try {
        if (!p.isLocation)
          localStorage.setItem("weather-city", JSON.stringify(p));
      } catch {}
      return true;
    } catch (e) {
      if (e.name !== "AbortError" && id === intent.current) {
        setError(true);
        setStatus("ამინდი ვერ ჩაიტვირთა. შეამოწმე ინტერნეტი.");
      }
    } finally {
      if (id === intent.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let p = places[0];
    try {
      const city = JSON.parse(localStorage.getItem("weather-city"));
      if (valid(city)) p = city;
      const favorites = JSON.parse(localStorage.getItem("weather-favorites"));
      if (Array.isArray(favorites))
        setSaved(favorites.filter((p) => valid(p) && !p.isLocation));
      setLight(localStorage.getItem("weather-theme") === "light");
      if (!localStorage.getItem("weather-location-asked"))
        dialog.current?.showModal();
    } catch {}
    loadCity(p);
    return () => {
      intent.current++;
      controller.current?.abort();
    };
  }, [loadCity]);
  useEffect(() => {
    document.body.classList.toggle("light", light);
  }, [light]);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    try {
      localStorage.setItem("weather-theme", next ? "light" : "dark");
    } catch {}
  };
  const isSaved = (p) => saved.some((c) => cityKey(c) === cityKey(p));
  const toggleSaved = (p) => {
    if (p.isLocation) return;
    const remove = isSaved(p),
      next = remove
        ? saved.filter((c) => cityKey(c) !== cityKey(p))
        : [
            ...saved,
            {
              name: p.name,
              country: p.country || "",
              latitude: p.latitude,
              longitude: p.longitude,
            },
          ];
    try {
      localStorage.setItem("weather-favorites", JSON.stringify(next));
      setSaved(next);
      setFeedback(
        remove
          ? `${p.name} სიიდან წაიშალა.`
          : `${p.name} შენახულია ამ ბრაუზერში.`,
      );
    } catch {
      setFeedback(
        "ქალაქი ვერ შეინახა. ბრაუზერში მონაცემების შენახვა შეზღუდულია.",
      );
    }
  };
  const remember = () => {
    try {
      localStorage.setItem("weather-location-asked", "yes");
    } catch {}
  };
  const useLocation = () => {
    remember();
    dialog.current?.close();
    const id = ++intent.current;
    controller.current?.abort();
    setLocating(true);
    setError(false);
    setLoading(false);
    setStatus("შენი მდებარეობა იძებნება…");
    const fail = (message) => {
      setLocating(false);
      if (id !== intent.current) return;
      setError(true);
      setStatus(message);
    };
    if (!navigator.geolocation) {
      fail("ბრაუზერს მდებარეობის განსაზღვრა არ შეუძლია. მოძებნე ქალაქი.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false);
        if (id !== intent.current) return;
        const { latitude, longitude } = position.coords,
          p = {
            name: `მდებარეობა ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            country: "",
            latitude,
            longitude,
            isLocation: true,
          };
        const ready = loadCity(p),
          current = intent.current,
          label = await resolveLocationName(latitude, longitude);
        const success = await ready;
        if (success && current === intent.current && label)
          setSelected({ ...p, ...label });
      },
      (e) =>
        fail(
          e.code === 1
            ? "მდებარეობის ნებართვა არ გაიცა. ბრაუზერში საიტის პარამეტრებიდან დაუშვი მდებარეობა და ხელახლა დააჭირე „მდებარეობის ნებართვას“."
            : "მდებარეობა ვერ განისაზღვრა. სცადე ხელახლა ან მოძებნე ქალაქი.",
        ),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };
  return {
    selected,
    data,
    status,
    error,
    loading,
    light,
    toggleTheme,
    saved,
    feedback,
    isSaved,
    toggleSaved,
    loadCity,
    dialog,
    remember,
    useLocation,
    locating,
    retry: () => loadCity(retry.current),
  };
}

"use client";
import { useEffect, useRef, useState } from "react";
import { getJSON } from "../lib/weather";
export default function Search({ inputRef, loadCity }) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [message, setMessage] = useState(""),
    [open, setOpen] = useState(false);
  const form = useRef(),
    controller = useRef(),
    id = useRef(0);
  useEffect(() => {
    const close = (e) => {
      if (
        e.key === "Escape" ||
        (e.type === "click" && !form.current?.contains(e.target))
      )
        setOpen(false);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      id.current++;
      controller.current?.abort();
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  async function search(e) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    const request = ++id.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setOpen(true);
    setResults([]);
    setMessage("ვეძებთ ქალაქს…");
    try {
      const data = await getJSON(
        "https://geocoding-api.open-meteo.com/v1/search?" +
          new URLSearchParams({
            name: "სამტრედია".startsWith(q.toLocaleLowerCase("ka"))
              ? "Samtredia"
              : q,
            count: 6,
            language: "ka",
            format: "json",
          }),
        controller.current.signal,
      );
      if (request !== id.current) return;
      setResults(
        (data.results || []).map((p) =>
          p.id === 612126 ? { ...p, name: "სამტრედია" } : p,
        ),
      );
      setMessage(
        data.results?.length ? "" : "ქალაქი ვერ მოიძებნა. სცადე სხვა სახელი.",
      );
    } catch (e) {
      if (e.name !== "AbortError" && request === id.current)
        setMessage("ძებნა ვერ შესრულდა. სცადე ხელახლა.");
    }
  }
  return (
    <form id="search-form" role="search" ref={form} onSubmit={search}>
      <span>⌕</span>
      <input
        id="search"
        ref={inputRef}
        aria-label="ქალაქის ძებნა"
        placeholder="მოძებნე ქალაქი..."
        autoComplete="off"
        minLength={2}
        required
        value={query}
        onChange={(e) => {
          id.current++;
          controller.current?.abort();
          setQuery(e.target.value);
          setOpen(false);
        }}
      />
      <button type="submit">
        ძებნა <span>↗</span>
      </button>
      <div id="results" hidden={!open}>
        {message && <p>{message}</p>}
        {results.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => {
              setOpen(false);
              setQuery("");
              loadCity(p);
            }}
          >
            {[p.name, p.admin1, p.country].filter(Boolean).join(", ")}
          </button>
        ))}
      </div>
    </form>
  );
}

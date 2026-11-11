"use client";
import { useRef } from "react";
import { useWeather } from "./use-weather";
import { Forecast, Rain } from "./forecast";
import { MapPins, Cities } from "./cities";
import Search from "./search";
export default function Page() {
  const m = useWeather(),
    inputRef = useRef();
  const focusSearch = () => {
    inputRef.current.focus();
    inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <>
      <main className="dashboard">
        <header>
          <a className="brand" href="./" aria-label="მთავარი">
            ✦
          </a>
          <div className="location">
            <button
              id="locate"
              onClick={m.useLocation}
              disabled={m.locating}
              className="pin locate-button"
              aria-label="ჩემი მდებარეობის გამოყენება"
              title="ჩემი მდებარეობა"
            >
              ⌖
            </button>
            <div>
              <small>ამინდი შენთან</small>
              <strong id="location">
                {[m.selected.name, m.selected.country]
                  .filter(Boolean)
                  .join(", ")}
              </strong>
            </div>
          </div>
          <Search inputRef={inputRef} loadCity={m.loadCity} />
          <button
            id="theme"
            className="theme"
            onClick={m.toggleTheme}
            aria-label={m.light ? "მუქი თემის ჩართვა" : "ღია თემის ჩართვა"}
          >
            <span className="theme-sun" aria-hidden="true">
              ☀
            </span>
            <span className="theme-moon" aria-hidden="true">
              ☾
            </span>
          </button>
        </header>
        <div className="intro">
          <div>
            <p className="eyebrow">ყოველი დღის ახალი პერსპექტივა</p>
            <h1>შენი დღე, შენი ამინდი.</h1>
          </div>
          <div className="intro-actions">
            <button
              id="location-permission"
              onClick={() => m.dialog.current.showModal()}
              className="quiet-button"
              aria-haspopup="dialog"
            >
              ⌖ მდებარეობის ნებართვა
            </button>
            <button
              id="save-city"
              className="quiet-button"
              disabled={m.loading || m.selected.isLocation}
              aria-pressed={m.isSaved(m.selected)}
              onClick={() => m.toggleSaved(m.selected)}
            >
              {m.selected.isLocation
                ? `⌖ ${m.selected.name}`
                : m.isSaved(m.selected)
                  ? "★ შენახულია"
                  : "☆ ქალაქის შენახვა"}
            </button>
            <span className="live">
              <i></i> ცოცხალი პროგნოზი
            </span>
          </div>
        </div>
        <div
          id="status"
          role="status"
          aria-live="polite"
          className={m.error ? "error" : ""}
        >
          {m.status} {m.error && <button onClick={m.retry}>ხელახლა ცდა</button>}
        </div>
        <div className="layout">
          <section className="main-column">
            <div className="section-heading">
              <h2>ამინდის პროგნოზი</h2>
              <span className="pill">მომდევნო 5 დღე</span>
            </div>
            <div aria-busy={m.loading}>
              <Forecast data={m.data} />
            </div>
            <div className="section-heading map-heading">
              <h2>მსოფლიო შენს წინ</h2>
              <span className="muted">აირჩიე ქალაქი რუკაზე ↗</span>
            </div>
            <div className="world">
              <div className="map-grid"></div>
              <img className="world-map" src="/world.svg" alt="მსოფლიოს რუკა" />
              <MapPins loadCity={m.loadCity} />
              <button id="explore" onClick={focusSearch} className="map-search">
                ⌕ <span>ქალაქის ძებნა</span> ↗
              </button>
              <span className="map-caption">მსოფლიოს ამინდი · °C</span>
            </div>
          </section>
          <aside>
            <div className="section-heading">
              <h2>წვიმის ალბათობა</h2>
              <span className="muted">დღეს</span>
            </div>
            <div className="rain-panel">
              <div className="chart-labels">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>
              <Rain data={m.data} />
            </div>
            <div className="section-heading cities-heading">
              <h2>სხვა ქალაქები</h2>
              <button
                id="find-city"
                onClick={focusSearch}
                className="quiet-button"
                aria-label="ქალაქის დამატება"
              >
                ＋ დამატება
              </button>
            </div>
            <p id="city-feedback" className="city-feedback" role="status">
              {m.feedback}
            </p>
            <Cities model={m} />
          </aside>
        </div>
        <div className="weather-signoff">
          <div className="signoff-horizon" aria-hidden="true">
            <span></span>
          </div>
          <p>
            ყველა ამინდს თავისი ხასიათი აქვს
            <span>შენ დღეს შენი ფერი მიეცი.</span>
          </p>
          <div className="signoff-dots" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </main>
      <dialog
        id="location-dialog"
        ref={m.dialog}
        onCancel={m.remember}
        aria-labelledby="location-title"
      >
        <div className="location-symbol">⌖</div>
        <h2 id="location-title">ამინდი შენს მდებარეობაზე</h2>
        <p>
          გამოვიყენოთ შენი მდებარეობა ადგილობრივი ამინდის საჩვენებლად? თანხმობის
          შემდეგ ბრაუზერიც მოგთხოვს ნებართვას.
        </p>
        <div className="location-actions">
          <button id="allow-location" onClick={m.useLocation}>
            მდებარეობის გამოყენება
          </button>
          <button
            id="skip-location"
            onClick={() => {
              m.remember();
              m.dialog.current.close();
            }}
          >
            ახლა არა
          </button>
        </div>
        <small>
          თუ ადრე ნებართვა დაბლოკე, ბრაუზერში მისამართის გვერდით გახსენი საიტის
          პარამეტრები და მდებარეობაზე წვდომა დაუშვი. შემდეგ ხელახლა დააჭირე
          „მდებარეობის გამოყენებას“.
        </small>
      </dialog>
    </>
  );
}

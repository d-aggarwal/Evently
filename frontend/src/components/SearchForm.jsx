import { useState, useCallback } from 'react';
import StationInput from './StationInput';

export default function SearchForm({ onSearch, isLoading }) {
  const [from, setFrom] = useState({ name: '', code: '' });
  const [to, setTo] = useState({ name: '', code: '' });
  const [date, setDate] = useState('');

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!from.name || !to.name) return;
    // Use code if selected from autocomplete, else use the typed name
    onSearch({
      from: from.code || from.name,
      to: to.code || to.name,
      date,
    });
  };

  const fromDisplay = from.code ? `${from.name} (${from.code})` : from.name;
  const toDisplay = to.code ? `${to.name} (${to.code})` : to.name;

  // Get tomorrow as min date
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="search-card">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-form__stations">
          <div className="search-form__field">
            <label className="search-form__label" htmlFor="station-from">
              From
            </label>
            <StationInput
              id="station-from"
              placeholder="e.g. New Delhi"
              value={fromDisplay}
              onChange={setFrom}
            />
          </div>

          <button
            type="button"
            className="search-form__swap-btn"
            onClick={handleSwap}
            aria-label="Swap stations"
            title="Swap stations"
          >
            ⇄
          </button>

          <div className="search-form__field">
            <label className="search-form__label" htmlFor="station-to">
              To
            </label>
            <StationInput
              id="station-to"
              placeholder="e.g. Mumbai"
              value={toDisplay}
              onChange={setTo}
            />
          </div>
        </div>

        <div className="search-form__date-field">
          <label className="search-form__label" htmlFor="travel-date">
            Date
          </label>
          <input
            id="travel-date"
            className="search-form__date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
          />
        </div>

        <button
          type="submit"
          className={`search-form__submit ${isLoading ? 'search-form__submit--loading' : ''}`}
          disabled={isLoading || !from.name || !to.name}
        >
          {isLoading ? (
            <>
              <span className="spinner" /> Searching…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search Trains
            </>
          )}
        </button>
      </form>
    </div>
  );
}

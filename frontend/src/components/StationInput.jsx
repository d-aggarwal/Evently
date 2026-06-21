import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAutocomplete } from '../api/searchApi';

export default function StationInput({ id, placeholder, value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value changes (e.g. swap)
  useEffect(() => {
    setQuery(value || '');
    setSelected(!!value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doFetch = useCallback(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    try {
      const results = await fetchAutocomplete(q);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    onChange({ name: val, code: '' });

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(val), 200);
  };

  const handleSelect = (station) => {
    setQuery(`${station.name} (${station.code})`);
    setSelected(true);
    setIsOpen(false);
    onChange(station);
  };

  const handleClear = () => {
    setQuery('');
    setSelected(false);
    setSuggestions([]);
    setIsOpen(false);
    onChange({ name: '', code: '' });
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="station-input" ref={wrapperRef}>
      <input
        id={id}
        className="station-input__field"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && !selected) setIsOpen(true);
        }}
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          className="station-input__clear"
          onClick={handleClear}
          aria-label="Clear"
        >
          ×
        </button>
      )}
      {isOpen && (
        <div className="station-input__dropdown" role="listbox">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <div
                key={s.stationId || i}
                className={`station-input__option ${i === activeIndex ? 'station-input__option--active' : ''}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className="station-input__option-name">{s.name}</span>
                <span className="station-input__option-code">{s.code}</span>
              </div>
            ))
          ) : (
            <div className="station-input__no-results">No stations found</div>
          )}
        </div>
      )}
    </div>
  );
}

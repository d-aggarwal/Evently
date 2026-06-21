import { useState } from 'react';
import SearchForm from './components/SearchForm';
import TrainResults from './components/TrainResults';
import { fetchTrains } from './api/searchApi';

export default function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async ({ from, to, date }) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fetchTrains(from, to, date);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to search trains');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="navbar__brand">
          <svg className="navbar__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          <span className="navbar__title">
            Rail<span>Search</span>
          </span>
        </a>
      </nav>

      {/* Hero */}
      <section className="hero">
        <p className="hero__subtitle">Fast • Reliable • Simple</p>
        <h1 className="hero__title">
          Find Your <span>Perfect Train</span>
        </h1>
        <p className="hero__desc">
          Search across all routes, check seat availability, and plan your journey — all in one place.
        </p>
      </section>

      {/* Search Form */}
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Results */}
      <TrainResults
        results={results}
        isLoading={isLoading}
        error={error}
        hasSearched={hasSearched}
      />

      {/* Footer */}
      <footer className="footer">
        © {new Date().getFullYear()} RailSearch — All rights reserved.
      </footer>
    </div>
  );
}

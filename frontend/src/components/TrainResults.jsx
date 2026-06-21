import TrainCard from './TrainCard';

export default function TrainResults({ results, isLoading, error, hasSearched }) {
  if (!hasSearched) return null;

  if (isLoading) {
    return (
      <div className="results-section">
        <div className="state-message">
          <div className="spinner spinner--dark" />
          <p className="state-message__title" style={{ marginTop: '16px' }}>
            Searching trains…
          </p>
          <p className="state-message__desc">Finding the best routes for you</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-section">
        <div className="state-message">
          <div className="state-message__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c87000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className="state-message__title">Something went wrong</p>
          <p className="state-message__desc">{error}</p>
        </div>
      </div>
    );
  }

  const { trains = [], count = 0, from, to, date } = results || {};

  if (trains.length === 0) {
    return (
      <div className="results-section">
        <div className="state-message">
          <div className="state-message__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8e90a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p className="state-message__title">No trains found</p>
          <p className="state-message__desc">
            No trains found between{' '}
            {from?.resolved || 'selected'} and {to?.resolved || 'selected'}
            {date && date !== 'any' ? ` on ${date}` : ''}. Try different stations or dates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-section">
      <div className="results-header">
        <h2 className="results-header__title">
          {from?.resolved} → {to?.resolved}
          {date && date !== 'any' ? ` · ${date}` : ''}
        </h2>
        <span className="results-header__count">
          {count} {count === 1 ? 'train' : 'trains'} found
        </span>
      </div>

      <div className="results-list">
        {trains.map((train, i) => (
          <TrainCard key={train.trainId || i} train={train} />
        ))}
      </div>
    </div>
  );
}

export default function TrainCard({ train }) {
  const { trainName, trainNumber, from, to, seatSummary, schedule } = train;

  const formatTime = (t) => {
    if (!t) return '--:--';
    // Handle "HH:MM:SS" or "HH:MM" format
    return t.slice(0, 5);
  };

  return (
    <article className="train-card">
      {/* Header */}
      <div className="train-card__header">
        <h3 className="train-card__name">{trainName}</h3>
        <span className="train-card__number">#{trainNumber}</span>
      </div>

      {/* Journey Timeline */}
      <div className="train-card__journey">
        <div className="train-card__station">
          <div className="train-card__station-time">{formatTime(from.departure)}</div>
          <div className="train-card__station-name">
            <span className="train-card__station-code">{from.code}</span> — {from.name}
          </div>
        </div>

        <div className="train-card__route-line">
          <div className="train-card__route-dot" />
          <div className="train-card__route-dash" />
          <span className="train-card__route-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
          <div className="train-card__route-dash" />
          <div className="train-card__route-dot" />
        </div>

        <div className="train-card__station train-card__station--end">
          <div className="train-card__station-time">{formatTime(to.arrival)}</div>
          <div className="train-card__station-name">
            <span className="train-card__station-code">{to.code}</span> — {to.name}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="train-card__footer">
        <div className="train-card__seats">
          {seatSummary && seatSummary.total > 0 && (
            <span className="train-card__seat-badge train-card__seat-badge--available">
              {seatSummary.total} seats total
            </span>
          )}
          {schedule && schedule.available !== undefined && (
            <span className="train-card__seat-badge train-card__seat-badge--available">
              {schedule.available} available
            </span>
          )}
          {seatSummary && (
            <>
              {seatSummary.LOWER > 0 && (
                <span className="train-card__seat-badge">LB: {seatSummary.LOWER}</span>
              )}
              {seatSummary.UPPER > 0 && (
                <span className="train-card__seat-badge">UB: {seatSummary.UPPER}</span>
              )}
              {seatSummary.MIDDLE > 0 && (
                <span className="train-card__seat-badge">MB: {seatSummary.MIDDLE}</span>
              )}
              {seatSummary.SIDE_LOWER > 0 && (
                <span className="train-card__seat-badge">SL: {seatSummary.SIDE_LOWER}</span>
              )}
              {seatSummary.SIDE_UPPER > 0 && (
                <span className="train-card__seat-badge">SU: {seatSummary.SIDE_UPPER}</span>
              )}
            </>
          )}
        </div>

        {schedule ? (
          <span className="train-card__schedule-status train-card__schedule-status--active">
            ● {schedule.status}
          </span>
        ) : (
          <span className="train-card__schedule-status train-card__schedule-status--no-schedule">
            No schedule for this date
          </span>
        )}
      </div>
    </article>
  );
}

const API_BASE = `${import.meta.env.VITE_API_URL}/search`;

/**
 * Autocomplete station names.
 * GET /api/search/autocomplete?q=<prefix>
 *
 * API Response shape: { statusCode, data (=message string), message (=actual data), success }
 * Note: The backend ApiResponse constructor has (statusCode, data, message) but controllers
 * call it as (true, 'label', actualData), so real data lands in `message` field.
 */
export async function fetchAutocomplete(query) {
  if (!query || query.length < 2) return [];

  try {
    const res = await fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];

    const json = await res.json();
    // Backend swaps args: actual data is in `message`, not `data`
    const suggestions = json.message || json.data || [];
    return Array.isArray(suggestions) ? suggestions : [];
  } catch {
    return [];
  }
}

/**
 * Search trains between two stations on a given date.
 * POST /api/search/trains?from=<from>&to=<to>&date=<date>
 */
export async function fetchTrains(from, to, date) {
  const params = new URLSearchParams({ from, to });
  if (date) params.set('date', date);

  const res = await fetch(`${API_BASE}/trains?${params.toString()}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Search failed');
  }

  const json = await res.json();
  // Backend swaps args: actual data is in `message`, not `data`
  const result = json.message || json.data || { trains: [], count: 0 };
  return typeof result === 'object' && !Array.isArray(result)
    ? result
    : { trains: [], count: 0 };
}

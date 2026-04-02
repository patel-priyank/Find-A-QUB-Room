const BASE = import.meta.env.VITE_API_URL || '';

if (typeof window !== 'undefined') {
  const fetchReq = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${BASE.replace(/\/$/, '')}${input}`;
    } else if (input && input.url && typeof input.url === 'string' && input.url.startsWith('/api')) {
      input = new Request(`${BASE.replace(/\/$/, '')}${input.url}`, input);
    }

    return fetchReq(input, init);
  };
}

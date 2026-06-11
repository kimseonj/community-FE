import { useEffect, useMemo, useState } from 'react';

function normalizeHash() {
  const raw = window.location.hash.replace(/^#/, '');
  return raw || '/feed';
}

export function navigate(path) {
  window.location.hash = path;
}

export function useHashRoute() {
  const [hash, setHash] = useState(normalizeHash);

  useEffect(() => {
    const handleHashChange = () => setHash(normalizeHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return useMemo(() => {
    const [pathPart, queryString = ''] = hash.split('?');
    const segments = pathPart.split('/').filter(Boolean);
    const searchParams = new URLSearchParams(queryString);

    return {
      hash,
      path: pathPart,
      segments,
      searchParams,
      is: (path) => pathPart === path,
      startsWith: (path) => pathPart.startsWith(path),
    };
  }, [hash]);
}

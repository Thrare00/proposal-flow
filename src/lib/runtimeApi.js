function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getBasePath() {
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return baseUrl || '';
}

export function getLocalApiBase() {
  const basePath = getBasePath();
  return basePath ? `${basePath}/api` : '/api';
}

export function isLocalRuntime() {
  if (typeof window === 'undefined') {
    return false;
  }

  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

export function buildApiUrl(pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${trimTrailingSlash(getLocalApiBase())}${normalizedPath}`;
}

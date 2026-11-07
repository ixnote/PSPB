const API = '/api';

/** Returns image URL - supports external URLs (http) or local paths (served via /api/website/files/) */
export function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API}/website/files/${path}`;
}

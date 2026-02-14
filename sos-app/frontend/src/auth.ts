const KEY = "sos_token";

export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}

export function getToken() {
  return localStorage.getItem(KEY);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

import { API_URL, TOKEN_KEY } from "./constants";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable; the session lasts until reload
  }
};

export const makeApiRequest = async ({
  endpoint,
  contentType = "application/json",
  requestBody,
  method = "GET",
  stringify = true,
  signal,
  responseType = "json",
  query,
}) => {
  const token = getToken();
  const url = new URL(API_URL + endpoint);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url, {
    method,
    body:
      requestBody === undefined
        ? undefined
        : stringify
          ? JSON.stringify(requestBody)
          : requestBody,
    headers: {
      "Content-Type": contentType,
      "ngrok-skip-browser-warning": "true",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    signal,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // non-JSON error body
    }
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event("auth:logout"));
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  // Handle different response types
  switch (responseType) {
    case "blob":
      return response.blob();
    case "text":
      return response.text();
    case "json":
    default:
      return response.json();
  }
};

// Trigger a browser download for a blob
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

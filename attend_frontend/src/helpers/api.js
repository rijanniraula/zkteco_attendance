import { API_URL } from "./constants";

export const makeApiRequest = async ({
  endpoint,
  contentType = "application/json",
  requestBody,
  method = "GET",
  stringify = true,
  signal,
  responseType = "json",
}) => {
  try {
    const response = await fetch(API_URL + endpoint, {
      method,
      body: stringify ? JSON.stringify(requestBody) : requestBody,
      headers: {
        "Content-Type": contentType,
      },
      signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
  } catch (error) {
    console.error(error);
    throw new Error(`API request failed: ${error.message}`);
  }
};

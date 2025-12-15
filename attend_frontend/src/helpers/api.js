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
    return responseType === "json" ? response.json() : response.text();
  } catch (error) {
    console.error(error);
    throw new Error(`API request failed: ${error.message}`);
  }
};

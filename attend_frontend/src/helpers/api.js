export const makeApiRequest = async (url, method, body, headers) => {
  try {
    const response = await fetch(url, {
      method,
      body: method === "GET" ? undefined : JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(error);
    throw new Error(`API request failed: ${error.message}`);
  }
};

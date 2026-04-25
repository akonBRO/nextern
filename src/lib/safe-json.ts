export async function readJsonSafely<T>(response: Response, fallback: T): Promise<T> {
  try {
    const text = await response.text();
    if (!text.trim()) {
      return fallback;
    }

    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

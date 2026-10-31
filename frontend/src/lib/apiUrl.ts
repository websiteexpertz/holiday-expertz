export function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
}
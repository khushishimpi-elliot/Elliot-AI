import open from "open";

/** Open `url` in the user's default browser. No-op on failure. */
export async function openInBrowser(url: string): Promise<void> {
  try {
    await open(url);
  } catch {
    // best effort — the user can still copy/paste the URL from stdout
  }
}

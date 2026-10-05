// Minimal Frasberg client — hits the live platform API with the frb_live_ key.
// Set FRASBERG_API_URL and FRASBERG_API_KEY in the studio environment.
export function useFrasbergClient() {
  const base = (process.env.REACT_APP_FRASBERG_API_URL || "").replace(/\/$/, "");
  const key = process.env.REACT_APP_FRASBERG_API_KEY || "";

  async function request(path: string, body: any) {
    const res = await fetch(`${base}/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    const payload = await res.json();
    return { status: res.status, payload };
  }

  return { request };
}

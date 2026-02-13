const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";

export interface FarcasterProfile {
  fid: string;
  username: string;
  displayName: string;
  pfp: string;
}

export async function lookupFarcasterByAddress(
  address: string
): Promise<FarcasterProfile | null> {
  if (!NEYNAR_API_KEY) return null;

  try {
    const res = await fetch(
      `${NEYNAR_BASE_URL}/user/bulk-by-address?addresses=${address.toLowerCase()}`,
      {
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          accept: "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const users = data?.[address.toLowerCase()];
    if (!users || users.length === 0) return null;

    const user = users[0];
    return {
      fid: String(user.fid),
      username: user.username || "",
      displayName: user.display_name || user.username || "",
      pfp: user.pfp_url || "",
    };
  } catch {
    return null;
  }
}

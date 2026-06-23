import { request } from "./client.js";

export interface MagicLinkResponse {
  sent: boolean;
  expires_in_seconds: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  email: string;
}

export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  return request<MagicLinkResponse>("/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function redeemMagicLink(token: string): Promise<TokenResponse> {
  return request<TokenResponse>(`/auth/callback?token=${encodeURIComponent(token)}`);
}

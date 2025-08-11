export interface OAuthConfig {
  authEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

export function authorize(config: OAuthConfig) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'token',
    scope: config.scope,
  });
  window.location.href = `${config.authEndpoint}?${params.toString()}`;
}

export function extractTokenFromHash(hash: string = window.location.hash) {
  const match = hash.match(/access_token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function storeToken(source: string, token: string) {
  try {
    localStorage.setItem(`oauth.${source}`, token);
  } catch {}
}

export function getToken(source: string) {
  try {
    return localStorage.getItem(`oauth.${source}`);
  } catch {
    return null;
  }
}

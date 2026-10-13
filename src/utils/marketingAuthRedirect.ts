const marketingOrigins = new Set([
  'https://homedocumentation.com',
  'https://www.homedocumentation.com',
]);

const appCallback = 'https://app.homedocumentation.com/auth/callback';
const authErrorFields = [
  'error',
  'error_code',
  'error_description',
  'error_uri',
] as const;
const hashAuthFields = [
  'access_token',
  'refresh_token',
  'token_type',
  'expires_in',
  'expires_at',
  'type',
  ...authErrorFields,
] as const;
const queryAuthFields = ['code', 'type', ...authErrorFields] as const;

type ForwardableAuthResponse = {
  target: 'query' | 'hash';
  params: URLSearchParams;
};

const hasAuthError = (params: URLSearchParams) =>
  authErrorFields.some((field) => Boolean(params.get(field)));

const copyFields = <T extends readonly string[]>(
  source: URLSearchParams,
  fields: T,
) => {
  const result = new URLSearchParams();
  for (const field of fields) {
    const values = source.getAll(field);
    if (values.length > 1) return null;
    if (values[0]) result.set(field, values[0]);
  }
  return result;
};

const parseForwardableResponse = (
  sourceUrl: string,
): ForwardableAuthResponse | null => {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return null;
  }

  if (
    !marketingOrigins.has(url.origin) ||
    url.username ||
    url.password ||
    (url.pathname !== '/' && url.pathname !== '/auth/callback')
  ) {
    return null;
  }

  const queryHasCode = url.searchParams.getAll('code');
  const queryIsAuthResponse =
    (queryHasCode.length === 1 && Boolean(queryHasCode[0])) ||
    hasAuthError(url.searchParams);
  if (queryIsAuthResponse) {
    const params = copyFields(url.searchParams, queryAuthFields);
    if (params && params.toString()) return { target: 'query', params };
  }

  const hash = new URLSearchParams(
    url.hash.startsWith('#') ? url.hash.slice(1) : url.hash,
  );
  const accessTokens = hash.getAll('access_token');
  const refreshTokens = hash.getAll('refresh_token');
  const hashHasTokenPair =
    accessTokens.length === 1 &&
    Boolean(accessTokens[0]) &&
    refreshTokens.length === 1 &&
    Boolean(refreshTokens[0]);
  if (hashHasTokenPair || hasAuthError(hash)) {
    const params = copyFields(hash, hashAuthFields);
    if (params && params.toString()) return { target: 'hash', params };
  }

  return null;
};

/** Returns whether a marketing-host URL carries a supported auth response. */
export const isMarketingAuthRedirect = (sourceUrl: string) =>
  parseForwardableResponse(sourceUrl) !== null;

/** Forwards only recognized Supabase auth response fields to the fixed app URL. */
export const forwardMarketingAuthRedirect = (
  sourceUrl: string,
  replace: (targetUrl: string) => void,
) => {
  const response = parseForwardableResponse(sourceUrl);
  if (!response) return false;

  const separator = response.target === 'query' ? '?' : '#';
  replace(`${appCallback}${separator}${response.params.toString()}`);
  return true;
};

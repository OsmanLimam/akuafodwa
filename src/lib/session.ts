// Shared session transport constants.
// This file must stay free of server-only imports (next/headers, crypto, db)
// because client code (lib/api.ts) imports it too.
export const SESSION_HEADER = 'x-session-token'
export const SESSION_STORAGE_KEY = 'akuafo_session_token'

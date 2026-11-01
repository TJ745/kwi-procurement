import { createAuthClient } from "better-auth/react";

// Same-origin client; requests go through /api/auth (rate-limited by Better Auth).
export const authClient = createAuthClient();

export type MeratTokenPayload = {
  userId: string;
  personId: string;
  codeMelli: string;
  fullName: string;
  mahal: number;
  postId: number;
  iat?: number;
  exp?: number;
};

export function generateToken(
  payload: Omit<MeratTokenPayload, "iat" | "exp">,
  expiresIn?: string | number,
): string;

export function verifyToken(token: string): MeratTokenPayload;
export function hashString(value: unknown): string;

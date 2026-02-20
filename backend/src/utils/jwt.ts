// adds JWT (JSON Web Token) support so your backend can issue and verify login tokens for authenticated API requests.


import jwt from "jsonwebtoken";

export type JwtPayload = {
    userId: string;
    email: string;
};

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
}
import { NextFunction, Request, Response } from "express";
import { custom, Issuer } from "openid-client";

export function getFullDomain(): string {
  let port = process.env.PUBLISHED_PORT || process.env.PORT;
  return `http://${process.env.HOST}:${port}`;
}

export async function initClient(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.app.authIssuer) {
    return next();
  }

  const issuer = await Issuer.discover(process.env.OPEN_ID_CONFIG_URL);
  console.log("OpendId issuer created");
  const client = new issuer.Client({
    client_id: process.env.OAUTH_CLIENT_ID!,
    client_secret: process.env.OAUTH_CLIENT_SECRET!,
    redirect_uris: [`${getFullDomain()}/redirect`],
    response_types: ["code"],
  });
  client[custom.clock_tolerance] = 3;

  req.app.authIssuer = issuer;
  req.app.authClient = client;

  next();
}

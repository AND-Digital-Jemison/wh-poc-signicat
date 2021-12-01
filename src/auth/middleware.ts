import { NextFunction, Request, Response } from 'express';
import { BaseClient, custom, Issuer } from 'openid-client';

export function getFullDomain(): string {
  const port = process.env.PUBLISHED_PORT || process.env.PORT;
  return `http://${process.env.HOST}:${port}`;
}

export async function initClient(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.app.authIssuer) {
    return next();
  }

  let issuer: Issuer<BaseClient>;
  let client: BaseClient;

  issuer = await Issuer.discover(process.env.OPEN_ID_SIGNICAT_CONFIG_URL);
  console.log('OpendId issuer created');
  client = new issuer.Client({
    client_id: process.env.OAUTH_SIGNICAT_CLIENT_ID!,
    client_secret: process.env.OAUTH_SIGNICAT_CLIENT_SECRET!,
    redirect_uris: [`${getFullDomain()}/redirect`],
    response_types: ['code'],
  });

  client[custom.clock_tolerance] = 3;
  req.app.signicatClient = client;

  issuer = await Issuer.discover(process.env.OPEN_ID_CRIIPTO_CONFIG_URL);
  console.log('OpendId issuer created');
  client = new issuer.Client({
    client_id: process.env.OAUTH_CRIIPTO_CLIENT_ID!,
    client_secret: process.env.OAUTH_CRIIPTO_CLIENT_SECRET!,
    redirect_uris: [`${getFullDomain()}/redirect`],
    response_types: ['code'],
  });

  client[custom.clock_tolerance] = 3;
  req.app.cripptoClient = client;

  issuer = await Issuer.discover(process.env.OPEN_ID_SIGNATURGRUPPEN_CONFIG_URL);
  console.log('OpendId issuer created');
  client = new issuer.Client({
    client_id: process.env.OAUTH_SIGNATURGRUPPEN_CLIENT_ID,
    client_secret: process.env.OAUTH_SIGNATURGRUPPEN_CLIENT_SECRET,
    scope: 'openid mitid nemid userinfo_token',
    redirect_uri: [`${getFullDomain()}/redirect`],
    response_type: ['code'],
  });

  client[custom.clock_tolerance] = 3;
  req.app.signaturgruppenClient = client;

  next();
}

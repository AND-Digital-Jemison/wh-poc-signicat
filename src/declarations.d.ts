import { Client, Issuer, TokenSet, UserinfoResponse } from 'openid-client';
import { ISession } from './auth/routes';

declare global {
  namespace Express {
    export interface Application {
      authIssuer?: Issuer;
      authClient?: Client;
    }

    export interface Request {
      // I am using auth instead of locals because I cannot statically type
      // locals, so to keep things statically analyzable I am using other attr
      session?: ISession;
    }
  }
}

import { Router } from 'express';
import { LoginRoutes } from './login-routes';
import {
  getAuthStateCookie,
  serializeAuthState,
  setAuthStateCookie,
} from './state';
import { BaseClient, custom, Issuer } from 'openid-client';
import { getFullDomain } from '.';

/**
 *
 National ID	Provider	Last name	First name	One-time password	Password
 11113306361	Signicat	Johnson	John	otp	qwer1234
 29090816894	Signicat	Williams	Ellie	otp	qwer1234
 10103933108	Signicat	Nordmann	Ola	otp	qwer1234
 */

export default function mitidRoutes(): Router {
  const router = Router();

  router.get(LoginRoutes.LoginMitID, async function (req, res) {
    let issuer: Issuer<BaseClient>;
    let client: BaseClient;

    issuer = await Issuer.discover(process.env.MITID_CONFIG_URL);
    console.log('OpendId issuer created');
    client = new issuer.Client({
      client_id: process.env.MITID_CLIENT_ID,
      client_secret: process.env.MITID_CLIENT_SECRET,
      redirect_uris: [process.env.MITID_REDIRECT],
      response_types: ['code'],
    });

    client[custom.clock_tolerance] = 3;

    const state = serializeAuthState();

    const authUrl = client.authorizationUrl({
      scope: 'openid profile email mitid ',
      state,
      acr_values: 'urn:signicat:oidc:method:mitid-cpr',
    });

    console.log('state', state);
    setAuthStateCookie(res, state);

    console.log('redirecting', authUrl);
    res.redirect(authUrl);
  });
  // TODO
  // in the mock service create responses for each incoming request (mit and nem) (in beforeUserInfo)
  // create routes file for mitid and nemid
  // how can we force an error from there, without touching the eid service (from the mockserver)
  // why do we lose userinfo we added in the beforeUserInfo hook when we reload?
  router.get(LoginRoutes.LoginMitIDRedirect, async (req, res) => {
    try {
      const state = getAuthStateCookie(req);
      const client = req.app.signicatClient;

      const params = client!.callbackParams(req);
      console.log('params', params);
      const tokenSet = await client!.callback(
        process.env.MITID_REDIRECT,
        params,
        { state },
      );
      console.log('calling userinfo', tokenSet);
      const user = await client!.userinfo(tokenSet);

      res.status(200).send(`
                   <h3>Success 200</h3>
                   
                   <h3>Login Method: MitID</h3>
    
                    Claims: <pre>${JSON.stringify(
                      tokenSet.claims(),
                      null,
                      2,
                    )}</pre>
                
                    User: <pre>${JSON.stringify(user, null, 2)}</pre>
                    
                    Token Set: <pre>${JSON.stringify(tokenSet, null, 2)}</pre>
                `);
    } catch (err) {
      console.log('Error Post Redirect', err);
      res.status(401).send(`
                    <h3>Unauthorised 401</h3>
                     Error: <pre>${JSON.stringify(err, null, 2)}</pre>
                `);
    }
  });

  return router;
}

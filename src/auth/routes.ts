import { Router } from 'express';
import { getFullDomain } from './middleware';
import {
  getAuthStateCookie,
  serializeAuthState,
  setAuthStateCookie,
} from './state';
import { TokenSet, UserinfoResponse } from 'openid-client';

export interface ISession {
  user: UserinfoResponse;
  tokenSet: TokenSet;
}

export default function authRoutesMiddleware(): Router {
  const router = Router();

  router.get('/login', function (req, res) {
    const state = serializeAuthState();

    const authUrl = req.app.authClient!.authorizationUrl({
      scope: "openid profile email mitid signicat.national_id",
      state,
      acr_values: 'urn:signicat:oidc:method:mitid-cpr urn:signicat:oidc:method:nemid'
    });

    console.log('state', state);
    setAuthStateCookie(res, state);

    console.log('redirecting', authUrl);
    res.redirect(authUrl);
  });

  router.get('/redirect', async (req, res) => {
    try {
      const state = getAuthStateCookie(req);
      const client = req.app.authClient;

      const params = client!.callbackParams(req);
      console.log('params', params);
      const tokenSet = await client!.callback(
        `${getFullDomain()}/redirect`,
        params,
        { state },
      );
      console.log('calling userinfo', tokenSet);
      const user = await client!.userinfo(tokenSet);

      let logInMethod = `NemID`;
      if (user.hasOwnProperty('mitid.uuid')) {
        logInMethod = 'MitID';
      }

      res.status(200).send(`
               <h3>Success 200</h3>
               
               <h3>Login Method: ${logInMethod}</h3>

                Claims: <pre>${JSON.stringify(tokenSet.claims(), null, 2)}</pre>
            
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

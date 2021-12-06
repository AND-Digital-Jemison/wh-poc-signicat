import { Router } from 'express';
import { getFullDomain } from './middleware';
import {
  getAuthStateCookie,
  serializeAuthState,
  setAuthStateCookie,
} from './state';
import { TokenSet, UserinfoResponse } from 'openid-client';
import axios from 'axios';
import oauth from 'axios-oauth-client';
import { LoginRoutes } from './login-routes';

export interface ISession {
  user: UserinfoResponse;
  tokenSet: TokenSet;
}

export default function authRoutesMiddleware(): Router {
  const router = Router();

  router.get(LoginRoutes.Signicat, function (req, res) {
    const state = serializeAuthState();

    const authSignicatUrl = req.app.signicatClient!.authorizationUrl({
      scope: 'openid profile email',
      state,
      acr_values: 'urn:signicat:oidc:method:mitid-cpr urn:signicat:oidc:method:nemid',
    });

    console.log('state', state);
    setAuthStateCookie(res, state);

    console.log('redirecting', authSignicatUrl);
    res.redirect(authSignicatUrl);
  });

  router.get(LoginRoutes.Criipto, function (req, res) {
    const state = serializeAuthState();

    const authCriiptoUrl = req.app.cripptoClient!.authorizationUrl({
      scope: 'openid email profile mitid',
      state,
      acr_values: 'urn:grn:authn:dk:mitid:substantial'
    });

    console.log('state', state);
    setAuthStateCookie(res, state);

    console.log('redirecting', authCriiptoUrl);
    res.redirect(authCriiptoUrl);
  });

  router.get(LoginRoutes.Signaturgruppen, function (req, res) {
    const state = serializeAuthState();

    const authSignaturgruppenUrl = req.app.signaturgruppenClient!.authorizationUrl({
      state,
      acr_values: 'urn:signicat:oidc:method:mitid',
    });

    console.log('state', state);
    setAuthStateCookie(res, state);

    console.log('redirecting', authSignaturgruppenUrl);
    res.redirect(authSignaturgruppenUrl);
  });

  router.get('/redirect', async (req, res) => {
    try {
      const state = getAuthStateCookie(req);
      const client = req.app.signicatClient;

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
      if (user.hasOwnProperty('mitid.uuid' || 'uuid')) {
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

  router.get('/cpr-check', async function (req, res) {
    console.log('In CPR Check', process.env.ROARING_ENDPOINT);

    // authenticate
    const getClientCredentials = oauth.client(axios.create(), {
      url: process.env.ROARING_AUTH_URL,
      grant_type: 'client_credentials',
      client_id: process.env.ROARING_CLIENT_ID,
      client_secret: process.env.ROARING_CLIENT_SECRET,
      scope: 'baz'
    });

    const auth = await getClientCredentials();
    if (!auth) return res.status(401).send('Could not authenticate with roaring.io')

    const { cprno } =  req.query;
    if (!cprno) return res.status(400).send(`<p><b>BAD REQUEST</b> Missing query parameter: CPR number</p>`)

    // example cprno 0712614382
    await axios
      .get(`${process.env.ROARING_ENDPOINT}/dk/person/1.0/${cprno}`, {
        headers: {
          Authorization: `${auth.token_type} ${auth.access_token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        return res.status(200).send(response.data.person[0]);
      })
      .catch((err) => {
        return res.status(400).send(`<div>Error: ${err}`);
      });
  });

  return router;
}

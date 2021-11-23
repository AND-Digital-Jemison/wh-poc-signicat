import { Router } from 'express';
import { getFullDomain } from './middleware';
import {
  getAuthStateCookie,
  serializeAuthState,
  setAuthStateCookie,
} from './state';
import { TokenSet, UserinfoResponse } from 'openid-client';
import axios from 'axios';

export interface ISession {
  user: UserinfoResponse;
  tokenSet: TokenSet;
}

export default function authRoutesMiddleware(): Router {
  const router = Router();

  router.get('/login', function (req, res) {
    const state = serializeAuthState();

    const authUrl = req.app.authClient!.authorizationUrl({
      scope: 'openid email profile mitid',
      state,
      acr_values: 'urn:signicat:oidc:method:mitid',
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

  router.get('/cpr-check', async function (req, res) {
    console.log('IN CPR CHECK', process.env.ROARING_ENDPOINT)

    // axios.request({ 
    //   headers:{'Content-Type': 'application/json'},
    //   url: "/token",
    //   method: "post",
    //   baseURL: process.env.ROARING_ENDPOINT, 
    //   data: "grant_type=client_credentials", 
    //   auth: {
    //       username: process.env.ROARING_CLIENT_ID,
    //       password: process.env.ROARING_CLIENT_SECRET
    //   }
    // }).then(res => console.log(res)).catch(err => console.log(`err: ${err}`))

    // const access_token = await axios.post(`${process.env.ROARING_AUTH_URL}`, {
    //   data: { "grant_type":"client_credentials"},
    //   headers: { "Content-Type": "application/x-www-form-urlencoded",
    //     "Authorization": "Basic Z29IZmRMd3VVN1I5UGdES3lNeTU1X19hYlI4YTpRSlBYblJJUFB2T1g3SGtTcUhubkNEZlNuczRh"}
    // }).then(res => console.log(`access_token: ${res}`)).catch(err => console.log(`err: ${err}`))


    const resObj = await axios.get(`${process.env.ROARING_ENDPOINT}/dk/person/1.0/0712614382`, {
      headers: { "Authorization" : `Bearer ${process.env.ROARING_ACCESS_TOKEN}`, "Accept":"application/json", "Content-Type": "application/json"}
    }).then(response => {
      console.log(response.data)
      const data = JSON.stringify(response.data)
      res.status(200).send(`<div><h3>Success</h3><p>Data:${data}</p></div>`)
    }).catch(err => {
      res.status(err.status).send(`<div>Error: ${err.message}`)
      console.log(`Err: ${err}`)
    })
    
  });

  return router;
}

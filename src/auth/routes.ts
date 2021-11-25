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
    console.log('IN CPR CHECK', process.env.ROARING_ENDPOINT);
    const { cprno, inputAddress, inputZipCode, inputFirstName, inputLastName } =
      req.query;
    console.log(`cprno: ${cprno}, address: ${inputAddress}`);

    // example cprno 0712614382
    await axios
      .get(`${process.env.ROARING_ENDPOINT}/dk/person/1.0/${cprno}`, {
        headers: {
          Authorization: `Bearer ${process.env.ROARING_ACCESS_TOKEN}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        console.log(JSON.stringify(response.data));
        const { address, name, personalNumber } = response.data.person[0];
        const { firstName, lastName } = name;
        const fullAddress = address.nationalRegistrationAddress.address;
        const { zipCode } = address.nationalRegistrationAddress;

        console.log(
          `Address: ${fullAddress} / Zip Code: ${zipCode} / First Name: ${firstName} / Last Name: ${lastName} / personalNumber: ${personalNumber}`,
        );

        let result = `<div><h3>Failed to match data fields</h3></div>`;
        if (
          cprno == personalNumber &&
          inputZipCode == zipCode &&
          inputFirstName == firstName &&
          inputLastName == lastName
        ) {
          result = `<div>
                      <h3>Success CPR Match</h3>
                      <ul>
                        <li>First Name: ${firstName}</li>
                        <li>Last Name: ${lastName}</li>
                        <li>CPR: ${personalNumber}</li>
                        <li>ZIP Code: ${zipCode}</li>
                      </ul>
                    </div>`;
        }

        res.status(200).send(result);
      })
      .catch((err) => {
        res.status(400).send(`<div>Error: ${err}`);
        console.log(`Err: ${err}`);
      });
  });

  return router;
}

import {Issuer, TypeOfGenericClient} from 'openid-client';
import {generators} from 'openid-client';
import express from "express";
import axios from "axios";

/**
 * Test user for Norwegian Bank ID

 User ID: 10103933108

 Password: qwer1234

 One time password (OTP): otp
 */

(async () => {

    const app = express()
    const port = 3000

    let client;

    app.get('/redirect', async (req, res) => {
        console.log('query', req.query);
        console.log('headers', req.headers);
        console.log('made it!', req.header('name'));

        try {
            const params = client.callbackParams(req);
            console.log('params', params)
            const code_verifier = generators.codeVerifier();
            console.log('code_verifier', code_verifier)

            const tokenSet = await client.callback('https://preprod.signicat.com/oidc/authorize', params, {code_verifier});
            console.log('received and validated tokens %j', tokenSet);
            console.log('validated ID Token claims %j', tokenSet.claims());
        } catch (e) {
            console.log(e)
        }

        /*   axios
               .post('https://preprod.signicat.com/oidc/authorize',
                   JSON.stringify({
                       code: req.query.code
                   }))
               .then(res => {
                   console.log(`statusCode: ${res.status}`)
                   console.log(res)
               })
               .catch(error => {
                   console.error(error)
               })*/

        res.send('Redirected!');
    })
    app.get('/', async (req, res) => {


        try {
            const issuer = await Issuer.discover('https://preprod.signicat.com/oidc/.well-known/openid-configuration');
            console.log('Discovered issuer %s %O', issuer.issuer, issuer.metadata);


            client = new issuer.Client({
                client_id: 'demo-preprod',
                client_secret: 'mqZ-_75-f2wNsiQTONb7On4aAZ7zc218mrRVk1oufa8',
                redirect_uris: ['http://localhost:3000/redirect'],
                response_types: ['openid profile'],

                //   id_token_signed_response_alg: "RS256",
                //  token_endpoint_auth_method: "client_secret_basic",
            });

// store the code_verifier in your framework's session mechanism, if it is a cookie based solution
// it should be httpOnly (not readable by javascript) and encrypted.

            //  const code_challenge = generators.codeChallenge(code_verifier);
            /*            const nonce = generators.nonce();
                        const params = client.callbackParams(req);
                        const tokenSet = await client.callback('http://localhost:3000/redirect', params, { nonce });
                        console.log('received and validated tokens %j', tokenSet);
                        console.log('validated ID Token claims', tokenSet.claims());*/

            //    const code_challenge = generators.codeChallenge(code_verifier);

            const x = client.authorizationUrl({
                scope: 'openid profile',
               // resource: 'https://preprod.signicat.com/oidc/authorize',
                response_type: 'code',
                state: generators.state(),
                nonce: generators.nonce(),
                acr_values: 'urn:signicat:oidc:method:nbid',

                //   code_challenge_method: 'S256',
            });

            res.redirect(x);
            //    const params = client.callbackParams(req);
            //    const tokenSet = await client.callback('http://localhost:3000/redirect', params, {code_verifier});
            //   console.log('received and validated tokens %j', tokenSet);
            //  console.log('validated ID Token claims %j', tokenSet.claims());
        } catch (e) {
            console.log(e);
        }

        //  res.send('Hello World!')
    })

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })


    /* const issuer = await Issuer.discover('https://preprod.signicat.com/oidc/.well-known/openid-configuration');
     console.log('Discovered issuer %s %O', issuer.issuer, issuer.metadata);


     const client = new issuer.Client({
         client_id: 'demo-preprod',
         client_secret: 'mqZ-_75-f2wNsiQTONb7On4aAZ7zc218mrRVk1oufa8',
         redirect_uris: ['http://localhost:3000/cb'],
         response_types: ['openid profile'],
         // id_token_signed_response_alg (default "RS256")
          token_endpoint_auth_method: "client_secret_basic",
     });

     const code_verifier = generators.codeVerifier();
 // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
 // it should be httpOnly (not readable by javascript) and encrypted.

     const code_challenge = generators.codeChallenge(code_verifier);

     client.authorizationUrl({
         scope: 'openid email profile',
         resource: 'https://preprod.signicat.com/oidc/authorize',
         code_challenge,
         code_challenge_method: 'S256',
     });*/

    /*    const params = client.callbackParams(req);
        const tokenSet = await client.callback('https://client.example.com/callback', params, { code_verifier });
        console.log('received and validated tokens %j', tokenSet);
        console.log('validated ID Token claims %j', tokenSet.claims());*/
})();

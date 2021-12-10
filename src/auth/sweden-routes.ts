import {Router} from "express";
import {LoginRoutes} from "./login-routes";
import {serializeAuthState, setAuthStateCookie} from "./state";
import {BaseClient, custom, Issuer} from "openid-client";


/**
 *
 National ID	Provider	Last name	First name	One-time password	Password
 11113306361	Signicat	Johnson	John	otp	qwer1234
 29090816894	Signicat	Williams	Ellie	otp	qwer1234
 10103933108	Signicat	Nordmann	Ola	otp	qwer1234
 */

export default function swedenRoutes(): Router {
    const router = Router();

    router.get(LoginRoutes.BankID, async function (req, res) {
        let issuer: Issuer<BaseClient>;
        let client: BaseClient;

        issuer = await Issuer.discover(process.env.OPEN_ID_SIGNICAT_CONFIG_URL);
        console.log('OpendId issuer created');
        client = new issuer.Client({
            client_id: process.env.OAUTH_SIGNICAT_CLIENT_ID,
            client_secret: process.env.OAUTH_SIGNICAT_CLIENT_SECRET,
            redirect_uris: [process.env.OAUTH_SIGNICAT_REDIRECT],
            response_types: ['code']
        });

        client[custom.clock_tolerance] = 3;

        const state = serializeAuthState();

        const authUrl = client.authorizationUrl({
            scope: 'openid profile email',
            state,
            acr_values: 'urn:signicat:oidc:method:sbid urn:signicat:oidc:method:sbid-remote urn:signicat:oidc:method:sbid-qr-remote urn:signicat:oidc:method:sbid-local'
        });

        console.log('state', state);
        setAuthStateCookie(res, state);

        console.log('redirecting', authUrl);
        res.redirect(authUrl);
    });


    return router;
}

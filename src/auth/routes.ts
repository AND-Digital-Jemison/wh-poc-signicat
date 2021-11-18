import {Router} from "express";
import {getFullDomain} from "./middleware";
import {deserializeAuthState, getAuthStateCookie, serializeAuthState, setAuthStateCookie,} from "./state";
import {TokenSet, UserinfoResponse} from "openid-client";

export interface ISession {
    user: UserinfoResponse;
    tokenSet: TokenSet;
}

export default function authRoutesMiddleware(): Router {
    const router = Router();

    router.get("/login", function (req, res, next) {
        const state = serializeAuthState();

        const authUrl = req.app.authClient!.authorizationUrl({
            scope: "openid email profile mitid ",
            state,
            acr_values: 'urn:signicat:oidc:method:mitid'
        });

        console.log("state", state);
        setAuthStateCookie(res, state);

        console.log("redirecting", authUrl);
        res.redirect(authUrl);
    });

    router.get("/redirect", async (req, res, next) => {
        try {
            const state = getAuthStateCookie(req);
            const client = req.app.authClient;

            const params = client!.callbackParams(req);
            const tokenSet = await client!.callback(
                `${getFullDomain()}/redirect`,
                params,
                {state}
            );
            const user = await client!.userinfo(tokenSet);

            res.send(`

                Claims: <pre>${JSON.stringify(tokenSet.claims(), null, 2)}</pre>
            
                User: <pre>${JSON.stringify(user, null, 2)}</pre>
                
                Token Set: <pre>${JSON.stringify(tokenSet, null, 2)}</pre>
            `);

        } catch (err) {
            console.log("SOMETHING WENT WRONG", err);
            res.send(401);
        }
    });

    return router;
}

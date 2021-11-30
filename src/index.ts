export * from './declarations';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';

import * as authHelpers from './auth';
import { LoginRoutes } from './auth/login-routes';

/*
Nemid - https://docs.zignsec.com/faq/how-to-test-nemid-dk-2/
THORFIN702-asasas12-0508300389.jpg

MitID:
u: Hannah9109
p: poiuytrewq

 */

console.log(`
 USING
 HOST: ${process.env.HOST}
 PORT: ${process.env.PORT}
`);

const app = express();

app.use(cookieParser());
app.use(authHelpers.initClient);
app.use(authHelpers.routes());

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <a href="${LoginRoutes.Signicat}">Login (Signicat)</a>
    <br />
    <a href="${LoginRoutes.Criipto}">Login (Criipto)</a>
    <br />
    <a href="${LoginRoutes.Signaturgruppen}">Login (Signaturgruppen)</a>
  `);
});

app.listen(process.env.PORT, () => {
  console.log(`Express started on port ${process.env.PORT}`);
});

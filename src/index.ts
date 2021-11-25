export * from './declarations';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';

import * as authHelpers from './auth';

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
 OAUTH_CLIENT_ID: ${process.env.OAUTH_CLIENT_ID}
 OAUTH_CLIENT_secret: ${process.env.OAUTH_CLIENT_SECRET}
`);

const app = express();

app.use(cookieParser());
app.use(authHelpers.initClient);
app.use(authHelpers.routes());

app.get('/', (req: Request, res: Response) => {
  res.send(`
  <div>
    <a href="/login">Login!</a>
    <br>
    <p>CPR Check</p>
    <form action="/cpr-check">
      <label for="inputFirstName">First Name</label><br>
      <input type="text" id="inputFirstName" name="inputFirstName"><br>
      <label for="inputLastName">Last Name</label><br>
      <input type="text" id="inputLastName" name="inputLastName"><br>
      <label for="cprno">CPR no:</label><br>
      <input type="text" id="cprno" name="cprno"><br>
      <label for="inputAddress">Address:</label><br>
      <input type="text" id="inputAddress" name="inputAddress"><br><br>
      <label for="inputZipCode">ZIP Code:</label><br>
      <input type="text" id="inputZipCode" name="inputZipCode"><br>
      <input type="submit" value="Submit"> 
    </form>   
  </div>`);
});

app.listen(process.env.PORT, () => {
  console.log(`Express started on port ${process.env.PORT}`);
});

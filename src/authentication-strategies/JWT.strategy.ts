const jwt = require('jsonwebtoken');
import {promisify} from 'util';
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);
// Consider turn it to a binding
const SECRET = 'secretforjwt';
import {Request} from '@loopback/rest';

export class JWTStrategy {
  // tslint:disable-next-line:no-any
  async authenticate(request: Request): Promise<any> {
    // A mock for sign in
    // const payload = {admin: true};
    // const payload = request.body;
    // await signAsync(payload, SECRET, { expiresIn: 300 });

    const token = request.query.token || request.headers['authorization'];
    // const token = 'not the right token';

    if (token) {
      try {
        return await verifyAsync(token, SECRET);
      } catch (err) {
        if (err) return Promise.reject('Authentication failed!');
      }
    }

    return Promise.reject('Token not found!');
  }
}

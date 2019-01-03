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
    // there is a discussion regarding how to retrieve the token,
    // see comment https://github.com/strongloop/loopback-next/issues/1997#issuecomment-451054806
    const token = request.query.token || request.headers['authorization'];

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

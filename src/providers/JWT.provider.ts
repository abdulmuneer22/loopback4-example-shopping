import {Provider, ValueOrPromise} from '@loopback/context';
const jwt = require('jsonwebtoken');
import {promisify} from 'util';
import {Request} from '@loopback/rest';
import {
  AuthenticateFn,
  UserProfile,
  AuthenticationMetadata,
  AuthenticationBindings,
} from '@loopback/authentication';
import {inject} from '@loopback/context';

const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);
// Consider turn it to a binding
const SECRET = 'secretforjwt';

// NOTE: any improvement to not using undefined?

export class JWTProvider implements Provider<AuthenticateFn | undefined> {
  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
  ) {}
  value(): ValueOrPromise<AuthenticateFn | undefined> {
    // NOTE: there should be a function that maps the metadata.strategy to the corresponding provider
    // the logic below shouldn't happen in the provider's value()
    if (!this.metadata) {
      return undefined;
    }

    const name = this.metadata.strategy;
    if (name === 'jwt') {
      return req => this.verify(req);
    } else {
      return Promise.reject(`The strategy ${name} is not available.`);
    }
  }
  async verify(request: Request): Promise<UserProfile | undefined> {
    // process.nextTick(() => {
    //   users.find(username, password, cb);
    // });

    const token =
      request.body.token ||
      request.query.token ||
      request.headers['x-access-token'];

    // do we allow session
    // if yes, then sign in function should store the token in the session

    if (token) {
      try {
        await verifyAsync(token, SECRET);
      } catch (err) {
        if (err) return Promise.reject('Authentication failed!');
      }
    }
    // should we return some meaningful message?
    return;
  }
}
// server
//   .bind(AuthenticationBindings.STRATEGY)
//   .toProvider(MyPassportStrategyProvider);

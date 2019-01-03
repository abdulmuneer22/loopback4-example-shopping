import {Provider, ValueOrPromise} from '@loopback/core';
import {inject} from '@loopback/context';
import {
  AuthenticationBindings,
  AuthenticationMetadata,
} from '@loopback/authentication';
// import { JWTStrategy } from '../authentication-strategies/JWT.strategy';
import {JWTStrategy} from '@loopback/authentication';
export class StrategyResolverProvider
  implements Provider<JWTStrategy | undefined> {
  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
  ) {}
  value(): ValueOrPromise<JWTStrategy | undefined> {
    if (!this.metadata) {
      return Promise.resolve(undefined);
    }

    const name = this.metadata.strategy;
    console.log('in strategy resolver');
    if (name === 'jwt') {
      return new JWTStrategy();
    } else {
      return Promise.reject(`The strategy ${name} is not available.`);
    }
  }
}

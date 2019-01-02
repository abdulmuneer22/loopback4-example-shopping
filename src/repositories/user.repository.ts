// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  DefaultCrudRepository,
  juggler,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';
import {User, Order, AccessToken} from '../models';
import {inject} from '@loopback/core';
import {OrderRepository} from './order.repository';
import {AccessTokenRepository} from './access-token.repository';
import {HasOneRepositoryFactory} from '@loopback/repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id
> {
  public orders: HasManyRepositoryFactory<Order, typeof User.prototype.id>;
  // From @jannyhou: should the relation here be hasOne or hasMany?
  public accesstoken: HasOneRepositoryFactory<
    AccessToken,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.mongo') protected datasource: juggler.DataSource,
    @repository(OrderRepository) protected orderRepository: OrderRepository,
    @repository(AccessTokenRepository)
    protected accessTokenRepository: AccessTokenRepository,
  ) {
    super(User, datasource);
    this.orders = this.createHasManyRepositoryFactoryFor(
      'orders',
      async () => orderRepository,
    );
    this.accesstoken = this._createHasOneRepositoryFactoryFor(
      'accesstoken',
      async () => accessTokenRepository,
    );
  }
}

// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Client, expect} from '@loopback/testlab';
import {Response} from 'supertest';
import {ShoppingApplication} from '../..';
import {
  UserRepository,
  OrderRepository,
  AccessTokenRepository,
} from '../../src/repositories';
import {MongoDataSource} from '../../src/datasources';
import {setupApplication} from './helper';
import {createRecommendationServer} from '../../recommender';
import {Server} from 'http';
const jwt = require('jsonwebtoken');
const recommendations = require('../../recommender/recommendations.json');

describe('UserController', () => {
  let app: ShoppingApplication;
  let client: Client;
  const mongodbDS = new MongoDataSource();
  const orderRepo = new OrderRepository(mongodbDS);
  const accessTokenRepo = new AccessTokenRepository(mongodbDS);
  const userRepo = new UserRepository(mongodbDS, orderRepo, accessTokenRepo);

  const user = {
    email: 'test@loopback.io',
    password: 'p4ssw0rd',
    firstname: 'Example',
    surname: 'User',
  };

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  beforeEach(clearDatabase);
  after(async () => {
    await app.stop();
  });

  it('creates new user when POST /users is invoked', async () => {
    const res = await client
      .post('/users')
      .send(user)
      .expect(200);

    // Assertions
    expect(res.body.email).to.equal('test@loopback.io');
    expect(res.body.firstname).to.equal('Example');
    expect(res.body.surname).to.equal('User');
    expect(res.body).to.have.property('id');
    expect(res.body).to.not.have.property('password');
  });

  it('throws error for POST /users with a missing email', async () => {
    const res = await client
      .post('/users')
      .send({
        password: 'p4ssw0rd',
        firstname: 'Example',
        surname: 'User',
      })
      .expect(422);

    const errorText = JSON.parse(res.error.text);
    expect(errorText.error.details[0].info.missingProperty).to.equal('email');
  });

  it('throws error for POST /users with an invalid email', async () => {
    const res = await client
      .post('/users')
      .send({
        email: 'test@loop&back.io',
        password: 'p4ssw0rd',
        firstname: 'Example',
        surname: 'User',
      })
      .expect(422);

    expect(res.body.error.message).to.equal('invalid email');
  });

  it('throws error for POST /users with a missing password', async () => {
    const res = await client
      .post('/users')
      .send({
        email: 'test@loopback.io',
        firstname: 'Example',
        surname: 'User',
      })
      .expect(422);

    const errorText = JSON.parse(res.error.text);
    expect(errorText.error.details[0].info.missingProperty).to.equal(
      'password',
    );
  });

  it('throws error for POST /users with a string', async () => {
    await client
      .post('/users')
      .send('hello')
      .expect(415);
  });

  it('returns a user with given id when GET /users/{id} is invoked', async () => {
    const newUser = await userRepo.create(user);
    delete newUser.password;
    delete newUser.orders;
    // MongoDB returns an id object we need to convert to string
    // since the REST API returns a string for the id property.
    newUser.id = newUser.id.toString();

    await client.get(`/users/${newUser.id}`).expect(200, newUser.toJSON());
  });

  it.skip('returns an error when invalid credentials are used', async () => {
    const newUser = await userRepo.create(user);
    newUser.password = 'wrong password';
    await client
      .post('users/login')
      .send({email: newUser.email, password: newUser.password})
      .expect(403)
      .end();
  });

  it.only('returns a user with given id only when that user logs in', async () => {
    const existingUser = await userRepo.create(user);
    const auth = {} as {token: string};
    // delete existingUser.password;
    delete existingUser.orders;
    // MongoDB returns an id object we need to convert to string
    // since the REST API returns a string for the id property.
    existingUser.id = existingUser.id.toString();
    const loginInfo = await client
      .post('/users/login')
      .send({email: existingUser.email, password: existingUser.password})
      .expect(204);
    // .end(onResponse);

    console.log(existingUser);

    let userId = loginInfo.body.id;
    auth.token = loginInfo.body.token;
    console.log(loginInfo.body);

    const result = await client
      .get(`/users/${userId}`)
      .set('Authorization', 'bearer ' + auth.token)
      .expect(200, existingUser.toJSON());

    // function onResponse(err: Error, res: Response) {
    //   auth.token = res.body.token;
    //   userId = res.body.id;
    // }
  });

  it.skip('returns a user with given id only when that user logs in', async () => {
    const newUser = await userRepo.create(user);
    const auth = {} as {token: string};
    delete newUser.password;
    delete newUser.orders;
    // MongoDB returns an id object we need to convert to string
    // since the REST API returns a string for the id property.
    newUser.id = newUser.id.toString();
    await client
      .post('/users/login')
      .send({username: 'the-username', password: 'the-password'})
      .expect(200)
      .end(onResponse);

    await client
      .get(`/users/${newUser.id}`)
      .set('Authorization', 'bearer ' + auth.token)
      .expect(200, newUser.toJSON());

    function onResponse(err: Error, res: Response) {
      auth.token = res.body.token;
    }
  });

  describe('user product recommendation (service) api', () => {
    // tslint:disable-next-line:no-any
    let recommendationService: Server;

    before(() => {
      recommendationService = createRecommendationServer();
    });

    after(() => {
      recommendationService.close();
    });

    it('returns product recommendations for a user', async () => {
      const newUser = await userRepo.create(user);
      await client
        .get(`/users/${newUser.id}/recommend`)
        .expect(200, recommendations);
    });
  });

  async function clearDatabase() {
    await userRepo.deleteAll();
  }
});

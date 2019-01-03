// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { repository } from '@loopback/repository';
import { post, param, get, requestBody, HttpErrors } from '@loopback/rest';
import { User, Product } from '../models';
import { UserRepository } from '../repositories';
import { hash } from 'bcryptjs';
import { promisify } from 'util';
import * as isemail from 'isemail';
import { RecommenderService } from '../services/recommender.service';
import { inject, Setter } from '@loopback/core';
import { authenticate, UserProfile, AuthenticationBindings } from '@loopback/authentication';
import { Credentials } from '../types';
import * as _ from 'lodash';
const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);

const hashAsync = promisify(hash);

const UserProfileSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' }
  }
};

export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject('services.RecommenderService')
    public recommender: RecommenderService,
    @inject.setter(AuthenticationBindings.CURRENT_USER)
    readonly setCurrentUser: Setter<UserProfile>
  ) { }

  @post('/users')
  async create(@requestBody() user: User): Promise<User> {
    // Validate Email
    if (!isemail.validate(user.email)) {
      throw new HttpErrors.UnprocessableEntity('invalid email');
    }

    // Validate Password Length
    if (user.password.length < 8) {
      throw new HttpErrors.UnprocessableEntity(
        'password must be minimum 8 characters',
      );
    }

    // Salt + Hash Password
    user.password = await hashAsync(user.password, 10);

    // Save & Return Result
    const savedUser = await this.userRepository.create(user);
    delete savedUser.password;
    return savedUser;
  }

  @get('/users/{userId}', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })

  async findById(@param.path.string('userId') userId: string): Promise<User> {
    return this.userRepository.findById(userId, {
      fields: { password: false },
    });
  }

  @get('/users/me', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async printCurrentUser(@inject('authentication.currentUser') currentUser: UserProfile): Promise<UserProfile> {
    return Promise.resolve(currentUser);
  }

  @post('users/logout', {
    responses: {
      '200': {
        description: 'Logging out successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
              }
            }
          },
        },
      },
    },
  })
  async logout(@inject('authentication.currentUser', { optional: true }) currentUser: UserProfile):
    Promise<Boolean> {
    if (currentUser) {
      const AnonymousUser = {
        id: 'ANONYMOUS'
      }
      this.setCurrentUser(AnonymousUser);
      return Promise.resolve(true);
    }

    return Promise.reject('No user logged in');
  }

  @get('/users/{userId}/recommend', {
    responses: {
      '200': {
        description: 'Products',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                'x-ts-type': Product,
              },
            },
          },
        },
      },
    },
  })
  async productRecommendations(
    @param.path.string('userId') userId: string,
  ): Promise<Product[]> {
    return this.recommender.getProductRecommendations(userId);
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'text/plain': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody() credentials: Credentials,
  ): Promise<String | undefined> {
    // Validate Email
    if (!isemail.validate(credentials.email)) {
      throw new HttpErrors.UnprocessableEntity('invalid email');
    }

    // Validate Password Length
    if (credentials.password.length < 8) {
      throw new HttpErrors.UnprocessableEntity(
        'password must be minimum 8 characters',
      );
    }

    // Check if user exists
    const foundUser = await this.userRepository.findOne({
      where: { email: credentials.email, password: credentials.password },
    });

    let token = undefined;

    if (foundUser) {
      const currentUser = _.pick(foundUser.toJSON(), ['id', 'email']);

      // Generate user token using JWT
      token = await signAsync(currentUser, 'secretforjwt', {
        expiresIn: 300,
      });
    }

    return Promise.resolve(token);
  }
}

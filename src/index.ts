// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ShoppingApplication} from './application';
import {ApplicationConfig} from '@loopback/core';

export {ShoppingApplication, PackageInfo, PackageKey} from './application';

export async function main(options?: ApplicationConfig) {
  const app = new ShoppingApplication(options);

  // app.component(AuthenticationComponent);

  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

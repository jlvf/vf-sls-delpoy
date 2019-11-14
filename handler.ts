import 'source-map-support/register';

import { Router } from './Router';

export const initstack = async (event, context) => {
  const router = new Router(event, context);
  return await router.response();
}

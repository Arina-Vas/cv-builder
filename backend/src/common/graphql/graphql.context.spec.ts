import type { Request, Response } from 'express';
import { createGqlContext } from './graphql.context';

describe('createGqlContext', () => {
  it('passes the Express request and response to resolvers', () => {
    const req = {} as Request;
    const res = {} as Response;

    expect(createGqlContext({ req, res })).toEqual({ req, res });
  });
});

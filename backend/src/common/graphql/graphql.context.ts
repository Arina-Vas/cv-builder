import type { Request, Response } from 'express';

export interface GqlContext {
  readonly req: Request;
  readonly res: Response;
}

export const createGqlContext = ({ req, res }: GqlContext): GqlContext => {
  return {
    req,
    res,
  };
};

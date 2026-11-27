import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RequestLocale, requestLocale } from './request-locale.decorator';

const graphqlContext = (headers: Record<string, string>): ExecutionContext => {
  const args = [{}, {}, { req: { headers } }, {}];
  return {
    getType: () => 'graphql',
    getArgs: () => args,
    getArgByIndex: (index: number) => args[index],
    getHandler: () => () => undefined,
    getClass: () => class Resolver {},
  } as unknown as ExecutionContext;
};

describe('request locale', () => {
  it('takes the language from the Accept-Language header of the request', () => {
    expect(requestLocale(graphqlContext({ 'accept-language': 'ru-RU,ru;q=0.9' }))).toBe('ru');
  });

  it('falls back to English without the header', () => {
    expect(requestLocale(graphqlContext({}))).toBe('en');
  });

  it('is available as the @RequestLocale() param decorator', () => {
    class Resolver {
      handle(@RequestLocale() _locale: unknown): void {}
    }
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Resolver, 'handle') as Record<
      string,
      { factory: (data: unknown, context: ExecutionContext) => unknown }
    >;
    const [arg] = Object.values(args);

    expect(arg?.factory(undefined, graphqlContext({ 'accept-language': 'de' }))).toBe('de');
  });
});

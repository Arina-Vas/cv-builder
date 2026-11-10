import type { CodegenConfig } from '@graphql-codegen/cli';

const GENERATED_DIR = './src/gql/';

const config: CodegenConfig = {
  schema: '../backend/schema.gql',
  documents: ['src/**/*.{ts,tsx}', `!${GENERATED_DIR}**`, '!src/**/*.test.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    [GENERATED_DIR]: {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        scalars: { DateTime: 'string', Date: 'string' },
        useTypeImports: true,
      },
    },
  },
};

export default config;

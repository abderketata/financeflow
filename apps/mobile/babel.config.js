module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src'
          }
        }
      ],
      // @tanstack/query-core déclare `"react-native": "src/index.ts"` : Metro compile
      // donc ses sources TypeScript, qui utilisent des membres privés `#`. Le preset
      // Expo SDK 48 ne les active pas, d'où l'échec du bundle de production
      // (« Class private methods are not enabled »).
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
      '@babel/plugin-transform-class-properties',
      // `react-native-reanimated/plugin` doit rester le dernier de la liste.
      'react-native-reanimated/plugin'
    ]
  };
};

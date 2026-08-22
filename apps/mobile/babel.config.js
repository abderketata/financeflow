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
      //
      // `loose: true` est indispensable, pas cosmétique. Babel exécute les `plugins`
      // AVANT les `presets`, donc ceux-ci voient les sources de react-native avant que
      // babel-preset-expo n'ait retiré leurs annotations Flow. En mode « define »
      // (le défaut), `onload: ?Function;` dans XMLHttpRequest devient un
      // `Object.defineProperty(this, 'onload', …)` : une propriété propre qui masque
      // l'accesseur posé sur le prototype par event-target-shim. Or c'est ce setter
      // qui enregistre l'écouteur. Résultat : `xhr.onloadend = fn` n'enregistre plus
      // rien, aucune réponse HTTP ne remonte au JS, et toute requête (axios comme
      // fetch) reste pendante indéfiniment — sans erreur ni timeout.
      // En mode loose, ces champs deviennent de simples affectations, qui passent bien
      // par le setter du prototype.
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      // `react-native-reanimated/plugin` doit rester le dernier de la liste.
      'react-native-reanimated/plugin'
    ]
  };
};

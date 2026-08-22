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
      // `react-native-reanimated/plugin` doit rester le dernier de la liste.
      'react-native-reanimated/plugin'
    ],
    // @tanstack/query-core déclare `"react-native": "src/index.ts"` : Metro compile donc
    // ses sources TypeScript, qui utilisent des membres privés `#`. Le preset Expo SDK 48
    // ne les active pas, d'où l'échec du bundle de production (« Class private methods are
    // not enabled »).
    //
    // Ces plugins DOIVENT rester cantonnés à @tanstack via `overrides`, et ne jamais
    // remonter dans `plugins`. Babel exécute les `plugins` avant les `presets` : placés
    // globalement, ils voient les sources de react-native avant que babel-preset-expo
    // n'ait retiré leurs annotations Flow, et transforment des déclarations purement
    // typées en vraies affectations. Deux pannes en avaient découlé, toutes deux
    // silencieuses :
    //
    //   - XMLHttpRequest déclare `onload: ?Function;` etc. Transformés, ces champs
    //     masquaient les accesseurs posés sur le prototype par event-target-shim — or
    //     c'est leur setter qui enregistre l'écouteur. Plus aucune réponse HTTP ne
    //     remontait au JS : axios comme fetch restaient pendants indéfiniment, sans
    //     erreur ni timeout (onerror et ontimeout étant masqués de la même façon).
    //
    //   - FlatList déclare `props: Props<ItemT>;`. Les initialiseurs de champs
    //     s'exécutant juste après `super(props)`, ce champ écrasait `this.props` par
    //     `undefined` avant que le constructeur n'appelle `this._checkProps(this.props)`,
    //     d'où un « Cannot read property 'getItem' of undefined » au premier rendu.
    overrides: [
      {
        test: /node_modules[\\/]@tanstack[\\/]/,
        plugins: [
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }]
        ]
      }
    ]
  };
};

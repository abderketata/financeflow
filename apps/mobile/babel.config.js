/**
 * Retire les déclarations de champs de classe purement typées avant que les
 * plugins de champs de classe ne les voient.
 *
 * TypeScript n'émet rien pour `subscribe!: Subscribable['subscribe']` : c'est
 * une simple annotation de type. `@babel/plugin-transform-class-properties`, lui,
 * en fait une vraie affectation `this.subscribe = void 0` dans le constructeur.
 * Sur une sous-classe, ce champ masque alors la méthode héritée du prototype.
 *
 * Le visiteur porte sur `Class` et non sur `ClassProperty` : Babel visite le
 * parent avant l'enfant, si bien qu'un visiteur `ClassProperty` passerait APRÈS
 * la transformation de la classe entière et n'aurait plus rien à retirer.
 */
const stripTypeOnlyClassFields = () => ({
  name: 'strip-type-only-class-fields',
  visitor: {
    Class(path) {
      path.get('body.body').forEach((member) => {
        if (member.isClassProperty() && !member.node.value && !member.node.decorators?.length) {
          member.remove();
        }
      });
    },
  },
});

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
          // DOIT rester en premier : les plugins qui suivent transformeraient les
          // déclarations purement typées en affectations. `InfiniteQueryObserver`
          // redéclare ainsi `subscribe`, `getCurrentResult` et `fetch` pour en
          // affiner le type ; transformées, ces trois déclarations masquaient les
          // méthodes héritées de `QueryObserver` et le premier rendu d'un écran
          // utilisant `useInfiniteQuery` (Chèques / Traites) plantait sur
          // « observer.getCurrentResult is not a function ».
          stripTypeOnlyClassFields,
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }]
        ]
      }
    ]
  };
};

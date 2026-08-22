const path = require('path');
const dotenv = require('dotenv');
const appJson = require('./app.json');

// `.env` racine, utilisé en développement local.
// Il est ignoré par git : lors d'un build EAS (cloud) il n'est PAS envoyé,
// l'URL vient alors de `env.API_BASE_URL` déclaré dans eas.json.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiBaseUrl =
  process.env.API_BASE_URL || appJson.expo.extra?.apiBaseUrl || 'http://51.75.24.113:1334';

/**
 * La configuration statique vit dans `app.json` ; ce fichier ne fait que la
 * compléter avec l'URL d'API résolue à la volée.
 *
 * Important : `app.config.js` a la priorité sur `app.json`. Sans cette fusion,
 * tout ce qu'`app.json` contient serait ignoré — y compris le `extra.eas.projectId`
 * qu'`eas init` y écrit au premier build.
 */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiBaseUrl,
    },
  },
};

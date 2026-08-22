# Build APK et test sur émulateur

## Build APK

1. Se placer dans le dossier mobile :

```bash
cd D:\CRMFinanceFlow\financeflow\apps\mobile
```

2. Lancer le build :

```bash
npx eas-cli@latest build --profile preview --platform android
```

3. Copier l'URL affichée à la fin, ouvrir la page, télécharger l'APK.

## Lancer l'émulateur

4. Ouvrir un **nouveau** terminal.

5. Démarrer l'AVD :

```bash
emulator -avd financeflow_api34 -gpu host -no-boot-anim
```

6. Attendre ~80 s (écran d'accueil Android).

## Installer et tester

7. Vérifier que l'émulateur est vu :

```bash
adb devices
```

8. Installer l'APK :

```bash
adb install -r C:\Android\apk\financeflow-scoped.apk
```

9. Lancer l'app :

```bash
adb shell am start -n com.financeflow.app/.MainActivity
```

10. Se connecter dans la fenêtre de l'émulateur.

## Voir les erreurs

11. Vider le journal :

```bash
adb logcat -c
```

12. Suivre les erreurs JS et les crashs :

```bash
adb logcat -s ReactNativeJS:V AndroidRuntime:E
```

## Réinstaller un nouveau build

13. Refaire les étapes 2 → 3, puis 8 → 9 avec le nouveau chemin d'APK.

---

## Environnement installé

| Élément | Emplacement |
|---|---|
| SDK Android | `C:\Android` |
| `adb` | `C:\Android\platform-tools` |
| Émulateur | `C:\Android\emulator` |
| JDK 17 (Temurin) | `C:\Java\jdk-17.0.20+8` |
| APK téléchargés | `C:\Android\apk` |
| AVD | `financeflow_api34` — Android 14, `google_apis/x86_64`, 2 cœurs, 2 Go |

`ANDROID_HOME`, `ANDROID_SDK_ROOT` et le `PATH` sont définis au niveau utilisateur. Un terminal déjà ouvert avant leur création ne les voit pas : en ouvrir un nouveau.

`JAVA_HOME` global reste sur Java 8 (d'autres outils en dépendent). Si un outil Android réclame le JDK 17, le préciser à l'appel :

```bash
set JAVA_HOME=C:\Java\jdk-17.0.20+8
```

## Pièges connus

- `sdkmanager` renvoie un **exit code 9 même en cas de succès** (son avertissement de dépréciation part sur stderr). Vérifier les dossiers installés, pas le code de retour.
- `sdkmanager` attend des **slashes** (`system-images/android-34/google_apis/x86_64`) ; `avdmanager`, lui, attend toujours des **points-virgules** dans son argument `-k`.
- Ne jamais remonter les plugins `@babel/plugin-transform-class-properties` & co. dans le tableau `plugins` de [babel.config.js](babel.config.js) : ils doivent rester cantonnés à `@tanstack` via `overrides`. Globalement, ils cassent silencieusement toute la couche réseau et font planter chaque `FlatList`. Le détail du mécanisme est en commentaire dans le fichier.

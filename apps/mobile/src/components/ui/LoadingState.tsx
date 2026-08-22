import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/ui/BrandLogo';
import { brand, spacing } from '@/theme/brand';

const MARK_SIZE = 72;
// Diamètre initial de l'onde : à peine plus grand que le logo, elle s'en détache.
const HALO_SIZE = MARK_SIZE + 16;

// `useNativeDriver` n'est pas supporté par react-native-web : il y déclenche un
// avertissement et retombe sur le driver JS — autant être explicite.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Écran d'attente aux couleurs de l'application : la marque « respire »
 * (léger zoom cyclique) pendant qu'une onde circulaire s'en échappe,
 * à la manière d'un sonar. Remplace l'ActivityIndicator générique.
 */
export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  const breath = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    const pulse = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );

    breathing.start();
    pulse.start();

    return () => {
      breathing.stop();
      pulse.stop();
    };
  }, [breath, halo]);

  const markScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.45, 0.12, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View
          style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
        />
        <Animated.View style={{ transform: [{ scale: markScale }] }}>
          <BrandMark size={MARK_SIZE} />
        </Animated.View>
      </View>
      <Text style={styles.appName}>Flux Financier</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: brand.canvas,
  },
  // Scène carrée : l'onde grossit jusqu'à ~1,9× sans décaler le logo ni le texte.
  stage: {
    width: HALO_SIZE * 2,
    height: HALO_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    borderWidth: 2,
    borderColor: brand.blue500,
    backgroundColor: brand.blue100,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: brand.navy900,
  },
  text: {
    marginTop: spacing.sm - 2,
    fontSize: 13.5,
    fontWeight: '500',
    color: brand.slate500,
  },
});

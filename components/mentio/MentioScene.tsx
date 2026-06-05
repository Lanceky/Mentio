import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Mentio, type AgeBand } from '@/constants/theme';
import { MentioRobot, type MentioMood } from './MentioRobot';

type Props = {
  mood?: MentioMood;
  age?: AgeBand;
  style?: ViewStyle;
};

/**
 * Renders the Mentio robot inside a WebGL canvas (expo-gl under the hood).
 * Lighting is tuned to the light/dark purple brand so he always looks soft.
 */
export function MentioScene({ mood = 'idle', age = 'kid', style }: Props) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Canvas
        camera={{ position: [0, 0.1, 4.4], fov: 42 }}
        gl={{ antialias: true }}
        style={styles.canvas}>
        <ambientLight intensity={0.95} color={Mentio.paper} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} color={Mentio.chalk} />
        <directionalLight position={[-4, 2, 2]} intensity={0.6} color={Mentio.sand} />
        <pointLight position={[0, 1.6, 1.5]} intensity={0.7} color={Mentio.ochre} distance={6} />
        <MentioRobot mood={mood} age={age} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
  },
  canvas: {
    flex: 1,
  },
});

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Mentio } from '@/constants/theme';

/** Three dots that bounce up and down in sequence — Mentio "is typing". */
export function TypingDots({ color = Mentio.inkSoft }: { color?: string }) {
    return (
        <View style={styles.row}>
            <Dot delay={0} color={color} />
            <Dot delay={160} color={color} />
            <Dot delay={320} color={color} />
        </View>
    );
}

function Dot({ delay, color }: { delay: number; color: string }) {
    const y = useSharedValue(0);

    useEffect(() => {
        y.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-5, { duration: 300, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
                ),
                -1,
                false
            )
        );
    }, [delay, y]);

    const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

    return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 5,
        paddingVertical: 2,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
});

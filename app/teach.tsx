import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MentioMood } from '@/components/mentio/MentioRobot';
import { MentioScene } from '@/components/mentio/MentioScene';
import { TypingDots } from '@/components/mentio/TypingDots';
import { AGE_BANDS, Mentio } from '@/constants/theme';
import { getTopic } from '@/constants/topics';
import { generateReply, opener, reactToMaterial, type MentioReply } from '@/lib/confusion-engine';
import { usePreferences } from '@/providers/preferences';

type Message = {
    id: string;
    from: 'mentio' | 'user' | 'system';
    text: string;
};

let idSeq = 0;
const nextId = () => `m${idSeq++}`;

export default function Teach() {
    const router = useRouter();
    const { prefs } = usePreferences();
    const { age, topicId, name } = prefs;

    const topic = useMemo(() => getTopic(topicId), [topicId]);
    const band = AGE_BANDS[age];

    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState('');
    const [mood, setMood] = useState<MentioMood>('curious');
    const [userTurns, setUserTurns] = useState(0);
    const [typing, setTyping] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Seed the conversation with Mentio's opening confusion.
    useEffect(() => {
        const first = opener(topicId, age);
        setMessages([{ id: nextId(), from: 'mentio', text: first.text }]);
        setMood(first.mood);
        setUserTurns(0);
    }, [topicId, age]);

    // Clean up any pending typing timer on unmount.
    useEffect(() => {
        return () => {
            if (typingTimer.current) clearTimeout(typingTimer.current);
        };
    }, []);

    const scrollToEnd = useCallback(() => {
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, []);

    /**
     * Mentio never answers instantly. He "thinks" first: the typing dots appear,
     * then after a beat (scaled to how much he's about to say) the reply lands.
     */
    const respondWithDelay = useCallback(
        (reply: MentioReply) => {
            setMood(reply.mood);
            setTyping(true);
            scrollToEnd();

            const think = 700 + Math.min(1600, reply.text.length * 28);
            typingTimer.current = setTimeout(() => {
                setTyping(false);
                setMessages((prev) => [...prev, { id: nextId(), from: 'mentio', text: reply.text }]);
                scrollToEnd();
            }, think);
        },
        [scrollToEnd]
    );

    const send = () => {
        const text = draft.trim();
        if (!text || typing) return;
        setDraft('');

        const turn = userTurns;
        setMessages((prev) => [...prev, { id: nextId(), from: 'user', text }]);
        setUserTurns((n) => n + 1);
        scrollToEnd();

        respondWithDelay(generateReply({ topicId, age, userText: text, turn }));
    };

    const upload = async () => {
        if (typing) return;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/*', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets?.length) return;
            const file = result.assets[0];

            setMessages((prev) => [
                ...prev,
                { id: nextId(), from: 'system', text: `\u{1F4CE} Added “${file.name}”` },
            ]);
            scrollToEnd();
            respondWithDelay(reactToMaterial(file.name, topicId, age));
        } catch {
            // Picker failures are non-fatal; ignore so the loop keeps going.
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: band.bg }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
                    <Text style={styles.backText}>‹</Text>
                </Pressable>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {topic.title}
                    </Text>
                    <Text style={styles.headerSub}>
                        {name ? `${name} is teaching Mentio` : 'You’re teaching Mentio'}
                    </Text>
                </View>
            </View>

            {/* Mentio avatar reacting to mood */}
            <View style={styles.avatarRow}>
                <View style={[styles.avatarGlow, { backgroundColor: band.accent, opacity: 0.16 }]} />
                <MentioScene mood={mood} age={age} style={styles.avatar} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={8}>
                {/* Conversation */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.flex}
                    contentContainerStyle={styles.convo}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={scrollToEnd}
                    showsVerticalScrollIndicator={false}>
                    {messages.map((m) => {
                        if (m.from === 'system') {
                            return (
                                <Text key={m.id} style={styles.system}>
                                    {m.text}
                                </Text>
                            );
                        }
                        const mine = m.from === 'user';
                        return (
                            <View
                                key={m.id}
                                style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleMentio]}>
                                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
                            </View>
                        );
                    })}

                    {/* Mentio is thinking — bouncing dots before he replies */}
                    {typing && (
                        <View style={[styles.bubble, styles.bubbleMentio, styles.typingBubble]}>
                            <TypingDots color={Mentio.inkSoft} />
                        </View>
                    )}
                </ScrollView>

                {/* Upload hint — nudge the learner to add their study material */}
                <Pressable onPress={upload} style={styles.uploadHint}>
                    <Text style={styles.uploadHintIcon}>📄</Text>
                    <Text style={styles.uploadHintText}>
                        Got notes or a worksheet? Upload it so Mentio can ask about it.
                    </Text>
                </Pressable>

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <Pressable onPress={upload} hitSlop={8} style={styles.uploadBtn}>
                        <Text style={styles.uploadIcon}>＋</Text>
                    </Pressable>
                    <TextInput
                        style={styles.input}
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Explain it to Mentio…"
                        placeholderTextColor={Mentio.stone}
                        multiline
                        onSubmitEditing={send}
                        returnKeyType="send"
                        blurOnSubmit
                    />
                    <Pressable
                        onPress={send}
                        disabled={!draft.trim()}
                        style={[styles.sendBtn, { backgroundColor: draft.trim() ? Mentio.pine : Mentio.stone }]}>
                        <Text style={styles.sendIcon}>↑</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
        gap: 8,
    },
    back: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Mentio.chalk,
        borderWidth: 1,
        borderColor: Mentio.stone,
    },
    backText: {
        fontSize: 24,
        lineHeight: 26,
        fontWeight: '800',
        color: Mentio.ink,
    },
    headerInfo: { flex: 1 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Mentio.ink,
    },
    headerSub: {
        fontSize: 12.5,
        fontWeight: '600',
        color: Mentio.inkSoft,
    },
    avatarRow: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
    },
    avatarGlow: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    avatar: {
        width: 180,
        height: 150,
    },
    convo: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 10,
    },
    bubble: {
        maxWidth: '82%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    bubbleMentio: {
        alignSelf: 'flex-start',
        backgroundColor: Mentio.chalk,
        borderTopLeftRadius: 6,
        borderWidth: 1,
        borderColor: Mentio.stone,
    },
    bubbleMine: {
        alignSelf: 'flex-end',
        backgroundColor: Mentio.ink,
        borderTopRightRadius: 6,
    },
    bubbleText: {
        fontSize: 15.5,
        lineHeight: 21,
        color: Mentio.ink,
        fontWeight: '600',
    },
    bubbleTextMine: {
        color: Mentio.chalk,
    },
    typingBubble: {
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    system: {
        alignSelf: 'center',
        fontSize: 12.5,
        fontWeight: '700',
        color: Mentio.inkSoft,
        backgroundColor: Mentio.sand,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: 'hidden',
    },
    uploadHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 14,
        backgroundColor: Mentio.sand,
        borderWidth: 1,
        borderColor: Mentio.stone,
        borderStyle: 'dashed',
    },
    uploadHintIcon: {
        fontSize: 18,
    },
    uploadHintText: {
        flex: 1,
        fontSize: 12.5,
        lineHeight: 17,
        fontWeight: '600',
        color: Mentio.inkSoft,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 6,
        borderTopWidth: 1,
        borderTopColor: Mentio.stone,
    },
    uploadBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Mentio.chalk,
        borderWidth: 1,
        borderColor: Mentio.stone,
    },
    uploadIcon: {
        fontSize: 24,
        lineHeight: 26,
        fontWeight: '700',
        color: Mentio.ink,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: Mentio.chalk,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 11,
        paddingBottom: 11,
        fontSize: 15.5,
        color: Mentio.ink,
        borderWidth: 1,
        borderColor: Mentio.stone,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendIcon: {
        fontSize: 22,
        fontWeight: '800',
        color: Mentio.chalk,
    },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AgeBand } from '@/constants/theme';

export type Preferences = {
    name: string;
    age: AgeBand;
    topicId: string;
    onboarded: boolean;
};

const DEFAULTS: Preferences = {
    name: '',
    age: 'kid',
    topicId: 'sorting',
    onboarded: false,
};

const STORAGE_KEY = 'mentio.preferences.v1';

type PreferencesContextValue = {
    prefs: Preferences;
    ready: boolean;
    update: (patch: Partial<Preferences>) => void;
    reset: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
    const [ready, setReady] = useState(false);

    // Load persisted preferences on first mount.
    useEffect(() => {
        let active = true;
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (active && raw) {
                    setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) });
                }
            })
            .catch(() => { })
            .finally(() => active && setReady(true));
        return () => {
            active = false;
        };
    }, []);

    // Persist whenever preferences change (after initial load).
    useEffect(() => {
        if (ready) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => { });
        }
    }, [prefs, ready]);

    const update = (patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch }));
    const reset = () => setPrefs(DEFAULTS);

    return (
        <PreferencesContext.Provider value={{ prefs, ready, update, reset }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const ctx = useContext(PreferencesContext);
    if (!ctx) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return ctx;
}

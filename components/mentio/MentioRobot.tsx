import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { Mentio, type AgeBand } from '@/constants/theme';

/** The expressive states Mentio can be in while talking to the child. */
export type MentioMood = 'idle' | 'happy' | 'curious' | 'nod' | 'celebrate';

type MoodTarget = {
  /** vertical bob amplitude */
  bob: number;
  /** how much the mouth curves into a smile (0 = flat, 1 = big smile) */
  smile: number;
  /** sideways head tilt (curiosity) in radians */
  tilt: number;
  /** continuous head-nodding strength (agreeing) */
  nod: number;
  /** antenna / face light intensity */
  glow: number;
  /** body spin speed multiplier (celebration) */
  spin: number;
  /** overall scale pop */
  pop: number;
};

const MOODS: Record<MentioMood, MoodTarget> = {
  idle: { bob: 0.025, smile: 0.45, tilt: 0, nod: 0, glow: 0.6, spin: 0, pop: 1 },
  happy: { bob: 0.04, smile: 1, tilt: 0, nod: 0, glow: 1, spin: 0, pop: 1.02 },
  curious: { bob: 0.02, smile: 0.2, tilt: 0.16, nod: 0, glow: 0.8, spin: 0, pop: 1 },
  nod: { bob: 0.025, smile: 0.7, tilt: 0, nod: 0.5, glow: 0.9, spin: 0, pop: 1 },
  celebrate: { bob: 0.06, smile: 1, tilt: 0, nod: 0, glow: 1.4, spin: 0.4, pop: 1.03 },
};

/**
 * Per-age tuning. As the learner gets older Mentio becomes calmer and sleeker:
 * smaller scale dampening on motion, less bounce, less glow flicker.
 */
const AGE_MOTION: Record<AgeBand, { motion: number; smoothing: number }> = {
  kid: { motion: 1, smoothing: 4 },
  teen: { motion: 0.6, smoothing: 5 },
  mature: { motion: 0.32, smoothing: 6 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function MentioRobot({
  mood = 'idle',
  age = 'kid',
}: {
  mood?: MentioMood;
  age?: AgeBand;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshStandardMaterial>(null);

  // Smoothly interpolated live values (so mood changes feel organic).
  const live = useRef<MoodTarget>({ ...MOODS.idle });
  // Tracks the next time Mentio should blink.
  const blink = useRef({ next: 1.5, closing: 0 });

  const ageCfg = AGE_MOTION[age];

  const materials = useMemo(() => buildMaterials(age), [age]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const target = MOODS[mood];
    const k = Math.min(1, delta * ageCfg.smoothing); // smoothing toward target mood
    const m = ageCfg.motion; // global motion damping for this age

    // Ease every live param toward the active mood.
    (Object.keys(target) as (keyof MoodTarget)[]).forEach((key) => {
      live.current[key] = lerp(live.current[key], target[key], k);
    });
    const L = live.current;

    if (root.current) {
      // Subtle floating bob + faint sway, scaled by age maturity.
      root.current.position.y = Math.sin(t * 1.2) * L.bob * m;
      root.current.rotation.z = Math.sin(t * 0.5) * 0.015 * m;
      root.current.rotation.y = L.spin > 0.02 ? t * 1.4 * L.spin * m : Math.sin(t * 0.4) * 0.05 * m;
      const targetScale = lerp(1, L.pop, m);
      const s = lerp(root.current.scale.x, targetScale, k);
      root.current.scale.setScalar(s);
    }

    if (head.current) {
      // Gentle curiosity tilt + soft nod.
      head.current.rotation.z = L.tilt * m + Math.sin(t * 0.7) * 0.008 * m;
      head.current.rotation.x = (L.nod * Math.sin(t * 3) * 0.14 + Math.sin(t * 1.0) * 0.008) * m;
    }

    // Blink: quick squash of the eyes on a timer.
    blink.current.next -= delta;
    if (blink.current.next <= 0 && blink.current.closing <= 0) {
      blink.current.closing = 0.18;
      blink.current.next = 2.2 + Math.random() * 2.5;
    }
    let eyeOpen = 1;
    if (blink.current.closing > 0) {
      blink.current.closing -= delta;
      const phase = Math.max(0, blink.current.closing) / 0.18;
      eyeOpen = Math.abs(phase - 0.5) * 2; // 1 -> 0 -> 1
    }
    if (leftEye.current && rightEye.current) {
      leftEye.current.scale.y = Math.max(0.08, eyeOpen);
      rightEye.current.scale.y = Math.max(0.08, eyeOpen);
    }

    // Mouth curls into a smile based on mood (kid/teen only).
    if (mouth.current) {
      mouth.current.rotation.z = lerp(Math.PI * 0.7, Math.PI, L.smile);
      mouth.current.scale.set(0.85 + L.smile * 0.35, 0.55 + L.smile * 0.7, 1);
    }

    // Face / antenna light pulses with a soft heartbeat (calmer as age rises).
    if (glowMat.current) {
      const flicker = 0.2 * m;
      glowMat.current.emissiveIntensity = L.glow * (1 - flicker + Math.sin(t * 2) * flicker);
    }
  });

  const refs = { root, head, leftEye, rightEye, mouth, glowMat };

  return (
    <group ref={root} position={[0, 0, 0]} scale={AGE_SCALE[age]}>
      {age === 'kid' && <KidPersona materials={materials} refs={refs} />}
      {age === 'teen' && <TeenPersona materials={materials} refs={refs} />}
      {age === 'mature' && <MaturePersona materials={materials} refs={refs} />}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Shared plumbing for the three age personas                          */
/* ------------------------------------------------------------------ */

type Materials = ReturnType<typeof buildMaterials>;

type PersonaRefs = {
  root: React.RefObject<THREE.Group | null>;
  head: React.RefObject<THREE.Group | null>;
  leftEye: React.RefObject<THREE.Mesh | null>;
  rightEye: React.RefObject<THREE.Mesh | null>;
  mouth: React.RefObject<THREE.Mesh | null>;
  glowMat: React.RefObject<THREE.MeshStandardMaterial | null>;
};

type PersonaProps = { materials: Materials; refs: PersonaRefs };

const AGE_SCALE: Record<AgeBand, number> = {
  kid: 0.5,
  teen: 0.5,
  mature: 0.52,
};

/** Each age uses a slightly more mature material treatment. */
function buildMaterials(age: AgeBand) {
  const bodyColor = age === 'kid' ? Mentio.clay : age === 'teen' ? Mentio.ochre : Mentio.stone;
  const panelColor =
    age === 'mature' ? Mentio.ink : age === 'teen' ? Mentio.sand : Mentio.chalk;
  const metalness = age === 'kid' ? 0.1 : age === 'teen' ? 0.3 : 0.6;
  const roughness = age === 'kid' ? 0.5 : age === 'teen' ? 0.45 : 0.35;

  return {
    body: new THREE.MeshStandardMaterial({ color: bodyColor, roughness, metalness }),
    panel: new THREE.MeshStandardMaterial({
      color: panelColor,
      roughness: age === 'mature' ? 0.4 : 0.55,
      metalness: age === 'mature' ? 0.4 : 0.05,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: age === 'kid' ? Mentio.clayDeep : Mentio.ink,
      roughness: 0.5,
      metalness: 0.2,
    }),
    glasses: new THREE.MeshStandardMaterial({
      color: Mentio.ink,
      roughness: 0.35,
      metalness: 0.3,
    }),
    eyeWhite: new THREE.MeshStandardMaterial({
      color: Mentio.chalk,
      roughness: 0.25,
      emissive: new THREE.Color(Mentio.chalk),
      emissiveIntensity: 0.1,
    }),
    pupil: new THREE.MeshStandardMaterial({ color: Mentio.ink, roughness: 0.3 }),
    shine: new THREE.MeshStandardMaterial({
      color: Mentio.chalk,
      roughness: 0.1,
      emissive: new THREE.Color(Mentio.chalk),
      emissiveIntensity: 0.5,
    }),
    mouth: new THREE.MeshStandardMaterial({ color: Mentio.ink, roughness: 0.4 }),
  };
}

/* ------------------------------------------------------------------ */
/* Ages 5–9 — the playful, bubbly original                             */
/* ------------------------------------------------------------------ */

function KidPersona({ materials, refs }: PersonaProps) {
  const { head, leftEye, rightEye, mouth, glowMat } = refs;
  return (
    <>
      {/* Rounded body */}
      <mesh position={[0, -1.0, 0]} scale={[0.62, 0.58, 0.58]} material={materials.body}>
        <sphereGeometry args={[0.85, 48, 48]} />
      </mesh>
      {/* Soft chest panel */}
      <mesh position={[0, -0.98, 0.42]} scale={[0.4, 0.42, 0.16]} material={materials.panel}>
        <sphereGeometry args={[0.55, 32, 32]} />
      </mesh>

      {/* Head group (nods + tilts) — a friendly small rectangular head */}
      <group ref={head} position={[0, 0.05, 0]}>
        <mesh material={materials.body}>
          <boxGeometry args={[1.15, 0.95, 0.85]} />
        </mesh>
        <mesh position={[0, -0.05, 0.4]} scale={[0.78, 0.66, 0.16]} material={materials.panel}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>

        {/* Cheek bolts */}
        <mesh position={[-0.62, -0.3, 0.2]} material={materials.dark}>
          <sphereGeometry args={[0.09, 24, 24]} />
        </mesh>
        <mesh position={[0.62, -0.3, 0.2]} material={materials.dark}>
          <sphereGeometry args={[0.09, 24, 24]} />
        </mesh>

        {/* Big friendly eyes */}
        <group position={[0, 0.04, 0.46]}>
          <mesh ref={leftEye} position={[-0.26, 0, 0]} material={materials.eyeWhite}>
            <sphereGeometry args={[0.2, 32, 32]} />
          </mesh>
          <mesh position={[-0.26, -0.02, 0.14]} material={materials.pupil}>
            <sphereGeometry args={[0.11, 24, 24]} />
          </mesh>
          <mesh position={[-0.21, 0.06, 0.21]} material={materials.shine}>
            <sphereGeometry args={[0.042, 16, 16]} />
          </mesh>
          <mesh ref={rightEye} position={[0.26, 0, 0]} material={materials.eyeWhite}>
            <sphereGeometry args={[0.2, 32, 32]} />
          </mesh>
          <mesh position={[0.26, -0.02, 0.14]} material={materials.pupil}>
            <sphereGeometry args={[0.11, 24, 24]} />
          </mesh>
          <mesh position={[0.31, 0.06, 0.21]} material={materials.shine}>
            <sphereGeometry args={[0.042, 16, 16]} />
          </mesh>
        </group>

        {/* Soft smile */}
        <mesh
          ref={mouth}
          position={[0, -0.34, 0.46]}
          rotation={[0, 0, Math.PI]}
          material={materials.mouth}>
          <torusGeometry args={[0.15, 0.034, 16, 32, Math.PI]} />
        </mesh>

        {/* Antenna on top */}
        <mesh position={[0, 0.66, 0]} material={materials.dark}>
          <cylinderGeometry args={[0.03, 0.03, 0.34, 16]} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial
            ref={glowMat}
            color={Mentio.ochre}
            emissive={new THREE.Color(Mentio.ochre)}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Ages 10–15 — sleeker, a visor instead of cartoon eyes, no antenna   */
/* ------------------------------------------------------------------ */

function TeenPersona({ materials, refs }: PersonaProps) {
  const { head, leftEye, rightEye, mouth, glowMat } = refs;
  return (
    <>
      {/* Slimmer, taller body */}
      <mesh position={[0, -0.95, 0]} scale={[0.5, 0.62, 0.5]} material={materials.body}>
        <sphereGeometry args={[0.85, 48, 48]} />
      </mesh>
      {/* Slim chest seam */}
      <mesh position={[0, -0.9, 0.36]} scale={[0.26, 0.4, 0.12]} material={materials.panel}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>

      {/* Rounded-rectangle head, a touch narrower */}
      <group ref={head} position={[0, 0.08, 0]}>
        <mesh material={materials.body}>
          <boxGeometry args={[1.0, 0.92, 0.8]} />
        </mesh>
        {/* Face panel */}
        <mesh position={[0, 0.02, 0.4]} material={materials.panel}>
          <boxGeometry args={[0.82, 0.5, 0.04]} />
        </mesh>

        {/* Round glowing eyes (kept as refs so blink still works) */}
        <group position={[0, 0.08, 0.44]}>
          <mesh ref={leftEye} position={[-0.22, 0, 0]}>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial
              ref={glowMat}
              color={Mentio.chalk}
              emissive={new THREE.Color(Mentio.chalk)}
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          {/* left pupil — tiny dark dot for a lifelike gaze */}
          <mesh position={[-0.22, 0, 0.085]} material={materials.pupil}>
            <sphereGeometry args={[0.038, 16, 16]} />
          </mesh>
          <mesh ref={rightEye} position={[0.22, 0, 0]}>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial
              color={Mentio.chalk}
              emissive={new THREE.Color(Mentio.chalk)}
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          {/* right pupil — tiny dark dot for a lifelike gaze */}
          <mesh position={[0.22, 0, 0.085]} material={materials.pupil}>
            <sphereGeometry args={[0.038, 16, 16]} />
          </mesh>
        </group>

        {/* Glasses — round lens frames, a bridge, and temple arms */}
        <group position={[0, 0.08, 0.49]}>
          {/* left lens frame */}
          <mesh position={[-0.22, 0, 0]} material={materials.glasses}>
            <torusGeometry args={[0.15, 0.022, 16, 32]} />
          </mesh>
          {/* right lens frame */}
          <mesh position={[0.22, 0, 0]} material={materials.glasses}>
            <torusGeometry args={[0.15, 0.022, 16, 32]} />
          </mesh>
          {/* bridge */}
          <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.glasses}>
            <cylinderGeometry args={[0.018, 0.018, 0.14, 12]} />
          </mesh>
          {/* temple arms reaching back to the head sides */}
          <mesh position={[-0.4, 0.02, -0.08]} rotation={[0, 0.5, 0]} material={materials.glasses}>
            <cylinderGeometry args={[0.016, 0.016, 0.22, 12]} />
          </mesh>
          <mesh position={[0.4, 0.02, -0.08]} rotation={[0, -0.5, 0]} material={materials.glasses}>
            <cylinderGeometry args={[0.016, 0.016, 0.22, 12]} />
          </mesh>
        </group>

        {/* Subtle understated smile line */}
        <mesh
          ref={mouth}
          position={[0, -0.3, 0.42]}
          rotation={[0, 0, Math.PI]}
          material={materials.mouth}>
          <torusGeometry args={[0.12, 0.022, 12, 28, Math.PI]} />
        </mesh>

        {/* Side comms vents instead of a kiddie antenna */}
        <mesh position={[-0.54, 0.1, 0]} material={materials.dark}>
          <boxGeometry args={[0.06, 0.32, 0.5]} />
        </mesh>
        <mesh position={[0.54, 0.1, 0]} material={materials.dark}>
          <boxGeometry args={[0.06, 0.32, 0.5]} />
        </mesh>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Ages 15–20 — minimal, polished device. A single light bar, no smile */
/* ------------------------------------------------------------------ */

function MaturePersona({ materials, refs }: PersonaProps) {
  const { head, leftEye, rightEye, glowMat } = refs;
  return (
    <>
      {/* Monolithic tapered body */}
      <mesh position={[0, -0.95, 0]} scale={[0.46, 0.7, 0.46]} material={materials.body}>
        <cylinderGeometry args={[0.8, 0.95, 1.4, 32]} />
      </mesh>
      {/* Thin accent ring */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.dark}>
        <torusGeometry args={[0.46, 0.03, 16, 48]} />
      </mesh>

      {/* Smooth rounded-cube head */}
      <group ref={head} position={[0, 0.18, 0]}>
        <mesh material={materials.body}>
          <boxGeometry args={[0.92, 0.86, 0.82]} />
        </mesh>
        {/* Inset glass face panel */}
        <mesh position={[0, 0, 0.4]} material={materials.panel}>
          <boxGeometry args={[0.78, 0.66, 0.06]} />
        </mesh>

        {/* Single horizontal light bar — the only "expression" */}
        <mesh ref={leftEye} position={[0, 0.02, 0.45]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.05, 0.42, 6, 16]} />
          <meshStandardMaterial
            ref={glowMat}
            color={Mentio.ochre}
            emissive={new THREE.Color(Mentio.ochre)}
            emissiveIntensity={1.5}
            roughness={0.12}
          />
        </mesh>
        {/* hidden second ref so blink logic stays valid */}
        <mesh ref={rightEye} visible={false} position={[0, 0.02, 0.45]}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
        </mesh>

        {/* Fine seam line under the bar */}
        <mesh position={[0, -0.26, 0.41]} material={materials.dark}>
          <boxGeometry args={[0.5, 0.012, 0.04]} />
        </mesh>
      </group>
    </>
  );
}

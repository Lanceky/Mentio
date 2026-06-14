# Mentio

**The robot you get to teach.**

Mentio is a learning app built on the **protégé effect** — the well-studied idea that we
understand something far more deeply when we have to teach it to someone else. Instead of
quizzing the child, Mentio flips the classroom: a small, friendly 3D robot becomes the
*student*, and the child becomes the *teacher*.

Mentio never gives answers, never corrects, and never lectures. He just gets genuinely
(and charmingly) confused — asking for an example, poking at a contradiction, wondering
"but why does that work?" — so the child has to think harder and explain better. When the
explanation finally clicks, he celebrates.

## How it works

1. **Onboarding** — the child enters their name, picks an age band, and chooses a subject
   to teach.
2. **Teaching** — Mentio greets them and asks what they want to start with. The child
   explains in their own words; Mentio reacts to exactly what they said and asks one
   curious follow-up question.
3. **Bring your own material** *(optional)* — upload notes, a worksheet, or a textbook
   chapter (PDF, Word `.docx`, or plain text). Mentio reads it on-device and makes his
   questions revolve around that material. With no upload, he asks about the chosen
   subject instead.
4. **The robot reacts** — the 3D robot shifts mood (curious, nodding, happy, celebrating)
   in time with the conversation.

Every line Mentio says is generated live by the **DeepSeek** model from a strict,
behaviour-rich prompt — there are no canned or scripted responses.

## Age-adaptive

Mentio tailors his voice, his questions, and even his appearance to three age bands:

| Band     | Ages   | Mentio's voice                                              |
| -------- | ------ | ----------------------------------------------------------- |
| Kid      | 5–9    | Playful and silly, tiny words, lots of wonder               |
| Teen     | 10–15  | Casual classmate, sharper "but why does that work?" probing |
| Mature   | 15–20  | Calm and Socratic — definitions, edge cases, counterexamples |

The subject list, prompt voice, model temperature, and the robot's look all change with
the band.

## Tech stack

- **Expo SDK 54** with **expo-router** (file-based routing), React 19, React Native 0.81,
  Hermes, New Architecture
- **TypeScript** (strict)
- **three.js** + **@react-three/fiber** + **expo-gl** for the real-time 3D robot
- **DeepSeek** chat completions API for all of Mentio's dialogue
- **expo-document-picker** + **expo-file-system** for uploads, with on-device extraction via
  **pdfjs-dist** (PDF) and **jszip** (`.docx`) — no backend, the material never leaves the
  device
- **AsyncStorage** for persisting the learner's preferences

## Project structure

```
app/                 File-based routes
  _layout.tsx        Root stack + preferences provider
  index.tsx          Onboarding (name, age, subject)
  teach.tsx          Teaching screen (chat + upload + 3D robot)
components/mentio/    3D robot, GL scene, and typing indicator
constants/            Theme tokens and the subject catalogue
lib/                  DeepSeek client + document extraction pipeline
providers/            Preferences (persisted with AsyncStorage)
```

## Getting started

### Prerequisites

- Node.js 18+
- A **DeepSeek API key** ([platform.deepseek.com](https://platform.deepseek.com))
- The **Expo Go** app on your phone, or an Android emulator / iOS simulator

### 1. Install dependencies

```bash
npm install
```

### 2. Add your DeepSeek API key

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

> The `.env` file is git-ignored. Without a key, the app still runs but Mentio will tell
> you he isn't connected yet.

### 3. Start the app

```bash
npx expo start
```

Then scan the QR code with **Expo Go**, or press `a` / `i` to open an Android emulator or
iOS simulator.

## Scripts

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `npm start`          | Start the Expo dev server             |
| `npm run android`    | Start and open on Android             |
| `npm run ios`        | Start and open on iOS                 |
| `npm run web`        | Start the web build                   |
| `npm run lint`       | Lint with ESLint (`expo lint`)        |
| `npx tsc --noEmit`   | Type-check the project                |

## Note on the API key

This prototype uses an `EXPO_PUBLIC_` environment variable, which Expo embeds directly into
the app bundle. That's fine for a demo or hackathon build, but it means the key is shipped
to the client. For production you should move the DeepSeek call behind your own server-side
proxy so the key never reaches the device.

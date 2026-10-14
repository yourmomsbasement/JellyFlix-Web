import React, { type ReactNode } from 'react';

/** Features drawn on white faces. */
const INK = '#141414';
const WHITE = '#fff';
const PINK = '#F48FB1';
const ORANGE = '#FFA726';
const SHADE = 'rgba(0, 0, 0, 0.14)';

export interface AvatarIconDefinition {
    id: string
    /** Shown to screen readers and as a tooltip. */
    label: string
    /** Drawn in a 100×100 box on top of the profile color. */
    art: ReactNode
}

const smile = (
    <>
        <rect x='28' y='30' width='9' height='16' rx='2' fill={WHITE} />
        <rect x='63' y='30' width='9' height='16' rx='2' fill={WHITE} />
        <path d='M24 60 Q50 84 76 60' stroke={WHITE} strokeWidth='7' fill='none' strokeLinecap='round' />
    </>
);

/**
 * The generated avatars a profile can pick, Netflix-style: simple characters on the profile color. A profile without
 * one shows the smiley; a photo, when there is one, is shown instead.
 */
export const AVATAR_ICONS: AvatarIconDefinition[] = [
    { id: 'smile', label: 'Smile', art: smile },
    {
        id: 'cool',
        label: 'Cool',
        art: (
            <>
                <path d='M20 36 H80 V42 Q78 56 64 56 Q54 56 52 44 H48 Q46 56 36 56 Q22 56 20 42 Z' fill={INK} />
                <path d='M27 40 L33 40' stroke='rgba(255,255,255,0.5)' strokeWidth='3' strokeLinecap='round' />
                <path d='M58 40 L64 40' stroke='rgba(255,255,255,0.5)' strokeWidth='3' strokeLinecap='round' />
                <path d='M32 68 Q52 80 70 64' stroke={WHITE} strokeWidth='7' fill='none' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'starry',
        label: 'Starry eyes',
        art: (
            <>
                <path d='M33 24 L37 34 L48 34 L39 41 L42 52 L33 45 L24 52 L27 41 L18 34 L29 34 Z' fill={WHITE} />
                <path d='M67 24 L71 34 L82 34 L73 41 L76 52 L67 45 L58 52 L61 41 L52 34 L63 34 Z' fill={WHITE} />
                <path d='M30 62 H70 Q70 84 50 84 Q30 84 30 62 Z' fill={WHITE} />
            </>
        )
    },
    {
        id: 'love',
        label: 'Heart eyes',
        art: (
            <>
                <path d='M33 50 L20 37 A7.5 7.5 0 0 1 33 28 A7.5 7.5 0 0 1 46 37 Z' fill={WHITE} />
                <path d='M67 50 L54 37 A7.5 7.5 0 0 1 67 28 A7.5 7.5 0 0 1 80 37 Z' fill={WHITE} />
                <path d='M26 62 Q50 86 74 62' stroke={WHITE} strokeWidth='7' fill='none' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'cat',
        label: 'Cat',
        art: (
            <>
                <path d='M20 46 L24 12 L46 32 Z' fill={WHITE} />
                <path d='M80 46 L76 12 L54 32 Z' fill={WHITE} />
                <path d='M26 40 L28 22 L39 32 Z' fill={PINK} />
                <path d='M74 40 L72 22 L61 32 Z' fill={PINK} />
                <circle cx='50' cy='58' r='31' fill={WHITE} />
                <ellipse cx='38' cy='54' rx='4.5' ry='7' fill={INK} />
                <ellipse cx='62' cy='54' rx='4.5' ry='7' fill={INK} />
                <path d='M45 65 H55 L50 71 Z' fill={PINK} />
                <path d='M50 71 Q45 77 40 74 M50 71 Q55 77 60 74' stroke={INK} strokeWidth='2.5' fill='none' strokeLinecap='round' />
                <path d='M30 64 L12 60 M30 69 L13 72 M70 64 L88 60 M70 69 L87 72' stroke={INK} strokeWidth='2' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'bear',
        label: 'Bear',
        art: (
            <>
                <circle cx='25' cy='30' r='13' fill={WHITE} />
                <circle cx='75' cy='30' r='13' fill={WHITE} />
                <circle cx='25' cy='30' r='6' fill={SHADE} />
                <circle cx='75' cy='30' r='6' fill={SHADE} />
                <circle cx='50' cy='57' r='32' fill={WHITE} />
                <circle cx='38' cy='50' r='4.5' fill={INK} />
                <circle cx='62' cy='50' r='4.5' fill={INK} />
                <ellipse cx='50' cy='68' rx='15' ry='11' fill={SHADE} />
                <ellipse cx='50' cy='63' rx='6' ry='4.5' fill={INK} />
                <path d='M50 67 V72 M44 74 Q50 78 56 74' stroke={INK} strokeWidth='2.5' fill='none' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'panda',
        label: 'Panda',
        art: (
            <>
                <circle cx='24' cy='28' r='12' fill={INK} />
                <circle cx='76' cy='28' r='12' fill={INK} />
                <circle cx='50' cy='56' r='33' fill={WHITE} />
                <ellipse cx='36' cy='52' rx='9' ry='12' transform='rotate(30 36 52)' fill={INK} />
                <ellipse cx='64' cy='52' rx='9' ry='12' transform='rotate(-30 64 52)' fill={INK} />
                <circle cx='37' cy='51' r='3' fill={WHITE} />
                <circle cx='63' cy='51' r='3' fill={WHITE} />
                <ellipse cx='50' cy='66' rx='5.5' ry='4' fill={INK} />
                <path d='M44 74 Q50 79 56 74' stroke={INK} strokeWidth='2.5' fill='none' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'fox',
        label: 'Fox',
        art: (
            <>
                <path d='M16 44 L22 10 L46 30 Z' fill={WHITE} />
                <path d='M84 44 L78 10 L54 30 Z' fill={WHITE} />
                <path d='M24 36 L26 20 L38 30 Z' fill={INK} />
                <path d='M76 36 L74 20 L62 30 Z' fill={INK} />
                <path d='M14 38 Q50 18 86 38 L50 88 Z' fill={WHITE} />
                <path d='M14 38 Q34 46 40 58 L50 88 Z M86 38 Q66 46 60 58 L50 88 Z' fill={SHADE} />
                <ellipse cx='36' cy='50' rx='4' ry='5.5' fill={INK} />
                <ellipse cx='64' cy='50' rx='4' ry='5.5' fill={INK} />
                <circle cx='50' cy='80' r='5' fill={INK} />
            </>
        )
    },
    {
        id: 'bunny',
        label: 'Bunny',
        art: (
            <>
                <rect x='29' y='4' width='14' height='40' rx='7' fill={WHITE} />
                <rect x='57' y='4' width='14' height='40' rx='7' fill={WHITE} />
                <rect x='33' y='10' width='6' height='28' rx='3' fill={PINK} />
                <rect x='61' y='10' width='6' height='28' rx='3' fill={PINK} />
                <circle cx='50' cy='62' r='29' fill={WHITE} />
                <circle cx='39' cy='57' r='4' fill={INK} />
                <circle cx='61' cy='57' r='4' fill={INK} />
                <ellipse cx='50' cy='67' rx='4.5' ry='3.5' fill={PINK} />
                <path d='M50 70 V74 M42 74 Q46 79 50 74 Q54 79 58 74' stroke={INK} strokeWidth='2.2' fill='none' strokeLinecap='round' />
                <rect x='46' y='75' width='8' height='7' rx='1.5' fill={WHITE} stroke={INK} strokeWidth='1.5' />
            </>
        )
    },
    {
        id: 'owl',
        label: 'Owl',
        art: (
            <>
                <path d='M20 30 L28 12 L38 26 Q50 22 62 26 L72 12 L80 30 Q86 50 80 70 Q72 90 50 90 Q28 90 20 70 Q14 50 20 30 Z' fill={WHITE} />
                <circle cx='36' cy='46' r='13' fill={SHADE} />
                <circle cx='64' cy='46' r='13' fill={SHADE} />
                <circle cx='36' cy='46' r='8' fill={WHITE} />
                <circle cx='64' cy='46' r='8' fill={WHITE} />
                <circle cx='37' cy='47' r='5' fill={INK} />
                <circle cx='63' cy='47' r='5' fill={INK} />
                <path d='M44 58 H56 L50 68 Z' fill={ORANGE} />
                <path d='M34 76 Q38 72 42 76 M46 79 Q50 75 54 79 M58 76 Q62 72 66 76' stroke={SHADE} strokeWidth='2.5' fill='none' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'penguin',
        label: 'Penguin',
        art: (
            <>
                <ellipse cx='50' cy='56' rx='34' ry='36' fill={INK} />
                <path d='M50 38 Q36 22 26 36 Q16 54 28 74 Q38 90 50 90 Q62 90 72 74 Q84 54 74 36 Q64 22 50 38 Z' fill={WHITE} />
                <circle cx='40' cy='50' r='4.5' fill={INK} />
                <circle cx='60' cy='50' r='4.5' fill={INK} />
                <path d='M42 60 H58 L50 69 Z' fill={ORANGE} />
                <circle cx='30' cy='64' r='4' fill={PINK} opacity='0.6' />
                <circle cx='70' cy='64' r='4' fill={PINK} opacity='0.6' />
            </>
        )
    },
    {
        id: 'frog',
        label: 'Frog',
        art: (
            <>
                <circle cx='30' cy='32' r='14' fill={WHITE} />
                <circle cx='70' cy='32' r='14' fill={WHITE} />
                <circle cx='31' cy='32' r='6' fill={INK} />
                <circle cx='69' cy='32' r='6' fill={INK} />
                <ellipse cx='50' cy='62' rx='38' ry='26' fill={WHITE} />
                <path d='M24 62 Q50 82 76 62' stroke={INK} strokeWidth='4' fill='none' strokeLinecap='round' />
                <circle cx='24' cy='70' r='5' fill={PINK} opacity='0.7' />
                <circle cx='76' cy='70' r='5' fill={PINK} opacity='0.7' />
                <circle cx='44' cy='52' r='1.8' fill={INK} />
                <circle cx='56' cy='52' r='1.8' fill={INK} />
            </>
        )
    },
    {
        id: 'robot',
        label: 'Robot',
        art: (
            <>
                <path d='M50 10 V22' stroke={WHITE} strokeWidth='4' strokeLinecap='round' />
                <circle cx='50' cy='9' r='5' fill={WHITE} />
                <rect x='10' y='44' width='8' height='18' rx='3' fill={WHITE} />
                <rect x='82' y='44' width='8' height='18' rx='3' fill={WHITE} />
                <rect x='17' y='22' width='66' height='60' rx='12' fill={WHITE} />
                <circle cx='36' cy='46' r='9' fill={INK} />
                <circle cx='64' cy='46' r='9' fill={INK} />
                <circle cx='38' cy='44' r='3' fill={WHITE} />
                <circle cx='66' cy='44' r='3' fill={WHITE} />
                <rect x='31' y='62' width='38' height='10' rx='3' fill={INK} />
                <path d='M40.5 62 V72 M50 62 V72 M59.5 62 V72' stroke={WHITE} strokeWidth='2' />
            </>
        )
    },
    {
        id: 'alien',
        label: 'Alien',
        art: (
            <>
                <path d='M34 22 L24 8 M66 22 L76 8' stroke={WHITE} strokeWidth='3.5' strokeLinecap='round' />
                <circle cx='24' cy='8' r='5' fill={WHITE} />
                <circle cx='76' cy='8' r='5' fill={WHITE} />
                <path d='M50 16 Q86 16 84 50 Q82 78 50 92 Q18 78 16 50 Q14 16 50 16 Z' fill={WHITE} />
                <ellipse cx='36' cy='50' rx='9' ry='14' transform='rotate(-30 36 50)' fill={INK} />
                <ellipse cx='64' cy='50' rx='9' ry='14' transform='rotate(30 64 50)' fill={INK} />
                <circle cx='33' cy='45' r='2.5' fill={WHITE} />
                <circle cx='61' cy='45' r='2.5' fill={WHITE} />
                <path d='M44 76 Q50 80 56 76' stroke={INK} strokeWidth='2.5' fill='none' strokeLinecap='round' />
            </>
        )
    },
    {
        id: 'ghost',
        label: 'Ghost',
        art: (
            <>
                <path d='M22 88 V46 A28 28 0 0 1 78 46 V88 L68.7 80 L59.3 88 L50 80 L40.7 88 L31.3 80 Z' fill={WHITE} />
                <ellipse cx='39' cy='46' rx='5.5' ry='8' fill={INK} />
                <ellipse cx='61' cy='46' rx='5.5' ry='8' fill={INK} />
                <ellipse cx='50' cy='64' rx='6' ry='7' fill={INK} />
            </>
        )
    },
    {
        id: 'monster',
        label: 'Monster',
        art: (
            <>
                <path d='M24 30 L16 8 L36 22 Z M76 30 L84 8 L64 22 Z' fill={WHITE} />
                <rect x='16' y='20' width='68' height='70' rx='26' fill={WHITE} />
                <circle cx='50' cy='46' r='15' fill={INK} />
                <circle cx='50' cy='46' r='7' fill={WHITE} />
                <circle cx='52' cy='44' r='3.5' fill={INK} />
                <path d='M30 68 Q50 86 70 68 Z' fill={INK} />
                <path d='M36 70 L40 76 L44 71 M56 71 L60 76 L64 70' fill={WHITE} />
            </>
        )
    },
    {
        id: 'astronaut',
        label: 'Astronaut',
        art: (
            <>
                <circle cx='50' cy='50' r='38' fill={WHITE} />
                <rect x='22' y='30' width='56' height='38' rx='19' fill={INK} />
                <path d='M32 42 Q36 36 44 36' stroke='rgba(255,255,255,0.6)' strokeWidth='4' fill='none' strokeLinecap='round' />
                <circle cx='70' cy='60' r='3' fill='rgba(255,255,255,0.4)' />
                <rect x='38' y='80' width='24' height='8' rx='3' fill={SHADE} />
                <circle cx='12' cy='50' r='6' fill={WHITE} />
                <circle cx='88' cy='50' r='6' fill={WHITE} />
            </>
        )
    },
    {
        id: 'ninja',
        label: 'Ninja',
        art: (
            <>
                <circle cx='50' cy='52' r='36' fill={INK} />
                <path d='M78 38 L94 28 M80 44 L96 44' stroke={INK} strokeWidth='7' strokeLinecap='round' />
                <rect x='16' y='38' width='68' height='22' rx='11' fill={WHITE} />
                <path d='M30 50 Q36 44 44 49 M56 49 Q64 44 70 50' stroke={INK} strokeWidth='5' fill='none' strokeLinecap='round' />
            </>
        )
    }
];

const ICONS_BY_ID = new Map(AVATAR_ICONS.map(icon => [ icon.id, icon ]));

/** The icon with this id; the smiley for none or one this client doesn't know. */
export const getAvatarIcon = (id: string | null | undefined) => ICONS_BY_ID.get(id ?? '') ?? AVATAR_ICONS[0];

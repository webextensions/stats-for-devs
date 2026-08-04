// The `stats-for-devs/auto` entry: importing this module IS the API - it mounts the HUD (which
// renders nothing until shown). One line in a host's entry file:
//
//     import 'stats-for-devs/auto';
//
// Kept separate from the side-effect-free `index.ts` barrel so tree-shaking consumers of the
// package API never pay for the mount. A tsdown entry in its own right (dist/auto.js - see
// frontend/lib/tsdown.config.ts) and listed in package.json.ts "sideEffects".

import { mountStatsForDevs } from './statsForDevs/mount.tsx';

mountStatsForDevs();

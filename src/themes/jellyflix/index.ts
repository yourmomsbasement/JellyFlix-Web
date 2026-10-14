import { JELLYFLIX_PALETTES } from './palettes';
import { buildJellyFlixScheme } from './scheme';

/** The "Classic Red" color scheme: near-black with a red accent. (Its id stays `jellyflix` for existing settings.) */
const theme = buildJellyFlixScheme(JELLYFLIX_PALETTES.jellyflix);

export default theme;

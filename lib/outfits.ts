/**
 * Pro Mr. Guy outfits — each is a hat (drawn over the head) plus a clothing
 * recolour map (original sprite hex → outfit hex). Shared by every mascot
 * renderer (MrGuyMascot, MarketCharacter) so the look is consistent.
 *
 * Hat pixel = [row, col, colour]; row 0 is the top hair row, negative rows sit
 * above the head in the canvas headroom.
 */
export type HatPixel = [number, number, string]
export interface Outfit { name: string; hat: HatPixel[]; suit: Record<string, string> }

// hat palettes
const BD = '#c43d3d', DO = '#e05a5a', PO = '#f5f5f5'           // beanie
const GO = '#ffcf33', GD = '#d39e00', JW = '#e0384e'           // crown gold
const BK = '#16161e', BND = '#6a1a2a'                          // top hat

const BEANIE: HatPixel[] = [
  [-3, 9, PO],
  [-2, 6, DO], [-2, 7, DO], [-2, 8, DO], [-2, 9, DO], [-2, 10, DO], [-2, 11, DO], [-2, 12, DO],
  [-1, 5, DO], [-1, 6, DO], [-1, 7, DO], [-1, 8, DO], [-1, 9, DO], [-1, 10, DO], [-1, 11, DO], [-1, 12, DO], [-1, 13, DO],
  [0, 4, BD], [0, 5, BD], [0, 6, BD], [0, 7, BD], [0, 8, BD], [0, 9, BD], [0, 10, BD], [0, 11, BD], [0, 12, BD], [0, 13, BD], [0, 14, BD],
]
const CROWN: HatPixel[] = [
  [-2, 5, GO], [-2, 7, GO], [-2, 9, GO], [-2, 11, GO], [-2, 13, GO],
  [-1, 5, GO], [-1, 6, GO], [-1, 7, GO], [-1, 8, GO], [-1, 9, JW], [-1, 10, GO], [-1, 11, GO], [-1, 12, GO], [-1, 13, GO],
  [0, 5, GD], [0, 6, GD], [0, 7, GD], [0, 8, GD], [0, 9, GD], [0, 10, GD], [0, 11, GD], [0, 12, GD], [0, 13, GD],
]
const TOPHAT: HatPixel[] = [
  [-3, 6, BK], [-3, 7, BK], [-3, 8, BK], [-3, 9, BK], [-3, 10, BK], [-3, 11, BK], [-3, 12, BK],
  [-2, 6, BK], [-2, 7, BK], [-2, 8, BK], [-2, 9, BK], [-2, 10, BK], [-2, 11, BK], [-2, 12, BK],
  [-1, 6, BND], [-1, 7, BND], [-1, 8, BND], [-1, 9, BND], [-1, 10, BND], [-1, 11, BND], [-1, 12, BND],
  [0, 3, BK], [0, 4, BK], [0, 5, BK], [0, 6, BK], [0, 7, BK], [0, 8, BK], [0, 9, BK], [0, 10, BK], [0, 11, BK], [0, 12, BK], [0, 13, BK], [0, 14, BK], [0, 15, BK],
]

// Original sprite colours (must match the GRID constants in the mascot files)
const J1 = '#0f0f1a', J2 = '#181828', J3 = '#222236'   // suit
const TR = '#c01010', TD = '#7a0000'                   // bow tie
const SH = '#0a0a14', SL = '#1c1c30'                   // shoes

export const OUTFITS: Record<string, Outfit> = {
  royal:  { name: 'Royal',  hat: CROWN,  suit: { [J1]: '#2a1245', [J2]: '#4a2178', [J3]: '#6a35a8', [TR]: GO, [TD]: GD } },
  winter: { name: 'Winter', hat: BEANIE, suit: { [J1]: '#10301d', [J2]: '#1c5234', [J3]: '#277a4a', [SH]: '#2e1c0e', [SL]: '#4a3018' } },
  tuxedo: { name: 'Tuxedo', hat: TOPHAT, suit: { [J1]: '#0b0b0e', [J2]: '#17171c', [J3]: '#26262e', [TR]: '#1f1f26', [TD]: '#000000' } },
}

export const OUTFIT_IDS = Object.keys(OUTFITS)

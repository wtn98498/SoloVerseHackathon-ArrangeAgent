import { TrackKind } from '../contracts';

/**
 * Single source of truth for instrument visuals (Kinetic Play palette).
 * Frontend presentation only — does NOT change the shared data contract.
 * `color` = bright container fill, `shadow` = dark tone used for the
 * chunky 0-blur offset shadow, `soft` = light tint background.
 */
export interface InstrumentTheme {
  kind: TrackKind;
  label: string; // 中文
  en: string; // 英文
  icon: string; // base-aware public asset path
  color: string; // bright container fill
  shadow: string; // dark chunky-shadow tone
  soft: string; // light tint
  onColor: string; // readable text color on top of `color`
}

export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

export const INSTRUMENT_THEME: Record<TrackKind, InstrumentTheme> = {
  drums: {
    kind: 'drums',
    label: '鼓组',
    en: 'Drums',
    icon: publicAsset('icons/drums.png'),
    color: '#e60012',
    shadow: '#930007',
    soft: '#ffe0e3',
    onColor: '#ffffff',
  },
  bass: {
    kind: 'bass',
    label: '贝斯',
    en: 'Bass',
    icon: publicAsset('icons/bass.png'),
    color: '#16c265',
    shadow: '#0a5c2c',
    soft: '#d4f7e3',
    onColor: '#002814',
  },
  guitar: {
    kind: 'guitar',
    label: '吉他',
    en: 'Guitar',
    icon: publicAsset('icons/guitar.png'),
    color: '#ebc300',
    shadow: '#554500',
    soft: '#fff4cc',
    onColor: '#231b00',
  },
  keys: {
    kind: 'keys',
    label: '键盘',
    en: 'Keys',
    icon: publicAsset('icons/keys.png'),
    color: '#37b4ff',
    shadow: '#004b70',
    soft: '#d6f0ff',
    onColor: '#001e30',
  },
};

/** Display order for the instrument sidebar + timeline. */
export const INSTRUMENT_ORDER: TrackKind[] = ['drums', 'bass', 'guitar', 'keys'];

/** CSS custom-property bag for an instrument, to spread onto an element's style. */
export function instrumentVars(theme: InstrumentTheme): React.CSSProperties {
  return {
    ['--c' as any]: theme.color,
    ['--cs' as any]: theme.shadow,
  };
}

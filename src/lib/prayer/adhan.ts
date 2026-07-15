import {
  CalculationMethod,
  type CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
} from 'adhan';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type CalculationMethodKey =
  | 'singapore' // MUIS — Fajr 20° / Isha 18°, closest ASEAN standard for Thailand
  | 'mwl'
  | 'umm_al_qura'
  | 'egyptian'
  | 'karachi'
  | 'moonsighting';

export type MadhabKey = 'shafi' | 'hanafi';

export interface PrayerCalcOptions {
  method?: CalculationMethodKey;
  madhab?: MadhabKey;
}

// Thai Muslim community is predominantly Shafi'i; Singapore/JAKIM parameters
// (Fajr 20°, Isha 18°) are the closest published standard to Thai practice.
// Official Chularajmontri tables always take precedence over calculation.
export const DEFAULT_METHOD: CalculationMethodKey = 'singapore';
export const DEFAULT_MADHAB: MadhabKey = 'shafi';

const METHOD_FACTORIES: Record<CalculationMethodKey, () => CalculationParameters> = {
  singapore: CalculationMethod.Singapore,
  mwl: CalculationMethod.MuslimWorldLeague,
  umm_al_qura: CalculationMethod.UmmAlQura,
  egyptian: CalculationMethod.Egyptian,
  karachi: CalculationMethod.Karachi,
  moonsighting: CalculationMethod.MoonsightingCommittee,
};

export function getCalculationParams(options: PrayerCalcOptions = {}): CalculationParameters {
  const params = METHOD_FACTORIES[options.method ?? DEFAULT_METHOD]();
  params.madhab = (options.madhab ?? DEFAULT_MADHAB) === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

export interface CalculatedPrayerTimes {
  source: 'calculated';
  method: CalculationMethodKey;
  madhab: MadhabKey;
  times: Record<PrayerName, Date>;
}

/** Pure client-safe calculation — works fully offline (no network, no API). */
export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  options: PrayerCalcOptions = {},
): CalculatedPrayerTimes {
  const coordinates = new Coordinates(latitude, longitude);
  const pt = new PrayerTimes(coordinates, date, getCalculationParams(options));
  return {
    source: 'calculated',
    method: options.method ?? DEFAULT_METHOD,
    madhab: options.madhab ?? DEFAULT_MADHAB,
    times: {
      fajr: pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha,
    },
  };
}

export const PRAYER_ORDER: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** The next upcoming prayer after `now`, or fajr of the next day. */
export function nextPrayer(
  times: Record<PrayerName, Date>,
  now: Date,
): { name: PrayerName; at: Date } | null {
  for (const name of PRAYER_ORDER) {
    if (name === 'sunrise') continue; // sunrise is not a prayer
    if (times[name] > now) return { name, at: times[name] };
  }
  return null;
}

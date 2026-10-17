/** English publishes; Chinese is available only while developing locally. */
export const developmentLocales = ['en'] as const;
export const productionLocales = ['en'] as const;
export type Locale = (typeof developmentLocales)[number];
export const defaultLocale: Locale = 'en';
export function localesForCommand(isProductionBuild: boolean): readonly Locale[] {
  return isProductionBuild ? productionLocales : developmentLocales;
}

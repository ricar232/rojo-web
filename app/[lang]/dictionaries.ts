import 'server-only';
import type es from '../../dictionaries/es.json';

const dictionaries = {
  en: () => import('../../dictionaries/en.json').then((module) => module.default),
  es: () => import('../../dictionaries/es.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof es;

export const hasLocale = (locale: string): locale is Locale => {
  return locale in dictionaries;
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};

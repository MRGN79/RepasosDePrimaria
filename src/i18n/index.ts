import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

/*
 * Configuración i18n (ADR-001 §2).
 * Idiomas base: EN (fallback técnico del scaffold) + ES (uso real en España).
 * Detección: localStorage → navigator. Un usuario español con navegador en ES
 * verá ES desde el primer arranque.
 *
 * Maquetador: deja aquí los namespaces cargados con las claves usadas en la
 * capa visual. Frontend amplía el contenido (banco de feedback, ejercicios)
 * sin tocar esta configuración.
 */

import enCommon from "@locales/en/common.json";
import enHome from "@locales/en/home.json";
import enOnboarding from "@locales/en/onboarding.json";
import enSubjects from "@locales/en/subjects.json";
import enQuiz from "@locales/en/quiz.json";
import enResults from "@locales/en/results.json";
import enBackpack from "@locales/en/backpack.json";
import enPrint from "@locales/en/print.json";
import enSettings from "@locales/en/settings.json";
import enContent from "@locales/en/content.json";
import enExercises from "@locales/en/exercises.json";
import enCalligraphy from "@locales/en/calligraphy.json";
import enAuth from "@locales/en/auth.json";

import esCommon from "@locales/es/common.json";
import esHome from "@locales/es/home.json";
import esOnboarding from "@locales/es/onboarding.json";
import esSubjects from "@locales/es/subjects.json";
import esQuiz from "@locales/es/quiz.json";
import esResults from "@locales/es/results.json";
import esBackpack from "@locales/es/backpack.json";
import esPrint from "@locales/es/print.json";
import esSettings from "@locales/es/settings.json";
import esContent from "@locales/es/content.json";
import esExercises from "@locales/es/exercises.json";
import esCalligraphy from "@locales/es/calligraphy.json";
import esAuth from "@locales/es/auth.json";

export const NAMESPACES = [
  "common",
  "home",
  "onboarding",
  "subjects",
  "quiz",
  "results",
  "backpack",
  "print",
  "settings",
  "content",
  "exercises",
  "calligraphy",
  "auth",
] as const;

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    onboarding: enOnboarding,
    subjects: enSubjects,
    quiz: enQuiz,
    results: enResults,
    backpack: enBackpack,
    print: enPrint,
    settings: enSettings,
    content: enContent,
    exercises: enExercises,
    calligraphy: enCalligraphy,
    auth: enAuth,
  },
  es: {
    common: esCommon,
    home: esHome,
    onboarding: esOnboarding,
    subjects: esSubjects,
    quiz: esQuiz,
    results: esResults,
    backpack: esBackpack,
    print: esPrint,
    settings: esSettings,
    content: esContent,
    exercises: esExercises,
    calligraphy: esCalligraphy,
    auth: esAuth,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    ns: NAMESPACES,
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "tdp:lang",
      caches: ["localStorage"],
    },
  });

export default i18n;

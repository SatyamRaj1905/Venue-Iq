import { SUPPORTED_LANGUAGE_IDS, type SupportedLanguage } from "@/lib/domain/constants";

export { isSupportedLanguage, type SupportedLanguage } from "@/lib/domain/constants";

export const supportedLanguages = SUPPORTED_LANGUAGE_IDS;

export interface LanguageOption {
  value: SupportedLanguage;
  label: string;
  nativeLabel: string;
  direction: "ltr" | "rtl";
}

export const languageOptions: LanguageOption[] = [
  { value: "en", label: "English", nativeLabel: "English", direction: "ltr" },
  { value: "es", label: "Spanish", nativeLabel: "Español", direction: "ltr" },
  { value: "fr", label: "French", nativeLabel: "Français", direction: "ltr" },
  { value: "pt", label: "Portuguese", nativeLabel: "Português", direction: "ltr" },
  { value: "ar", label: "Arabic", nativeLabel: "العربية", direction: "rtl" },
  { value: "hi", label: "Hindi", nativeLabel: "हिन्दी", direction: "ltr" },
];

export function getLanguageDirection(language: SupportedLanguage): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}

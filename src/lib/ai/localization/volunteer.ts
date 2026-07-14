import type { SupportedLanguage, VolunteerTopic } from "../schemas";

const VOLUNTEER_BOUNDARIES: Readonly<Record<SupportedLanguage, string>> = {
  en: "Do not improvise during emergencies or act beyond the approved volunteer SOP. Contact the named trained venue role when escalation is required.",
  es: "No improvise durante emergencias ni actúe fuera del procedimiento aprobado para voluntarios. Contacte al responsable capacitado indicado cuando sea necesario escalar.",
  fr: "N’improvisez pas en cas d’urgence et ne dépassez pas la procédure approuvée. Contactez le rôle formé indiqué lorsqu’une escalade est nécessaire.",
  pt: "Não improvise durante emergências nem aja além do procedimento aprovado. Contate a função treinada indicada quando for necessário escalar.",
  ar: "لا ترتجل أثناء الطوارئ ولا تتجاوز إجراءات المتطوعين المعتمدة. تواصل مع مسؤول الموقع المدرّب المذكور عند الحاجة إلى التصعيد.",
  hi: "आपातस्थिति में मनमाना कदम न उठाएँ और स्वीकृत स्वयंसेवक प्रक्रिया से बाहर न जाएँ। ज़रूरत पड़ने पर बताए गए प्रशिक्षित वेन्यू अधिकारी से संपर्क करें।",
};

const SOP_TITLES: Readonly<Record<SupportedLanguage, Readonly<Record<VolunteerTopic, string>>>> = {
  en: {
    "accessible-entry": "Accessible entrance assistance",
    "lost-person": "Lost person or separated family",
    medical: "Medical assistance",
    transport: "Transport disruption assistance",
    crowd: "Crowd concern",
  },
  es: {
    "accessible-entry": "Ayuda para entrada accesible",
    "lost-person": "Persona perdida o familia separada",
    medical: "Asistencia médica",
    transport: "Ayuda por interrupción del transporte",
    crowd: "Incidencia de afluencia",
  },
  fr: {
    "accessible-entry": "Aide à l’entrée accessible",
    "lost-person": "Personne perdue ou famille séparée",
    medical: "Assistance médicale",
    transport: "Aide en cas de perturbation des transports",
    crowd: "Préoccupation liée à la foule",
  },
  pt: {
    "accessible-entry": "Ajuda para entrada acessível",
    "lost-person": "Pessoa perdida ou família separada",
    medical: "Assistência médica",
    transport: "Ajuda com interrupção de transporte",
    crowd: "Preocupação com multidão",
  },
  ar: {
    "accessible-entry": "مساعدة الدخول الميسّر",
    "lost-person": "شخص مفقود أو عائلة منفصلة",
    medical: "مساعدة طبية",
    transport: "مساعدة عند تعطّل النقل",
    crowd: "مشكلة ازدحام",
  },
  hi: {
    "accessible-entry": "सुगम प्रवेश सहायता",
    "lost-person": "लापता व्यक्ति या बिछड़ा परिवार",
    medical: "चिकित्सा सहायता",
    transport: "परिवहन व्यवधान सहायता",
    crowd: "भीड़ संबंधी चिंता",
  },
};

export function localizeVolunteerBoundary(
  language: SupportedLanguage,
  englishBoundary: string,
): string {
  return language === "en" ? englishBoundary : VOLUNTEER_BOUNDARIES[language];
}

export function localizeSopTitle(language: SupportedLanguage, topic: VolunteerTopic): string {
  return SOP_TITLES[language][topic];
}

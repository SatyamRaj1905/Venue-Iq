import type { SupportedLanguage } from "./languageOptions";

export type VolunteerRole = "wayfinding" | "accessibility" | "guest-services" | "transport";
export type SopTopic = "accessible-entry" | "lost-person" | "medical" | "transport" | "crowd";

export interface VolunteerOption<T extends string> {
  value: T;
  label: string;
}

export interface VolunteerFallback {
  summary: string;
  checklist: string[];
  escalation: string;
  contactRole: string;
}

export const volunteerRoles: Array<VolunteerOption<VolunteerRole>> = [
  { value: "wayfinding", label: "Wayfinding volunteer" },
  { value: "accessibility", label: "Accessibility support" },
  { value: "guest-services", label: "Guest services" },
  { value: "transport", label: "Transport liaison" },
];

export const sopTopics: Array<VolunteerOption<SopTopic>> = [
  { value: "accessible-entry", label: "Accessible entrance" },
  { value: "lost-person", label: "Lost person or family" },
  { value: "medical", label: "Medical support" },
  { value: "transport", label: "Transport disruption" },
  { value: "crowd", label: "Crowd concern" },
];

const englishFallback: VolunteerFallback = {
  summary:
    "Welcome the family, confirm that step-free access is needed, and guide them to Gate B via the signed east plaza route.",
  checklist: [
    "Ask whether anyone needs mobility or sensory support.",
    "Point out the cyan accessible-route signs to Gate B.",
    "Offer to contact the accessibility host at the Gate B assistance desk.",
    "Keep the east plaza emergency lane clear while walking with the family.",
  ],
  escalation:
    "If the route is blocked, the family is distressed, or medical help is needed, contact venue control. Do not choose an unverified shortcut.",
  contactRole: "Gate B accessibility host",
};

export const volunteerFallbacks: Record<SupportedLanguage, VolunteerFallback> = {
  en: englishFallback,
  es: {
    summary:
      "Reciba a la familia, confirme que necesita acceso sin escalones y guíela a la Puerta B por la ruta señalizada de la plaza este.",
    checklist: [
      "Pregunte si alguien necesita apoyo de movilidad o sensorial.",
      "Señale las indicaciones cian de ruta accesible hacia la Puerta B.",
      "Ofrezca contactar al anfitrión de accesibilidad del puesto de ayuda.",
      "Mantenga libre el carril de emergencia de la plaza este.",
    ],
    escalation:
      "Si la ruta está bloqueada, la familia está angustiada o necesita ayuda médica, contacte al control del recinto.",
    contactRole: "Anfitrión de accesibilidad de la Puerta B",
  },
  fr: {
    summary:
      "Accueillez la famille, confirmez le besoin d’un accès sans marches et guidez-la vers la porte B par l’itinéraire balisé de la place est.",
    checklist: [
      "Demandez si une aide à la mobilité ou sensorielle est nécessaire.",
      "Montrez les panneaux cyan d’itinéraire accessible vers la porte B.",
      "Proposez de joindre l’agent d’accessibilité au point d’aide.",
      "Gardez libre la voie d’urgence de la place est.",
    ],
    escalation:
      "Si le trajet est bloqué ou qu’une aide médicale est requise, contactez le poste de contrôle du site.",
    contactRole: "Agent d’accessibilité de la porte B",
  },
  pt: {
    summary:
      "Acolha a família, confirme a necessidade de acesso sem degraus e oriente-a ao Portão B pela rota sinalizada da praça leste.",
    checklist: [
      "Pergunte se alguém precisa de apoio de mobilidade ou sensorial.",
      "Mostre a sinalização ciano da rota acessível até o Portão B.",
      "Ofereça contato com o anfitrião de acessibilidade.",
      "Mantenha livre a faixa de emergência da praça leste.",
    ],
    escalation:
      "Se a rota estiver bloqueada ou houver necessidade médica, contate o controle do estádio.",
    contactRole: "Anfitrião de acessibilidade do Portão B",
  },
  ar: {
    summary:
      "رحّب بالعائلة، وتأكد من حاجتها إلى مسار دون درج، ثم أرشدها إلى البوابة B عبر مسار الساحة الشرقية المعلّم.",
    checklist: [
      "اسأل عمّا إذا كان أحدهم يحتاج إلى دعم حركي أو حسّي.",
      "أشر إلى علامات المسار الميسّر باللون السماوي.",
      "اعرض التواصل مع مضيف إتاحة الوصول.",
      "حافظ على ممر الطوارئ في الساحة الشرقية خاليًا.",
    ],
    escalation:
      "إذا كان المسار مغلقًا أو لزمت مساعدة طبية، اتصل بغرفة تحكم الملعب. لا تستخدم طريقًا مختصرًا غير معتمد.",
    contactRole: "مضيف إتاحة الوصول عند البوابة B",
  },
  hi: {
    summary:
      "परिवार का स्वागत करें, सीढ़ी-रहित पहुँच की ज़रूरत पक्की करें और उन्हें पूर्वी प्लाज़ा के चिह्नित मार्ग से गेट B तक ले जाएँ।",
    checklist: [
      "पूछें कि किसी को चलने-फिरने या संवेदी सहायता चाहिए।",
      "गेट B तक नीले-हरे सुगम मार्ग संकेत दिखाएँ।",
      "सहायता डेस्क के एक्सेसिबिलिटी होस्ट से संपर्क की पेशकश करें।",
      "पूर्वी प्लाज़ा की आपातकालीन लेन खाली रखें।",
    ],
    escalation:
      "मार्ग बंद होने, परिवार के परेशान होने या चिकित्सा सहायता की ज़रूरत पर वेन्यू कंट्रोल से संपर्क करें।",
    contactRole: "गेट B एक्सेसिबिलिटी होस्ट",
  },
};

const obstructedAccessFallbacks: Record<SupportedLanguage, VolunteerFallback> = {
  en: {
    summary:
      "The shared simulation reports an accessible-route obstruction. Keep the family at a staffed assistance point until venue control confirms a signed step-free alternative.",
    checklist: [
      "Keep the family at the nearest staffed assistance point.",
      "Explain that venue control must confirm the accessible route before travel.",
      "Contact the accessibility lead through the approved channel.",
      "Use only the signed step-free alternative confirmed by venue control.",
    ],
    escalation:
      "The active accessible-route obstruction requires confirmation from venue control. Do not choose or improvise an alternative route.",
    contactRole: "Accessibility lead and venue control",
  },
  es: {
    summary:
      "La simulación compartida indica una obstrucción en la ruta accesible. Mantenga a la familia en un punto de asistencia atendido hasta que el control del recinto confirme una alternativa señalizada sin escalones.",
    checklist: [
      "Mantenga a la familia en el punto de asistencia atendido más cercano.",
      "Explique que el control del recinto debe confirmar la ruta accesible.",
      "Contacte al responsable de accesibilidad por el canal autorizado.",
      "Use solo la alternativa sin escalones confirmada y señalizada.",
    ],
    escalation:
      "La obstrucción activa requiere confirmación del control del recinto. No improvise una ruta alternativa.",
    contactRole: "Responsable de accesibilidad y control del recinto",
  },
  fr: {
    summary:
      "La simulation partagée signale une obstruction de l’itinéraire accessible. Gardez la famille à un point d’aide occupé jusqu’à la confirmation d’un autre trajet sans marches par le poste de contrôle.",
    checklist: [
      "Gardez la famille au point d’aide occupé le plus proche.",
      "Expliquez que le poste de contrôle doit confirmer l’itinéraire accessible.",
      "Contactez le responsable de l’accessibilité par le canal approuvé.",
      "Utilisez uniquement l’autre trajet sans marches confirmé et balisé.",
    ],
    escalation:
      "L’obstruction active nécessite la confirmation du poste de contrôle. N’improvisez pas un autre itinéraire.",
    contactRole: "Responsable de l’accessibilité et poste de contrôle",
  },
  pt: {
    summary:
      "A simulação compartilhada informa uma obstrução na rota acessível. Mantenha a família em um ponto de apoio com equipe até o controle do local confirmar uma alternativa sinalizada e sem degraus.",
    checklist: [
      "Mantenha a família no ponto de apoio com equipe mais próximo.",
      "Explique que o controle do local deve confirmar a rota acessível.",
      "Contate a liderança de acessibilidade pelo canal aprovado.",
      "Use somente a alternativa sem degraus confirmada e sinalizada.",
    ],
    escalation:
      "A obstrução ativa exige confirmação do controle do local. Não improvise uma rota alternativa.",
    contactRole: "Liderança de acessibilidade e controle do local",
  },
  ar: {
    summary:
      "تشير المحاكاة المشتركة إلى وجود عائق في المسار الميسّر. أبقِ العائلة عند نقطة مساعدة مأهولة حتى تؤكد غرفة التحكم مسارًا بديلاً معتمدًا دون درج.",
    checklist: [
      "أبقِ العائلة عند أقرب نقطة مساعدة مأهولة.",
      "وضّح أن غرفة التحكم يجب أن تؤكد المسار الميسّر قبل التحرك.",
      "اتصل بمسؤول إتاحة الوصول عبر القناة المعتمدة.",
      "استخدم فقط المسار البديل المعلّم دون درج الذي تؤكده غرفة التحكم.",
    ],
    escalation: "يتطلب عائق المسار النشط تأكيدًا من غرفة التحكم. لا تخترع أو ترتجل مسارًا بديلاً.",
    contactRole: "مسؤول إتاحة الوصول وغرفة التحكم",
  },
  hi: {
    summary:
      "साझा सिमुलेशन में सुगम मार्ग पर रुकावट दर्ज है। वेन्यू कंट्रोल के चिह्नित सीढ़ी-रहित विकल्प की पुष्टि करने तक परिवार को स्टाफ़ वाले सहायता बिंदु पर रखें।",
    checklist: [
      "परिवार को निकटतम स्टाफ़ वाले सहायता बिंदु पर रखें।",
      "बताएँ कि आगे बढ़ने से पहले वेन्यू कंट्रोल को सुगम मार्ग की पुष्टि करनी होगी।",
      "स्वीकृत चैनल से एक्सेसिबिलिटी लीड से संपर्क करें।",
      "केवल वेन्यू कंट्रोल द्वारा पुष्ट चिह्नित सीढ़ी-रहित विकल्प का उपयोग करें।",
    ],
    escalation:
      "सक्रिय मार्ग रुकावट के लिए वेन्यू कंट्रोल की पुष्टि आवश्यक है। कोई वैकल्पिक मार्ग स्वयं न बनाएँ।",
    contactRole: "एक्सेसिबिलिटी लीड और वेन्यू कंट्रोल",
  },
};

const safeEnglishFallbacksByTopic: Record<SopTopic, VolunteerFallback> = {
  "accessible-entry": englishFallback,
  "lost-person": {
    summary:
      "Keep the reporting guest at the nearest staffed assistance point and contact the guest-services supervisor through the approved channel.",
    checklist: [
      "Keep the reporting guest at the nearest staffed assistance point.",
      "Record only the minimum description needed by venue control.",
      "Contact the guest-services supervisor using the approved radio channel.",
      "Do not broadcast personal details publicly.",
    ],
    escalation:
      "All lost-person reports must be handed to the trained guest-services and security teams.",
    contactRole: "Guest-services supervisor",
  },
  medical: {
    summary:
      "Contact medical command immediately, report the signed location marker, and keep the response route clear.",
    checklist: [
      "Contact medical command immediately through the approved channel.",
      "State the signed location marker and any visible hazards.",
      "Keep access clear and follow the medical commander's instructions.",
      "Do not diagnose, move, or treat the guest unless specifically trained and directed.",
    ],
    escalation:
      "Medical concerns are outside standard volunteer authority and require trained responders.",
    contactRole: "Medical command",
  },
  transport: {
    summary:
      "Check the approved transport bulletin, share only listed accessible alternatives, and direct the guest to the transport liaison desk.",
    checklist: [
      "Check the approved transport status bulletin.",
      "Share only the listed accessible alternatives and estimated times.",
      "Direct guests to the transport liaison desk for individual support.",
    ],
    escalation:
      "Escalate when no approved accessible option is listed or a guest may miss essential assistance.",
    contactRole: "Transport liaison",
  },
  crowd: {
    summary:
      "Report the signed location and observable concern to crowd control, keep emergency routes clear, and await trained instructions.",
    checklist: [
      "Report the signed location and observable concern to crowd control.",
      "Keep emergency and step-free paths clear.",
      "Follow approved steward instructions and avoid creating a counter-flow.",
    ],
    escalation: "Crowd interventions require the trained crowd-safety team and human approval.",
    contactRole: "Crowd safety lead",
  },
};

/**
 * Returns localized copy for the primary accessible-entry demo and a
 * topic-correct English safety baseline for every other SOP. The baseline is
 * intentionally preferred to a fluent but incorrect emergency fallback.
 */
export function getVolunteerFallback(
  language: SupportedLanguage,
  topic: SopTopic,
  accessRouteUnavailable = false,
): VolunteerFallback {
  if (topic === "accessible-entry" && accessRouteUnavailable) {
    return obstructedAccessFallbacks[language];
  }
  return topic === "accessible-entry"
    ? volunteerFallbacks[language]
    : safeEnglishFallbacksByTopic[topic];
}

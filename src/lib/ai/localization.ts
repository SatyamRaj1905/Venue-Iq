import type {
  FacilityKind,
  RoutePreferences,
  ScenarioId,
  StadiumAlert,
  StadiumPathKind,
} from "@/lib/domain";

import type { AlertSummary, SupportedLanguage, VolunteerTopic } from "./schemas";

interface RouteCopy {
  readonly instruction: Readonly<Record<StadiumPathKind, (destination: string) => string>>;
  readonly stepFree: string;
  readonly stairs: string;
  readonly lift: string;
  readonly ramp: string;
  readonly baseExplanation: string;
  readonly stepFreeExplanation: string;
  readonly crowdExplanation: (level: string) => string;
  readonly quietExplanation: string;
  readonly obstructionExplanation: string;
}

const ROUTE_COPY: Readonly<Record<SupportedLanguage, RouteCopy>> = {
  en: {
    instruction: {
      lift: (destination) => `Take the lift to ${destination}.`,
      ramp: (destination) => `Follow the step-free ramp to ${destination}.`,
      stairs: (destination) => `Use the stairs to ${destination}.`,
      "accessible-path": (destination) => `Follow the accessible path to ${destination}.`,
      walkway: (destination) => `Continue along the concourse to ${destination}.`,
    },
    stepFree: "Step-free segment.",
    stairs: "This segment contains stairs and is not step-free.",
    lift: "Step-free lift; allow time to board and exit.",
    ramp: "Step-free ramp with a gradual incline.",
    baseExplanation: "Calculated from the trusted simulated stadium graph.",
    stepFreeExplanation: "Every selected segment is step-free.",
    crowdExplanation: (level) =>
      `Crowd weighting was applied; the busiest selected segment is ${level}.`,
    quietExplanation: "Quieter paths received a lower routing cost.",
    obstructionExplanation: "Closed and accessibility-obstructed paths were excluded.",
  },
  es: {
    instruction: {
      lift: (destination) => `Tome el ascensor hasta ${destination}.`,
      ramp: (destination) => `Siga la rampa sin escalones hasta ${destination}.`,
      stairs: (destination) => `Use las escaleras hasta ${destination}.`,
      "accessible-path": (destination) => `Siga el camino accesible hasta ${destination}.`,
      walkway: (destination) => `Continúe por el vestíbulo hasta ${destination}.`,
    },
    stepFree: "Tramo sin escalones.",
    stairs: "Este tramo tiene escaleras y no es accesible sin escalones.",
    lift: "Ascensor sin escalones; reserve tiempo para entrar y salir.",
    ramp: "Rampa sin escalones con pendiente gradual.",
    baseExplanation: "Calculado con el grafo simulado y fiable del estadio.",
    stepFreeExplanation: "Todos los tramos seleccionados son accesibles sin escalones.",
    crowdExplanation: (level) =>
      `Se aplicó la ponderación de afluencia; el tramo más concurrido tiene nivel ${level}.`,
    quietExplanation: "Las rutas más tranquilas recibieron un coste menor.",
    obstructionExplanation: "Se excluyeron las rutas cerradas y con obstáculos de accesibilidad.",
  },
  fr: {
    instruction: {
      lift: (destination) => `Prenez l’ascenseur jusqu’à ${destination}.`,
      ramp: (destination) => `Suivez la rampe sans marches jusqu’à ${destination}.`,
      stairs: (destination) => `Prenez les escaliers jusqu’à ${destination}.`,
      "accessible-path": (destination) => `Suivez le chemin accessible jusqu’à ${destination}.`,
      walkway: (destination) => `Continuez dans le hall jusqu’à ${destination}.`,
    },
    stepFree: "Tronçon sans marches.",
    stairs: "Ce tronçon comporte des escaliers et n’est pas sans marches.",
    lift: "Ascenseur sans marches ; prévoyez le temps d’embarquer et de sortir.",
    ramp: "Rampe sans marches à pente progressive.",
    baseExplanation: "Calculé à partir du plan simulé et fiable du stade.",
    stepFreeExplanation: "Tous les tronçons sélectionnés sont sans marches.",
    crowdExplanation: (level) =>
      `La fréquentation a été pondérée ; le tronçon le plus chargé est au niveau ${level}.`,
    quietExplanation: "Les chemins plus calmes ont reçu un coût inférieur.",
    obstructionExplanation: "Les chemins fermés ou obstrués pour l’accessibilité ont été exclus.",
  },
  pt: {
    instruction: {
      lift: (destination) => `Pegue o elevador até ${destination}.`,
      ramp: (destination) => `Siga a rampa sem degraus até ${destination}.`,
      stairs: (destination) => `Use as escadas até ${destination}.`,
      "accessible-path": (destination) => `Siga o caminho acessível até ${destination}.`,
      walkway: (destination) => `Continue pelo saguão até ${destination}.`,
    },
    stepFree: "Trecho sem degraus.",
    stairs: "Este trecho contém escadas e não é livre de degraus.",
    lift: "Elevador sem degraus; reserve tempo para entrar e sair.",
    ramp: "Rampa sem degraus com inclinação gradual.",
    baseExplanation: "Calculado a partir do mapa simulado e confiável do estádio.",
    stepFreeExplanation: "Todos os trechos selecionados são livres de degraus.",
    crowdExplanation: (level) =>
      `A lotação foi ponderada; o trecho mais movimentado está no nível ${level}.`,
    quietExplanation: "Caminhos mais silenciosos receberam custo menor.",
    obstructionExplanation:
      "Caminhos fechados ou com obstruções de acessibilidade foram excluídos.",
  },
  ar: {
    instruction: {
      lift: (destination) => `استخدم المصعد إلى ${destination}.`,
      ramp: (destination) => `اتبع المنحدر الخالي من الدرج إلى ${destination}.`,
      stairs: (destination) => `استخدم الدرج إلى ${destination}.`,
      "accessible-path": (destination) => `اتبع المسار الميسّر إلى ${destination}.`,
      walkway: (destination) => `تابع عبر الرواق إلى ${destination}.`,
    },
    stepFree: "مقطع خالٍ من الدرج.",
    stairs: "يتضمن هذا المقطع درجًا وليس خاليًا من الدرج.",
    lift: "مصعد خالٍ من الدرج؛ اترك وقتًا للدخول والخروج.",
    ramp: "منحدر خالٍ من الدرج وميله تدريجي.",
    baseExplanation: "حُسب المسار من مخطط الملعب التجريبي الموثوق.",
    stepFreeExplanation: "جميع المقاطع المختارة خالية من الدرج.",
    crowdExplanation: (level) => `طُبّق ترجيح الازدحام؛ مستوى أكثر المقاطع ازدحامًا هو ${level}.`,
    quietExplanation: "حصلت المسارات الأكثر هدوءًا على تكلفة توجيه أقل.",
    obstructionExplanation: "استُبعدت المسارات المغلقة والمسارات ذات عوائق إتاحة الوصول.",
  },
  hi: {
    instruction: {
      lift: (destination) => `${destination} तक लिफ़्ट लें।`,
      ramp: (destination) => `${destination} तक सीढ़ी-रहित रैंप का पालन करें।`,
      stairs: (destination) => `${destination} तक सीढ़ियों का उपयोग करें।`,
      "accessible-path": (destination) => `${destination} तक सुगम मार्ग का पालन करें।`,
      walkway: (destination) => `${destination} तक कॉनकोर्स पर आगे बढ़ें।`,
    },
    stepFree: "सीढ़ी-रहित खंड।",
    stairs: "इस खंड में सीढ़ियाँ हैं और यह सीढ़ी-रहित नहीं है।",
    lift: "सीढ़ी-रहित लिफ़्ट; चढ़ने और उतरने के लिए समय रखें।",
    ramp: "धीमी ढलान वाला सीढ़ी-रहित रैंप।",
    baseExplanation: "विश्वसनीय सिम्युलेटेड स्टेडियम ग्राफ़ से गणना की गई।",
    stepFreeExplanation: "चुने गए सभी खंड सीढ़ी-रहित हैं।",
    crowdExplanation: (level) => `भीड़ भार लागू किया गया; सबसे व्यस्त खंड का स्तर ${level} है।`,
    quietExplanation: "शांत रास्तों को कम रूटिंग लागत दी गई।",
    obstructionExplanation: "बंद और सुगम्यता-अवरुद्ध रास्तों को हटाया गया।",
  },
};

const FACILITY_LABELS: Readonly<Record<SupportedLanguage, Readonly<Record<FacilityKind, string>>>> =
  {
    en: {
      toilet: "Toilet",
      "accessible-toilet": "Accessible toilet",
      medical: "Medical point",
      "water-refill": "Water refill",
      "assistance-desk": "Assistance desk",
      food: "Food area",
      "transport-pickup": "Transport pickup",
      lift: "Lift",
    },
    es: {
      toilet: "Baño",
      "accessible-toilet": "Baño accesible",
      medical: "Puesto médico",
      "water-refill": "Recarga de agua",
      "assistance-desk": "Puesto de asistencia",
      food: "Zona de comida",
      "transport-pickup": "Recogida de transporte",
      lift: "Ascensor",
    },
    fr: {
      toilet: "Toilettes",
      "accessible-toilet": "Toilettes accessibles",
      medical: "Point médical",
      "water-refill": "Point d’eau",
      "assistance-desk": "Point d’assistance",
      food: "Restauration",
      "transport-pickup": "Prise en charge transport",
      lift: "Ascenseur",
    },
    pt: {
      toilet: "Banheiro",
      "accessible-toilet": "Banheiro acessível",
      medical: "Posto médico",
      "water-refill": "Reabastecimento de água",
      "assistance-desk": "Balcão de assistência",
      food: "Área de alimentação",
      "transport-pickup": "Embarque de transporte",
      lift: "Elevador",
    },
    ar: {
      toilet: "دورة مياه",
      "accessible-toilet": "دورة مياه ميسّرة",
      medical: "نقطة طبية",
      "water-refill": "تعبئة مياه",
      "assistance-desk": "مكتب مساعدة",
      food: "منطقة طعام",
      "transport-pickup": "نقطة نقل",
      lift: "مصعد",
    },
    hi: {
      toilet: "शौचालय",
      "accessible-toilet": "सुगम शौचालय",
      medical: "चिकित्सा केंद्र",
      "water-refill": "पानी भरने का केंद्र",
      "assistance-desk": "सहायता डेस्क",
      food: "भोजन क्षेत्र",
      "transport-pickup": "परिवहन पिकअप",
      lift: "लिफ़्ट",
    },
  };

const SCENARIO_LABELS: Readonly<Record<SupportedLanguage, Readonly<Record<ScenarioId, string>>>> = {
  en: {
    normal: "Normal operations",
    "arrival-surge": "Arrival surge",
    "gate-closure": "Gate closure",
    "train-disruption": "Train disruption",
    "heat-alert": "Heat alert",
    "medical-response": "Medical response",
    "accessibility-obstruction": "Accessible-path obstruction",
    "waste-overflow": "Waste overflow",
  },
  es: {
    normal: "Operación normal",
    "arrival-surge": "Aumento de llegadas",
    "gate-closure": "Cierre de puerta",
    "train-disruption": "Interrupción ferroviaria",
    "heat-alert": "Alerta de calor",
    "medical-response": "Respuesta médica",
    "accessibility-obstruction": "Obstrucción de ruta accesible",
    "waste-overflow": "Desbordamiento de residuos",
  },
  fr: {
    normal: "Fonctionnement normal",
    "arrival-surge": "Afflux d’arrivées",
    "gate-closure": "Fermeture de porte",
    "train-disruption": "Perturbation ferroviaire",
    "heat-alert": "Alerte chaleur",
    "medical-response": "Intervention médicale",
    "accessibility-obstruction": "Itinéraire accessible obstrué",
    "waste-overflow": "Débordement de déchets",
  },
  pt: {
    normal: "Operação normal",
    "arrival-surge": "Pico de chegadas",
    "gate-closure": "Fechamento de portão",
    "train-disruption": "Interrupção ferroviária",
    "heat-alert": "Alerta de calor",
    "medical-response": "Resposta médica",
    "accessibility-obstruction": "Obstrução de rota acessível",
    "waste-overflow": "Transbordamento de resíduos",
  },
  ar: {
    normal: "تشغيل اعتيادي",
    "arrival-surge": "تدفّق وصول",
    "gate-closure": "إغلاق بوابة",
    "train-disruption": "تعطّل القطار",
    "heat-alert": "تنبيه حرارة",
    "medical-response": "استجابة طبية",
    "accessibility-obstruction": "عائق في المسار الميسّر",
    "waste-overflow": "فيض النفايات",
  },
  hi: {
    normal: "सामान्य संचालन",
    "arrival-surge": "आगमन में उछाल",
    "gate-closure": "गेट बंद",
    "train-disruption": "ट्रेन व्यवधान",
    "heat-alert": "गर्मी चेतावनी",
    "medical-response": "चिकित्सा प्रतिक्रिया",
    "accessibility-obstruction": "सुगम मार्ग अवरोध",
    "waste-overflow": "कचरा अतिप्रवाह",
  },
};

const ALERT_MESSAGES: Readonly<
  Record<SupportedLanguage, Readonly<{ normal: string; active: (zones: string) => string }>>
> = {
  en: {
    normal: "No major venue disruption is active.",
    active: (zones) => `Follow venue staff directions. Affected zones: ${zones}.`,
  },
  es: {
    normal: "No hay ninguna interrupción importante activa.",
    active: (zones) => `Siga las indicaciones del personal. Zonas afectadas: ${zones}.`,
  },
  fr: {
    normal: "Aucune perturbation majeure n’est active.",
    active: (zones) => `Suivez les consignes du personnel. Zones concernées : ${zones}.`,
  },
  pt: {
    normal: "Nenhuma interrupção importante está ativa.",
    active: (zones) => `Siga as orientações da equipe. Zonas afetadas: ${zones}.`,
  },
  ar: {
    normal: "لا يوجد تعطّل كبير نشط في الموقع.",
    active: (zones) => `اتبع توجيهات موظفي الموقع. المناطق المتأثرة: ${zones}.`,
  },
  hi: {
    normal: "वेन्यू में कोई बड़ा सक्रिय व्यवधान नहीं है।",
    active: (zones) => `वेन्यू कर्मचारियों के निर्देश मानें। प्रभावित क्षेत्र: ${zones}।`,
  },
};

export function localizeRouteInstruction(
  language: SupportedLanguage,
  pathKind: StadiumPathKind,
  destination: string,
): string {
  return ROUTE_COPY[language].instruction[pathKind](destination);
}

export function localizeAccessibilityNote(
  language: SupportedLanguage,
  pathKind: StadiumPathKind,
  stepFree: boolean,
): string {
  const copy = ROUTE_COPY[language];
  if (!stepFree) return copy.stairs;
  if (pathKind === "lift") return copy.lift;
  if (pathKind === "ramp") return copy.ramp;
  return copy.stepFree;
}

export function localizeRouteExplanations(
  language: SupportedLanguage,
  preferences: RoutePreferences,
  crowdLevel: string,
): string[] {
  const copy = ROUTE_COPY[language];
  const result = [copy.baseExplanation];
  if (preferences.stepFree === true) result.push(copy.stepFreeExplanation);
  if (preferences.avoidCrowds === true) result.push(copy.crowdExplanation(crowdLevel));
  if (preferences.preferQuiet === true) result.push(copy.quietExplanation);
  if (preferences.avoidAccessibilityObstructions ?? true) result.push(copy.obstructionExplanation);
  return result;
}

export function localizeFacilityType(language: SupportedLanguage, kind: FacilityKind): string {
  return FACILITY_LABELS[language][kind];
}

export function localizeAlert(
  alert: StadiumAlert,
  scenario: ScenarioId,
  language: SupportedLanguage,
  severity: AlertSummary["severity"],
): AlertSummary {
  const firstZone = alert.zoneIds[0];
  const zones = alert.zoneIds.join(", ") || "—";
  return {
    id: alert.id,
    title: SCENARIO_LABELS[language][scenario],
    message:
      scenario === "normal"
        ? ALERT_MESSAGES[language].normal
        : ALERT_MESSAGES[language].active(zones),
    severity,
    ...(firstZone === undefined ? {} : { zoneId: firstZone }),
    simulated: true,
  };
}

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

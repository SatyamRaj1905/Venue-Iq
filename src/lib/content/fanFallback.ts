import type { FanAssistanceResponse, FanAssistRequest } from "@/lib/ai/schemas";
import { applyFanRequestPolicy } from "@/lib/ai/intent";
import {
  findNearbyFacilities,
  findRoute,
  getScenarioState,
  getTransportOptions as rankTransportOptions,
  STADIUM_GRAPH,
  STADIUM_NODES,
  type FacilityKind,
  type RouteStep as DomainRouteStep,
  type SimulationState,
} from "@/lib/domain";
import type { SupportedLanguage } from "./languageOptions";

type RouteStep = NonNullable<FanAssistanceResponse["route"]>["steps"][number];

interface FanCopy {
  stepFreeNote: string;
  nextSteps: [string, string];
}

const fanCopy: Record<SupportedLanguage, FanCopy> = {
  en: {
    stepFreeNote: "The full route is step-free.",
    nextSteps: ["Ask for a quieter route", "Show nearby assistance points"],
  },
  es: {
    stepFreeNote: "Toda la ruta es accesible sin escalones.",
    nextSteps: ["Pedir una ruta más tranquila", "Mostrar puntos de asistencia cercanos"],
  },
  fr: {
    stepFreeNote: "L’itinéraire est entièrement sans marches.",
    nextSteps: ["Demander un trajet plus calme", "Afficher les points d’aide proches"],
  },
  pt: {
    stepFreeNote: "Todo o percurso é sem degraus.",
    nextSteps: ["Pedir uma rota mais tranquila", "Mostrar pontos de assistência próximos"],
  },
  ar: {
    stepFreeNote: "المسار بالكامل دون درج.",
    nextSteps: ["اطلب مسارًا أكثر هدوءًا", "أظهر نقاط المساعدة القريبة"],
  },
  hi: {
    stepFreeNote: "पूरा मार्ग सीढ़ी-रहित है।",
    nextSteps: ["और शांत मार्ग पूछें", "पास के सहायता बिंदु दिखाएँ"],
  },
};

const noRouteCopy: Record<SupportedLanguage, string> = {
  en: "No safe route matches the selected constraints. Stay where you are and ask the nearest assistance host to confirm an alternative.",
  es: "Ninguna ruta segura cumple las condiciones seleccionadas. Permanezca donde está y pida al anfitrión de asistencia más cercano que confirme una alternativa.",
  fr: "Aucun itinéraire sûr ne correspond aux critères choisis. Restez sur place et demandez à l’agent d’assistance le plus proche de confirmer une alternative.",
  pt: "Nenhuma rota segura atende às condições escolhidas. Fique onde está e peça ao anfitrião de assistência mais próximo para confirmar uma alternativa.",
  ar: "لا يوجد مسار آمن يطابق الشروط المحددة. ابقَ في مكانك واطلب من أقرب مضيف مساعدة تأكيد بديل.",
  hi: "चुनी गई शर्तों के लिए कोई सुरक्षित मार्ग नहीं है। अपनी जगह पर रहें और नज़दीकी सहायता होस्ट से विकल्प की पुष्टि कराएँ।",
};

const transportNextSteps: Record<SupportedLanguage, [string, string]> = {
  en: ["Show accessible transport only", "Ask the venue transport liaison"],
  es: ["Mostrar solo transporte accesible", "Preguntar al enlace de transporte"],
  fr: ["Afficher uniquement les transports accessibles", "Contacter l’agent de transport"],
  pt: ["Mostrar apenas transporte acessível", "Perguntar ao contato de transporte"],
  ar: ["اعرض وسائل النقل الميسّرة فقط", "اسأل مسؤول تنسيق النقل"],
  hi: ["केवल सुगम परिवहन दिखाएँ", "वेन्यू परिवहन संपर्क से पूछें"],
};

const facilityNextSteps: Record<SupportedLanguage, [string, string]> = {
  en: ["Show another nearby facility", "Ask an assistance host to confirm"],
  es: ["Mostrar otra instalación cercana", "Pedir confirmación a un anfitrión"],
  fr: ["Afficher un autre service proche", "Demander confirmation à un agent"],
  pt: ["Mostrar outra instalação próxima", "Pedir confirmação a um anfitrião"],
  ar: ["أظهر مرفقًا قريبًا آخر", "اطلب التأكيد من مضيف المساعدة"],
  hi: ["कोई दूसरी नज़दीकी सुविधा दिखाएँ", "सहायता होस्ट से पुष्टि कराएँ"],
};

const noFacilityCopy: Record<SupportedLanguage, string> = {
  en: "No open matching facility is available in the trusted venue data. Stay at the signed location and ask an assistance host to confirm an option.",
  es: "No hay una instalación abierta que coincida en los datos verificados del recinto. Permanezca en la ubicación señalizada y pida ayuda a un anfitrión.",
  fr: "Aucun service ouvert correspondant n’est disponible dans les données vérifiées. Restez au repère indiqué et demandez confirmation à un agent.",
  pt: "Nenhuma instalação aberta correspondente está disponível nos dados verificados. Fique no local sinalizado e peça confirmação a um anfitrião.",
  ar: "لا يوجد مرفق مفتوح مطابق في بيانات المكان الموثوقة. ابقَ عند الموقع المعلّم واطلب من مضيف المساعدة تأكيد خيار مناسب.",
  hi: "विश्वसनीय वेन्यू डेटा में कोई खुली मेल खाने वाली सुविधा उपलब्ध नहीं है। चिह्नित स्थान पर रहें और सहायता होस्ट से विकल्प की पुष्टि कराएँ।",
};

const noTransportCopy: Record<SupportedLanguage, string> = {
  en: "No matching transport option is currently available in the trusted simulated data. Ask the venue transport liaison to confirm an alternative.",
  es: "No hay una opción de transporte que coincida en los datos simulados verificados. Pida al enlace de transporte que confirme una alternativa.",
  fr: "Aucune option de transport correspondante n’est disponible dans les données simulées vérifiées. Demandez une autre solution à l’agent de transport.",
  pt: "Nenhuma opção de transporte correspondente está disponível nos dados simulados verificados. Peça uma alternativa ao contato de transporte.",
  ar: "لا يتوفر حاليًا خيار نقل مطابق في البيانات المحاكية الموثوقة. اطلب من مسؤول تنسيق النقل تأكيد بديل.",
  hi: "विश्वसनीय सिमुलेटेड डेटा में अभी कोई मेल खाता परिवहन विकल्प उपलब्ध नहीं है। वेन्यू परिवहन संपर्क से विकल्प की पुष्टि कराएँ।",
};

function nodeName(nodeId: string): string {
  return STADIUM_NODES.find((node) => node.id === nodeId)?.name ?? nodeId;
}

function alertSummaries(snapshot: SimulationState): FanAssistanceResponse["alerts"] {
  return snapshot.alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    message: alert.message,
    severity: severityToCrowd(alert.severity),
    ...(alert.zoneIds[0] ? { zoneId: alert.zoneIds[0] } : {}),
    simulated: true,
  }));
}

function unavailableFacilityIds(snapshot: SimulationState): ReadonlySet<string> {
  const unavailable = new Set(snapshot.routeConditions.closedNodeIds ?? []);
  const unavailableEdges = new Set([
    ...(snapshot.routeConditions.closedEdgeIds ?? []),
    ...(snapshot.routeConditions.obstructedEdgeIds ?? []),
  ]);
  for (const edge of STADIUM_GRAPH.edges) {
    if (edge.status === "closed" || edge.accessibilityObstructed || unavailableEdges.has(edge.id)) {
      unavailable.add(edge.from);
      unavailable.add(edge.to);
    }
  }
  return unavailable;
}

function availableFacilities(
  originId: string,
  kinds: readonly FacilityKind[] | undefined,
  snapshot: SimulationState,
) {
  const unavailable = unavailableFacilityIds(snapshot);
  return findNearbyFacilities([originId], {
    graph: STADIUM_GRAPH,
    maximumDistanceMeters: 2_000,
    ...(kinds === undefined ? {} : { kinds }),
  }).filter((facility) => !unavailable.has(facility.id));
}

function localizedFacilitySummary(request: FanAssistRequest, facilityName: string): string {
  const origin = nodeName(request.currentLocation);
  const summaries: Record<SupportedLanguage, string> = {
    en: `${facilityName} is the nearest open matching facility in the trusted venue map. Follow the signed route from ${origin}.`,
    es: `${facilityName} es la instalación abierta más cercana que coincide en el mapa verificado. Siga la ruta señalizada desde ${origin}.`,
    fr: `${facilityName} est le service ouvert correspondant le plus proche sur le plan vérifié. Suivez le trajet balisé depuis ${origin}.`,
    pt: `${facilityName} é a instalação aberta correspondente mais próxima no mapa verificado. Siga a rota sinalizada a partir de ${origin}.`,
    ar: `${facilityName} هو أقرب مرفق مفتوح مطابق في خريطة المكان الموثوقة. اتبع المسار المعلّم من ${origin}.`,
    hi: `${facilityName} विश्वसनीय वेन्यू मानचित्र में सबसे नज़दीकी खुली मेल खाने वाली सुविधा है। ${origin} से चिह्नित मार्ग का पालन करें।`,
  };
  return summaries[request.language];
}

function localizedTransportSummary(
  language: SupportedLanguage,
  option: ReturnType<typeof rankTransportOptions>[number] | undefined,
): string {
  if (option === undefined) {
    return noTransportCopy[language];
  }
  const summaries: Record<SupportedLanguage, string> = {
    en: `${option.name} is the highest-ranked available simulated transport option: ${option.waitMinutes} minute wait and ${option.totalJourneyMinutes} minutes total.`,
    es: `${option.name} es la opción de transporte simulado disponible mejor clasificada: ${option.waitMinutes} minutos de espera y ${option.totalJourneyMinutes} minutos en total.`,
    fr: `${option.name} est l’option de transport simulée disponible la mieux classée : ${option.waitMinutes} minutes d’attente et ${option.totalJourneyMinutes} minutes au total.`,
    pt: `${option.name} é a opção de transporte simulado disponível mais bem classificada: ${option.waitMinutes} minutos de espera e ${option.totalJourneyMinutes} minutos no total.`,
    ar: `${option.name} هو خيار النقل المتاح الأعلى ترتيبًا في المحاكاة: انتظار ${option.waitMinutes} دقيقة ومدة إجمالية ${option.totalJourneyMinutes} دقيقة.`,
    hi: `${option.name} उपलब्ध सिमुलेटेड परिवहन में सबसे ऊँचा विकल्प है: ${option.waitMinutes} मिनट प्रतीक्षा और कुल ${option.totalJourneyMinutes} मिनट।`,
  };
  return summaries[language];
}

function createTransportFallback(
  request: FanAssistRequest,
  snapshot: SimulationState,
): FanAssistanceResponse {
  const options = rankTransportOptions(
    { accessibleOnly: request.preferences.stepFree },
    snapshot.transport.services,
  ).slice(0, 5);
  return {
    intent: "transport",
    language: request.language,
    summary: localizedTransportSummary(request.language, options[0]),
    transportOptions: options.map((option) => ({
      id: option.id,
      name: option.name,
      mode: option.mode,
      status: option.status,
      waitMinutes: option.waitMinutes,
      totalJourneyMinutes: option.totalJourneyMinutes,
      accessible: option.accessible,
      destinationNodeId: option.destinationNodeId,
      note: option.note,
      simulated: true,
    })),
    alerts: alertSummaries(snapshot),
    accessibilityNotes: request.preferences.stepFree
      ? ["Only transport options marked accessible are included."]
      : [],
    nextSteps: [...transportNextSteps[request.language]],
    confidence: options.length > 0 ? 0.94 : 0.7,
    handoffRequired: options.length === 0,
    fallbackUsed: true,
    simulated: true,
  };
}

function translatedInstruction(step: DomainRouteStep, language: SupportedLanguage): string {
  const path = step.pathKind.replaceAll("-", " ");
  const translations: Record<SupportedLanguage, string> = {
    en: `Continue from ${step.fromName} to ${step.toName} using the signed ${path}.`,
    es: `Continúe desde ${step.fromName} hasta ${step.toName} por el ${path} señalizado.`,
    fr: `Continuez de ${step.fromName} à ${step.toName} par le chemin ${path} balisé.`,
    pt: `Continue de ${step.fromName} até ${step.toName} pelo caminho ${path} sinalizado.`,
    ar: `تابع من ${step.fromName} إلى ${step.toName} عبر مسار ${path} المعلّم.`,
    hi: `${step.fromName} से ${step.toName} तक चिह्नित ${path} मार्ग से जाएँ।`,
  };
  return translations[language];
}

function localizedRouteSummary(request: FanAssistRequest, isStepFree: boolean): string {
  const origin = nodeName(request.currentLocation);
  const destination = nodeName(request.destination);
  const access = isStepFree ? "step-free" : "fastest available";
  const summaries: Record<SupportedLanguage, string> = {
    en: `A deterministic ${access} route is available from ${origin} to ${destination}. Follow the signed steps and current venue alerts below.`,
    es: `Hay una ruta determinista ${isStepFree ? "sin escalones" : "disponible"} desde ${origin} hasta ${destination}. Siga los pasos señalizados y las alertas del recinto.`,
    fr: `Un itinéraire déterministe ${isStepFree ? "sans marches" : "disponible"} relie ${origin} à ${destination}. Suivez les étapes et les alertes ci-dessous.`,
    pt: `Uma rota determinística ${isStepFree ? "sem degraus" : "disponível"} liga ${origin} a ${destination}. Siga as etapas e os alertas abaixo.`,
    ar: `يتوفر مسار محدد ${isStepFree ? "دون درج" : "آمن"} من ${origin} إلى ${destination}. اتبع الخطوات والتنبيهات أدناه.`,
    hi: `${origin} से ${destination} तक एक निर्धारित ${isStepFree ? "सीढ़ी-रहित" : "सुरक्षित"} मार्ग उपलब्ध है। नीचे दिए संकेतों और अलर्ट का पालन करें।`,
  };
  return summaries[request.language];
}

function severityToCrowd(
  severity: "info" | "warning" | "critical",
): "low" | "moderate" | "critical" {
  if (severity === "info") return "low";
  if (severity === "warning") return "moderate";
  return "critical";
}

export function createFanFallback(request: FanAssistRequest): FanAssistanceResponse {
  const policy = applyFanRequestPolicy(request);
  const safeRequest = policy.request;
  const copy = fanCopy[safeRequest.language];
  const snapshot = getScenarioState(safeRequest.scenario);

  if (policy.intent === "transport") {
    return createTransportFallback(safeRequest, snapshot);
  }

  const facilities =
    policy.intent === "facility"
      ? availableFacilities(safeRequest.currentLocation, policy.facilityKinds, snapshot)
      : [];
  const nearestFacility = facilities[0];
  if (policy.intent === "facility" && nearestFacility === undefined) {
    return {
      intent: "facility",
      language: safeRequest.language,
      summary: noFacilityCopy[safeRequest.language],
      alerts: alertSummaries(snapshot),
      accessibilityNotes: [],
      nextSteps: [...facilityNextSteps[safeRequest.language]],
      confidence: 0.94,
      handoffRequired: true,
      fallbackUsed: true,
      simulated: true,
    };
  }

  const routeRequest: FanAssistRequest =
    nearestFacility === undefined
      ? safeRequest
      : { ...safeRequest, destination: nearestFacility.id };
  const result = findRoute(STADIUM_GRAPH, {
    originId: routeRequest.currentLocation,
    destinationId: routeRequest.destination,
    preferences: routeRequest.preferences,
    conditions: snapshot.routeConditions,
  });

  if (!result.found) {
    return {
      intent: policy.intent,
      language: safeRequest.language,
      summary: noRouteCopy[safeRequest.language],
      alerts: alertSummaries(snapshot),
      accessibilityNotes: [],
      nextSteps:
        policy.intent === "facility"
          ? [...facilityNextSteps[safeRequest.language]]
          : [...copy.nextSteps],
      confidence: 0.98,
      handoffRequired: true,
      fallbackUsed: true,
      simulated: true,
    };
  }

  const route = result.route;
  const steps: RouteStep[] = route.steps.map((step) => ({
    id: step.edgeId,
    instruction: translatedInstruction(step, safeRequest.language),
    distanceMeters: step.distanceMeters,
    estimatedMinutes: Math.max(1, Math.round(step.estimatedSeconds / 60)),
    crowdLevel: step.crowdLevel,
    accessibilityNotes: step.stepFree ? [] : [step.accessibilityNote],
  }));

  return {
    intent: policy.intent,
    language: safeRequest.language,
    summary:
      nearestFacility === undefined
        ? localizedRouteSummary(routeRequest, route.isStepFree)
        : localizedFacilitySummary(routeRequest, nearestFacility.name),
    route: {
      originId: route.originId,
      destinationId: route.destinationId,
      totalDistanceMeters: route.totalDistanceMeters,
      estimatedWalkingMinutes: route.estimatedWalkingMinutes,
      stepFree: route.isStepFree,
      crowdLevel: route.crowdLevel,
      steps,
      nearbyFacilities: (facilities.length > 0 ? facilities : route.nearbyFacilities).map(
        (facility) => ({
          id: facility.id,
          name: facility.name,
          type: facility.kind.replaceAll("-", " "),
          locationId: facility.zoneId,
          accessible: facility.accessible,
        }),
      ),
    },
    alerts: alertSummaries(snapshot),
    accessibilityNotes: route.isStepFree ? [copy.stepFreeNote] : route.explanations.slice(0, 2),
    nextSteps:
      policy.intent === "facility"
        ? [...facilityNextSteps[safeRequest.language]]
        : [...copy.nextSteps],
    confidence: 0.88,
    handoffRequired: false,
    fallbackUsed: true,
    simulated: true,
  };
}

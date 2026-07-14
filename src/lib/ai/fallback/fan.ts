import type { FanAssistRequest, FanAssistanceResponse, SupportedLanguage } from "../types";
import type { FanGrounding } from "../tools/fan";

interface FanCopy {
  readonly route: (origin: string, destination: string, minutes: number) => string;
  readonly facility: (name: string, type: string) => string;
  readonly transport: (name: string, minutes: number) => string;
  readonly unavailable: string;
  readonly nextSteps: readonly string[];
  readonly accessibility: string;
}

const FAN_COPY: Readonly<Record<SupportedLanguage, FanCopy>> = {
  en: {
    route: (origin, destination, minutes) =>
      `Use the approved route from ${origin} to ${destination}. The simulated walk takes about ${minutes} minutes. It was selected from the current deterministic venue conditions.`,
    facility: (name, type) =>
      `${name} is the nearest trusted ${type} found along the selected simulated route.`,
    transport: (name, minutes) =>
      `${name} is the highest-ranked trusted simulated transport option, with about ${minutes} minutes of total journey time.`,
    unavailable:
      "No verified route is currently available. Stay at the staffed location and ask a venue host for an approved alternative.",
    nextSteps: [
      "Follow the ordered route steps and venue signs.",
      "Ask an accessibility host if conditions change.",
    ],
    accessibility:
      "The result respects the selected step-free and accessibility-obstruction preferences.",
  },
  es: {
    route: (origin, destination, minutes) =>
      `Use la ruta aprobada desde ${origin} hasta ${destination}. El recorrido simulado dura unos ${minutes} minutos y se eligió con las condiciones deterministas actuales del recinto.`,
    facility: (name, type) =>
      `${name} es el ${type} verificado más cercano a lo largo de la ruta simulada seleccionada.`,
    transport: (name, minutes) =>
      `${name} es la opción de transporte simulada y verificada mejor clasificada, con unos ${minutes} minutos de viaje total.`,
    unavailable:
      "No hay una ruta verificada disponible. Permanezca en el punto atendido y pida a un anfitrión una alternativa aprobada.",
    nextSteps: [
      "Siga los pasos ordenados y la señalización del recinto.",
      "Pida ayuda al anfitrión de accesibilidad si cambian las condiciones.",
    ],
    accessibility:
      "El resultado respeta las preferencias de ruta sin escalones y evita obstrucciones de accesibilidad.",
  },
  fr: {
    route: (origin, destination, minutes) =>
      `Suivez l’itinéraire approuvé de ${origin} à ${destination}. Le trajet simulé dure environ ${minutes} minutes et tient compte des conditions déterministes du site.`,
    facility: (name, type) =>
      `${name} est le point ${type} vérifié le plus proche le long de l’itinéraire simulé choisi.`,
    transport: (name, minutes) =>
      `${name} est l’option de transport simulée et vérifiée la mieux classée, pour environ ${minutes} minutes au total.`,
    unavailable:
      "Aucun itinéraire vérifié n’est disponible. Restez au point d’accueil et demandez une solution approuvée.",
    nextSteps: [
      "Suivez les étapes ordonnées et la signalétique.",
      "Demandez l’aide d’un agent d’accessibilité si la situation change.",
    ],
    accessibility:
      "Le résultat respecte les préférences sans marches et évite les obstacles d’accessibilité.",
  },
  pt: {
    route: (origin, destination, minutes) =>
      `Use a rota aprovada de ${origin} até ${destination}. O percurso simulado leva cerca de ${minutes} minutos e considera as condições determinísticas atuais.`,
    facility: (name, type) =>
      `${name} é o ponto de ${type} verificado mais próximo ao longo da rota simulada selecionada.`,
    transport: (name, minutes) =>
      `${name} é a opção de transporte simulada e verificada mais bem classificada, com cerca de ${minutes} minutos no total.`,
    unavailable:
      "Nenhuma rota verificada está disponível. Permaneça no ponto com equipe e peça uma alternativa aprovada.",
    nextSteps: [
      "Siga as etapas ordenadas e a sinalização.",
      "Peça ajuda ao anfitrião de acessibilidade se as condições mudarem.",
    ],
    accessibility:
      "O resultado respeita as preferências sem degraus e evita obstruções de acessibilidade.",
  },
  ar: {
    route: (origin, destination, minutes) =>
      `استخدم المسار المعتمد من ${origin} إلى ${destination}. تستغرق الرحلة التجريبية نحو ${minutes} دقيقة وفق بيانات الموقع الحتمية الحالية.`,
    facility: (name, type) =>
      `${name} هو أقرب مرفق موثوق من نوع ${type} على طول المسار التجريبي المحدد.`,
    transport: (name, minutes) =>
      `${name} هو خيار النقل التجريبي الموثوق الأعلى ترتيبًا، ويستغرق إجمالًا نحو ${minutes} دقيقة.`,
    unavailable:
      "لا يتوفر حاليًا مسار موثّق. ابقَ عند النقطة المأهولة واطلب من مضيف الموقع بديلًا معتمدًا.",
    nextSteps: [
      "اتبع خطوات المسار المرتبة ولافتات الموقع.",
      "اطلب مساعدة مضيف إتاحة الوصول إذا تغيرت الظروف.",
    ],
    accessibility: "تراعي النتيجة تفضيلات المسار دون درج وتتجنب عوائق إتاحة الوصول.",
  },
  hi: {
    route: (origin, destination, minutes) =>
      `${origin} से ${destination} तक स्वीकृत मार्ग का उपयोग करें। मौजूदा नियत वेन्यू स्थितियों के अनुसार अनुमानित पैदल समय लगभग ${minutes} मिनट है।`,
    facility: (name, type) => `${name} चुने गए सिम्युलेटेड मार्ग पर निकटतम सत्यापित ${type} है।`,
    transport: (name, minutes) =>
      `${name} सर्वोच्च क्रम वाला विश्वसनीय सिम्युलेटेड परिवहन विकल्प है, जिसमें कुल लगभग ${minutes} मिनट लगते हैं।`,
    unavailable:
      "अभी कोई सत्यापित मार्ग उपलब्ध नहीं है। कर्मचारी वाले स्थान पर रहें और वेन्यू होस्ट से स्वीकृत विकल्प माँगें।",
    nextSteps: [
      "क्रमबद्ध मार्ग चरणों और संकेतों का पालन करें।",
      "स्थिति बदलने पर एक्सेसिबिलिटी होस्ट से सहायता लें।",
    ],
    accessibility: "यह परिणाम सीढ़ी-रहित पसंद का सम्मान करता है और सुगम्यता अवरोधों से बचता है।",
  },
};

export function createFanFallback(
  request: FanAssistRequest,
  grounding: FanGrounding,
): FanAssistanceResponse {
  const copy = FAN_COPY[request.language];
  const route = grounding.route;
  const primaryFacility = route?.nearbyFacilities[0];
  const primaryTransport = grounding.transportOptions?.[0];
  const routeNotes = grounding.routeExplanations.slice(0, 8);
  return {
    intent: grounding.intent,
    language: request.language,
    summary:
      grounding.intent === "transport" && primaryTransport !== undefined
        ? copy.transport(primaryTransport.name, primaryTransport.totalJourneyMinutes)
        : grounding.intent === "facility" && primaryFacility !== undefined
          ? copy.facility(primaryFacility.name, primaryFacility.type)
          : route === undefined
            ? copy.unavailable
            : copy.route(route.originId, route.destinationId, route.estimatedWalkingMinutes),
    ...(route === undefined ? {} : { route }),
    ...(grounding.transportOptions === undefined
      ? {}
      : { transportOptions: [...grounding.transportOptions] }),
    alerts: [...grounding.alerts],
    accessibilityNotes: routeNotes.length > 0 ? routeNotes : [copy.accessibility],
    nextSteps: [...copy.nextSteps],
    confidence: route === undefined ? 0.55 : 0.96,
    handoffRequired: route === undefined,
    fallbackUsed: true,
    simulated: true,
  };
}

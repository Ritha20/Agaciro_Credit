export type LocaleKey =
  | "title"
  | "tagline"
  | "scoreTitle"
  | "scoreSubtitle"
  | "tierBronze"
  | "tierSilver"
  | "tierGold"
  | "tierPlatinum"
  | "simulateTitle"
  | "simulateDesc"
  | "blockchainTitle"
  | "blockchainDesc"
  | "endorsementTitle"
  | "endorsementDesc"
  | "vouchLeader"
  | "vouchPending"
  | "vouchActive"
  | "requestVouch"
  | "badgesTitle"
  | "coachTitle"
  | "coachPlaceholder"
  | "coachSubmit"
  | "matcherTitle"
  | "matcherDesc"
  | "botTitle"
  | "botDesc"
  | "runBacktest"
  | "backtestProgress"
  | "methodologyTab"
  | "inputsTab"
  | "logicTab"
  | "riskTab"
  | "perfTab"
  | "infraTab"
  | "innovationTab";

export const TRANSLATIONS: Record<string, Record<LocaleKey, string>> = {
  en: {
    title: "AGACIRO CREDIT",
    tagline: "Your Hustle, Your Credit",
    scoreTitle: "Dignity Trust Assessment",
    scoreSubtitle: "Alternative scoring calculated dynamically from micro-transactions & group endorsements.",
    tierBronze: "Bronze Tier",
    tierSilver: "Silver Tier",
    tierGold: "Gold Tier",
    tierPlatinum: "Platinum Tier",
    simulateTitle: "Interactive Score Simulator",
    simulateDesc: "Adjust transaction volumes to instantly evaluate how lenders and micro-investment systems weigh your ledger.",
    blockchainTitle: "Proof-of-Trust Blockchain Records",
    blockchainDesc: "Immutable distributed logging flags suspicious activities and prevents score manipulation on bank-facing networks.",
    endorsementTitle: "Community Endorsements & Savings Vouchers",
    endorsementDesc: "Informal credit requires human trust. SACCO managers and cooperative leaders can directly endorse your ledger.",
    vouchLeader: "Vouched by cooperative leaders",
    vouchPending: "Verification Pending",
    vouchActive: "Vouched & Active",
    requestVouch: "New Endorsement Request",
    badgesTitle: "Dignity Badges & Milestones",
    coachTitle: "AI Financial Coach & Kiosk Planner",
    coachPlaceholder: "Ask how to boost your score, calculate interest, or expand your inventory...",
    coachSubmit: "Consult Coach",
    matcherTitle: "Instant Bank & MFI Matcher APIs",
    matcherDesc: "Matched lenders directly query your score in under 2 seconds. Apply instantly at customized interest rates.",
    botTitle: "Hustle Yield: Forex Algo Bot",
    botDesc: "Micro-investment shield. Allocate score-approved capital into our Forex quantitative bot with full risk safeguards.",
    runBacktest: "Execute Bot Simulation",
    backtestProgress: "Simulation Active. Harvesting market inputs...",
    methodologyTab: "1. Forecast Methodology",
    inputsTab: "2. Market Data Inputs",
    logicTab: "3. Execution Logic",
    riskTab: "4. Capital Controls",
    perfTab: "5. Performance Logs",
    infraTab: "6. System Stack",
    innovationTab: "7. Edge Innovation",
  },
  rw: {
    title: "AGACIRO CREDIT",
    tagline: "Ubushake Bwawe, Inguzo Yawe",
    scoreTitle: "Isuzuma Ry'Icyizere N'Agaciro",
    scoreSubtitle: "Amanota y'inyongera abarwa hashingiwe ku bikorwa byawe bya buri munsi n'ubufatanye bw'abaturage.",
    tierBronze: "Icyiciro cya Bronze",
    tierSilver: "Icyiciro cya Silver",
    tierGold: "Icyiciro cya Gold",
    tierPlatinum: "Icyiciro cya Platinum",
    simulateTitle: "Simulator y'Amanota y'Icyizere",
    simulateDesc: "Hindura ingano y'ubucuruzi bwawe urebe uko ibigo by'imari n'ishoramari bibona umwirondoro wawe.",
    blockchainTitle: "Ububiko bwa Blockchain Budahinduka",
    blockchainDesc: "Ibyandikwa muri mudasobwa bikwirakwizwa, birinda impimbano n'uburiganya ku manota yawe y'inguzanyo.",
    endorsementTitle: "Gushyigikirwa n'Umuryango n'Amashyirahamwe",
    endorsementDesc: "Kugira ngo ubone inguzanyo bisaba icyizere. Abayobozi ba koperative na SACCO bafite uburenganzira bwo kuguhamya.",
    vouchLeader: "Yemejwe n'abayobozi ba koperative",
    vouchPending: "Bitegereje Kwemezwa",
    vouchActive: "Byemejwe & Bihamye",
    requestVouch: "Saba Gushyigikirwa Gushya",
    badgesTitle: "Impamyabushobozi z'Agaciro",
    coachTitle: "AI Umutoza w'Imari n'Ingendo z'Ubucuruzi",
    coachPlaceholder: "Baza uko wakura amanota yawe, uko inguzanyo zibarwa, cyangwa uko wagura ubucuruzi...",
    coachSubmit: "Gisha Inama AI",
    matcherTitle: "Kuguza Direct kuri Banki & MFI APIs",
    matcherDesc: "Ibigo by'imari bifata amanota yawe mu masegonda 2. Saba inguzanyo ku nyungu ntoya mu buryo bworoshye.",
    botTitle: "Umubonano w'Icyizere: Forex Trading Bot",
    botDesc: "Gushora imari duto. Shora bamwe mu bushobozi bwawe muri algorithm y'ubucuruzi bw'amahanga ifite uburinzi bukomeye.",
    runBacktest: "Simura Ubucuruzi bwa Forex",
    backtestProgress: "Gusimula birakora. Gukurikirana amakuru y'isoko...",
    methodologyTab: "1. Uburyo bwo Guhanura",
    inputsTab: "2. Amakuru y'Isoko",
    logicTab: "3. Amategeko y'Ubucuruzi",
    riskTab: "4. Igenzura ry'Ikigereranyo",
    perfTab: "5. Imikorere n'Inyungu",
    infraTab: "6. Imiterere ya Sisitemu",
    innovationTab: "7. Udushya tw'Ikoranabuhanga",
  },
  sw: {
    title: "AGACIRO CREDIT",
    tagline: "Kazi Yako, Mkopo Wako",
    scoreTitle: "Tathmini ya Kujenga Agaciro",
    scoreSubtitle: "Alama mbadala za mkopo zinazokokotolewa kutoka kwa miamala midogo na ridhaa za vikundi vya ushirika.",
    tierBronze: "Kiwango cha Bronze",
    tierSilver: "Kiwango cha Silver",
    tierGold: "Kiwango cha Gold",
    tierPlatinum: "Kiwango cha Platinum",
    simulateTitle: "Kisimulizi cha Alama zako",
    simulateDesc: "Rekebisha kiasi cha miamala yako kuona jinsi wakopeshaji soko wanavyotathmini wasifu wako papo hapo.",
    blockchainTitle: "Rekodi za Blockchain za Usalama",
    blockchainDesc: "Rekodi zilizosimbishwa kuzuia ulaghai au upotoshaji wa alama zako wakati wa maombi ya mkopo.",
    endorsementTitle: "Uidhinishaji wa Jamii na Vikundi vya Akiba",
    endorsementDesc: "Uaminifu wa kijamii ni msingi. Viongozi na wasimamizi wa SACCO wanaweza kuidhinisha historia yako.",
    vouchLeader: "Imeidhinishwa na viongozi wa ushirika",
    vouchPending: "Kusubiri Kuthibitishwa",
    vouchActive: "Imethibitishwa & Hai",
    requestVouch: "Omba Uidhinishaji Mpya",
    badgesTitle: "Majiwe ya Msingi ya Agaciro",
    coachTitle: "AI Kocha wa Kifedha na Mipango",
    coachPlaceholder: "Uliza jinsi ya kukuza alama yako, kupanga akiba, au kupanua kibanda cha biashara...",
    coachSubmit: "Wasiliana na AI Kocha",
    matcherTitle: "Mechi ya Papo kwa Papo na Benki na MFI API",
    matcherDesc: "Benki zilizounganishwa zinapata alama zako kwa chini ya sekunde 2. Omba mikopo kwa viwango nafuu vya riba.",
    botTitle: "Hustle Yield: Forex Algo Bot",
    botDesc: "Kinga ya uwekezaji mdogo. Tenga sehemu ya mtaji wako kwenye bot yetu ya biashara ya Forex yenye udhibiti thabiti wa hatari.",
    runBacktest: "Simulia Biashara ya Forex",
    backtestProgress: "Mwigizaji anafanya kazi. Kukusanya ripoti za soko...",
    methodologyTab: "1. Mbinu ya Utabiri",
    inputsTab: "2. Data Inayoingia",
    logicTab: "3. Mantiki ya Biashara",
    riskTab: "4. Udhibiti Mkali",
    perfTab: "5. Matokeo ya Kazi",
    infraTab: "6. Miundombinu mikuu",
    innovationTab: "7. Mabadiliko Mapya",
  },
};

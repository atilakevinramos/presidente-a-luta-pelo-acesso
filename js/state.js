/**
 * state.js - Estado central da partida, geração de nomes brasileiros e sistema de cards (vantagens/desvantagens) para técnicos e comissão.
 */

const FIRST_NAMES = ["Lucas", "Gabriel", "Matheus", "Pedro", "Guilherme", "Gustavo", "Felipe", "Vinicius", "Bruno", "Eduardo", "Diego", "Rafael", "Rodrigo", "Thiago", "Marcelo", "Leonardo", "Caio", "Enzo", "Henrique", "João", "Carlos", "Daniel"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Ribeiro", "Carvalho", "Lopes", "Barbosa", "Vieira", "Martins", "Rocha", "Araújo", "Fernandes", "Costa"];

function getRandomName() {
  const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${f} ${l}`;
}

export const POSITIVE_CARDS = [
  { id: "gk_spec", name: "Especialista em Goleiros", type: "positive", desc: "+20% defesa por goleiros e +10% velocidade de evolução para goleiros." },
  { id: "def_spec", name: "Especialista em Defensores", type: "positive", desc: "+20% defesa por zagueiros/laterais e +10% velocidade de evolução para defensores." },
  { id: "att_spec", name: "Especialista em Meia e Atacantes", type: "positive", desc: "+20% ataque por meias/atacantes e +7% velocidade de evolução para meias e atacantes." },
  { id: "pop_star", name: "Pop Star", type: "positive", desc: "+50% de receita nos ingressos da bilheteria e patrocínio master." },
  { id: "rigorous", name: "Rigoroso", type: "positive", desc: "Focado na base: evolui a base 50% mais rápido." },
  { id: "paizao", name: "Paizão", type: "positive", desc: "Levanta a moral do time 25% a mais do que o normal." },
  { id: "phys_spec", name: "Especialista Físico", type: "positive", desc: "+15% de bônus de melhora no físico do time." }
];

export const NEGATIVE_CARDS = [
  { id: "hate_media", name: "Odeia a Mídia", type: "negative", desc: "Reduz a moral do time em 15% a cada 10 rodadas." },
  { id: "explorer", name: "Explorador", type: "negative", desc: "Reduz o físico do time em 15% a cada 5 rodadas." },
  { id: "newly_wed", name: "Recém Casado", type: "negative", desc: "Não dá atenção ao clube: arrecada 20% a menos de receita por rodada." },
  { id: "gambler", name: "Apostador", type: "negative", desc: "Viciado em apostas. Chance de 5% a cada rodada de ser pego e demitido." },
  { id: "natural_seller", name: "Vendedor Nato", type: "negative", desc: "Chance de 15% a cada 5 rodadas de vender um jogador aleatório do elenco." }
];

// Cards específicos para o Olheiro (2 Positivos, 1 Negativo)
export const SCOUT_CARDS = {
  positive: [
    { id: "eagle_eye", name: "Olho de Águia", type: "positive", desc: "1 vez a cada 30 rodadas, aparecerá um jogador na base com over 75 e potencial 99." },
    { id: "pop_star_scout", name: "Pop Star", type: "positive", desc: "Atrai olhares da mídia e dá um bônus de +15% no valor gerado pelo patrocinador." },
    { id: "voice_exp", name: "Voz da Experiência", type: "positive", desc: "Consegue trazer no começo de cada temporada um jogador com over 90 veterano de 32 anos e contrato de 12 meses." },
    { id: "open_doors", name: "Abre Portas", type: "positive", desc: "Aumenta o número de solicitações de reforços do técnico de 5 para 8 por ano." }
  ],
  negative: [
    { id: "sneaky_snake", name: "Cobra Sorrateira", type: "negative", desc: "Some com um jovem da base aleatório a cada 10 rodadas." },
    { id: "damp_money", name: "Afasta a Grana", type: "negative", desc: "Mal visto na mídia, reduz o patrocínio em 10%." },
    { id: "no_morale", name: "Sem Moral", type: "negative", desc: "Estraga a moral do time reduzindo em 5% a moral do time a cada 2 rodadas." }
  ]
};

// Cards específicos para o Treinador da Base (2 Positivos, 1 Negativo)
export const YOUTH_COACH_CARDS = {
  positive: [
    { id: "star_hunter", name: "Caçador de Estrelas", type: "positive", desc: "A cada rodada dá um bônus aleatório de 50 mil até 300 mil reais." },
    { id: "pifador", name: "Pifador", type: "positive", desc: "Evolui os meias da base 30% mais rápido que o normal." },
    { id: "potentiator", name: "Potencializador", type: "positive", desc: "Aumenta o potencial do jogador em 50%." },
    { id: "wall_maker", name: "Formador de Muralhas", type: "positive", desc: "Uma vez no ano tem 50% de chance de trazer um goleiro de over 70 e potencial 99 na base." }
  ],
  negative: [
    { id: "bureaucrat", name: "Burocrata", type: "negative", desc: "Dificulta o trabalho, a base evolui 30% mais lento com ele." },
    { id: "loser", name: "Perdedor", type: "negative", desc: "Perde 30 mil reais por rodada pois é péssimo em administrar o orçamento da base." }
  ]
};

// Cards específicos para o Preparador Físico (2 Positivos, 1 Negativo)
export const PHYSIO_CARDS = {
  positive: [
    { id: "med_legend", name: "Lenda da Medicina", type: "positive", desc: "Jogadores recuperam 30% mais rápido a energia." },
    { id: "shopee_ray", name: "Dr Ray da Shopee", type: "positive", desc: "Atrai patrocínios, gera 100 mil a cada 3 rodadas pro caixa do time." },
    { id: "familiar", name: "Familiar", type: "positive", desc: "Convida jogadores pra festas em sua casa, aumenta a moral em 10% do time a cada rodada." }
  ],
  negative: [
    { id: "clumsy", name: "Desastrado às vezes", type: "negative", desc: "Uma vez na temporada tem 99% de chance de fazer um jogador zerar a energia de tanto treinar." },
    { id: "spender", name: "Gastador", type: "negative", desc: "Precisa de dinheiro para equipamentos, o clube paga a ele 20 mil reais por rodada." }
  ]
};

export function generateStaffCards(roleKey) {
  if (roleKey === 'scout') {
    const p1 = SCOUT_CARDS.positive[Math.floor(Math.random() * SCOUT_CARDS.positive.length)];
    let p2 = SCOUT_CARDS.positive[Math.floor(Math.random() * SCOUT_CARDS.positive.length)];
    while (p2.id === p1.id) p2 = SCOUT_CARDS.positive[Math.floor(Math.random() * SCOUT_CARDS.positive.length)];
    const neg = SCOUT_CARDS.negative[Math.floor(Math.random() * SCOUT_CARDS.negative.length)];
    return [p1, p2, neg];
  } else if (roleKey === 'youthCoach') {
    const p1 = YOUTH_COACH_CARDS.positive[Math.floor(Math.random() * YOUTH_COACH_CARDS.positive.length)];
    let p2 = YOUTH_COACH_CARDS.positive[Math.floor(Math.random() * YOUTH_COACH_CARDS.positive.length)];
    while (p2.id === p1.id) p2 = YOUTH_COACH_CARDS.positive[Math.floor(Math.random() * YOUTH_COACH_CARDS.positive.length)];
    const neg = YOUTH_COACH_CARDS.negative[Math.floor(Math.random() * YOUTH_COACH_CARDS.negative.length)];
    return [p1, p2, neg];
  } else if (roleKey === 'physio') {
    const p1 = PHYSIO_CARDS.positive[Math.floor(Math.random() * PHYSIO_CARDS.positive.length)];
    let p2 = PHYSIO_CARDS.positive[Math.floor(Math.random() * PHYSIO_CARDS.positive.length)];
    while (p2.id === p1.id) p2 = PHYSIO_CARDS.positive[Math.floor(Math.random() * PHYSIO_CARDS.positive.length)];
    const neg = PHYSIO_CARDS.negative[Math.floor(Math.random() * PHYSIO_CARDS.negative.length)];
    return [p1, p2, neg];
  } else {
    const pos1 = POSITIVE_CARDS[Math.floor(Math.random() * POSITIVE_CARDS.length)];
    let pos2 = POSITIVE_CARDS[Math.floor(Math.random() * POSITIVE_CARDS.length)];
    while (pos2.id === pos1.id) pos2 = POSITIVE_CARDS[Math.floor(Math.random() * POSITIVE_CARDS.length)];
    const neg = NEGATIVE_CARDS[Math.floor(Math.random() * NEGATIVE_CARDS.length)];
    return [pos1, pos2, neg].map(c => ({ ...c, desc: `[Comissão]: ${c.desc}` }));
  }
}

export function generateRandomCoachCards(isAssistantOrStaff = false) {
  const pos1 = POSITIVE_CARDS[Math.floor(Math.random() * POSITIVE_CARDS.length)];
  let pos2 = POSITIVE_CARDS[Math.floor(Math.random() * POSITIVE_CARDS.length)];
  while (pos2.id === pos1.id) {
    pos2 = POSITIVE_CARDS[Math.floor(Math.random() * POSITIVE_CARDS.length)];
  }
  const neg = NEGATIVE_CARDS[Math.floor(Math.random() * NEGATIVE_CARDS.length)];
  const cards = [pos1, pos2, neg];

  if (isAssistantOrStaff) {
    return cards.map(c => ({ ...c, desc: `[Comissão -50%]: ${c.desc}` }));
  }
  return cards;
}

function generateInitialSquad() {
  const positions = [
    "GOL", "GOL",
    "DEF", "DEF", "DEF", "DEF", "DEF", "DEF",
    "MEI", "MEI", "MEI", "MEI", "MEI",
    "ATA", "ATA", "ATA", "ATA"
  ];

  return positions.map((pos, i) => {
    const age = 18 + Math.floor(Math.random() * 14);
    const rating = 12 + Math.floor(Math.random() * 17);
    const potential = Math.min(99, rating + 15 + Math.floor(Math.random() * 20));
    const salary = Math.max(1800, Math.floor(rating * 350));
    const marketValue = rating * 5000 + potential * 2000;
    const contractMonths = 6 + Math.floor(Math.random() * 19);

    return {
      id: Date.now() + i + Math.floor(Math.random() * 1000),
      name: getRandomName(),
      pos,
      age,
      rating,
      potential,
      salary,
      marketValue,
      condition: 100,
      moral: 80,
      contractMonths
    };
  });
}

function generateInitialYouth() {
  const positions = ["GOL", "DEF", "MEI", "ATA"];
  const youth = [];

  for (let i = 0; i < 3; i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const rating = 12 + Math.floor(Math.random() * 8);
    const potential = rating + 25 + Math.floor(Math.random() * 20);

    youth.push({
      id: Date.now() + 50 + i,
      name: getRandomName(),
      pos,
      age: 15 + Math.floor(Math.random() * 3),
      rating,
      potential,
      marketValue: 15000 + (potential * 1200)
    });
  }

  return youth;
}

export const gameState = {
  version: 4.2,
  turn: 1,
  year: 2026,
  club: {
    name: "Grêmio Esportivo Brasil",
    sigla: "GEB",
    primaryColor: "#00ff66",
    secondaryColor: "#131c2e",
    division: "Série D",
    cash: 200000,
    debt: 0,
    ticketPrice: 30,
    reputation: 35
  },
  autoSubstituteMode: 'fatigue',
  autoRenewEnabled: false,
  autoRenewMaxSalary: 10000,
  coachSigningsUsedThisYear: 0,
  fans: {
    trust: 60,
    attendanceBase: 5000
  },
  board: {
    support: 70,
    nextElectionTurn: 38
  },
  bankruptcy: {
    consecutiveNegativeMonths: 0
  },
  youthInfraLevel: 1,
  academyMaintCost: 7000,
  scoutsUsedThisYear: 0,
  staff: {
    coach: { 
      name: getRandomName(), 
      role: "Treinador Principal", 
      salary: 15500, 
      coachOverall: 26, 
      cards: generateRandomCoachCards(false), 
      level: 2 
    },
    assistant: { name: "Marcos Vinicius", role: "Auxiliar Técnico", salary: 11200, skill: "Tático", benefit: "+5% Força Geral", level: 2, cards: generateRandomCoachCards(true) },
    scout: { name: "Roberto Olheiro", role: "Olheiro", salary: 9800, skill: "Olho Clínico", benefit: "+Talentos Jovens", level: 2, cards: generateStaffCards('scout') },
    youthCoach: { name: "Renato Base", role: "Treinador da Base", salary: 8400, skill: "Formador", benefit: "+Velocidade Base", level: 2, cards: generateStaffCards('youthCoach') },
    physio: { name: "Dr. Silveira", role: "Preparador Físico", salary: 10500, skill: "Recuperação", benefit: "-15% Lesões", level: 2, cards: generateStaffCards('physio') }
  },
  squad: generateInitialSquad(),
  youthPlayers: generateInitialYouth(),
  candidates: {
    coach: [
      { name: getRandomName(), role: "Treinador Principal", salary: 15500, hireCost: 0, coachOverall: 26, cards: generateRandomCoachCards(false), level: 2 },
      { name: getRandomName(), role: "Treinador Principal", salary: 12600, hireCost: 7000, coachOverall: 22, cards: generateRandomCoachCards(false), level: 2 },
      { name: getRandomName(), role: "Treinador Principal", salary: 8400, hireCost: 0, coachOverall: 15, cards: generateRandomCoachCards(false), level: 1 }
    ],
    assistant: [
      { name: "Marcos Vinicius", role: "Auxiliar Técnico", salary: 11200, hireCost: 0, skill: "Tático", benefit: "+5% Força Geral.", level: 2, cards: generateRandomCoachCards(true) }
    ],
    scout: [
      { name: getRandomName(), role: "Olheiro", salary: 9800, hireCost: 0, skill: "Olho Clínico", benefit: "Encontra jovens talentos.", level: 2, cards: generateStaffCards('scout') },
      { name: getRandomName(), role: "Olheiro", salary: 10200, hireCost: 2000, skill: "Olho Clínico", benefit: "Encontra jovens talentos.", level: 2, cards: generateStaffCards('scout') }
    ],
    youthCoach: [
      { name: getRandomName(), role: "Treinador da Base", salary: 8400, hireCost: 0, skill: "Formador", benefit: "Acelera evolução.", level: 2, cards: generateStaffCards('youthCoach') },
      { name: getRandomName(), role: "Treinador da Base", salary: 9100, hireCost: 2500, skill: "Formador", benefit: "Acelera evolução.", level: 2, cards: generateStaffCards('youthCoach') }
    ],
    physio: [
      { name: getRandomName(), role: "Preparador Físico", salary: 10500, hireCost: 0, skill: "Recuperação", benefit: "-15% Lesões.", level: 2, cards: generateStaffCards('physio') },
      { name: getRandomName(), role: "Preparador Físico", salary: 11000, hireCost: 3000, skill: "Recuperação", benefit: "-15% Lesões.", level: 2, cards: generateStaffCards('physio') }
    ]
  },
  standings: [],
  ledger: [],
  historyLog: [],
  lastMonthlyResult: 0
};

export function resetGameState() {
  gameState.turn = 1;
  gameState.year = 2026;
  gameState.club.cash = 200000;
  gameState.club.debt = 0;
  gameState.club.ticketPrice = 30;
  gameState.autoSubstituteMode = 'fatigue';
  gameState.autoRenewEnabled = false;
  gameState.autoRenewMaxSalary = 10000;
  gameState.coachSigningsUsedThisYear = 0;
  gameState.fans.trust = 60;
  gameState.board.support = 70;
  gameState.board.nextElectionTurn = 38;
  gameState.bankruptcy.consecutiveNegativeMonths = 0;
  gameState.youthInfraLevel = 1;
  gameState.academyMaintCost = 7000;
  gameState.scoutsUsedThisYear = 0;
  gameState.squad = generateInitialSquad();
  gameState.youthPlayers = generateInitialYouth();
  gameState.staff.coach = { 
    name: getRandomName(), 
    role: "Treinador Principal", 
    salary: 15500, 
    coachOverall: 26, 
    cards: generateRandomCoachCards(false), 
    level: 2 
  };
  gameState.staff.scout.cards = generateStaffCards('scout');
  gameState.staff.youthCoach.cards = generateStaffCards('youthCoach');
  gameState.staff.physio.cards = generateStaffCards('physio');
  gameState.ledger = [];
  gameState.historyLog = [];
  gameState.lastMonthlyResult = 0;
}
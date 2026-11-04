/**
 * politics.js - Lógica do Sistema Político, governabilidade, grupos políticos, promessas, articulação e eleição.
 */

import { gameState } from './state.js';
import { addTransaction } from './finances.js';

/**
 * Retorna o rótulo e a classe de cor da sustentação política conforme a faixa de apoio do conselho.
 */
export function getPoliticalStatus() {
  const support = gameState.board.support;
  if (support >= 80) return { label: "Apoio Forte", level: 5, colorClass: "text-emerald-400 font-bold" };
  if (support >= 60) return { label: "Situação Estável", level: 4, colorClass: "text-blue-400 font-bold" };
  if (support >= 40) return { label: "Situação Instável", level: 3, colorClass: "text-yellow-400 font-bold" };
  if (support >= 20) return { label: "Situação Crítica", level: 2, colorClass: "text-orange-400 font-bold" };
  return { label: "Colapso Político", level: 1, colorClass: "text-red-500 font-bold" };
}

/**
 * Recalcula a proporção das bancadas (Situação, Independentes, Oposição) mantendo a soma em 100%.
 */
export function updatePoliticalGroups() {
  const support = gameState.board.support;
  
  // O grupo de Situação orbita em volta do apoio do Conselho
  let situacao = Math.min(80, Math.max(10, Math.round(support * 0.75)));
  let oposicao = Math.min(70, Math.max(10, Math.round((100 - support) * 0.75)));
  
  // O que sobra fica com os Independentes
  let independentes = 100 - situacao - oposicao;
  if (independentes < 10) {
    independentes = 10;
    situacao = 100 - independentes - oposicao;
  }

  gameState.politics.groups.situacao = situacao;
  gameState.politics.groups.independentes = independentes;
  gameState.politics.groups.oposicao = oposicao;
}

/**
 * Atualiza o apoio do conselho ajustando dentro dos limites (0 - 100).
 */
export function modifyBoardSupport(delta, reason) {
  const oldVal = gameState.board.support;
  gameState.board.support = Math.max(0, Math.min(100, gameState.board.support + delta));
  const diff = gameState.board.support - oldVal;

  updatePoliticalGroups();

  if (diff !== 0 && reason) {
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Política]: ${reason} (${diff > 0 ? '+' : ''}${diff}% Apoio do Conselho)`
    });
  }
}

/**
 * Executa uma ação de articulação política.
 */
export function executePoliticalAction(actionKey) {
  const actions = {
    reuniao: {
      name: "Reunião com Conselheiros",
      cost: 5000,
      supportGain: 3,
      cooldown: 3,
      desc: "Conversa com lideranças políticas para alinhar interesses imediatos."
    },
    almoco: {
      name: "Almoço com Lideranças",
      cost: 15000,
      supportGain: 5,
      cooldown: 5,
      desc: "Almoço em restaurante reservado para cultivar boas relações políticas."
    },
    plano: {
      name: "Apresentar Plano de Gestão",
      cost: 25000,
      supportGain: 8,
      cooldown: 8,
      desc: "Apresenta relatório formal de metas esportivas e equilíbrio orçamentário."
    },
    reivindicacao: {
      name: "Atender Reivindicação do Conselho",
      cost: 45000,
      supportGain: 12,
      cooldown: 12,
      desc: "Concede melhorias estruturais e orçamentárias pedidas pelo conselho."
    },
    negociacao: {
      name: "Negociar com Independentes",
      cost: 30000,
      supportGain: 9,
      cooldown: 10,
      desc: "Oferece abertura política para conquistar o voto da bancada neutra."
    }
  };

  const action = actions[actionKey];
  if (!action) return { success: false, message: "Ação inválida." };

  if (gameState.politics.cooldowns[actionKey] > 0) {
    return {
      success: false,
      message: `Aguarde mais ${gameState.politics.cooldowns[actionKey]} rodada(s) para realizar esta ação novamente.`
    };
  }

  if (gameState.club.cash < action.cost) {
    return {
      success: false,
      message: `Caixa insuficiente. O custo necessário é de R$ ${action.cost.toLocaleString('pt-BR')}.`
    };
  }

  // Abatimento financeiro real no caixa
  addTransaction(`Articulação Política: ${action.name}`, "Política", -action.cost);
  modifyBoardSupport(action.supportGain, `Ação realizada: ${action.name}`);
  gameState.politics.cooldowns[actionKey] = action.cooldown;

  return {
    success: true,
    message: `${action.name} realizada com sucesso! Apoio do Conselho subiu em +${action.supportGain}%.`
  };
}

/**
 * Cria uma nova promessa política do presidente perante o conselho.
 */
export function addPromise(promiseType) {
  const activePromisesCount = gameState.politics.promises.filter(p => p.status === 'active').length;
  if (activePromisesCount >= 2) {
    return { success: false, message: "Você já possui 2 promessas em andamento. Cumpra-as antes de assumir novos compromissos!" };
  }

  const promiseDefs = {
    financial_debt: {
      title: "Manter Caixa Positivo",
      desc: "Manter o caixa do clube acima de R$ 50.000 ao fim das próximas 10 rodadas.",
      duration: 10,
      impactWin: 10,
      impactFail: -15
    },
    invest_academy: {
      title: "Evoluir Infraestrutura da Base",
      desc: "Melhorar o nível da infraestrutura da base nas próximas 12 rodadas.",
      duration: 12,
      targetLevel: gameState.youthInfraLevel + 1,
      impactWin: 12,
      impactFail: -18
    },
    strengthen_squad: {
      title: "Fortalecer o Elenco Profissional",
      desc: "Alcançar uma média de Habilidade (GER) dos titulares de no mínimo 30 nas próx. 8 rodadas.",
      duration: 8,
      targetAvg: 30,
      impactWin: 8,
      impactFail: -12
    },
    win_matches: {
      title: "Vencer 5 Partidas",
      desc: "Conquistar pelo menos 5 vitórias nas próximas 10 rodadas oficiais.",
      duration: 10,
      targetWins: 5,
      currentWins: 0,
      impactWin: 10,
      impactFail: -15
    }
  };

  const def = promiseDefs[promiseType];
  if (!def) return { success: false, message: "Tipo de promessa desconhecido." };

  const newPromise = {
    id: Date.now(),
    type: promiseType,
    title: def.title,
    desc: def.desc,
    remainingTurns: def.duration,
    status: 'active',
    impactWin: def.impactWin,
    impactFail: def.impactFail,
    targetLevel: def.targetLevel,
    targetAvg: def.targetAvg,
    targetWins: def.targetWins,
    currentWins: 0
  };

  gameState.politics.promises.push(newPromise);
  gameState.historyLog.unshift({
    turn: gameState.turn,
    text: `[Promessa Política]: O presidente prometeu publicamente ao Conselho: "${def.title}".`
  });

  return { success: true, message: `Promessa "${def.title}" firmada com sucesso perante o Conselho!` };
}

/**
 * Atualiza e verifica o cumprimento ou descumprimento das promessas ativas a cada rodada.
 */
export function processPromisesCheck(lastMatchOutcome) {
  gameState.politics.promises.forEach(promise => {
    if (promise.status !== 'active') return;

    if (promise.type === 'win_matches' && lastMatchOutcome === 'win') {
      promise.currentWins = (promise.currentWins || 0) + 1;
    }

    promise.remainingTurns--;

    let fulfilled = false;
    let failed = false;

    if (promise.type === 'financial_debt') {
      if (promise.remainingTurns <= 0) {
        if (gameState.club.cash >= 50000) fulfilled = true;
        else failed = true;
      }
    } else if (promise.type === 'invest_academy') {
      if (gameState.youthInfraLevel >= promise.targetLevel) fulfilled = true;
      else if (promise.remainingTurns <= 0) failed = true;
    } else if (promise.type === 'strengthen_squad') {
      const starters = gameState.squad.slice(0, 11);
      const avg = starters.length > 0 ? starters.reduce((acc, p) => acc + (p.rating || 20), 0) / starters.length : 0;
      if (avg >= promise.targetAvg) fulfilled = true;
      else if (promise.remainingTurns <= 0) failed = true;
    } else if (promise.type === 'win_matches') {
      if (promise.currentWins >= promise.targetWins) fulfilled = true;
      else if (promise.remainingTurns <= 0) failed = true;
    }

    if (fulfilled) {
      promise.status = 'fulfilled';
      modifyBoardSupport(promise.impactWin, `Promessa Cumprida: "${promise.title}"!`);
      gameState.fans.trust = Math.min(100, gameState.fans.trust + 5);
    } else if (failed) {
      promise.status = 'failed';
      modifyBoardSupport(promise.impactFail, `Promessa Descumprida: "${promise.title}"!`);
      gameState.fans.trust = Math.max(0, gameState.fans.trust - 8);
    }
  });
}

/**
 * Decrementa cooldowns de ações a cada avanço de rodada.
 */
export function processPoliticsTurn() {
  Object.keys(gameState.politics.cooldowns).forEach(key => {
    if (gameState.politics.cooldowns[key] > 0) {
      gameState.politics.cooldowns[key]--;
    }
  });

  updatePoliticalGroups();
}

/**
 * Gera um evento político aleatório se as condições forem atendidas.
 */
export function checkRandomPoliticalEvent() {
  if (gameState.turn % 7 !== 0) return null; // Ocorre a cada 7 rodadas aproximadamente

  const events = [
    {
      id: "cost_inquiry",
      title: "Cobrança sobre Gastos Administrativos",
      desc: "Conselheiros da oposição questionam os custos com diárias da diretoria e viagens.",
      options: [
        { text: "Prestar esclarecimentos e oferecer jantar ao conselho (-R$ 10.000)", effect: () => { addTransaction("Jantar de Esclarecimento Política", "Política", -10000); modifyBoardSupport(4, "Conselho satisfeito com explicações."); } },
        { text: "Ignorar os questionamentos da oposição", effect: () => { modifyBoardSupport(-6, "Oposição usou o silêncio para atacar a gestão."); } }
      ]
    },
    {
      id: "extraordinary_meeting",
      title: "Ameaça de Reunião Extraordinária",
      desc: "Um grupo independente exige a apresentação do balancete trimestral.",
      options: [
        { text: "Contratar auditoria independente (-R$ 20.000)", effect: () => { addTransaction("Auditoria Independente", "Política", -20000); modifyBoardSupport(8, "Transparência elogiada pelos conselheiros."); } },
        { text: "Enviar balancete padrão simplificado", effect: () => { modifyBoardSupport(-2, "Alguns conselheiros desconfiaram dos números."); } }
      ]
    },
    {
      id: "youth_demand",
      title: "Exigência de Apoio à Base",
      desc: "Conselheiros tradicionais cobram maior investimento nas categorias de base.",
      options: [
        { text: "Injetar R$ 30.000 no fundo da base", effect: () => { addTransaction("Aporte Emergencial na Base", "Base", -30000); modifyBoardSupport(7, "Apoio do conselho renovado pelo incentivo aos jovens."); } },
        { text: "Priorizar o elenco profissional no momento", effect: () => { modifyBoardSupport(-4, "Conselheiros ligados à base demonstraram descontentamento."); } }
      ]
    }
  ];

  const selectedEvent = events[Math.floor(Math.random() * events.length)];
  return selectedEvent;
}
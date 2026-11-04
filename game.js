/**
 * game.js - Avanço de turnos, contadores de estatísticas para o Hall da Fama e ciclo de jogo.
 */

import { gameState } from './state.js';
import { processMonthlyFinances, addTransaction } from './finances.js';
import { simulateTurnMatches, initStandings, processPlayerDevelopmentAndAging, processRetirements } from './matches.js';
import { checkGameConditions, processElectionCheck } from './elections.js';
import { refreshCoachMarket } from './staff.js';
import { saveGame } from './save.js';
import { processPoliticsTurn, processPromisesCheck, modifyBoardSupport, checkRandomPoliticalEvent } from './politics.js';

const FIRST_NAMES = ["Lucas", "Gabriel", "Matheus", "Pedro", "Guilherme", "Gustavo", "Felipe", "Vinicius", "Bruno", "Eduardo", "Diego", "Rafael", "Rodrigo", "Thiago", "Marcelo", "Leonardo", "Caio", "Enzo", "Henrique", "João"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Ribeiro", "Carvalho", "Lopes", "Barbosa", "Vieira", "Martins", "Rocha"];

function getRandomName() {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

export function advanceGameTurn() {
  gameState.turn++;

  let seasonEnded = false;
  let seasonResultInfo = null;

  processStaffCardsTurnEffects();
  processContractsTurn();
  processPoliticsTurn();

  if (gameState.turn > 38) {
    seasonResultInfo = processSeasonEnd();
    seasonEnded = true;
    gameState.year++;
    gameState.turn = 1;
    gameState.stats.seasonsPlayed++;
    gameState.politics.mandateYear = gameState.politics.mandateYear === 1 ? 2 : 1;
  }

  const matchDetails = simulateTurnMatches(gameState.turn);

  // Contagem de estatísticas para o Hall da Fama
  if (matchDetails.outcomeType === 'win') {
    gameState.stats.winsCount++;
    modifyBoardSupport(1, "Vitória na rodada");
  } else if (matchDetails.outcomeType === 'draw') {
    gameState.stats.drawsCount++;
  } else {
    gameState.stats.lossesCount++;
    modifyBoardSupport(-1, "Derrota na rodada");
  }

  gameState.historyLog.unshift({
    turn: gameState.turn,
    text: `[Partida]: ${matchDetails.matchResultText}`
  });

  processPromisesCheck(matchDetails.outcomeType);

  const netResult = processMonthlyFinances(matchDetails.matchInfo.homeMatchesCount);
  gameState.historyLog.unshift({
    turn: gameState.turn,
    text: `[Finanças]: Resultado operacional do período foi de R$ ${netResult.toLocaleString('pt-BR')}.`
  });

  if (netResult < -20000) {
    modifyBoardSupport(-2, "Déficit operacional no mês");
  }

  if (gameState.turn % 2 === 0) {
    refreshCoachMarket();
  }

  processPlayerDevelopmentAndAging();

  if (seasonEnded) {
    gameState.squad.forEach(p => p.age++);
    processRetirements();
    processVoiceOfExperienceStartOfSeason();
  }

  const polEvent = checkRandomPoliticalEvent();
  const electionResult = processElectionCheck();

  if (electionResult.defeated) {
    return {
      status: 'gameover',
      reason: electionResult.reason,
      matchDetails,
      seasonResultInfo,
      electionResult: electionResult.electionResult,
      polEvent
    };
  }

  const goCheck = checkGameConditions();
  if (goCheck.gameOver) {
    return {
      status: 'gameover',
      reason: goCheck.reason,
      matchDetails,
      seasonResultInfo,
      polEvent
    };
  }

  saveGame();

  return {
    status: 'continue',
    matchDetails,
    seasonResultInfo,
    electionOccurred: electionResult.electionOccurred,
    electionResult: electionResult.electionResult,
    polEvent
  };
}

function processContractsTurn() {
  const expiredPlayers = [];
  const expiringSoonPlayers = [];
  const autoRenewedPlayers = [];

  gameState.squad = gameState.squad.filter(p => {
    if (p.contractMonths === undefined) p.contractMonths = 12;
    p.contractMonths--;

    if (p.contractMonths === 1 && gameState.autoRenewEnabled) {
      if (p.salary <= gameState.autoRenewMaxSalary) {
        p.salary = Math.round(p.salary * 1.20);
        p.contractMonths += 24;
        autoRenewedPlayers.push(p.name);
        return true;
      }
    }

    if (p.contractMonths === 2) expiringSoonPlayers.push(p.name);
    if (p.contractMonths <= 0) {
      expiredPlayers.push(p.name);
      return false;
    }
    return true;
  });

  if (autoRenewedPlayers.length > 0) {
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[🔄 Renovação Automática]: O(s) contrato(s) de ${autoRenewedPlayers.join(', ')} foi(ram) renovado(s) automaticamente por mais 2 anos.`
    });
  }

  if (expiringSoonPlayers.length > 0) {
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[⚠️ Alerta de Contrato]: O(s) contrato(s) do(s) atleta(s) ${expiringSoonPlayers.join(', ')} expiram em apenas 2 meses!`
    });
  }

  if (expiredPlayers.length > 0) {
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Fim de Contrato]: Os seguintes atletas deixaram o clube: ${expiredPlayers.join(', ')}.`
    });
  }
}

function processStaffCardsTurnEffects() {
  const scoutCards = gameState.staff.scout && gameState.staff.scout.cards ? gameState.staff.scout.cards : [];

  if (scoutCards.some(c => c.id === 'eagle_eye') && gameState.turn % 30 === 0) {
    const positions = ["GOL", "DEF", "MEI", "ATA"];
    const newTalent = {
      id: Date.now(),
      name: getRandomName(),
      pos: positions[Math.floor(Math.random() * positions.length)],
      age: 18,
      rating: 75,
      potential: 99,
      salary: 3500,
      marketValue: 250000
    };
    gameState.youthPlayers.push(newTalent);
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Olheiro - Olho de Águia]: Um super talento (GER 75, Potencial 99) chamado ${newTalent.name} chegou à base!`
    });
  }

  if (scoutCards.some(c => c.id === 'sneaky_snake') && gameState.turn % 10 === 0 && gameState.youthPlayers.length > 0) {
    const removed = gameState.youthPlayers.splice(Math.floor(Math.random() * gameState.youthPlayers.length), 1)[0];
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Olheiro - Cobra Sorrateira]: O olheiro agiu por trás e o jovem promissor ${removed.name} sumiu da base!`
    });
  }

  if (scoutCards.some(c => c.id === 'no_morale') && gameState.turn % 2 === 0) {
    gameState.squad.forEach(p => p.moral = Math.max(0, p.moral - 5));
  }

  const youthCards = gameState.staff.youthCoach && gameState.staff.youthCoach.cards ? gameState.staff.youthCoach.cards : [];

  if (youthCards.some(c => c.id === 'star_hunter')) {
    const bonus = 50000 + Math.floor(Math.random() * 250001);
    addTransaction("Bônus Caçador de Estrelas (Base)", "Base", bonus);
  }

  if (youthCards.some(c => c.id === 'loser')) {
    addTransaction("Prejuízo Orçamentário (Treinador Perdedor)", "Base", -30000);
  }

  if (youthCards.some(c => c.id === 'wall_maker') && gameState.turn === 1) {
    if (Math.random() < 0.5) {
      const gkTalent = {
        id: Date.now(),
        name: getRandomName(),
        pos: 'GOL',
        age: 17,
        rating: 70,
        potential: 99,
        salary: 3000,
        marketValue: 200000
      };
      gameState.youthPlayers.push(gkTalent);
      gameState.historyLog.unshift({
        turn: gameState.turn,
        text: `[Base - Formador de Muralhas]: Um goleiro lendário (${gkTalent.name}, GER 70, Pot. 99) foi descoberto na base!`
      });
    }
  }

  const physioCards = gameState.staff.physio && gameState.staff.physio.cards ? gameState.staff.physio.cards : [];

  if (physioCards.some(c => c.id === 'shopee_ray') && gameState.turn % 3 === 0) {
    addTransaction("Patrocínio Dr. Ray da Shopee", "Comercial", 100000);
  }

  if (physioCards.some(c => c.id === 'familiar')) {
    gameState.squad.forEach(p => p.moral = Math.min(100, p.moral + 10));
  }

  if (physioCards.some(c => c.id === 'clumsy') && gameState.turn === 19 && gameState.squad.length > 0) {
    const unluckyPlayer = gameState.squad[Math.floor(Math.random() * gameState.squad.length)];
    unluckyPlayer.condition = 0;
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Preparador - Desastrado]: Nosso preparador exagerou no treino e esgotou completamente a energia do atleta ${unluckyPlayer.name}!`
    });
  }

  if (physioCards.some(c => c.id === 'spender')) {
    addTransaction("Compra de Equipamentos (Preparador Gastador)", "Despesas", -20000);
  }
}

function processVoiceOfExperienceStartOfSeason() {
  const scoutCards = gameState.staff.scout && gameState.staff.scout.cards ? gameState.staff.scout.cards : [];
  if (scoutCards.some(c => c.id === 'voice_exp')) {
    const vetPlayer = {
      id: Date.now(),
      name: getRandomName(),
      pos: "MEI",
      age: 32,
      rating: 90,
      potential: 90,
      salary: 15000,
      marketValue: 300000,
      condition: 100,
      moral: 90,
      contractMonths: 12
    };
    gameState.squad.push(vetPlayer);
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Voz da Experiência]: O olheiro contratou o veterano craque ${vetPlayer.name} (GER 90, 32 anos) para liderar o time nesta temporada!`
    });
  }
}

function processSeasonEnd() {
  const playerPos = gameState.standings.findIndex(s => s.isPlayer) + 1;
  const currentDiv = gameState.club.division;

  let seasonMsg = `Fim da Temporada! Você terminou em ${playerPos}º lugar na ${currentDiv}.`;
  let title = "Fim de Temporada";
  let isPromotion = false;
  let isChampion = false;

  gameState.scoutsUsedThisYear = 0;
  gameState.coachSigningsUsedThisYear = 0;

  // O título pertence exclusivamente ao campeão da divisão.
  if (playerPos === 1) {
    isChampion = true;
    gameState.stats.titlesCount++;
  }

  // As posições de acesso existentes (1º ao 4º lugar) só promovem
  // clubes das Séries D, C e B. A Série A é a divisão máxima.
  if (
    playerPos >= 1 &&
    playerPos <= 4 &&
    ["Série D", "Série C", "Série B"].includes(currentDiv)
  ) {
    isPromotion = true;

    if (currentDiv === "Série D") {
      gameState.club.division = "Série C";
      const prize = 200000;
      addTransaction("Premiação por Acesso à Série C", "Premiações", prize);
      seasonMsg = `🚀 PARABÉNS! O clube conquistou o ACESSO para a SÉRIE C e faturou R$ ${prize.toLocaleString('pt-BR')} de bônus!`;
      title = "Acesso Conquistado à Série C!";
      gameState.fans.trust = Math.min(100, gameState.fans.trust + 20);
      modifyBoardSupport(15, "Acesso conquistado para a Série C");
    } else if (currentDiv === "Série C") {
      gameState.club.division = "Série B";
      const prize = 500000;
      addTransaction("Premiação por Acesso à Série B", "Premiações", prize);
      seasonMsg = `🚀 PARABÉNS! O clube conquistou o ACESSO para a SÉRIE B e faturou R$ ${prize.toLocaleString('pt-BR')} de bônus!`;
      title = "Acesso Conquistado à Série B!";
      gameState.fans.trust = Math.min(100, gameState.fans.trust + 25);
      modifyBoardSupport(20, "Acesso conquistado para a Série B");
    } else if (currentDiv === "Série B") {
      gameState.club.division = "Série A";
      const prize = 1500000;
      addTransaction("Premiação por Acesso à Série A", "Premiações", prize);
      seasonMsg = `🏆 HISTÓRICO! O clube alcançou a ELITE DO FUTEBOL BRASILEIRO (SÉRIE A) e faturou R$ ${prize.toLocaleString('pt-BR')}!`;
      title = "Acesso Histórico à Série A!";
      gameState.fans.trust = 100;
      modifyBoardSupport(25, "Acesso histórico para a Série A");
    }
  } else if (currentDiv === "Série A" && playerPos === 1) {
    const prize = 3000000;
    addTransaction("Premiação de CAMPEÃO DA SÉRIE A", "Premiações", prize);
    seasonMsg = `👑 CAMPEÃO BRASILEIRO! O clube atingiu o topo do futebol nacional e faturou R$ ${prize.toLocaleString('pt-BR')}!`;
    title = "Campeão Brasileiro da Série A!";
    modifyBoardSupport(30, "Título Brasileiro da Série A");
  } else if (playerPos >= 17) {
    if (currentDiv === "Série A") {
      gameState.club.division = "Série B";
      seasonMsg = `⚠️ O clube foi rebaixado para a Série B.`;
      title = "Rebaixado";
      gameState.fans.trust = Math.max(0, gameState.fans.trust - 20);
      modifyBoardSupport(-20, "Rebaixamento para a Série B");
    } else if (currentDiv === "Série B") {
      gameState.club.division = "Série C";
      seasonMsg = `⚠️ O clube foi rebaixado para a Série C.`;
      title = "Rebaixado";
      gameState.fans.trust = Math.max(0, gameState.fans.trust - 20);
      modifyBoardSupport(-20, "Rebaixamento para a Série C");
    } else if (currentDiv === "Série C") {
      gameState.club.division = "Série D";
      seasonMsg = `⚠️ O clube foi rebaixado para a Série D.`;
      title = "Rebaixado";
      gameState.fans.trust = Math.max(0, gameState.fans.trust - 20);
      modifyBoardSupport(-20, "Rebaixamento para a Série D");
    }
  }

  gameState.historyLog.unshift({
    turn: gameState.turn,
    text: `[TEMPORADA]: ${seasonMsg}`
  });

  gameState.standings = [];
  initStandings();

  return { isPromotion, isChampion, title, message: seasonMsg, position: playerPos };
}
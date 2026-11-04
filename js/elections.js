/**
 * elections.js - Gestão de confiança, conselho deliberativo, eleições e game over.
 */

import { gameState } from './state.js';

export function checkGameConditions() {
  if (gameState.fans.trust <= 0) {
    return {
      gameOver: true,
      reason: "A torcida perdeu totalmente a confiança na sua gestão e invadiu o clube. Demissão imediata!"
    };
  }

  if (gameState.bankruptcy.consecutiveNegativeMonths >= 5) {
    return {
      gameOver: true,
      reason: "O clube acumulou 5 meses consecutivos de saldo negativo no caixa e decretou falência financeira."
    };
  }

  if (gameState.board.support <= 10) {
    return {
      gameOver: true,
      reason: "O Conselho Deliberativo aprovou um impeachment extraordinário por falta quase total de sustentação política (Apoio < 10%)."
    };
  }

  return { gameOver: false, reason: "" };
}

/**
 * Processa a contagem regressiva e a eleição bianual (mandato de 76 rodadas no total = 2 temporadas).
 */
export function processElectionCheck() {
  gameState.board.nextElectionTurn--;
  
  if (gameState.board.nextElectionTurn <= 0) {
    // Apuração Completa da Eleição Presidencial
    const electionResult = runPresidencialElection();
    
    // Reseta o ciclo para o próximo mandato de 2 temporadas (76 rodadas)
    gameState.board.nextElectionTurn = 76;
    gameState.politics.mandateYear = 1;

    if (!electionResult.won) {
      return {
        defeated: true,
        reason: `Você foi derrotado nas eleições presidenciais por ${electionResult.oppCandidate} (${electionResult.oppVotes}% vs ${electionResult.playerVotes}%). Fim do mandato administrativo!`,
        electionResult
      };
    }

    return {
      defeated: false,
      electionOccurred: true,
      electionResult
    };
  }

  return { defeated: false, electionOccurred: false };
}

/**
 * Calcula o resultado da eleição com base em 5 fatores ponderados:
 * 1. Apoio do Conselho (40%)
 * 2. Confiança da Torcida (25%)
 * 3. Saúde Financeira (15%)
 * 4. Desempenho na Divisão (10%)
 * 5. Promessas Cumpridas (10%)
 */
export function runPresidencialElection() {
  const boardWeight = (gameState.board.support / 100) * 40;
  const fanWeight = (gameState.fans.trust / 100) * 25;
  
  // Saúde financeira: ter dinheiro em caixa gera pontuação
  const cashScore = Math.min(100, Math.max(0, (gameState.club.cash / 300000) * 100));
  const finWeight = (cashScore / 100) * 15;

  // Divisão: Série A/B dá prestígio
  const divScores = { "Série A": 100, "Série B": 80, "Série C": 60, "Série D": 40 };
  const divScore = divScores[gameState.club.division] || 40;
  const divWeight = (divScore / 100) * 10;

  // Promessas cumpridas
  const fulfilledPromises = gameState.politics.promises.filter(p => p.status === 'fulfilled').length;
  const failedPromises = gameState.politics.promises.filter(p => p.status === 'failed').length;
  const promiseBalance = Math.max(0, Math.min(100, 50 + (fulfilledPromises * 20) - (failedPromises * 20)));
  const promiseWeight = (promiseBalance / 100) * 10;

  let totalPlayerVotes = Math.round(boardWeight + fanWeight + finWeight + divWeight + promiseWeight);
  
  // Fator aleatório pequeno (+/- 3%)
  const randFactor = Math.floor(Math.random() * 7) - 3;
  totalPlayerVotes = Math.max(15, Math.min(95, totalPlayerVotes + randFactor));
  
  const oppVotes = 100 - totalPlayerVotes;
  const won = totalPlayerVotes >= 50;

  const resultObj = {
    won,
    playerVotes: totalPlayerVotes,
    oppVotes,
    oppCandidate: gameState.politics.opponentCandidate.name
  };

  gameState.politics.electionResultsHistory.unshift({
    year: gameState.year,
    turn: gameState.turn,
    resultObj
  });

  return resultObj;
}
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

  return { gameOver: false, reason: "" };
}

export function processElectionCheck() {
  gameState.board.nextElectionTurn--;
  if (gameState.board.nextElectionTurn <= 0) {
    gameState.board.nextElectionTurn = 38;

    const approvalScore = (gameState.fans.trust + gameState.board.support) / 2;
    if (approvalScore < 45) {
      return {
        defeated: true,
        reason: "O Conselho Deliberativo e a torcida votaram pela sua saída nas eleições presidenciais devido ao baixo apoio acumulado."
      };
    }
  }
  return { defeated: false, reason: "" };
}
/**
 * save.js - Gerencia o salvamento automático, carregamento, validação e migração.
 */

import { gameState } from './state.js';

const SAVE_KEY = 'presidente_save_v2';

export function saveGame() {
  try {
    const dataToSave = JSON.stringify(gameState);
    localStorage.setItem(SAVE_KEY, dataToSave);
    return true;
  } catch (e) {
    console.error("Erro ao salvar o jogo:", e);
    return false;
  }
}

export function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    
    if (!parsed || typeof parsed.turn !== 'number' || !parsed.club || !parsed.standings) {
      console.warn("Salvamento incompatível ou corrompido detectado. Limpando dados antigos...");
      clearSavedGame();
      return false;
    }

    // Garantia de migração retrocompatível para o Sistema Político
    if (!parsed.politics) {
      parsed.politics = {
        mandateYear: 1,
        groups: { situacao: 50, independentes: 30, oposicao: 20 },
        cooldowns: { reuniao: 0, almoco: 0, plano: 0, reivindicacao: 0, negociacao: 0 },
        promises: [],
        eventsHistory: [],
        opponentCandidate: { name: "Dr. Arthur Medeiros", strength: 45 },
        electionResultsHistory: []
      };
    }

    if (!parsed.board || typeof parsed.board.nextElectionTurn !== 'number') {
      parsed.board = { support: 70, nextElectionTurn: 76 };
    }

    Object.assign(gameState, parsed);
    return true;
  } catch (e) {
    console.error("Erro ao carregar o salvamento. Limpando memória:", e);
    clearSavedGame();
    return false;
  }
}

export function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSavedGame() {
  localStorage.removeItem(SAVE_KEY);
}
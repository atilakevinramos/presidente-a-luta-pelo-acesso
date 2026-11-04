/**
 * main.js - Ponto de entrada que inicializa os módulos, salvamentos, ciclo de vida
 * e exibe o modal de pós-jogo após cada avanço de turno.
 */

import { gameState, resetGameState } from './state.js';
import { saveGame, loadGame, hasSavedGame, clearSavedGame } from './save.js';
import { initUI, renderAll, showGameOverScreen, showMatchResultModal, setPendingGameOver } from './ui.js';
import { advanceGameTurn } from './game.js';
import { initStandings } from './matches.js';

function initApp() {
  if (hasSavedGame()) {
    const loaded = loadGame();
    if (loaded) {
      document.getElementById('setup-screen').classList.add('hidden');
      initStandings();
      renderAll();
    } else {
      document.getElementById('setup-screen').classList.remove('hidden');
    }
  } else {
    document.getElementById('setup-screen').classList.remove('hidden');
  }

  initUI({
    onStartCareer: (customConfig) => {
      clearSavedGame();
      resetGameState();

      // Aplica o nome escolhido para o presidente.
      gameState.presidentName = customConfig.presidentName;

      gameState.club.name = customConfig.name;
      gameState.club.sigla = customConfig.sigla;
      gameState.club.primaryColor = customConfig.primaryColor;
      gameState.club.secondaryColor = customConfig.secondaryColor;

      initStandings();
      const playerEntry = gameState.standings.find(s => s.isPlayer);
      if (playerEntry) playerEntry.name = customConfig.name;

      saveGame();
      document.getElementById('setup-screen').classList.add('hidden');
      renderAll();
    },
    onAdvanceTurn: () => {
      const result = advanceGameTurn();
      renderAll();

      if (result.matchDetails) {
        showMatchResultModal(result.matchDetails);
      }

      if (result.status === 'gameover') {
        setPendingGameOver(result.reason);
      }
    },
    onRestart: () => {
      clearSavedGame();
      location.reload();
    },
    onGameOverModal: (reason) => {
      showGameOverScreen(reason);
    }
  });

  const manualSaveBtn = document.getElementById('btn-manual-save');
  if (manualSaveBtn) {
    manualSaveBtn.addEventListener('click', () => {
      const success = saveGame();
      if (success) {
        alert("Jogo salvo com sucesso!");
      } else {
        alert("Erro ao salvar o jogo.");
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);
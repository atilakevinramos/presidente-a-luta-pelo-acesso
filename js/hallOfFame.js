/**
 * hallOfFame.js - Lógica de cálculo de pontuação da carreira e comunicação com Google Apps Script.
 */

import { gameState } from './state.js';

// ATENÇAO: Insira aqui a URL do seu Web App do Google Apps Script após a publicação
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqEQ-YBY1LJLHRj1hzdhI5nGJnBS-BZR8IaoG7TwY4oLfLcbAeDgIDjA9bCanAY9JI/exec";

/**
 * Calcula detalhadamente a pontuação da carreira com base nos critérios estabelecidos.
 */
export function calculateCareerScore(customState = gameState) {
  const stats = customState.stats || { seasonsPlayed: 0, titlesCount: 0, winsCount: 0, drawsCount: 0, specialObjectivesCompleted: 0 };
  
  const titles = stats.titlesCount || 0;
  const wins = stats.winsCount || 0;
  const draws = stats.drawsCount || 0;
  const seasons = stats.seasonsPlayed || 0;
  const cashFinal = customState.club ? customState.club.cash : 0;
  const objectives = stats.specialObjectivesCompleted || 0;

  const pointsTitles = titles * 1000;
  const pointsWins = wins * 50;
  const pointsDraws = draws * 15;
  const pointsSeasons = seasons * 200;
  
  // R$ 1 milhão em caixa = 10 pontos. Caixa negativo não gera pontos negativos excessivos (mínimo 0).
  const millions = cashFinal / 1000000;
  const pointsFinancial = Math.max(0, Math.round(millions * 10));
  
  const pointsObjectives = objectives * 300;

  const totalScore = pointsTitles + pointsWins + pointsDraws + pointsSeasons + pointsFinancial + pointsObjectives;

  return {
    totalScore,
    breakdown: {
      titles: pointsTitles,
      wins: pointsWins,
      draws: pointsDraws,
      seasons: pointsSeasons,
      financial: pointsFinancial,
      objectives: pointsObjectives
    },
    raw: {
      titlesCount: titles,
      winsCount: wins,
      drawsCount: draws,
      seasonsCount: seasons,
      cashFinal,
      objectivesCount: objectives
    }
  };
}

/**
 * Envia o registro da carreira para a API do Google Apps Script.
 */
export async function submitCareerToHallOfFame(presidentName) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("INSERIR_URL")) {
    return { success: false, message: "URL da API do Apps Script não configurada no jogo." };
  }

  const scoreData = calculateCareerScore(gameState);
  const payload = {
    action: "registerCareer",
    careerId: gameState.careerId || ('car_' + Date.now()),
    date: new Date().toISOString(),
    presidentName: presidentName || gameState.presidentName || "Presidente Anônimo",
    clubName: gameState.club.name || "Clube",
    totalScore: scoreData.totalScore,
    titles: scoreData.raw.titlesCount,
    wins: scoreData.raw.winsCount,
    draws: scoreData.raw.drawsCount,
    losses: gameState.stats.lossesCount || 0,
    seasons: scoreData.raw.seasonsCount,
    cashFinal: scoreData.raw.cashFinal,
    ptsTitles: scoreData.breakdown.titles,
    ptsWins: scoreData.breakdown.wins,
    ptsDraws: scoreData.breakdown.draws,
    ptsSeasons: scoreData.breakdown.seasons,
    ptsFinancial: scoreData.breakdown.financial,
    ptsObjectives: scoreData.breakdown.objectives
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Necessário para contornar restrições padrão do Google Apps Script Web App
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Como o modo 'no-cors' retorna opaque response, salvamos localmente como enviado com sucesso
    return { success: true, message: "Carreira enviada com sucesso para o Hall da Fama!" };
  } catch (error) {
    console.error("Erro ao enviar para o Hall da Fama:", error);
    return { success: false, message: "Falha de conexão ao enviar dados. Tente novamente mais tarde." };
  }
}

/**
 * Consulta o ranking online no Google Apps Script.
 */
export async function fetchHallOfFameRankings(category = "geral") {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("INSERIR_URL")) {
    throw new Error("URL da API do Apps Script não configurada.");
  }

  try {
    const url = `${APPS_SCRIPT_URL}?action=getRanking&category=${category}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao carregar rankings.");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar Hall da Fama:", error);
    throw error;
  }
}
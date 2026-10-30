/**
 * finances.js - Controle financeiro, despesas, bilheteria, patrocínios, manutenção da base e hidromassagem.
 */

import { gameState } from './state.js';

export function addTransaction(description, category, amount) {
  gameState.club.cash += amount;
  gameState.ledger.unshift({
    turn: gameState.turn,
    description,
    category,
    amount
  });
  if (gameState.ledger.length > 100) gameState.ledger.pop();
}

export function calculateTotalSalaries() {
  let total = 0;
  gameState.squad.forEach(p => total += p.salary);
  Object.values(gameState.staff).forEach(s => total += s.salary);
  return total;
}

export function applyHydroSpaRecovery() {
  const hydroCost = 21000;

  if (gameState.club.cash < hydroCost) {
    return { 
      success: false, 
      message: `Caixa insuficiente! A sessão de hidromassagem para o elenco custa R$ ${hydroCost.toLocaleString('pt-BR')}.` 
    };
  }

  addTransaction("Sessão de Hidromassagem Intensiva (Elenco)", "Estrutura", -hydroCost);

  gameState.squad.forEach(p => {
    p.condition = Math.min(100, p.condition + 35);
  });

  return { 
    success: true, 
    message: `Sessão de hidromassagem realizada! O elenco recuperou o vigor físico para as próximas partidas.` 
  };
}

export function processMonthlyFinances(homeMatchesCount) {
  let revSponsorship = 50000;
  let revCommercial = 0;

  // Efeitos dos cards de patrocínio
  const scoutCards = gameState.staff.scout && gameState.staff.scout.cards ? gameState.staff.scout.cards : [];
  if (scoutCards.some(c => c.id === 'pop_star_scout')) revSponsorship *= 1.15;
  if (scoutCards.some(c => c.id === 'damp_money')) revSponsorship *= 0.90;

  if (gameState.staff.coach && gameState.staff.coach.skill === "Pop Star") {
    revCommercial += 40000;
  }

  let ticketRev = 0;
  let estimatedAttendance = 0;
  if (homeMatchesCount > 0) {
    const ticketP = gameState.club.ticketPrice;
    const diffFromNeutral = ticketP - 40;
    const steps = diffFromNeutral / 5;
    const trustDelta = Math.round(steps * 4);

    gameState.fans.trust = Math.max(0, Math.min(100, gameState.fans.trust - trustDelta));

    const priceFactor = Math.max(0.3, 1 - (ticketP - 30) / 150);
    const trustFactor = gameState.fans.trust / 100;
    estimatedAttendance = Math.floor(10000 * priceFactor * trustFactor);
    estimatedAttendance = Math.min(15000, Math.max(500, estimatedAttendance));
    
    ticketRev = estimatedAttendance * ticketP * homeMatchesCount;
  }

  const totalRevenue = revSponsorship + revCommercial + ticketRev;

  const salaries = calculateTotalSalaries();
  const youthMaint = gameState.academyMaintCost;
  const totalExpenses = salaries + youthMaint;

  const netResult = totalRevenue - totalExpenses;
  gameState.lastMonthlyResult = netResult;

  if (revSponsorship > 0) addTransaction("Receita de Patrocínio Master", "Patrocínio", Math.round(revSponsorship));
  if (revCommercial > 0) addTransaction("Receita Comercial & Imagem", "Comercial", revCommercial);
  if (ticketRev > 0) addTransaction(`Bilheteria de ${homeMatchesCount} jogo(s) em casa (${estimatedAttendance} público méd.)`, "Bilheteria", ticketRev);
  
  if (salaries > 0) addTransaction("Pagamento de Salários (Elenco e Comissão)", "Despesas", -salaries);
  if (youthMaint > 0) addTransaction(`Manutenção da Infraestrutura da Base (Nível ${gameState.youthInfraLevel})`, "Base", -youthMaint);

  if (gameState.club.cash < 0) {
    gameState.bankruptcy.consecutiveNegativeMonths++;
  } else {
    gameState.bankruptcy.consecutiveNegativeMonths = 0;
  }

  return netResult;
}
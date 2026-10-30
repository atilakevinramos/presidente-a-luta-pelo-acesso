/**
 * staff.js - Gestão da comissão técnica e geração aleatória de candidatos.
 */

import { gameState, generateRandomCoachCards, generateStaffCards } from './state.js';
import { addTransaction } from './finances.js';

const FIRST_NAMES = ["Abel", "Rogério", "Renato", "Fernando", "Jorge", "Vanderlei", "Dorival", "Cuca", "Tite", "Mano", "Antônio", "Luiz", "Marcelo", "Thiago", "Eduardo", "Silvio", "Ricardo", "Mário", "Carlos", "Alberto"];
const LAST_NAMES = ["Ferreira", "Ceni", "Gaúcho", "Diniz", "Jesus", "Luxemburgo", "Júnior", "Belém", "Martins", "Menezes", "Oliveira", "Felipe", "Sobrinho", "Vargas", "Silveira", "Santos", "Souza", "Lima", "Costa", "Ribeiro"];

const PLAYER_FIRST = ["Marcos", "Lucas", "Luan", "Gabriel", "Rafa", "Matheus", "Gustavo", "Everton", "Pablo", "Dudu", "Bruno", "Henrique"];
const PLAYER_LAST = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"];

function getRandomPlayerName() {
  return `${PLAYER_FIRST[Math.floor(Math.random() * PLAYER_FIRST.length)]} ${PLAYER_LAST[Math.floor(Math.random() * PLAYER_LAST.length)]}`;
}

function getDivisionCoachBounds(division) {
  switch (division) {
    case "Série D": return { min: 10, max: 30 };
    case "Série C": return { min: 31, max: 50 };
    case "Série B": return { min: 51, max: 70 };
    case "Série A": return { min: 71, max: 99 };
    default: return { min: 10, max: 30 };
  }
}

export function refreshCoachMarket() {
  const bounds = getDivisionCoachBounds(gameState.club.division);
  const newCoachesCount = 2 + Math.floor(Math.random() * 2);
  
  const generatedCoaches = [];
  for (let i = 0; i < newCoachesCount; i++) {
    const randomName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + " " + LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const coachOverall = bounds.min + Math.floor(Math.random() * (bounds.max - bounds.min + 1));
    const coachCards = generateRandomCoachCards(false);
    const salary = coachOverall * 400;
    const hireCost = coachOverall > 25 ? (coachOverall - 20) * 2000 : 0;

    generatedCoaches.push({
      name: randomName,
      role: "Treinador Principal",
      salary: salary,
      hireCost: hireCost,
      coachOverall: coachOverall,
      cards: coachCards,
      level: Math.floor(coachOverall / 15) + 1
    });
  }
  gameState.candidates.coach = generatedCoaches;

  const staffRoles = ['assistant', 'scout', 'youthCoach', 'physio'];
  staffRoles.forEach(roleKey => {
    const roleNameMap = {
      assistant: "Auxiliar Técnico",
      scout: "Olheiro",
      youthCoach: "Treinador da Base",
      physio: "Preparador Físico"
    };
    const candList = [];
    for (let i = 0; i < 2; i++) {
      const randomName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + " " + LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const cards = roleKey === 'assistant' ? generateRandomCoachCards(true) : generateStaffCards(roleKey);
      candList.push({
        name: randomName,
        role: roleNameMap[roleKey],
        salary: 8000 + Math.floor(Math.random() * 4000),
        hireCost: Math.random() > 0.5 ? 3000 : 0,
        skill: "Especializado",
        benefit: "Impacto tático na comissão",
        cards: cards,
        level: 2
      });
    }
    gameState.candidates[roleKey] = candList;
  });
  
  gameState.historyLog.unshift({
    turn: gameState.turn,
    text: `[Mercado]: O mercado de profissionais da comissão técnica da ${gameState.club.division} foi atualizado!`
  });
}

export function hireStaffMember(roleKey, candidateIndex) {
  const candidatesList = gameState.candidates[roleKey];
  if (!candidatesList || !candidatesList[candidateIndex]) return false;

  const newStaff = candidatesList[candidateIndex];

  const totalCost = newStaff.hireCost || 0;
  if (gameState.club.cash < totalCost) {
    alert("Caixa insuficiente para pagar a taxa de contratação/rescisão deste profissional.");
    return false;
  }

  if (totalCost > 0) {
    addTransaction(`Taxa de contratação / rescisão (${newStaff.name})`, "Comissão Técnica", -totalCost);
  }

  const currentStaff = gameState.staff[roleKey];
  gameState.staff[roleKey] = { ...newStaff };
  candidatesList.splice(candidateIndex, 1, currentStaff);

  return true;
}

export function coachRequestSignings() {
  const scoutCards = gameState.staff.scout && gameState.staff.scout.cards ? gameState.staff.scout.cards : [];
  const maxSignings = scoutCards.some(c => c.id === 'open_doors') ? 8 : 5;

  if (gameState.coachSigningsUsedThisYear >= maxSignings) {
    return {
      success: false,
      message: `O técnico já utilizou as ${maxSignings} solicitações de reforços permitidas para esta temporada!`
    };
  }

  const bounds = getDivisionCoachBounds(gameState.club.division);
  const count = 1 + Math.floor(Math.random() * 3);
  const positions = ["GOL", "DEF", "MEI", "ATA"];
  const newPlayers = [];

  let totalCost = 0;

  for (let i = 0; i < count; i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const rating = bounds.min + Math.floor(Math.random() * (bounds.max - bounds.min + 1));
    const potential = Math.min(99, rating + 10 + Math.floor(Math.random() * 15));
    const salary = Math.max(2000, rating * 300);
    const cost = rating * 3000;
    totalCost += cost;

    const p = {
      id: Date.now() + i,
      name: getRandomPlayerName(),
      pos,
      age: 20 + Math.floor(Math.random() * 9),
      potential,
      salary,
      marketValue: cost * 1.2,
      condition: 100,
      moral: 90,
      contractMonths: 24
    };

    newPlayers.push(p);
  }

  if (gameState.club.cash < totalCost) {
    return {
      success: false,
      message: `Caixa insuficiente! O pacote de ${count} reforço(s) exigiria R$ ${totalCost.toLocaleString('pt-BR')} em luvas e taxas.`
    };
  }

  addTransaction(`Pacote de ${count} Reforço(s) trazido pelo técnico ${gameState.staff.coach.name}`, "Transferências", -totalCost);
  
  newPlayers.forEach(p => gameState.squad.push(p));
  gameState.coachSigningsUsedThisYear++;

  const namesList = newPlayers.map(p => `${p.name} (${p.pos})`).join(', ');

  return {
    success: true,
    message: `O técnico indicou e contratou ${count} reforço(s): ${namesList}! Custo total: R$ ${totalCost.toLocaleString('pt-BR')}.`,
    remaining: maxSignings - gameState.coachSigningsUsedThisYear
  };
}
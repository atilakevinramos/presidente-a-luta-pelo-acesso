/**
 * academy.js - Gestão da base com nomes limpos, cálculo dinâmico de salários e suporte aos cards de evolução do treinador.
 */

import { gameState } from './state.js';
import { addTransaction } from './finances.js';

const FIRST_NAMES = ["Lucas", "Gabriel", "Matheus", "Pedro", "Guilherme", "Gustavo", "Felipe", "Vinicius", "Bruno", "Eduardo", "Diego", "Rafael", "Rodrigo", "Thiago", "Marcelo", "Leonardo", "Caio", "Enzo", "Henrique", "João"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Ribeiro", "Carvalho", "Lopes", "Barbosa", "Vieira", "Martins", "Rocha"];

function getRandomName() {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

export function getYouthUpgradeCost() {
  return gameState.youthInfraLevel * 70000;
}

export function getYouthNewMaintCost() {
  return Math.floor((gameState.youthInfraLevel + 1) * 7000);
}

export function upgradeYouthInfrastructure() {
  const cost = getYouthUpgradeCost();
  if (gameState.club.cash < cost) {
    return { success: false, message: "Caixa insuficiente para investir na infraestrutura da base." };
  }

  addTransaction(`Investimento na Melhoria da Base (Nível ${gameState.youthInfraLevel + 1})`, "Base", -cost);
  
  gameState.youthInfraLevel++;
  gameState.academyMaintCost = Math.floor(gameState.youthInfraLevel * 7000);

  return { success: true, message: `Base elevada para o Nível ${gameState.youthInfraLevel} com sucesso!` };
}

/**
 * Calcula o salário do jovem com base no potencial (ou overall), variando de R$ 500 a R$ 4.000.
 */
function calculateYouthSalary(rating, potential) {
  // Base de cálculo ponderada entre rating e potencial (escala de 0 a 99)
  const score = (rating * 0.4) + (potential * 0.6);
  const minSalary = 500;
  const maxSalary = 4000;
  
  // Mapeia linearmente o score para a faixa de 500 a 4000
  let calculated = minSalary + (score / 99) * (maxSalary - minSalary);
  
  // Arredonda para a centena mais próxima
  return Math.max(minSalary, Math.min(maxSalary, Math.round(calculated / 100) * 100));
}

export function scoutYouthTalents() {
  const MAX_SCOUTS_PER_YEAR = 5;
  const SCOUT_COST = 4500;

  if (gameState.scoutsUsedThisYear >= MAX_SCOUTS_PER_YEAR) {
    return {
      success: false,
      message: `Você já utilizou o olheiro ${MAX_SCOUTS_PER_YEAR} vezes este ano. O limite anual foi atingido!`
    };
  }

  if (gameState.club.cash < SCOUT_COST) {
    return {
      success: false,
      message: `Caixa insuficiente para enviar o olheiro. Custo da missão: R$ ${SCOUT_COST.toLocaleString('pt-BR')}.`
    };
  }

  addTransaction("Taxa de envio de olheiro por talentos", "Base", -SCOUT_COST);
  gameState.scoutsUsedThisYear++;

  const positions = ["GOL", "DEF", "MEI", "ATA"];
  const randomName = getRandomName();
  const randomPos = positions[Math.floor(Math.random() * positions.length)];
  
  const baseBounds = {
    "Série D": 15,
    "Série C": 30,
    "Série B": 45,
    "Série A": 60
  };
  const minRating = baseBounds[gameState.club.division] || 15;
  
  let rating = minRating + Math.floor(Math.random() * 8);
  let potential = Math.min(99, rating + 25 + (gameState.youthInfraLevel * 5));

  if (gameState.staff.coach && gameState.staff.coach.cards && gameState.staff.coach.cards.some(c => c.id === 'rigorous')) {
    rating += 3;
    potential = Math.min(99, potential + 5);
  }

  const salary = calculateYouthSalary(rating, potential);

  const newTalent = {
    id: Date.now(),
    name: randomName,
    pos: randomPos,
    age: 16 + Math.floor(Math.random() * 3),
    rating,
    potential,
    salary,
    marketValue: 20000 + (potential * 1500)
  };

  gameState.youthPlayers.push(newTalent);
  
  return {
    success: true,
    talent: newTalent,
    remaining: MAX_SCOUTS_PER_YEAR - gameState.scoutsUsedThisYear
  };
}

export function promoteYouthToProfessional(youthId) {
  const idx = gameState.youthPlayers.findIndex(y => y.id === youthId);
  if (idx === -1) return false;

  const youth = gameState.youthPlayers[idx];
  gameState.youthPlayers.splice(idx, 1);

  const proPlayer = {
    id: Date.now(),
    name: youth.name,
    pos: youth.pos,
    age: youth.age,
    rating: youth.rating,
    potential: youth.potential,
    salary: youth.salary || calculateYouthSalary(youth.rating, youth.potential),
    marketValue: youth.marketValue,
    condition: 100,
    moral: 85,
    contractMonths: 24
  };

  gameState.squad.push(proPlayer);
  return true;
}
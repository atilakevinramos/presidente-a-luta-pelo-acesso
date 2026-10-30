/**
 * matches.js - Simulação de partidas, lógica de posições reais, declínio por idade e teto do técnico no profissional.
 */

import { gameState } from './state.js';

export function getMonthNameByTurn(turn) {
  const months = [
    "Janeiro", "Janeiro", "Fevereiro", "Fevereiro", "Março", "Março", "Março",
    "Abril", "Abril", "Abril", "Maio", "Maio", "Maio",
    "Junho", "Junho", "Junho", "Julho", "Julho", "Julho", "Julho",
    "Agosto", "Agosto", "Agosto", "Setembro", "Setembro", "Setembro",
    "Outubro", "Outubro", "Outubro", "Novembro", "Novembro", "Novembro", "Novembro",
    "Dezembro", "Dezembro", "Dezembro", "Dezembro", "Dezembro"
  ];
  const index = (turn - 1) % 38;
  return months[index] || "Dezembro";
}

function getDivisionOverallBounds(division) {
  switch (division) {
    case "Série D": return { min: 10, max: 30 };
    case "Série C": return { min: 31, max: 50 };
    case "Série B": return { min: 51, max: 70 };
    case "Série A": return { min: 71, max: 99 };
    default: return { min: 10, max: 30 };
  }
}

export function getPlayerEffectiveRating(player) {
  const baseRating = player.rating !== undefined ? player.rating : (player.potential - 10);
  const coachOverall = gameState.staff.coach ? gameState.staff.coach.coachOverall || 26 : 26;
  const effective = Math.min(baseRating, coachOverall);
  return Math.max(10, effective);
}

export function processPlayerDevelopmentAndAging() {
  gameState.youthPlayers.forEach(yp => {
    yp.rating = Math.min(yp.potential, yp.rating + Math.floor(Math.random() * 2) + 1);
    yp.marketValue += 5000;
  });

  gameState.squad.forEach(p => {
    if (p.rating === undefined) p.rating = Math.max(15, p.potential - 15);

    if (p.age < 30) {
      if (p.rating < p.potential) {
        p.rating = Math.min(p.potential, p.rating + 1);
      }
    } else {
      const yearsOver30 = p.age - 29;
      const dropChance = Math.max(0.2, 0.5 - (yearsOver30 * 0.05));
      if (Math.random() < dropChance) {
        p.rating = Math.max(10, p.rating - 1);
      }
    }
  });
}

export function processRetirements() {
  const retiringPlayers = [];
  gameState.squad = gameState.squad.filter(p => {
    if (p.age >= 36 && p.age <= 42) {
      const retireChance = (p.age - 35) * 0.25;
      if (Math.random() < retireChance) {
        retiringPlayers.push(p.name);
        return false;
      }
    } else if (p.age > 42) {
      retiringPlayers.push(p.name);
      return false;
    }
    return true;
  });

  if (retiringPlayers.length > 0) {
    gameState.historyLog.unshift({
      turn: gameState.turn,
      text: `[Aposentadorias]: Os seguintes atletas penduraram as chuteiras ao fim da temporada: ${retiringPlayers.join(', ')}.`
    });
  }
}

export function applyAutoSubstitutions() {
  if (gameState.squad.length <= 11) return;

  const squad = gameState.squad;

  let gks = squad.filter(p => p.pos === 'GOL');
  let defs = squad.filter(p => p.pos === 'DEF');
  let meis = squad.filter(p => p.pos === 'MEI');
  let atas = squad.filter(p => p.pos === 'ATA');

  const sortByQuality = (a, b) => {
    const mode = gameState.autoSubstituteMode || 'fatigue';
    if (mode === 'fatigue') {
      if (b.condition !== a.condition) return b.condition - a.condition;
      return getPlayerEffectiveRating(b) - getPlayerEffectiveRating(a);
    } else if (mode === 'rating') {
      const ratA = getPlayerEffectiveRating(a);
      const ratB = getPlayerEffectiveRating(b);
      if (ratB !== ratA) return ratB - ratA;
      return b.condition - a.condition;
    } else if (mode === 'youngest') {
      if (a.age !== b.age) return a.age - b.age;
      return getPlayerEffectiveRating(b) - getPlayerEffectiveRating(a);
    } else if (mode === 'oldest') {
      if (b.age !== a.age) return b.age - a.age;
      return getPlayerEffectiveRating(b) - getPlayerEffectiveRating(a);
    }
    return getPlayerEffectiveRating(b) - getPlayerEffectiveRating(a);
  };

  gks.sort(sortByQuality);
  defs.sort(sortByQuality);
  meis.sort(sortByQuality);
  atas.sort(sortByQuality);

  let starters = [];

  if (gks.length > 0) {
    starters.push(gks.shift());
  }

  for (let i = 0; i < 4 && defs.length > 0; i++) {
    starters.push(defs.shift());
  }

  for (let i = 0; i < 4 && meis.length > 0; i++) {
    starters.push(meis.shift());
  }

  for (let i = 0; i < 2 && atas.length > 0; i++) {
    starters.push(atas.shift());
  }

  let bench = squad.filter(p => !starters.includes(p));
  bench.sort(sortByQuality);

  while (starters.length < 11 && bench.length > 0) {
    starters.push(bench.shift());
  }

  bench = squad.filter(p => !starters.includes(p));
  bench.sort(sortByQuality);

  gameState.squad = [...starters, ...bench];
}

function getDivisionClubNames(division) {
  if (division === "Série A") {
    return [
      gameState.club.name, "Flamengo", "Palmeiras", "Atlético MG", "Botafogo",
      "São Paulo", "Fluminense", "Grêmio", "Internacional", "Corinthians",
      "Cruzeiro", "Vasco da Gama", "Bahia", "Athletico PR", "Fortaleza",
      "Cuiabá", "Red Bull Bragantino", "Juventude", "Criciúma", "Atlético GO"
    ];
  } else if (division === "Série B") {
    return [
      gameState.club.name, "Santos", "Sport Recife", "Ceará", "Goiás",
      "Coritiba", "Novorizontino", "Mirassol", "America MG", "Vila Nova",
      "Ponte Preta", "CRB", "Chapecoense", "Guarani", "Botafogo SP",
      "Operário PR", "Brusque", "Ituano", "Paysandu", "Amazonas FC"
    ];
  } else if (division === "Série C") {
    return [
      gameState.club.name, "Náutico", "Volta Redonda", "São Bernardo", "Ypiranga RS",
      "Londrina", "Caxias RS", "Ferroviário CE", "Remo PA", "Botafogo PB",
      "ABC Natal", "Confiança SE", "CSA Alagoas", "Sampaio Corrêa", "Tombense",
      "Aparecidense", "Floresta CE", "São José RS", "Ferroviária SP", "Anápolis GO"
    ];
  } else {
    return [
      gameState.club.name, "Ferroviário CE", "Caxias RS", "Santa Cruz PE", "Remo PA", 
      "Manaus FC", "ABC Natal", "Brasil de Pelotas", "Athletic MG", 
      "Imperatriz MA", "Novorizontino SP", "São Bernardo SP", "Botafogo PB", 
      "Figueirense SC", "Paysandu PA", "America RN", "Ypiranga RS", 
      "Paraná Clube", "Santo André SP", "Juazeirense BA"
    ];
  }
}

export function initStandings() {
  if (gameState.standings && gameState.standings.length === 20) return;
  const clubNames = getDivisionClubNames(gameState.club.division);

  gameState.standings = clubNames.map((name, index) => ({
    name: name,
    isPlayer: index === 0,
    p: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0
  }));
}

export function getTurnMatchDetails(turn) {
  initStandings();
  const opponents = gameState.standings.filter(s => !s.isPlayer);
  const oppIndex = (turn - 1) % opponents.length;
  const opponent = opponents[oppIndex] ? opponents[oppIndex].name : "Adversário FC";
  const isHome = turn % 2 !== 0;
  const monthName = getMonthNameByTurn(turn);
  
  return { isHome, opponent, homeMatchesCount: isHome ? 1 : 0, monthName };
}

export function simulateTurnMatches(turn) {
  initStandings();
  applyAutoSubstitutions();

  const matchInfo = getTurnMatchDetails(turn);
  const playerEntry = gameState.standings.find(s => s.isPlayer);
  const opponentEntry = gameState.standings.find(s => s.name === matchInfo.opponent);

  let playerSquadStrength = 20;
  let missingGoalieWarning = false;

  if (gameState.squad.length > 0) {
    const starters = gameState.squad.slice(0, 11);
    const hasGoalie = starters.some(p => p.pos === 'GOL');

    const effectiveRatings = starters.map(p => {
      const eff = getPlayerEffectiveRating(p);
      return eff * (p.condition / 100);
    });
    const totalRating = effectiveRatings.reduce((acc, r) => acc + r, 0);
    playerSquadStrength = Math.floor(totalRating / starters.length);

    if (!hasGoalie) {
      playerSquadStrength = Math.floor(playerSquadStrength * 0.5);
      missingGoalieWarning = true;
    }
  }

  if (matchInfo.isHome && gameState.staff.coach && gameState.staff.coach.skill === "Casa Forte") {
    playerSquadStrength += 4;
  }
  if (gameState.staff.assistant && gameState.staff.assistant.skill.includes("Tático")) {
    playerSquadStrength += 3;
  }

  const bounds = getDivisionOverallBounds(gameState.club.division);
  const oppStrength = bounds.min + Math.floor(Math.random() * (bounds.max - bounds.min + 1));

  const playerGoals = Math.max(0, Math.floor((playerSquadStrength + (Math.random() * 14 - 7)) / 18));
  const oppGoals = Math.max(0, Math.floor((oppStrength + (Math.random() * 14 - 7)) / 18));

  playerEntry.j++;
  playerEntry.gp += playerGoals;
  playerEntry.gc += oppGoals;
  playerEntry.sg = playerEntry.gp - playerEntry.gc;

  if (opponentEntry) {
    opponentEntry.j++;
    opponentEntry.gp += oppGoals;
    opponentEntry.gc += playerGoals;
    opponentEntry.sg = opponentEntry.gp - opponentEntry.gc;
  }

  let matchResultText = "";
  let outcomeType = "draw";

  if (playerGoals > oppGoals) {
    playerEntry.v++;
    playerEntry.p += 3;
    if (opponentEntry) opponentEntry.d++;
    matchResultText = `Rodada ${turn} (${matchInfo.monthName}): Vitória por ${playerGoals}x${oppGoals} contra o ${matchInfo.opponent} (${matchInfo.isHome ? 'Em Casa' : 'Fora'})!`;
    gameState.fans.trust = Math.min(100, gameState.fans.trust + 2);
    outcomeType = "win";
  } else if (playerGoals === oppGoals) {
    playerEntry.e++;
    playerEntry.p += 1;
    if (opponentEntry) {
      opponentEntry.e++;
      opponentEntry.p += 1;
    }
    matchResultText = `Rodada ${turn} (${matchInfo.monthName}): Empate em ${playerGoals}x${oppGoals} contra o ${matchInfo.opponent} (${matchInfo.isHome ? 'Em Casa' : 'Fora'}).`;
    outcomeType = "draw";
  } else {
    playerEntry.d++;
    if (opponentEntry) {
      opponentEntry.v++;
      opponentEntry.p += 3;
    }
    matchResultText = `Rodada ${turn} (${matchInfo.monthName}): Derrota de ${playerGoals}x${oppGoals} para o ${matchInfo.opponent} (${matchInfo.isHome ? 'Em Casa' : 'Fora'}).`;
    gameState.fans.trust = Math.max(0, gameState.fans.trust - 2);
    outcomeType = "loss";
  }

  if (missingGoalieWarning) {
    matchResultText += ` ⚠️ ATENÇÃO: O time jogou sem um Goleiro titular em campo! Desempenho reduzido em 50%.`;
  }

  let physioRecoveryBonus = 15;
  if (gameState.staff.physio) {
    if (gameState.staff.physio.skill === "Fortaleza") physioRecoveryBonus = 25;
    else if (gameState.staff.physio.skill === "Recuperação") physioRecoveryBonus = 20;
  }

  gameState.squad.forEach((p, idx) => {
    if (idx < 11) {
      p.condition = Math.max(20, p.condition - 18 + (physioRecoveryBonus - 10));
    } else {
      p.condition = Math.min(100, p.condition + physioRecoveryBonus + 15);
    }
  });

  const otherClubs = gameState.standings.filter(s => !s.isPlayer && s.name !== matchInfo.opponent);
  const shuffled = [...otherClubs].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      const c1 = shuffled[i];
      const c2 = shuffled[i + 1];
      const g1 = Math.max(0, Math.floor((bounds.min + 3 + (Math.random() * 12 - 6)) / 18));
      const g2 = Math.max(0, Math.floor((bounds.min + 3 + (Math.random() * 12 - 6)) / 18));

      c1.j++; c1.gp += g1; c1.gc += g2; c1.sg = c1.gp - c1.gc;
      c2.j++; c2.gp += g2; c2.gc += g1; c2.sg = c2.gp - c2.gc;

      if (g1 > g2) { c1.v++; c1.p += 3; c2.d++; }
      else if (g1 === g2) { c1.e++; c1.p += 1; c2.e++; c2.p += 1; }
      else { c1.d++; c2.v++; c2.p += 3; }
    }
  }

  gameState.standings.sort((a, b) => {
    if (b.p !== a.p) return b.p - a.p;
    if (b.sg !== a.sg) return b.sg - a.sg;
    return b.gp - a.gp;
  });

  return { matchInfo, playerGoals, oppGoals, matchResultText, outcomeType };
}
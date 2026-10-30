/**
 * ui.js - Renderização da interface, incluindo renovação de contratos, salários na base e comissão técnica.
 */

import { gameState } from './state.js';
import { upgradeYouthInfrastructure, scoutYouthTalents, promoteYouthToProfessional, getYouthUpgradeCost, getYouthNewMaintCost } from './academy.js';
import { hireStaffMember, coachRequestSignings } from './staff.js';
import { getTurnMatchDetails, getPlayerEffectiveRating, applyAutoSubstitutions, getMonthNameByTurn } from './matches.js';
import { addTransaction, applyHydroSpaRecovery } from './finances.js';

let pendingGameOverReason = null;
let pendingSeasonResult = null;

export function initUI(callbacks) {
  setupTabs();
  setupCustomizationListeners(callbacks.onStartCareer);
  setupModalListeners(callbacks.onAdvanceTurn, callbacks.onRestart);
  setupYouthListeners();
  setupTicketSlider();
  setupMatchModalListener(callbacks.onGameOverModal);
  setupCelebrationListener();
}

function applyDynamicTheme() {
  const color = gameState.club.primaryColor || '#00ff66';

  let styleTag = document.getElementById('dynamic-theme-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-theme-style';
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    .text-neon { color: ${color} !important; }
    .bg-neon { background-color: ${color} !important; }
    .border-neon { border-color: ${color} !important; }
  `;
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      buttons.forEach(b => {
        b.classList.remove('bg-neon', 'text-darkBg');
        b.classList.add('text-gray-300', 'hover:text-white', 'hover:bg-borderCol');
      });
      btn.classList.add('bg-neon', 'text-darkBg');
      btn.classList.remove('text-gray-300', 'hover:text-white', 'hover:bg-borderCol');

      contents.forEach(c => c.classList.add('hidden'));
      const activeSec = document.getElementById(`tab-${targetTab}`);
      if (activeSec) activeSec.classList.remove('hidden');
    });
  });
}

function setupCustomizationListeners(startCareerCallback) {
  const nameInput = document.getElementById('setup-club-name');
  const siglaInput = document.getElementById('setup-club-sigla');
  const colorPrimary = document.getElementById('setup-color-primary');
  const colorSecondary = document.getElementById('setup-color-secondary');
  const previewBadge = document.getElementById('preview-badge');
  const previewName = document.getElementById('preview-name');
  const hexPrimary = document.getElementById('hex-primary');
  const hexSecondary = document.getElementById('hex-secondary');

  function updatePreview() {
    if (!nameInput || !siglaInput) return;
    const name = nameInput.value || "Meu Clube";
    const sigla = (siglaInput.value || "CLU").toUpperCase();
    const primary = colorPrimary ? colorPrimary.value : '#00ff66';
    const secondary = colorSecondary ? colorSecondary.value : '#131c2e';

    if (previewName) previewName.textContent = name;
    if (previewBadge) {
      previewBadge.textContent = sigla;
      previewBadge.style.backgroundColor = secondary;
      previewBadge.style.borderColor = primary;
      previewBadge.style.color = primary;
    }
    if (hexPrimary) hexPrimary.textContent = primary;
    if (hexSecondary) hexSecondary.textContent = secondary;
  }

  if (nameInput) nameInput.addEventListener('input', updatePreview);
  if (siglaInput) siglaInput.addEventListener('input', updatePreview);
  if (colorPrimary) colorPrimary.addEventListener('input', updatePreview);
  if (colorSecondary) colorSecondary.addEventListener('input', updatePreview);

  const startBtn = document.getElementById('btn-start-career');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const customConfig = {
        name: nameInput.value || "Grêmio Esportivo Brasil",
        sigla: (siglaInput.value || "GEB").toUpperCase(),
        primaryColor: colorPrimary ? colorPrimary.value : "#00ff66",
        secondaryColor: colorSecondary ? colorSecondary.value : "#131c2e"
      };
      startCareerCallback(customConfig);
    });
  }
}

function setupModalListeners(advanceCallback, restartCallback) {
  const advanceBtnDashboard = document.getElementById('btn-advance-turn');
  const advanceBtnHeader = document.getElementById('btn-advance-turn-header');
  
  if (advanceBtnDashboard) advanceBtnDashboard.addEventListener('click', advanceCallback);
  if (advanceBtnHeader) advanceBtnHeader.addEventListener('click', advanceCallback);

  const restartBtn = document.getElementById('btn-restart-game');
  if (restartBtn) restartBtn.addEventListener('click', restartCallback);
}

function setupMatchModalListener() {
  const closeBtn = document.getElementById('btn-close-match-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const modal = document.getElementById('match-result-modal');
      if (modal) modal.classList.add('hidden');

      if (pendingSeasonResult && pendingSeasonResult.isPromotion) {
        showCelebrationModal(pendingSeasonResult);
        pendingSeasonResult = null;
        return;
      }

      if (pendingGameOverReason) {
        showGameOverScreen(pendingGameOverReason);
        pendingGameOverReason = null;
      }
    });
  }
}

function setupCelebrationListener() {
  const closeBtn = document.getElementById('btn-close-celebration');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const modal = document.getElementById('celebration-modal');
      if (modal) modal.classList.add('hidden');

      if (pendingGameOverReason) {
        showGameOverScreen(pendingGameOverReason);
        pendingGameOverReason = null;
      }
    });
  }
}

export function showCelebrationModal(seasonResult) {
  const modal = document.getElementById('celebration-modal');
  const titleEl = document.getElementById('celebration-title');
  const descEl = document.getElementById('celebration-desc');
  const posEl = document.getElementById('celeb-pos');
  const divEl = document.getElementById('celeb-div');

  if (titleEl) titleEl.textContent = seasonResult.title;
  if (descEl) descEl.textContent = seasonResult.message;
  if (posEl) posEl.textContent = `${seasonResult.position}º Lugar`;
  if (divEl) divEl.textContent = gameState.club.division;

  if (modal) modal.classList.remove('hidden');
}

export function setPendingSeasonResult(result) {
  pendingSeasonResult = result;
}

function setupYouthListeners() {
  const upgradeBtn = document.getElementById('btn-upgrade-academy');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      const cost = getYouthUpgradeCost();
      const currMaint = gameState.academyMaintCost;
      const newMaint = getYouthNewMaintCost();

      const title = document.getElementById('youth-modal-title');
      const desc = document.getElementById('youth-modal-desc');
      const costEl = document.getElementById('youth-modal-cost');
      const currMaintEl = document.getElementById('youth-modal-curr-maint');
      const newMaintEl = document.getElementById('youth-modal-new-maint');

      if (title) title.textContent = `Melhorar Base para Nível ${gameState.youthInfraLevel + 1}`;
      if (desc) desc.textContent = `Investir na infraestrutura da base atrai jovens talentos mais qualificados.`;
      if (costEl) costEl.textContent = `R$ ${cost.toLocaleString('pt-BR')}`;
      if (currMaintEl) currMaintEl.textContent = `R$ ${currMaint.toLocaleString('pt-BR')} / mês`;
      if (newMaintEl) newMaintEl.textContent = `R$ ${newMaint.toLocaleString('pt-BR')} / mês`;

      const modal = document.getElementById('youth-modal');
      if (modal) modal.classList.remove('hidden');
    });
  }

  const cancelYouthBtn = document.getElementById('btn-cancel-youth');
  if (cancelYouthBtn) {
    cancelYouthBtn.addEventListener('click', () => {
      const modal = document.getElementById('youth-modal');
      if (modal) modal.classList.add('hidden');
    });
  }

  const confirmYouthBtn = document.getElementById('btn-confirm-youth');
  if (confirmYouthBtn) {
    confirmYouthBtn.addEventListener('click', () => {
      const res = upgradeYouthInfrastructure();
      const modal = document.getElementById('youth-modal');
      if (modal) modal.classList.add('hidden');
      alert(res.message);
      renderAll();
    });
  }

  const scoutBtn = document.getElementById('btn-scout-youth');
  if (scoutBtn) {
    scoutBtn.addEventListener('click', () => {
      const result = scoutYouthTalents();
      if (!result.success) {
        alert(result.message);
      } else {
        alert(`Olheiro bem-sucedido! Encontrou: ${result.talent.name} (${result.talent.pos}), ${result.talent.age} anos!\nRestam: ${result.remaining}/5`);
        renderAll();
      }
    });
  }
}

function setupTicketSlider() {
  const slider = document.getElementById('ticket-price-slider');
  const valDisplay = document.getElementById('ticket-price-val');
  const estAttendance = document.getElementById('est-attendance');

  if (slider) {
    slider.value = gameState.club.ticketPrice;
    if (valDisplay) valDisplay.textContent = `R$ ${gameState.club.ticketPrice},00`;

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      gameState.club.ticketPrice = val;
      if (valDisplay) valDisplay.textContent = `R$ ${val},00`;

      const priceFactor = Math.max(0.3, 1 - (val - 30) / 150);
      const trustFactor = gameState.fans.trust / 100;
      const est = Math.min(15000, Math.max(500, Math.floor(10000 * priceFactor * trustFactor)));
      if (estAttendance) estAttendance.textContent = `${est.toLocaleString('pt-BR')} torcedores`;
    });
  }
}

export function renderAll() {
  applyDynamicTheme();
  renderHeader();
  renderDashboard();
  renderSquad();
  renderStaff();
  renderAcademy();
  renderStandings();
  renderFinances();
  renderFansAndElections();
  renderHistory();
}

function renderHeader() {
  const badge = document.getElementById('header-badge');
  if (badge) {
    badge.textContent = gameState.club.sigla;
    badge.style.backgroundColor = gameState.club.secondaryColor;
    badge.style.borderColor = gameState.club.primaryColor;
    badge.style.color = gameState.club.primaryColor;
  }

  const nameEl = document.getElementById('header-club-name');
  if (nameEl) nameEl.textContent = gameState.club.name;

  const divEl = document.getElementById('header-division');
  if (divEl) divEl.textContent = gameState.club.division;

  const currentMonthName = getMonthNameByTurn(gameState.turn);
  const dateEl = document.getElementById('header-date');
  if (dateEl) dateEl.textContent = `${currentMonthName} (Rodada ${gameState.turn}) - Ano ${gameState.year}`;

  const cashEl = document.getElementById('header-cash');
  if (cashEl) cashEl.textContent = `R$ ${gameState.club.cash.toLocaleString('pt-BR')}`;

  const fansEl = document.getElementById('header-fans');
  if (fansEl) fansEl.textContent = `${gameState.fans.trust}%`;

  const boardEl = document.getElementById('header-board');
  if (boardEl) boardEl.textContent = `${gameState.board.support}%`;

  const riskHeader = document.getElementById('header-bankruptcy-risk');
  if (riskHeader) riskHeader.textContent = `${gameState.bankruptcy.consecutiveNegativeMonths} / 5`;
}

function renderDashboard() {
  const matchInfo = getTurnMatchDetails(gameState.turn);
  const homeEl = document.getElementById('team-home-name');
  const awayEl = document.getElementById('team-away-name');
  const venueEl = document.getElementById('match-venue-info');
  const monthEl = document.getElementById('next-match-month');

  if (homeEl) homeEl.textContent = matchInfo.isHome ? gameState.club.name : matchInfo.opponent;
  if (awayEl) awayEl.textContent = matchInfo.isHome ? matchInfo.opponent : gameState.club.name;
  if (venueEl) venueEl.textContent = matchInfo.isHome ? "🏟️ Jogo em Casa (Estádio Municipal)" : "✈️ Jogo Fora de Casa (Adversário)";
  if (monthEl) monthEl.textContent = `${matchInfo.monthName} (R.${gameState.turn})`;

  const trustStat = document.getElementById('stat-fan-trust');
  const trustBar = document.getElementById('bar-fan-trust');
  if (trustStat) trustStat.textContent = `${gameState.fans.trust}%`;
  if (trustBar) trustBar.style.width = `${gameState.fans.trust}%`;

  const boardStat = document.getElementById('stat-board-support');
  const boardBar = document.getElementById('bar-board-support');
  if (boardStat) boardStat.textContent = `${gameState.board.support}%`;
  if (boardBar) boardBar.style.width = `${gameState.board.support}%`;

  const nextElec = document.getElementById('info-next-election');
  if (nextElec) nextElec.textContent = `Rodada ${gameState.board.nextElectionTurn}`;

  const riskEl = document.getElementById('info-bankruptcy-status');
  if (riskEl) {
    if (gameState.bankruptcy.consecutiveNegativeMonths > 0) {
      riskEl.textContent = `Alerta (${gameState.bankruptcy.consecutiveNegativeMonths}/5 meses)`;
      riskEl.className = "font-bold text-red-400";
    } else {
      riskEl.textContent = "Seguro (0/5)";
      riskEl.className = "font-bold text-emerald-400";
    }
  }

  const staffContainer = document.getElementById('dashboard-staff-summary');
  if (staffContainer) {
    const coach = gameState.staff.coach;
    staffContainer.innerHTML = `
      <div class="flex justify-between"><span class="text-gray-400">Treinador:</span> <span class="font-bold text-white">${coach.name} (GER: <strong class="text-neon">${coach.coachOverall || 26}</strong>)</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Auxiliar:</span> <span class="font-bold text-white">${gameState.staff.assistant.name}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Olheiro:</span> <span class="font-bold text-white">${gameState.staff.scout.name}</span></div>
    `;
  }

  const logContainer = document.getElementById('dashboard-log-container');
  if (logContainer) {
    logContainer.innerHTML = gameState.historyLog.slice(0, 5).map(item => `
      <div class="p-3 bg-black/30 border border-borderCol rounded-lg text-xs text-gray-300">
        <span class="text-neon font-bold">[Rodada ${item.turn}]:</span> ${item.text}
      </div>
    `).join('');
  }
}

function renderSquad() {
  const squadTab = document.getElementById('tab-squad');
  if (!squadTab) return;

  const currentMode = gameState.autoSubstituteMode || 'fatigue';
  const autoRenew = gameState.autoRenewEnabled || false;
  const autoRenewMax = gameState.autoRenewMaxSalary || 10000;
  
  const headerCard = squadTab.querySelector('div.bg-cardBg');
  if (headerCard) {
    headerCard.innerHTML = `
      <div class="space-y-3 w-full">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="text-lg font-extrabold text-white">Elenco Profissional</h3>
            <p class="text-xs text-gray-400">Gerencie atletas, contratos, salários e o critério de escalação e recuperação física.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button id="btn-hydro-spa" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1">
              <span>🛁 Sauna / Hidromassagem (R$ 21k)</span>
            </button>
            <div class="bg-black/30 border border-borderCol px-3 py-2 rounded-lg text-xs">
              <span class="text-gray-400 block text-[10px]">Folha Salarial Mensal</span>
              <span id="squad-total-salary" class="font-bold text-red-400">R$ 0</span>
            </div>
            <div class="bg-black/30 border border-borderCol px-3 py-2 rounded-lg text-xs">
              <span class="text-gray-400 block text-[10px]">Tamanho do Elenco</span>
              <span id="squad-total-count" class="font-bold text-neon">0 Jogadores</span>
            </div>
          </div>
        </div>

        <!-- BARRA DE CONFIGURAÇÕES DE TÁTICA E RENOVAÇÃO AUTOMÁTICA -->
        <div class="bg-black/40 border border-borderCol p-3 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
          <div class="flex items-center space-x-2">
            <span class="text-gray-400 font-semibold">Tática de Rodízio:</span>
            <select id="select-auto-sub" class="bg-darkBg text-neon font-bold border border-borderCol rounded px-2 py-1 outline-none cursor-pointer text-xs">
              <option value="fatigue" ${currentMode === 'fatigue' ? 'selected' : ''}>⚡ Priorizar Cansaço (Físico)</option>
              <option value="rating" ${currentMode === 'rating' ? 'selected' : ''}>⭐ Priorizar Habilidade (Overall)</option>
              <option value="youngest" ${currentMode === 'youngest' ? 'selected' : ''}>🌱 Priorizar Mais Jovens</option>
              <option value="oldest" ${currentMode === 'oldest' ? 'selected' : ''}>👔 Priorizar Experientes (Veteranos)</option>
              <option value="none" ${currentMode === 'none' ? 'selected' : ''}>🔒 Manual (Sem Rotação)</option>
            </select>
          </div>

          <div class="flex items-center space-x-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" id="chk-auto-renew" ${autoRenew ? 'checked' : ''} class="w-4 h-4 accent-neon rounded cursor-pointer" />
              <span class="font-bold text-gray-200">Renovação Automática (1 mês restando)</span>
            </label>
            <div class="flex items-center space-x-1">
              <span class="text-gray-400">Teto Salarial (R$):</span>
              <input type="number" id="input-auto-renew-max" value="${autoRenewMax}" step="1000" min="1000" class="w-24 bg-darkBg text-neon font-bold border border-borderCol rounded px-2 py-1 outline-none text-xs" />
            </div>
          </div>
        </div>
      </div>
    `;

    const selectEl = document.getElementById('select-auto-sub');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        gameState.autoSubstituteMode = e.target.value;
        applyAutoSubstitutions();
        renderSquad();
      });
    }

    const chkAutoRenew = document.getElementById('chk-auto-renew');
    if (chkAutoRenew) {
      chkAutoRenew.addEventListener('change', (e) => {
        gameState.autoRenewEnabled = e.target.checked;
      });
    }

    const inputAutoRenewMax = document.getElementById('input-auto-renew-max');
    if (inputAutoRenewMax) {
      inputAutoRenewMax.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 0) {
          gameState.autoRenewMaxSalary = val;
        }
      });
    }

    const spaBtn = document.getElementById('btn-hydro-spa');
    if (spaBtn) {
      spaBtn.addEventListener('click', () => {
        const result = applyHydroSpaRecovery();
        alert(result.message);
        if (result.success) {
          renderAll();
        }
      });
    }
  }

  const squadTableCard = document.querySelector('#tab-squad table');
  if (squadTableCard) {
    const thead = squadTableCard.querySelector('thead tr');
    if (thead && !thead.innerHTML.includes('Contrato')) {
      thead.innerHTML = `
        <th class="pb-3 font-semibold">Nome</th>
        <th class="pb-3 font-semibold">Pos.</th>
        <th class="pb-3 font-semibold">Idade</th>
        <th class="pb-3 font-semibold">Habilidade (GER)</th>
        <th class="pb-3 font-semibold">Potencial</th>
        <th class="pb-3 font-semibold">Salário / Mês</th>
        <th class="pb-3 font-semibold">Contrato Restante</th>
        <th class="pb-3 font-semibold">Valor de Mercado</th>
        <th class="pb-3 font-semibold">Condição / Moral</th>
        <th class="pb-3 font-semibold text-right">Ações</th>
      `;
    }
  }

  const tbody = document.getElementById('squad-table-body');
  if (tbody) {
    const coachOverall = gameState.staff.coach ? gameState.staff.coach.coachOverall || 26 : 26;

    tbody.innerHTML = gameState.squad.map((p, idx) => {
      const isStarter = idx < 11;
      const effectiveRating = getPlayerEffectiveRating(p);
      const isCapped = p.potential > coachOverall;
      const condColor = p.condition < 50 ? 'text-red-400 font-bold' : (p.condition < 80 ? 'text-yellow-400 font-bold' : 'text-emerald-400 font-bold');
      
      const contractMonths = p.contractMonths !== undefined ? p.contractMonths : 12;
      const contractColor = contractMonths <= 6 ? 'text-red-400 font-bold' : 'text-gray-300';

      return `
        <tr class="hover:bg-black/20 transition ${isStarter ? 'border-l-2 border-neon' : ''}">
          <td class="py-3 font-semibold text-white">
            ${p.name} <span class="text-[10px] ${isStarter ? 'text-neon font-bold' : 'text-gray-400'}">(${isStarter ? 'Titular' : 'Reserva'})</span>
          </td>
          <td class="py-3 text-neon">${p.pos}</td>
          <td class="py-3 text-gray-300">${p.age}</td>
          <td class="py-3 font-bold text-emerald-400">
            ${effectiveRating} 
            <span class="text-[10px] text-gray-400 font-normal">(${p.potential})</span>
            ${isCapped ? '<span class="text-[9px] text-yellow-400 ml-1" title="Limitado pelo Treinador!">⚠️</span>' : ''}
          </td>
          <td class="py-3 text-blue-400">${p.potential}</td>
          <td class="py-3 text-red-300">R$ ${p.salary.toLocaleString('pt-BR')}</td>
          <td class="py-3 ${contractColor}">${contractMonths} meses</td>
          <td class="py-3 text-gray-300">R$ ${p.marketValue.toLocaleString('pt-BR')}</td>
          <td class="py-3 ${condColor}">${p.condition}% <span class="text-gray-400 font-normal">/ ${p.moral}%</span></td>
          <td class="py-3 text-right space-x-1">
            <button class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded text-[11px] font-bold transition" onclick="window.renewPlayerContract(${p.id})" title="Aumenta 2 anos de contrato e +20% no salário">Renovar</button>
            <button class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded text-[11px] font-bold transition" onclick="window.sellPlayer(${p.id})">Vender</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  let totalSalaries = gameState.squad.reduce((acc, p) => acc + p.salary, 0);
  Object.values(gameState.staff).forEach(s => totalSalaries += s.salary);

  const totalSalaryEl = document.getElementById('squad-total-salary');
  if (totalSalaryEl) totalSalaryEl.textContent = `R$ ${totalSalaries.toLocaleString('pt-BR')}`;

  const totalCountEl = document.getElementById('squad-total-count');
  if (totalCountEl) totalCountEl.textContent = `${gameState.squad.length} Jogadores`;
}

function renderStaff() {
  const container = document.getElementById('staff-cards-container');
  if (!container) return;

  const roles = [
    { key: 'coach', title: 'Treinador Principal' },
    { key: 'assistant', title: 'Auxiliar Técnico' },
    { key: 'scout', title: 'Olheiro' },
    { key: 'youthCoach', title: 'Treinador da Base' },
    { key: 'physio', title: 'Preparador Físico' }
  ];

  const coachRemaining = 5 - gameState.coachSigningsUsedThisYear;

  container.innerHTML = roles.map(r => {
    const current = gameState.staff[r.key];
    const candidates = gameState.candidates[r.key] || [];
    const isCoach = r.key === 'coach';

    let currentCardsHtml = '';
    if (current && current.cards) {
      currentCardsHtml = `
        <div class="mt-2 space-y-1">
          <span class="text-[10px] font-bold uppercase text-gray-400 block">${isCoach ? 'Cards Ativos (2 Positivos / 1 Negativo):' : 'Cards de Apoio Ativos (-50% impacto):'}</span>
          <div class="grid grid-cols-1 gap-1">
            ${current.cards.map(c => `
              <div class="p-1.5 rounded text-[10px] border ${c.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}">
                <strong>${c.name}:</strong> ${c.desc}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-cardBg border border-borderCol rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4">
        <div>
          <span class="text-[10px] uppercase font-bold text-neon tracking-wider block">${r.title}</span>
          <h4 class="text-base font-extrabold text-white mt-1">${current.name}</h4>
          <p class="text-xs text-gray-400 mt-0.5">
            ${isCoach ? `Overall (GER): <strong class="text-neon">${current.coachOverall}</strong>` : `Especialidade: <span class="text-emerald-400 font-bold">${current.skill}</span>`}
          </p>
          ${currentCardsHtml}
          <div class="mt-3 text-xs flex justify-between">
            <span class="text-gray-400">Salário: <strong class="text-red-400">R$ ${current.salary.toLocaleString('pt-BR')}/mês</strong></span>
            ${current.hireCost > 0 ? `<span class="text-gray-400">Rescisão/Taxa: <strong class="text-yellow-400">R$ ${current.hireCost.toLocaleString('pt-BR')}</strong></span>` : ''}
          </div>

          ${isCoach ? `
            <div class="mt-4 pt-3 border-t border-borderCol">
              <button onclick="window.requestCoachReforcos()" class="w-full bg-neon text-darkBg font-extrabold py-2 rounded text-xs transition hover:opacity-90 shadow">
                🎯 Solicitar Reforços ao Técnico (${coachRemaining}/5 no ano)
              </button>
            </div>
          ` : ''}
        </div>

        <div class="border-t border-borderCol pt-3 space-y-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">Candidatos Disponíveis</span>
          ${candidates.map((cand, idx) => `
            <div class="bg-black/40 border border-borderCol p-3 rounded-lg space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-bold text-white block">${cand.name} ${cand.coachOverall ? `(GER: <strong class="text-neon">${cand.coachOverall}</strong>)` : ''}</span>
                  <span class="text-[10px] text-emerald-400">R$ ${cand.salary.toLocaleString('pt-BR')}/mês</span>
                </div>
                <button class="bg-neon hover:bg-emerald-400 text-darkBg font-bold px-2.5 py-1 rounded text-[11px] transition" onclick="window.hireStaff('${r.key}', ${idx})">
                  Contratar
                </button>
              </div>
              <div class="text-[10px] text-gray-400 bg-black/30 p-1.5 rounded border border-borderCol italic text-center">
                🔒 Cards Ocultos (Serão revelados após a contratação)
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderAcademy() {
  const levelEl = document.getElementById('academy-infra-level');
  if (levelEl) levelEl.textContent = `Nível ${gameState.youthInfraLevel}`;

  const maintEl = document.getElementById('academy-infra-maint');
  if (maintEl) maintEl.textContent = `R$ ${gameState.academyMaintCost.toLocaleString('pt-BR')}`;

  const scoutBtn = document.getElementById('btn-scout-youth');
  if (scoutBtn) {
    const remaining = 5 - gameState.scoutsUsedThisYear;
    scoutBtn.textContent = `🔍 Enviar Olheiro (R$ 4.5k) [Restam: ${remaining}/5]`;
  }

  const academyTableCard = document.querySelector('#tab-academy table');
  if (academyTableCard) {
    const thead = academyTableCard.querySelector('thead tr');
    if (thead && !thead.innerHTML.includes('Salário')) {
      thead.innerHTML = `
        <th class="pb-3 font-semibold">Nome</th>
        <th class="pb-3 font-semibold">Pos.</th>
        <th class="pb-3 font-semibold">Idade</th>
        <th class="pb-3 font-semibold">GER / Pot.</th>
        <th class="pb-3 font-semibold">Salário / Mês</th>
        <th class="pb-3 font-semibold">Valor Estimado</th>
        <th class="pb-3 font-semibold text-right">Ações</th>
      `;
    }
  }

  const tbody = document.getElementById('youth-table-body');
  if (tbody) {
    tbody.innerHTML = gameState.youthPlayers.map(y => {
      const salaryVal = y.salary || 500;
      return `
        <tr class="hover:bg-black/20 transition">
          <td class="py-3 font-semibold text-white">${y.name}</td>
          <td class="py-3 text-neon">${y.pos}</td>
          <td class="py-3 text-gray-300">${y.age}</td>
          <td class="py-3 font-bold text-emerald-400">${y.rating} / <span class="text-blue-400">${y.potential}</span></td>
          <td class="py-3 text-red-300">R$ ${salaryVal.toLocaleString('pt-BR')}</td>
          <td class="py-3 text-gray-300">R$ ${y.marketValue.toLocaleString('pt-BR')}</td>
          <td class="py-3 text-right space-x-2">
            <button class="bg-neon hover:bg-emerald-400 text-darkBg px-2.5 py-1 rounded text-[11px] font-bold transition" onclick="window.promoteYouth(${y.id})">Promover</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function renderStandings() {
  const tbody = document.getElementById('standings-table-body');
  if (tbody) {
    tbody.innerHTML = gameState.standings.map((s, idx) => {
      const isG4 = idx < 4;
      const rowHighlight = isG4 ? 'bg-emerald-500/10 border-l-4 border-emerald-400 font-semibold' : '';
      const playerHighlight = s.isPlayer ? 'bg-neon/10 font-bold text-neon' : 'text-gray-300';

      return `
        <tr class="hover:bg-black/20 transition ${rowHighlight} ${playerHighlight}">
          <td class="py-3">
            ${isG4 ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold mr-1">G4</span>` : ''}
            ${idx + 1}º
          </td>
          <td class="py-3">${s.name} ${s.isPlayer ? '⭐' : ''}</td>
          <td class="py-3 text-center">${s.j}</td>
          <td class="py-3 text-center">${s.v}</td>
          <td class="py-3 text-center">${s.e}</td>
          <td class="py-3 text-center">${s.d}</td>
          <td class="py-3 text-center">${s.gp}</td>
          <td class="py-3 text-center">${s.gc}</td>
          <td class="py-3 text-center">${s.sg}</td>
          <td class="py-3 text-right font-black">${s.p}</td>
        </tr>
      `;
    }).join('');
  }
}

function renderFinances() {
  const cashDisp = document.getElementById('finance-cash-display');
  if (cashDisp) cashDisp.textContent = `R$ ${gameState.club.cash.toLocaleString('pt-BR')}`;

  const lastRes = document.getElementById('finance-last-result');
  if (lastRes) lastRes.textContent = `R$ ${gameState.lastMonthlyResult.toLocaleString('pt-BR')}`;

  const debtDisp = document.getElementById('finance-debt-display');
  if (debtDisp) debtDisp.textContent = `R$ ${gameState.club.debt.toLocaleString('pt-BR')}`;

  const tbody = document.getElementById('ledger-table-body');
  if (tbody) {
    tbody.innerHTML = gameState.ledger.map(item => `
      <tr class="hover:bg-black/20 transition">
        <td class="py-2.5 text-gray-400">Rodada ${item.turn}</td>
        <td class="py-2.5 text-white font-medium">${item.description}</td>
        <td class="py-2.5 text-neon">${item.category}</td>
        <td class="py-2.5 text-right font-bold ${item.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}">
          ${item.amount >= 0 ? '+' : ''} R$ ${item.amount.toLocaleString('pt-BR')}
        </td>
      </tr>
    `).join('');
  }
}

function renderFansAndElections() {
  const trustDet = document.getElementById('fans-trust-detail');
  const trustBar = document.getElementById('fans-trust-bar');
  if (trustDet) trustDet.textContent = `${gameState.fans.trust}%`;
  if (trustBar) trustBar.style.width = `${gameState.fans.trust}%`;

  const boardDet = document.getElementById('board-support-detail');
  const boardBar = document.getElementById('board-support-bar');
  if (boardDet) boardDet.textContent = `${gameState.board.support}%`;
  if (boardBar) boardBar.style.width = `${gameState.board.support}%`;

  const elecCount = document.getElementById('election-countdown');
  if (elecCount) elecCount.textContent = `${gameState.board.nextElectionTurn} rodadas restantes`;
}

function renderHistory() {
  const container = document.getElementById('full-history-container');
  if (container) {
    container.innerHTML = gameState.historyLog.map(item => `
      <div class="p-3 bg-black/30 border border-borderCol rounded-lg text-xs text-gray-300">
        <span class="text-neon font-bold">[Rodada ${item.turn}]:</span> ${item.text}
      </div>
    `).join('');
  }
}

export function showMatchResultModal(matchDetails) {
  const modal = document.getElementById('match-result-modal');
  const title = document.getElementById('modal-match-title');
  const desc = document.getElementById('modal-match-desc');
  const homeTeam = document.getElementById('modal-home-team');
  const awayTeam = document.getElementById('modal-away-team');
  const homeGoals = document.getElementById('modal-home-goals');
  const awayGoals = document.getElementById('modal-away-goals');
  const badgeResult = document.getElementById('modal-match-badge-result');

  const isHome = matchDetails.matchInfo.isHome;
  const opponent = matchDetails.matchInfo.opponent;

  if (homeTeam) homeTeam.textContent = isHome ? gameState.club.name : opponent;
  if (awayTeam) awayTeam.textContent = isHome ? opponent : gameState.club.name;
  if (homeGoals) homeGoals.textContent = isHome ? matchDetails.playerGoals : matchDetails.oppGoals;
  if (awayGoals) awayGoals.textContent = isHome ? matchDetails.oppGoals : matchDetails.playerGoals;

  if (matchDetails.outcomeType === "win") {
    if (title) title.textContent = "Vitória Importantíssima!";
    if (badgeResult) { badgeResult.textContent = "Vitória"; badgeResult.className = "text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"; }
  } else if (matchDetails.outcomeType === "draw") {
    if (title) title.textContent = "Empate Conquistado";
    if (badgeResult) { badgeResult.textContent = "Empate"; badgeResult.className = "text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"; }
  } else {
    if (title) title.textContent = "Derrota Dura";
    if (badgeResult) { badgeResult.textContent = "Derrota"; badgeResult.className = "text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block bg-red-500/20 text-red-400 border border-red-500/30"; }
  }

  if (desc) desc.textContent = matchDetails.matchResultText;
  
  if (modal) modal.classList.remove('hidden');
}

export function showGameOverScreen(reason) {
  const goReason = document.getElementById('go-reason');
  if (goReason) goReason.textContent = reason;

  const statTime = document.getElementById('go-stat-time');
  if (statTime) statTime.textContent = `Ano ${gameState.year} (R.${gameState.turn})`;

  const statDiv = document.getElementById('go-stat-div');
  if (statDiv) statDiv.textContent = gameState.club.division;

  const statCash = document.getElementById('go-stat-cash');
  if (statCash) statCash.textContent = `R$ ${gameState.club.cash.toLocaleString('pt-BR')}`;

  const statFans = document.getElementById('go-stat-fans');
  if (statFans) statFans.textContent = `${gameState.fans.trust}%`;

  const screen = document.getElementById('gameover-screen');
  if (screen) screen.classList.remove('hidden');
}

export function setPendingGameOver(reason) {
  pendingGameOverReason = reason;
}

window.sellPlayer = function(id) {
  const idx = gameState.squad.findIndex(p => p.id === id);
  if (idx === -1) return;
  const player = gameState.squad[idx];
  if (gameState.squad.length <= 11) {
    alert("Nao e possivel vender este jogador. O elenco precisa manter pelo menos 11 atletas.");
    return;
  }
  gameState.squad.splice(idx, 1);
  addTransaction(`Venda de jogador (${player.name})`, "Transferências", player.marketValue);
  renderAll();
  alert(`Jogador ${player.name} vendido com sucesso por R$ ${player.marketValue.toLocaleString('pt-BR')}!`);
};

window.renewPlayerContract = function(id) {
  const player = gameState.squad.find(p => p.id === id);
  if (!player) return;

  const oldSalary = player.salary;
  player.salary = Math.round(player.salary * 1.20);
  player.contractMonths = (player.contractMonths || 0) + 24;

  addTransaction(`Renovação de Contrato (${player.name})`, "Despesas", 0);
  gameState.historyLog.unshift({
    turn: gameState.turn,
    text: `[Renovação]: O contrato de ${player.name} foi renovado por mais 2 anos. Novo salário: R$ ${player.salary.toLocaleString('pt-BR')}.`
  });

  renderAll();
  alert(`Contrato de ${player.name} renovado com sucesso por mais 2 anos!\nNovo salário mensal: R$ ${player.salary.toLocaleString('pt-BR')} (+20%).`);
};

window.hireStaff = function(roleKey, candIndex) {
  const success = hireStaffMember(roleKey, candIndex);
  if (success) {
    renderAll();
    alert("Profissional contratado com sucesso!");
  }
};

window.promoteYouth = function(id) {
  const success = promoteYouthToProfessional(id);
  if (success) {
    renderAll();
    alert("Jovem promovido ao elenco profissional com sucesso!");
  }
};

window.requestCoachReforcos = function() {
  const res = coachRequestSignings();
  alert(res.message);
  if (res.success) {
    renderAll();
  }
};
// js/Historico.js - VERSÃO CORRIGIDA
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await inicializarHistorico();
  } catch (error) {
    console.error("Erro ao inicializar histórico:", error);
  }
});

async function inicializarHistorico() {
  console.log("Inicializando sistema de histórico...");
  
  // 1. Carregar lavouras
  await carregarLavouras();
  
  // 2. Configurar filtros
  configurarFiltros();
  
  // 3. Carregar estatísticas
  await carregarEstatisticas();
}

async function carregarLavouras(filtros = {}) {
  try {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) {
      console.error("Tabela não encontrada");
      return;
    }
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Carregando lavouras...</td></tr>';
    
    // Construir URL com filtros
    let url = '/api/historico/lavouras';
    const params = new URLSearchParams();
    
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros.status && filtros.status !== 'todos') params.append('status', filtros.status);
    if (filtros.nome) params.append('nome', filtros.nome);
    
    if (params.toString()) {
      url = `/api/historico/lavouras/filtrar?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      credentials: "same-origin"
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success" && data.data && data.data.length > 0) {
      tbody.innerHTML = '';
      
      data.data.forEach(lavoura => {
        const tr = document.createElement('tr');
        
        // Determinar ícone e classe de status
        let statusIcon = '';
        let statusClass = '';
        
        switch(lavoura.status) {
          case 'ativa':
            statusIcon = '<i class="fas fa-seedling"></i> ';
            statusClass = 'status-ativa';
            break;
          case 'concluída':
            statusIcon = '<i class="fas fa-check-circle"></i> ';
            statusClass = 'status-concluida';
            break;
          case 'oculta':
            statusIcon = '<i class="fas fa-times-circle"></i> ';
            statusClass = 'status-oculta';
            break;
          default:
            statusIcon = '<i class="fas fa-question-circle"></i> ';
            statusClass = '';
        }
        
        tr.innerHTML = `
          <td class="crop-name">
            ${statusIcon}<strong>${lavoura.nome || `Lavoura ${lavoura.ID_lavoura}`}</strong>
            <span class="cultura">${lavoura.cultura || 'Sem cultura definida'}</span>
          </td>
          <td>${lavoura.data_inicio || '--/--/----'}</td>
          <td>${lavoura.data_fim || 'Em andamento'}</td>
          <td style="white-space: nowrap;">
            <span class="status-badge ${statusClass}">${lavoura.status_display || lavoura.status}</span>
            <a href="TabelaHistoricos.html?id=${lavoura.ID_lavoura}" class="info-btn" title="Ver detalhes">
              <i class="fas fa-chart-line"></i> Detalhes
            </a>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
      
      console.log(`Carregadas ${data.data.length} lavouras`);
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma lavoura encontrada</td></tr>';
    }
    
  } catch (error) {
    console.error("Erro ao carregar lavouras:", error);
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center error">Erro ao carregar lavouras</td></tr>';
    }
  }
}

function configurarFiltros() {
  const form = document.getElementById('historyFilters');
  if (!form) {
    console.error("Formulário de filtros não encontrado");
    return;
  }
  
  // Configurar datas padrão
  const hoje = new Date().toISOString().split('T')[0];
  const umAnoAtras = new Date();
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  const umAnoAtrasStr = umAnoAtras.toISOString().split('T')[0];
  
  const inputInicio = document.getElementById('inicio');
  const inputColheita = document.getElementById('colheita');
  const inputNome = document.getElementById('nome');
  
  if (inputInicio) inputInicio.value = umAnoAtrasStr;
  if (inputColheita) inputColheita.value = hoje;
  
  // Criar e adicionar filtro de status
  const filterGroupStatus = document.createElement('div');
  filterGroupStatus.className = 'filter-group';
  filterGroupStatus.innerHTML = `
    <label for="status">Status</label>
    <select id="status" name="status">
      <option value="todos">Todos os Status</option>
      <option value="ativa">Ativas</option>
      <option value="concluída">Concluídas</option>
      <option value="oculta">Ocultas</option>
    </select>
  `;
  
  form.appendChild(filterGroupStatus);
  
  const selectStatus = document.getElementById('status');
  
  // Função para aplicar filtros
  const aplicarFiltros = async () => {
    const filtros = {
      data_inicio: inputInicio?.value || '',
      data_fim: inputColheita?.value || '',
      nome: inputNome?.value || '',
      status: selectStatus?.value || 'todos'
    };
    
    await carregarLavouras(filtros);
  };
  
  // Evento de submit do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await aplicarFiltros();
  });
  
  // Eventos de mudança em todos os filtros
  [inputInicio, inputColheita, inputNome, selectStatus].forEach(input => {
    if (input) {
      input.addEventListener('change', aplicarFiltros);
    }
  });
  
  // Evento de input para busca por nome (busca em tempo real após pequeno delay)
  if (inputNome) {
    let timeoutId;
    inputNome.addEventListener('input', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(aplicarFiltros, 500);
    });
  }
  
  console.log("Filtros configurados");
}

async function carregarEstatisticas() {
  try {
    const response = await fetch('/api/historico/estatisticas', {
      credentials: "same-origin"
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success" && data.data) {
        // Atualizar título com estatísticas
        const pageTitle = document.querySelector('.page-title p');
        if (pageTitle) {
          const stats = data.data;
          pageTitle.innerHTML = `
            Visualize e gerencie o histórico completo das suas plantações
            <br>
            <span class="estatisticas">
              <i class="fas fa-chart-pie"></i> 
              <strong>${stats.total_lavouras || 0}</strong> lavouras no total | 
              <i class="fas fa-seedling"></i> 
              <strong>${stats.lavouras_ativas || 0}</strong> ativas | 
              <i class="fas fa-check-circle"></i> 
              <strong>${stats.lavouras_concluidas || 0}</strong> concluídas
              ${stats.lavouras_ocultas ? `| <i class="fas fa-times-circle"></i> <strong>${stats.lavouras_ocultas}</strong> ocultas` : ''}
            </span>
          `;
        }
      }
    }
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error);
  }
}
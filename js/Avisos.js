// js/Avisos.js - VERSÃO ATUALIZADA
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Inicializando sistema de avisos...");
  
  try {
    // 1. Carregar avisos da API
    await carregarAvisos();
    
    // 2. Configurar filtros
    configurarFiltros();
    
    // 3. Configurar paginação
    configurarPaginacao();
    
    // 4. Atualizar a cada 5 minutos
    setInterval(carregarAvisos, 5 * 60 * 1000);
    
  } catch (error) {
    console.error("Erro ao inicializar avisos:", error);
    mostrarErro("Erro ao carregar avisos. Tente recarregar a página.");
  }
});

// Variáveis globais
let todosAvisos = [];
let avisosFiltrados = [];
const AVISOS_POR_PAGINA = 10;
let paginaAtual = 1;

async function carregarAvisos() {
  try {
    const response = await fetch("/api/avisos", {
      credentials: "same-origin"
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      todosAvisos = data.data || [];
      console.log(`Carregados ${todosAvisos.length} avisos`);
      
      // Aplicar filtro atual e atualizar tabela
      aplicarFiltro(document.querySelector('.botao-filtro.ativo')?.dataset.filtro || 'todos');
      atualizarTabela();
    } else {
      throw new Error(data.message || "Erro ao carregar avisos");
    }
    
  } catch (error) {
    console.error("Erro ao carregar avisos:", error);
    mostrarErro("Não foi possível carregar os avisos. Verifique sua conexão.");
  }
}

function configurarFiltros() {
  const botoesFiltro = document.querySelectorAll(".botao-filtro");
  
  botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", () => {
      const statusFiltro = botao.dataset.filtro;
      
      // Atualizar botão ativo
      botoesFiltro.forEach((btn) => btn.classList.remove("ativo"));
      botao.classList.add("ativo");
      
      // Aplicar filtro
      aplicarFiltro(statusFiltro);
    });
  });
}

function aplicarFiltro(filtro) {
  if (filtro === "todos") {
    avisosFiltrados = [...todosAvisos];
  } else {
    avisosFiltrados = todosAvisos.filter(aviso => aviso.nivel === filtro);
  }
  
  paginaAtual = 1;
  atualizarTabela();
  atualizarPaginacao();
}

function atualizarTabela() {
  const tbody = document.getElementById("tabela-avisos");
  if (!tbody) return;
  
  if (avisosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          <i class="fas fa-info-circle"></i> Nenhum aviso encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  // Calcular índice inicial e final para paginação
  const inicio = (paginaAtual - 1) * AVISOS_POR_PAGINA;
  const fim = inicio + AVISOS_POR_PAGINA;
  const avisosPagina = avisosFiltrados.slice(inicio, fim);
  
  tbody.innerHTML = '';
  
  avisosPagina.forEach(aviso => {
    const tr = document.createElement('tr');
    tr.dataset.status = aviso.nivel;
    tr.dataset.id = aviso.lavoura_id;
    
    // Formatar data e hora
    const dataHora = new Date(aviso.data_hora);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Determinar texto do status baseado no tipo
    let textoStatus = '';
    let classeStatus = '';
    
    switch(aviso.tipo) {
      case 'temperatura_baixa':
      case 'temperatura_alta':
        textoStatus = 'Temperatura fora do ideal';
        classeStatus = aviso.nivel === 'vermelho' ? 'status-seco' : 'status-regar';
        break;
      case 'umidade_ar_baixa':
      case 'umidade_ar_alta':
        textoStatus = 'Umidade do ar crítica';
        classeStatus = aviso.nivel === 'vermelho' ? 'status-seco' : 'status-regar';
        break;
      case 'umidade_solo_baixa':
        textoStatus = 'Precisa regar';
        classeStatus = aviso.nivel === 'vermelho' ? 'status-seco' : 'status-regar';
        break;
      case 'umidade_solo_alta':
        textoStatus = 'Solo muito úmido';
        classeStatus = 'status-seco';
        break;
      case 'ph_baixo':
      case 'ph_alto':
        textoStatus = 'pH inadequado';
        classeStatus = 'status-seco';
        break;
      case 'deficiencia_nitrogenio':
        textoStatus = 'Falta nitrogênio';
        classeStatus = 'status-regar';
        break;
      case 'deficiencia_fosforo':
        textoStatus = 'Falta fósforo';
        classeStatus = 'status-regar';
        break;
      case 'deficiencia_potassio':
        textoStatus = 'Falta potássio';
        classeStatus = 'status-regar';
        break;
      case 'vento_forte':
        textoStatus = 'Vento forte';
        classeStatus = 'status-seco';
        break;
      case 'chuva_excessiva':
        textoStatus = 'Chuva excessiva';
        classeStatus = 'status-seco';
        break;
      case 'sem_dados':
        textoStatus = 'Sem dados recentes';
        classeStatus = 'status-regar';
        break;
      case 'normal':
        textoStatus = 'Normal';
        classeStatus = 'status-normal';
        break;
      default:
        textoStatus = aviso.mensagem.substring(0, 30) + '...';
        classeStatus = aviso.nivel === 'verde' ? 'status-normal' : 
                      aviso.nivel === 'amarelo' ? 'status-regar' : 'status-seco';
    }
    
    tr.innerHTML = `
      <td class="lavoura-nome">
        <i class="fas fa-tractor"></i> ${aviso.lavoura_nome}
        <br>
        <small style="color: #aaa; font-size: 11px;">${aviso.parametro}: ${aviso.valor_atual || '--'}</small>
      </td>
      <td>
        <div class="status-texto">
          <span class="status ${aviso.nivel}"></span>
          <span class="${classeStatus}">${textoStatus}</span>
        </div>
      </td>
      <td class="data-hora">${dataFormatada}</td>
      <td class="data-hora">${horaFormatada}</td>
    `;
    
    // Adicionar tooltip com mais informações
    tr.title = `${aviso.mensagem}\nValor ideal: ${aviso.valor_ideal}`;
    
    // Adicionar evento de clique para marcar como lido
    tr.addEventListener('click', () => {
      marcarComoLido(aviso.lavoura_id, aviso.tipo);
    });
    
    tbody.appendChild(tr);
  });
}

function configurarPaginacao() {
  const botoesPagina = document.querySelectorAll(".botao-catalogo");
  
  botoesPagina.forEach((botao) => {
    botao.addEventListener("click", () => {
      const numeroPagina = parseInt(botao.dataset.pagina);
      
      if (numeroPagina !== paginaAtual) {
        // Atualizar botão ativo
        botoesPagina.forEach((btn) => btn.classList.remove("ativo"));
        botao.classList.add("ativo");
        
        // Mudar página
        paginaAtual = numeroPagina;
        atualizarTabela();
      }
    });
  });
}

function atualizarPaginacao() {
  const totalPaginas = Math.ceil(avisosFiltrados.length / AVISOS_POR_PAGINA);
  const container = document.querySelector(".catalogo-container");
  
  if (!container) return;
  
  // Limitar a 5 botões de página
  container.innerHTML = '';
  
  for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
    const botao = document.createElement('button');
    botao.className = `botao-catalogo ${i === paginaAtual ? 'ativo' : ''}`;
    botao.dataset.pagina = i;
    botao.textContent = i;
    
    botao.addEventListener('click', () => {
      paginaAtual = i;
      document.querySelectorAll('.botao-catalogo').forEach(btn => btn.classList.remove('ativo'));
      botao.classList.add('ativo');
      atualizarTabela();
    });
    
    container.appendChild(botao);
  }
  
  // Adicionar botões de navegação se houver muitas páginas
  if (totalPaginas > 5) {
    const btnAnterior = document.createElement('button');
    btnAnterior.className = 'botao-catalogo';
    btnAnterior.innerHTML = '<i class="fas fa-chevron-left"></i>';
    btnAnterior.addEventListener('click', () => {
      if (paginaAtual > 1) {
        paginaAtual--;
        atualizarTabela();
        atualizarPaginacao();
      }
    });
    
    const btnProximo = document.createElement('button');
    btnProximo.className = 'botao-catalogo';
    btnProximo.innerHTML = '<i class="fas fa-chevron-right"></i>';
    btnProximo.addEventListener('click', () => {
      if (paginaAtual < totalPaginas) {
        paginaAtual++;
        atualizarTabela();
        atualizarPaginacao();
      }
    });
    
    container.prepend(btnAnterior);
    container.appendChild(btnProximo);
  }
}

async function marcarComoLido(lavouraId, tipoAviso) {
  try {
    // Marcar visualmente
    const avisosParaRemover = document.querySelectorAll(`tr[data-id="${lavouraId}"]`);
    avisosParaRemover.forEach(tr => {
      tr.style.opacity = '0.6';
      tr.style.textDecoration = 'line-through';
    });
    
    // Enviar para API (opcional)
    await fetch(`/api/avisos/${lavouraId}/marcar-lido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    });
    
    // Remover da lista após 2 segundos
    setTimeout(() => {
      todosAvisos = todosAvisos.filter(aviso => 
        !(aviso.lavoura_id === lavouraId && aviso.tipo === tipoAviso)
      );
      aplicarFiltro(document.querySelector('.botao-filtro.ativo')?.dataset.filtro || 'todos');
    }, 2000);
    
  } catch (error) {
    console.error("Erro ao marcar aviso como lido:", error);
  }
}

function mostrarErro(mensagem) {
  const tbody = document.getElementById("tabela-avisos");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="error">
          <i class="fas fa-exclamation-triangle"></i> ${mensagem}
        </td>
      </tr>
    `;
  }
}

// Estatísticas em tempo real
function atualizarEstatisticas() {
  const total = todosAvisos.length;
  const vermelhos = todosAvisos.filter(a => a.nivel === 'vermelho').length;
  const amarelos = todosAvisos.filter(a => a.nivel === 'amarelo').length;
  const verdes = todosAvisos.filter(a => a.nivel === 'verde').length;
  
  console.log(`Estatísticas: ${vermelhos} vermelhos, ${amarelos} amarelos, ${verdes} verdes`);
}
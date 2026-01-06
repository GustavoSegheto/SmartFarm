// js/Lavouras.js
"use strict";

// Variáveis globais para os gráficos
let ventoGauge = null;
let pizzaChart = null;
let temperatureChart = null;
let lavouraAtualId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verificar autenticação
  await verificarSessao();
  
  // 2. Carregar lavouras no seletor
  await carregarLavourasNoSeletor();
  
  // 3. Inicializar gráficos
  inicializarGraficos();
  
  // 4. Configurar eventos
  configurarEventos();
});

// --- FUNÇÕES PRINCIPAIS ---

async function verificarSessao() {
  const userArea = document.getElementById("usuario-area");
  const nomeSpan = document.getElementById("usuario-nome");
  const btnLogout = document.getElementById("btnLogout");

  try {
    const resp = await fetch("/api/sessao", { credentials: "same-origin" });

    if (!resp.ok) {
      window.location.href = "/";
      return;
    }

    const data = await resp.json();

    if (!data.authenticated || !data.user) {
      window.location.href = "/";
      return;
    }

    // Sessão ok
    if (nomeSpan) {
      nomeSpan.textContent = data.user.nome || data.user.email || "Usuário";
    }
    if (userArea) {
      userArea.classList.remove("d-none");
    }

    // Configurar logout
    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        const desejaSair = window.confirm("Você deseja sair da sua conta?");
        if (!desejaSair) return;

        try {
          await fetch("/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
          });
        } finally {
          window.location.href = "/";
        }
      });
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    window.location.href = "/";
  }
}

async function carregarLavourasNoSeletor() {
  const seletor = document.getElementById("seletorLavouras");
  
  if (!seletor) {
    console.error("Seletor de lavouras não encontrado!");
    return;
  }
  
  try {
    seletor.innerHTML = '<option value="">Carregando lavouras...</option>';
    
    // ATENÇÃO: Verifique se esta rota existe no server.js
    const response = await fetch("/api/lavouras", {
      credentials: "same-origin"
    });
    
    if (!response.ok) {
      console.error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      throw new Error("Erro ao buscar lavouras");
    }
    
    const data = await response.json();
    console.log("Dados recebidos da API lavouras:", data);
    
    if (data.status === "success" && data.data && data.data.length > 0) {
      seletor.innerHTML = '<option value="">Selecione uma lavoura</option>';
      
      data.data.forEach(lavoura => {
        const option = document.createElement("option");
        option.value = lavoura.ID_lavoura;
        option.textContent = lavoura.nome || `Lavoura ${lavoura.ID_lavoura}`;
        option.dataset.status = lavoura.status || 'ativa';
        seletor.appendChild(option);
      });

      // Mostrar conteúdo da dashboard
      mostrarDashboard();
      
      // Selecionar a primeira lavoura automaticamente
      if (seletor.options.length > 1) {
        seletor.selectedIndex = 1;
        lavouraAtualId = seletor.value;
        await carregarDadosLavoura(seletor.value);

        // Verificar status da lavoura e ajustar botões
        const status = seletor.options[seletor.selectedIndex].dataset.status;
        ajustarBotoesPorStatus(status);
      }
    } else {
      console.warn("Nenhuma lavoura encontrada ou dados vazios");
      seletor.innerHTML = '<option value="">Nenhuma lavoura encontrada</option>';
      mostrarMensagemSemLavouras();
    }
  } catch (error) {
    console.error("Erro ao carregar lavouras:", error);
    seletor.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }

  function mostrarMensagemSemLavouras() {
    // Esconder TODO o conteúdo da dashboard
    const dashboardContent = document.querySelector('main.content .container-fluid');
    const botoesContainer = document.querySelector('.botoes-container');
    
    if (dashboardContent) dashboardContent.style.display = 'none';
    if (botoesContainer) botoesContainer.style.display = 'none';
    
    // Criar mensagem central
    const mainContent = document.querySelector('main.content');
    if (mainContent) {
      // Limpar conteúdo existente
      mainContent.innerHTML = '';
      
      const mensagemDiv = document.createElement('div');
      mensagemDiv.className = 'mensagem-central';
      mensagemDiv.innerHTML = `
        <div class="mensagem-sem-lavouras">
          <i class="fas fa-seedling icone-grande"></i>
          <h2>Nenhuma lavoura cadastrada</h2>
          <p class="subtitulo">
            Você ainda não possui lavouras cadastradas em sua conta.
          </p>
          <p class="instrucao">
            Para começar a monitorar suas plantações, crie sua primeira lavoura.
          </p>
          <div class="botoes-acao">
            <a href="CadastroLavoura.html" class="btn-nova-lavoura">
              <i class="fas fa-plus"></i> Criar Nova Lavoura
            </a>
            <button onclick="location.reload()" class="btn-atualizar">
              <i class="fas fa-sync-alt"></i> Atualizar Página
            </button>
          </div>
          <p class="dica">
            <i class="fas fa-lightbulb"></i>
            Dica: Vá em <strong>Nova Lavoura</strong> no menu lateral para adicionar sua primeira lavoura.
          </p>
        </div>
      `;
      
      mainContent.appendChild(mensagemDiv);
    }
  }

  function mostrarDashboard() {
    // Mostrar TODO o conteúdo da dashboard
    const dashboardContent = document.querySelector('main.content .container-fluid');
    const botoesContainer = document.querySelector('.botoes-container');
    
    if (dashboardContent) dashboardContent.style.display = 'block';
    if (botoesContainer) botoesContainer.style.display = 'flex';
    
    // Remover mensagem central se existir
    const mensagemCentral = document.querySelector('.mensagem-central');
    if (mensagemCentral) {
      mensagemCentral.remove();
    }
  }

  function ajustarBotoesPorStatus(status) {
    const btnConcluir = document.getElementById("btnConcluirLavoura");
    const btnExcluir = document.getElementById("btnExcluirLavoura");
    
    if (!btnConcluir || !btnExcluir) return;
    
    // Resetar botões
    btnConcluir.disabled = false;
    btnExcluir.disabled = false;
    btnConcluir.innerHTML = '<i class="fas fa-check"></i> Concluir Lavoura';
    btnExcluir.innerHTML = '<i class="fas fa-trash-alt"></i> Excluir Lavoura';
    
    if (status === 'concluída') {
      btnConcluir.disabled = true;
      btnConcluir.innerHTML = '<i class="fas fa-check-circle"></i> Lavoura Concluída';
      btnConcluir.style.opacity = '0.7';
      btnConcluir.style.cursor = 'not-allowed';
    } else {
      btnConcluir.style.opacity = '1';
      btnConcluir.style.cursor = 'pointer';
    }
    
    if (status === 'oculta') {
      btnExcluir.innerHTML = '<i class="fas fa-eye-slash"></i> Lavoura Ocultada';
      btnExcluir.disabled = true;
      btnExcluir.style.opacity = '0.7';
      btnExcluir.style.cursor = 'not-allowed';
    } else {
      btnExcluir.style.opacity = '1';
      btnExcluir.style.cursor = 'pointer';
    }
  }

  async function carregarDadosLavoura(idLavoura) {
    if (!idLavoura) {
      limparDados();
      return;
    }
    
    lavouraAtualId = idLavoura;
    
    try {
      const response = await fetch(`/api/lavouras/${idLavoura}/dados-completos`, {
        credentials: "same-origin"
      });
      
      if (!response.ok) {
        throw new Error("Erro ao buscar dados");
      }
      
      const data = await response.json();
      
      if (data.status === "success") {
        atualizarDadosClima(data.data.clima);
        atualizarDadosSensores(data.data.sensor);
        atualizarGraficoPizza(data.data.sensor);
        atualizarGraficoTemperatura(data.data.historicoTemperatura);
        atualizarVelocimetro(data.data.clima);
        
        // Esconder mensagem de sem lavouras se existir
        esconderMensagemSemLavouras();
      } else {
        limparDados();
      }
    } catch (error) {
      console.error("Erro ao carregar dados da lavoura:", error);
      limparDados();
    }
  }

  function esconderMensagemSemLavouras() {
    const graficosContainer = document.querySelector('.row.h-50.mb-4');
    const sensoresContainer = document.querySelector('.row.h-50');
    const botoesContainer = document.querySelector('.botoes-container');
    
    if (graficosContainer) graficosContainer.style.display = 'flex';
    if (sensoresContainer) sensoresContainer.style.display = 'flex';
    if (botoesContainer) botoesContainer.style.display = 'flex';
    
    const mensagem = document.querySelector('.mensagem-sem-lavouras');
    if (mensagem) {
      mensagem.remove();
    }
  }

async function carregarDadosLavoura(idLavoura) {
  if (!idLavoura) {
    console.log("Nenhuma lavoura selecionada");
    return;
  }
  
  try {
    console.log(`Carregando dados da lavoura ID: ${idLavoura}`);
    const response = await fetch(`/api/lavouras/${idLavoura}/dados-completos`, {
      credentials: "same-origin"
    });
    
    if (!response.ok) {
      console.error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      throw new Error("Erro ao buscar dados");
    }
    
    const data = await response.json();
    console.log("Dados recebidos da API dados-completos:", data);
    
    if (data.status === "success") {
      atualizarDadosClima(data.data.clima);
      atualizarDadosSensores(data.data.sensor);
      atualizarGraficoPizza(data.data.sensor);
      atualizarGraficoTemperatura(data.data.historicoTemperatura);
      atualizarVelocimetro(data.data.clima);
    } else {
      console.warn("Status não é success:", data);
      limparDados();
    }
  } catch (error) {
    console.error("Erro ao carregar dados da lavoura:", error);
    limparDados();
  }
}

// --- FUNÇÕES DE ATUALIZAÇÃO DE DADOS ---

function atualizarDadosClima(climaData) {
  console.log("Atualizando dados do clima:", climaData);
  
  if (climaData) {
    // Atualizar elementos da API de clima
    const tempEl = document.getElementById('temp_ar_valor');
    const umidEl = document.getElementById('umid_ar_valor');
    const ventEl = document.getElementById('vel_vento_valor');
    const pluvEl = document.getElementById('pluviosidade_valor');
    const fotoEl = document.getElementById('fotoperiodo_valor');
    const climaEl = document.getElementById('clima_valor');
    
    if(tempEl) tempEl.textContent = `${parseFloat(climaData.temp_ar || 0).toFixed(1)}°C`;
    if(umidEl) umidEl.textContent = `${parseFloat(climaData.umid_ar || 0).toFixed(0)}%`;
    if(ventEl) ventEl.textContent = `${parseFloat(climaData.vel_vento || 0).toFixed(1)} km/h`;
    if(pluvEl) pluvEl.textContent = `${parseFloat(climaData.pluviosidade || 0).toFixed(1)} mm`;
    if(fotoEl) fotoEl.textContent = `${parseFloat(climaData.fotoperiodo || 0).toFixed(1)} h`;
    if(climaEl) climaEl.textContent = climaData.clima || '--';
    
    // Atualizar também o elemento do vento no título do velocímetro
    const ventoTituloEl = document.querySelector('.subcardvento h2 span');
    if (ventoTituloEl) {
      ventoTituloEl.textContent = `${parseFloat(climaData.vel_vento || 0).toFixed(1)} km/h`;
    }
  } else {
    console.log("Sem dados de clima para atualizar");
  }
}

function atualizarDadosSensores(sensorData) {
  console.log("Atualizando dados do sensor:", sensorData);
  
  if (sensorData) {
    // Atualizar sensores do solo com dados REAIS do banco
    const umidadeSoloEl = document.getElementById('umidadeSoloValor');
    const phSoloEl = document.getElementById('phSoloValor');
    
    // Agora temos os dados reais da tabela info_sensor
    if(umidadeSoloEl && sensorData.umidade_solo !== null && sensorData.umidade_solo !== undefined) {
      umidadeSoloEl.textContent = `${parseFloat(sensorData.umidade_solo).toFixed(1)}%`;
    } else if (umidadeSoloEl) {
      umidadeSoloEl.textContent = "--%"; // Valor padrão se não houver dados
    }
    
    if(phSoloEl && sensorData.ph_solo !== null && sensorData.ph_solo !== undefined) {
      phSoloEl.textContent = parseFloat(sensorData.ph_solo).toFixed(1);
    } else if (phSoloEl) {
      phSoloEl.textContent = "--"; // Valor padrão se não houver dados
    }
    
    // Atualizar também no título
    const umidadeSoloTituloEl = document.querySelector('.subcardumidsolo h2 span');
    if (umidadeSoloTituloEl && sensorData.umidade_solo !== null) {
      umidadeSoloTituloEl.textContent = `${parseFloat(sensorData.umidade_solo).toFixed(1)}%`;
    }
    
    const phSoloTituloEl = document.querySelector('.subcardPHSolo h2 span');
    if (phSoloTituloEl && sensorData.ph_solo !== null) {
      phSoloTituloEl.textContent = parseFloat(sensorData.ph_solo).toFixed(1);
    }
    
  } else {
    console.log("Sem dados do sensor para atualizar");
    // Se não houver dados do sensor, mostra valores padrão
    const umidadeSoloEl = document.getElementById('umidadeSoloValor');
    const phSoloEl = document.getElementById('phSoloValor');
    
    if(umidadeSoloEl) umidadeSoloEl.textContent = "--%";
    if(phSoloEl) phSoloEl.textContent = "--";
  }
}

function atualizarGraficoPizza(sensorData) {
  if (!pizzaChart) {
    console.error("Gráfico pizza não inicializado");
    return;
  }
  
  let valoresNutrientes = [25, 25, 25, 25]; // Valores padrão
  
  if (sensorData && sensorData.nitrogenio !== undefined && 
      sensorData.fosforo !== undefined && sensorData.potassio !== undefined) {
    
    const n = parseFloat(sensorData.nitrogenio) || 0;
    const p = parseFloat(sensorData.fosforo) || 0;
    const k = parseFloat(sensorData.potassio) || 0;
    
    console.log(`Nutrientes: N=${n}, P=${p}, K=${k}`);
    
    const soma = n + p + k;
    const outros = soma < 100 ? Math.max(0, 100 - soma) : 0;
    
    valoresNutrientes = [n, p, k, outros];
  } else {
    console.log("Dados de nutrientes não disponíveis para gráfico");
  }
  
  pizzaChart.data.datasets[0].data = valoresNutrientes;
  pizzaChart.update();
  console.log("Gráfico pizza atualizado:", valoresNutrientes);
}

function atualizarGraficoTemperatura(historicoData) {
  if (!temperatureChart) {
    console.error("Gráfico temperatura não inicializado");
    return;
  }
  
  if (!historicoData || historicoData.length === 0) {
    console.log("Sem dados históricos de temperatura");
    // Usar dados simulados se não houver dados reais
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const maxTemps = [28, 30, 32, 29, 31, 33, 30];
    const minTemps = [18, 19, 20, 17, 19, 21, 20];
    
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = maxTemps;
    temperatureChart.data.datasets[1].data = minTemps;
    temperatureChart.update();
    
    // Atualizar valores de texto
    const maxTempEl = document.getElementById("maxTempValue");
    const minTempEl = document.getElementById("minTempValue");
    
    if (maxTempEl && maxTemps.length > 0) {
      const max = Math.max(...maxTemps);
      maxTempEl.textContent = max.toFixed(1) + "°C";
    }
    
    if (minTempEl && minTemps.length > 0) {
      const min = Math.min(...minTemps);
      minTempEl.textContent = min.toFixed(1) + "°C";
    }
    
    return;
  }
  
  // Preparar arrays para o gráfico
  const labels = [];
  const maxTemps = [];
  const minTemps = [];
  
  historicoData.forEach(dia => {
    const dataObj = new Date(dia.data);
    labels.push(dataObj.toLocaleDateString('pt-BR', { weekday: 'short' }));
    maxTemps.push(parseFloat(dia.temp_max || 0));
    minTemps.push(parseFloat(dia.temp_min || 0));
  });
  
  // Atualizar gráfico
  temperatureChart.data.labels = labels;
  temperatureChart.data.datasets[0].data = maxTemps;
  temperatureChart.data.datasets[1].data = minTemps;
  temperatureChart.update();
  
  // Atualizar valores de texto
  const maxTempEl = document.getElementById("maxTempValue");
  const minTempEl = document.getElementById("minTempValue");
  
  if (maxTempEl && maxTemps.length > 0) {
    const max = Math.max(...maxTemps);
    maxTempEl.textContent = max.toFixed(1) + "°C";
  }
  
  if (minTempEl && minTemps.length > 0) {
    const min = Math.min(...minTemps);
    minTempEl.textContent = min.toFixed(1) + "°C";
  }
  
  console.log("Gráfico temperatura atualizado com", historicoData.length, "dias");
}

function atualizarVelocimetro(climaData) {
  if (!ventoGauge) {
    console.error("Velocímetro não inicializado");
    return;
  }
  
  if (climaData && climaData.vel_vento !== null && climaData.vel_vento !== undefined) {
    const velocidade = parseFloat(climaData.vel_vento) || 0;
    console.log(`Atualizando velocímetro para: ${velocidade} km/h`);
    ventoGauge.refresh(velocidade);
  } else {
    console.log("Sem dados de velocidade do vento para atualizar velocímetro");
    ventoGauge.refresh(0);
  }
}

function limparDados() {
  console.log("Limpando dados...");
  // Limpar todos os valores quando não há dados
  const elementos = [
    'temp_ar_valor', 'umid_ar_valor', 'vel_vento_valor',
    'pluviosidade_valor', 'fotoperiodo_valor', 'clima_valor',
    'umidadeSoloValor', 'phSoloValor', 'maxTempValue', 'minTempValue'
  ];
  
  elementos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '--';
  });
  
  // Limpar gráficos
  if (pizzaChart) {
    pizzaChart.data.datasets[0].data = [25, 25, 25, 25];
    pizzaChart.update();
  }
  
  if (temperatureChart) {
    temperatureChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0, 0];
    temperatureChart.data.datasets[1].data = [0, 0, 0, 0, 0, 0, 0];
    temperatureChart.update();
  }
  
  if (ventoGauge) {
    ventoGauge.refresh(0);
  }
}

// --- INICIALIZAÇÃO DE GRÁFICOS ---

function inicializarGraficos() {
  console.log("Inicializando gráficos...");
  
  // 1. Velocímetro (JustGage)
  if (typeof Raphael !== "undefined" && typeof JustGage !== "undefined") {
    console.log("Inicializando velocímetro...");
    ventoGauge = new JustGage({
      id: "velocimetro",
      value: 0,
      min: 0,
      max: 60,
      title: "km/h",
      label: "Velocidade do Vento",
      gaugeWidthScale: 0.6,
      levelColors: ["#00ff00", "#ffcc00", "#ff0000"],
      counter: true,
      customSectors: [
        { color: "#00ff00", lo: 0, hi: 20 },
        { color: "#ffcc00", lo: 20, hi: 40 },
        { color: "#ff0000", lo: 40, hi: 60 }
      ],
    });
    console.log("Velocímetro inicializado");
  } else {
    console.error("Raphael ou JustGage não carregado.");
  }

  // 2. Gráfico de Pizza (Nutrientes)
  const ctxPizza = document.getElementById("graficoPizza");
  if (ctxPizza) {
    console.log("Inicializando gráfico pizza...");
    pizzaChart = new Chart(ctxPizza.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Nitrogênio", "Fósforo", "Potássio", "Outros"],
        datasets: [{
          label: "Distribuição (%)",
          data: [25, 25, 25, 25], // Valores iniciais
          backgroundColor: ["#1b5e20", "#2e7d32", "#43a047", "#81c784"],
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 15,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
    console.log("Gráfico pizza inicializado");
  } else {
    console.error("Elemento canvas 'graficoPizza' não encontrado.");
  }

  // 3. Gráfico de Temperatura
  const ctxTemp = document.getElementById("temperatureChart");
  if (ctxTemp) {
    console.log("Inicializando gráfico temperatura...");
    temperatureChart = new Chart(ctxTemp.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
        datasets: [
          {
            label: "Máxima",
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(255, 107, 107, 0.8)",
            borderColor: "#ff6b6b",
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: "Mínima",
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(77, 171, 247, 0.8)",
            borderColor: "#4dabf7",
            borderWidth: 1,
            borderRadius: 3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              padding: 8,
              font: { size: 11, weight: "500" },
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 6,
            }
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}°C`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 0,
            max: 40,
            grid: { color: "rgba(0, 0, 0, 0.05)", drawBorder: false },
            ticks: {
              callback: (value) => value + "°C",
              font: { size: 10 },
              stepSize: 5,
              padding: 5,
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, padding: 5 }
          }
        },
        interaction: { mode: "index", intersect: false }
      }
    });
    console.log("Gráfico temperatura inicializado");
  } else {
    console.error("Elemento canvas 'temperatureChart' não encontrado.");
  }
}

// --- FUNÇÕES DOS BOTÕES ---

async function concluirLavoura() {
  if (!lavouraAtualId) {
    alert("Selecione uma lavoura primeiro!");
    return;
  }
  
  const seletor = document.getElementById('seletorLavouras');
  const lavouraNome = seletor.options[seletor.selectedIndex].textContent;
  
  if (!confirm(`Deseja realmente marcar a lavoura "${lavouraNome}" como concluída?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/lavouras/${lavouraAtualId}/concluir`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin"
    });
    
    const data = await response.json();
    
    if (data.status === "success") {
      alert(data.message);
      
      // Atualizar status no seletor
      const option = seletor.options[seletor.selectedIndex];
      option.dataset.status = 'concluída';
      
      // Ajustar botões
      ajustarBotoesPorStatus('concluída');
      
      // Recarregar dados
      await carregarDadosLavoura(lavouraAtualId);
      
    } else {
      alert("Erro: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao concluir lavoura:", error);
    alert("Erro ao concluir lavoura.");
  }
}

async function ocultarLavoura() {
  if (!lavouraAtualId) {
    alert("Selecione uma lavoura primeiro!");
    return;
  }
  
  const seletor = document.getElementById('seletorLavouras');
  const lavouraNome = seletor.options[seletor.selectedIndex].textContent;
  
  if (!confirm(`Tem certeza que deseja remover a lavoura "${lavouraNome}" da sua visão?\n\nOs dados serão mantidos no sistema, mas não aparecerão mais nas suas listas.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/lavouras/${lavouraAtualId}/ocultar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin"
    });
    
    const data = await response.json();
    
    if (data.status === "success") {
      alert(data.message);
      
      // Remover do seletor
      seletor.remove(seletor.selectedIndex);
      
      // Selecionar próxima lavoura ou limpar
      if (seletor.options.length > 1) {
        seletor.selectedIndex = 1;
        lavouraAtualId = seletor.value;
        await carregarDadosLavoura(lavouraAtualId);
        
        const status = seletor.options[seletor.selectedIndex].dataset.status;
        ajustarBotoesPorStatus(status);
      } else {
        lavouraAtualId = null;
        limparDados();
        mostrarMensagemSemLavouras();
      }
      
    } else {
      alert("Erro: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao ocultar lavoura:", error);
    alert("Erro ao ocultar lavoura.");
  }
}

// --- CONFIGURAÇÃO DE EVENTOS ---

function configurarEventos() {
  console.log("Configurando eventos...");
  
  // Evento do seletor de lavouras
  const seletor = document.getElementById('seletorLavouras');
  if (seletor) {
    seletor.addEventListener('change', async (e) => {
      console.log(`Lavoura selecionada: ${e.target.value}`);
      lavouraAtualId = e.target.value;
      
      if (lavouraAtualId) {
        const status = e.target.options[e.target.selectedIndex].dataset.status;
        ajustarBotoesPorStatus(status);
        await carregarDadosLavoura(lavouraAtualId);
      } else {
        limparDados();
      }
    });
  }
  
  // Eventos dos botões flutuantes
  const btnConcluir = document.getElementById("btnConcluirLavoura");
  const btnExcluir = document.getElementById("btnExcluirLavoura");
  
  if (btnConcluir) {
    btnConcluir.addEventListener("click", async () => {
      if (!lavouraAtualId) {
        alert("Selecione uma lavoura primeiro!");
        return;
      }
      
      const seletor = document.getElementById('seletorLavouras');
      const lavouraNome = seletor.options[seletor.selectedIndex].textContent;
      
      if (!confirm(`Deseja realmente marcar a lavoura "${lavouraNome}" como concluída?`)) {
        return;
      }
      
      try {
        const response = await fetch(`/api/lavouras/${lavouraAtualId}/concluir`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin"
        });
        
        const data = await response.json();
        
        if (data.status === "success") {
          alert(data.message);
          
          // Atualizar status no seletor
          const option = seletor.options[seletor.selectedIndex];
          option.dataset.status = 'concluída';
          
          // Ajustar botões
          ajustarBotoesPorStatus('concluída');
          
          // Recarregar dados
          await carregarDadosLavoura(lavouraAtualId);
          
        } else {
          alert("Erro: " + data.message);
        }
      } catch (error) {
        console.error("Erro ao concluir lavoura:", error);
        alert("Erro ao concluir lavoura.");
      }
    });
  }
  
  if (btnExcluir) {
    btnExcluir.addEventListener("click", async () => {
      if (!lavouraAtualId) {
        alert("Selecione uma lavoura primeiro!");
        return;
      }
      
      const seletor = document.getElementById('seletorLavouras');
      const lavouraNome = seletor.options[seletor.selectedIndex].textContent;
      
      if (!confirm(`Tem certeza que deseja remover a lavoura "${lavouraNome}" da sua visão?\n\nOs dados serão mantidos no sistema, mas não aparecerão mais nas suas listas.`)) {
        return;
      }
      
      try {
        const response = await fetch(`/api/lavouras/${lavouraAtualId}/ocultar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin"
        });
        
        const data = await response.json();
        
        if (data.status === "success") {
          alert(data.message);
          
          // Remover do seletor
          seletor.remove(seletor.selectedIndex);
          
          // Selecionar próxima lavoura ou mostrar mensagem
          if (seletor.options.length > 1) {
            seletor.selectedIndex = 1;
            lavouraAtualId = seletor.value;
            await carregarDadosLavoura(lavouraAtualId);
            
            const status = seletor.options[seletor.selectedIndex].dataset.status;
            ajustarBotoesPorStatus(status);
          } else {
            lavouraAtualId = null;
            limparDados();
            mostrarMensagemSemLavouras();
          }
          
        } else {
          alert("Erro: " + data.message);
        }
      } catch (error) {
        console.error("Erro ao ocultar lavoura:", error);
        alert("Erro ao ocultar lavoura.");
      }
    });
  }
  
  console.log("Eventos configurados");
}


// --- FUNÇÃO AUXILIAR PARA EXCLUIR LAVOURA ---

async function excluirLavoura(idLavoura) {
  try {
    const response = await fetch(`/api/lavouras/${idLavoura}`, {
      method: "DELETE",
      credentials: "same-origin"
    });
    
    const data = await response.json();
    
    if (data.status === "success") {
      alert(data.message);
      // Recarregar a lista de lavouras
      await carregarLavourasNoSeletor();
    } else {
      alert("Erro ao excluir lavoura: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao excluir lavoura:", error);
    alert("Erro ao excluir lavoura.");
  }
}

// --- DEBUG: Verificar console para problemas ---
console.log("Lavouras.js carregado com sucesso!");
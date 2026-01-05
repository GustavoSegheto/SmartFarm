// js/TabelaHistoricos.js - VERSÃO CORRIGIDA
"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await inicializarTabelaHistorico();
  } catch (error) {
    console.error("Erro ao inicializar tabela histórico:", error);
  }
});

async function inicializarTabelaHistorico() {
  console.log("Inicializando tabela de histórico detalhado...");
  
  // 1. Obter ID da lavoura da URL
  const urlParams = new URLSearchParams(window.location.search);
  const idLavoura = urlParams.get('id');
  
  if (!idLavoura) {
    mostrarErro("ID da lavoura não especificado na URL");
    return;
  }
  
  // 2. Carregar dados da lavoura
  await carregarDadosLavoura(idLavoura);
}

async function carregarDadosLavoura(idLavoura) {
  try {
    // Mostrar carregamento
    const tbody = document.querySelector('table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">Carregando dados históricos...</td></tr>';
    }
    
    const response = await fetch(`/api/historico/lavouras/${idLavoura}/detalhes`, {
      credentials: "same-origin"
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      // Atualizar cabeçalho
      atualizarCabecalho(data.data.lavoura);
      
      // Atualizar tabela
      atualizarTabela(data.data.lavoura.dados_combinados);
      
      console.log(`Carregados ${data.data.lavoura.total_registros} registros`);
    } else {
      mostrarErro(data.message || "Erro ao carregar dados");
    }
    
  } catch (error) {
    console.error("Erro ao carregar dados da lavoura:", error);
    mostrarErro("Erro ao carregar dados históricos");
  }
}

function atualizarCabecalho(dadosLavoura) {
  // Atualizar título
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    subtitle.innerHTML = `<i class="fas fa-history"></i> Histórico: ${dadosLavoura.nome}`;
  }
  
  // Atualizar informações do cabeçalho
  const headerInfo = document.querySelector('.header-info');
  if (headerInfo) {
    headerInfo.innerHTML = `
      <p><i class="fas fa-tractor"></i> <strong>Lavoura:</strong> ${dadosLavoura.nome}</p>
      <p><i class="fas fa-database"></i> <strong>Total de Registros:</strong> ${dadosLavoura.total_registros}</p>
      <p><i class="fas fa-cloud"></i> <strong>Leituras Clima:</strong> ${dadosLavoura.registros_clima || 0}</p>
      <p><i class="fas fa-microchip"></i> <strong>Leituras Sensor:</strong> ${dadosLavoura.registros_sensor || 0}</p>
    `;
  }
}

function atualizarTabela(dadosCombinados) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;
  
  if (!dadosCombinados || dadosCombinados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center">
          <i class="fas fa-info-circle"></i> Nenhum registro encontrado para esta lavoura
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = '';
  
  dadosCombinados.forEach(registro => {
    const tr = document.createElement('tr');
    
    // Determinar ícone do tipo de registro
    let tipoIcon = '';
    let tipoClass = '';
    
    if (registro.tipo === 'clima') {
      tipoIcon = '<i class="fas fa-cloud" title="Dados climáticos"></i> ';
      tipoClass = 'registro-clima';
    } else {
      tipoIcon = '<i class="fas fa-microchip" title="Dados do sensor"></i> ';
      tipoClass = 'registro-sensor';
    }
    
    tr.innerHTML = `
      <td>${formatarValor(registro.umidade_solo, '%')}</td>
      <td>${formatarValor(registro.umidade_ar, '%')}</td>
      <td>${formatarValor(registro.velocidade_vento, ' km/h')}</td>
      <td>${formatarValor(registro.ph_solo)}</td>
      <td>${registro.clima || '--'}</td>
      <td>${formatarValor(registro.temperatura, '°C')}</td>
      <td>${formatarValor(registro.nitrogenio, '%')}</td>
      <td>${formatarValor(registro.fosforo, '%')}</td>
      <td>${formatarValor(registro.potassio, '%')}</td>
      <td>${tipoIcon}${registro.data_leitura}</td>
    `;
    
    // Adicionar classe baseada no tipo
    if (tipoClass) {
      tr.classList.add(tipoClass);
    }
    
    tbody.appendChild(tr);
  });
}

function formatarValor(valor, sufixo = '') {
  if (valor === null || valor === undefined || valor === '') return '--';
  const num = parseFloat(valor);
  if (isNaN(num)) return '--';
  return `${num.toFixed(2)}${sufixo}`;
}

function mostrarErro(mensagem) {
  const tbody = document.querySelector('table tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center error">
          <i class="fas fa-exclamation-triangle"></i> ${mensagem}
        </td>
      </tr>
    `;
  }
  
  const headerInfo = document.querySelector('.header-info');
  if (headerInfo) {
    headerInfo.innerHTML = `
      <p class="error">
        <i class="fas fa-exclamation-circle"></i> 
        <strong>Erro:</strong> ${mensagem}
      </p>
    `;
  }
}

// Adicionar botão de exportar
function adicionarBotaoExportar() {
  const cardHeader = document.querySelector('.card-header');
  if (!cardHeader) return;
  
  // Verificar se o botão já existe
  if (document.querySelector('.export-btn')) return;
  
  const exportBtn = document.createElement('button');
  exportBtn.className = 'export-btn';
  exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Exportar';
  exportBtn.title = 'Exportar dados para CSV';
  
  exportBtn.onclick = () => {
    alert('Funcionalidade de exportação será implementada em breve!');
  };
  
  cardHeader.appendChild(exportBtn);
}

// Chamar função para adicionar botão de exportar após carregar
setTimeout(adicionarBotaoExportar, 1000);
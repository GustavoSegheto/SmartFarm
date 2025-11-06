/**
 * Lógica para simular a mudança de cotações ao selecionar uma nova lavoura.
 */
document.addEventListener('DOMContentLoaded', function() {
    
    const seletorLavouras = document.getElementById('seletorLavouras');
    
    // Elementos para atualização
    const cotacaoPrecoSaca = document.getElementById('cotacaoPrecoSaca');
    const cotacaoFutura = document.getElementById('cotacaoFutura');
    const cotacaoLocal = document.getElementById('cotacaoLocal');

    // Mapeamento de dados de exemplo para simulação
    const dadosCotas = {
        tomate: {
            preco: 'R$ 150,00',
            futura: 'R$ 155,50',
            local: 'CEASA-MG'
        },
        milho: {
            preco: 'R$ 70,50',
            futura: 'R$ 72,80',
            local: 'Bolsa de Chicago'
        },
        soja: {
            preco: 'R$ 135,20',
            futura: 'R$ 130,10',
            local: 'Porto de Paranaguá'
        },
        cafe: {
            preco: 'R$ 780,00',
            futura: 'R$ 805,00',
            local: 'Nova Iorque (ICE)'
        }
    };
    
    /**
     * Função que simula o carregamento de dados de cotação
     * baseado na lavoura selecionada.
     */
    function mudarLavoura() {
        const lavouraSelecionada = seletorLavouras.value;
        const dados = dadosCotas[lavouraSelecionada];
        const nomeLavoura = seletorLavouras.options[seletorLavouras.selectedIndex].text;

        if (dados) {
            // Atualiza o texto dos elementos (simulando a carga de dados)
            cotacaoPrecoSaca.textContent = dados.preco;
            cotacaoFutura.textContent = dados.futura;
            cotacaoLocal.textContent = dados.local;
            
            console.log(`Cotas atualizadas para: ${nomeLavoura}`);
            // Em uma aplicação real, aqui haveria uma chamada AJAX para o backend
            // para buscar os dados reais.
        }
    }

    // 1. Adiciona o Event Listener (Substitui o onchange no HTML)
    if (seletorLavouras) {
        seletorLavouras.addEventListener('change', mudarLavoura);
        
        // 2. Chama a função uma vez no carregamento para garantir que os dados iniciais sejam exibidos corretamente
        mudarLavoura();
    }
});
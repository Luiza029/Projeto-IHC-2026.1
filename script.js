// ==========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
let saldoApp = 200.00; // Saldo fictício inicial
let destinatarioAtual = ""; // Quem vai receber o dinheiro
let valorContaPendente = 0; // Quanto de dinheiro vai sair
let tipoTransacaoAtual = ""; // Guarda se é "PIX" ou "Pagamento"
let valorDigitadoStr = "0"; // String que alimenta o teclado numérico
let telaAnteriorConfirmacao = ""; // Ajuda o botão "Voltar" a saber para onde ir
// Formatador nativo do JS para converter números em R$ 0,00
const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Variável de controle de estado
let saldoOculto = false;

function toggleSaldo() {
    const displaySaldo = document.getElementById('display-saldo');
    const btnToggle = document.getElementById('btn-toggle-saldo');
    
    saldoOculto = !saldoOculto; // Inverte o valor do lt saldoOculto

    if (saldoOculto) {
        displaySaldo.textContent = "••••••"; // Máscara de segurança
        btnToggle.textContent = "👀"; // Muda o ícone
    } else {
        // Revela o saldo formatado usando o valor global saldoApp
        displaySaldo.textContent = formatadorBRL.format(saldoApp);
        btnToggle.textContent = "👁️";
    }
}

// ==========================================
// MOTOR DE NAVEGAÇÃO (SPA)
// ==========================================
// Esta função esconde todas as seções e mostra apenas a que possui o ID passado
function navegar(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
    document.getElementById(idTela).classList.add('ativa');

    // Sempre que voltar ao início, garante que o saldo na tela esteja atualizado
    if (idTela === 'tela-inicio') {
        const displaySaldo = document.getElementById('display-saldo');
        if (saldoOculto) {
            displaySaldo.textContent = "••••••";
        } else {
            displaySaldo.textContent = formatadorBRL.format(saldoApp);
        }
    }
}




// ==========================================
// FLUXOS DE CAPTURA DE DADOS
// ==========================================

// Chamada quando o usuário clica em um contato na lista do PIX
function selecionarContato(nome) {
    destinatarioAtual = nome;
    document.getElementById('titulo-valor').textContent = `Qual valor para ${nome}?`;
    navegar('tela-valor');
}

// Chamada quando o usuário digita um CPF/Chave na tela "Outra Pessoa"
function avancarOutraPessoa() {
    const input = document.getElementById('chave-pix').value;
    if (input.trim() === "") {
        alert("Por favor, digite uma chave válida."); // Tratamento de erro primário
        return;
    }
    selecionarContato(input);
}


// ==========================================
// TELA DE CONFIRMAÇÃO UNIVERSAL (Obrigatório em IHC)
// ==========================================
// Centralizamos as chamadas para garantir que TUDO passa por confirmação
function prepararConfirmacao(tipo, nomeDestino, valor) {
    tipoTransacaoAtual = tipo;
    destinatarioAtual = nomeDestino;
    valorContaPendente = valor;
    
    // Identifica de onde o usuário veio para configurar o botão "Voltar" ou "Não"
    if (tipo === "PIX") {
        telaAnteriorConfirmacao = "tela-valor";
        document.getElementById('legenda-confirmacao').textContent = "Você está enviando PIX para:";
    } else if (tipo === "Pagamento") {
        telaAnteriorConfirmacao = "tela-favoritas";
        document.getElementById('legenda-confirmacao').textContent = "Você está pagando a conta:";
    }

    // Preenche os dados na tela antes de exibi-la
    document.getElementById('nome-confirmacao').textContent = nomeDestino;
    document.getElementById('valor-confirmacao').textContent = formatadorBRL.format(valor);
    
    navegar('tela-confirmacao');
}

// Botão "Não" da tela de confirmação
function cancelarConfirmacao() {
    navegar(telaAnteriorConfirmacao);
}


// ==========================================
// PROCESSAMENTO E ESTADOS DO SISTEMA
// ==========================================

// Botão "Sim" da tela de confirmação dispara o Carregamento
function processarTransacao() {
    navegar('tela-carregando'); // Estado 1: Carregando
    
    // setTimeout simula o delay real da comunicação com um servidor bancário
    setTimeout(() => {
        avaliarTransacao();
    }, 2000);
}

// Lógica de Sucesso vs Erro baseada no Saldo
function avaliarTransacao() {
    const titulo = document.getElementById('titulo-feedback');
    const mensagem = document.getElementById('mensagem-feedback');
    const icone = document.getElementById('icone-feedback');
    const btnTentarNovamente = document.getElementById('btn-tentar-novamente');

    icone.className = 'icone-status'; // Limpa os ícones antigos

    if (valorContaPendente > saldoApp) {
        // FLUXO DE ERRO (Requisito obrigatório do projeto)
        titulo.textContent = "Saldo Insuficiente";
        titulo.style.color = "var(--cor-erro)";
        mensagem.innerHTML = `Você tentou pagar <strong>${formatadorBRL.format(valorContaPendente)}</strong>, mas seu saldo é <strong>${formatadorBRL.format(saldoApp)}</strong>.`;
        icone.classList.add('icone-erro');
        btnTentarNovamente.classList.remove('oculto'); // Exibe o botão de recuperação de erro
    } else {
        // FLUXO DE SUCESSO (Requisito principal)
        saldoApp -= valorContaPendente; // Efetiva o débito matemático
        titulo.textContent = "Transação Concluída!";
        titulo.style.color = "var(--cor-sucesso)";
        mensagem.innerHTML = `O valor de <strong>${formatadorBRL.format(valorContaPendente)}</strong> foi enviado para <strong>${destinatarioAtual}</strong>.`;
        icone.classList.add('icone-sucesso');
        btnTentarNovamente.classList.add('oculto'); // Oculta botão de tentar novamente
    }

    navegar('tela-feedback'); // Estado 2/3: Erro ou Sucesso
}

// Limpa as variáveis para a próxima operação
function finalizarFluxo() {
    destinatarioAtual = ""; 
    valorContaPendente = 0;
    navegar('tela-inicio');
}


// ==========================================
// LÓGICA DO TECLADO NUMÉRICO CUSTOMIZADO
// ==========================================

function abrirTeclado() {
    valorDigitadoStr = "0"; // Reseta o estado anterior do teclado
    atualizarVisor();
    navegar('tela-teclado');
}

// Transforma a string do teclado num float com duas casas decimais (ex: "500" vira 5.00)
function atualizarVisor() {
    const valorFloat = parseInt(valorDigitadoStr) / 100;
    document.getElementById('visor-valor').textContent = formatadorBRL.format(valorFloat);
}

function digitarNumero(num) {
    if (valorDigitadoStr === "0") {
        valorDigitadoStr = num;
    } else if (valorDigitadoStr.length < 7) { // Trava limite para não quebrar a UI
        valorDigitadoStr += num;
    }
    atualizarVisor();
}

function apagarNumero() {
    if (valorDigitadoStr.length > 1) {
        valorDigitadoStr = valorDigitadoStr.slice(0, -1); // Remove último dígito
    } else {
        valorDigitadoStr = "0";
    }
    atualizarVisor();
}

// Manda o valor do teclado direto para a tela de Confirmação
function confirmarValorTeclado() {
    const valorFloat = parseInt(valorDigitadoStr) / 100;
    if (valorFloat === 0) {
        alert("Por favor, digite um valor maior que zero."); // Prevenção de erro
        return;
    }
    prepararConfirmacao('PIX', destinatarioAtual, valorFloat);
}

// ==========================================
// LÓGICA DE LOGIN POR SENHA
// ==========================================
let senhaDigitada = "";
const SENHA_CORRETA = "123456";

function abrirTecladoSenha() {
    senhaDigitada = "";
    atualizarVisorSenha();
    navegar('tela-senha-login');
}

function atualizarVisorSenha() {
    const visor = document.getElementById('visor-senha');
    // Cria uma string de bolinhas baseada no tamanho da senha
    // Se estiver vazio, mostra traços
    if (senhaDigitada.length === 0) {
        visor.textContent = "------";
        visor.style.color = "var(--texto-secundario)";
    } else {
        visor.textContent = "•".repeat(senhaDigitada.length);
        visor.style.color = "var(--cor-primaria)";
    }
}

function digitarSenha(num) {
    if (senhaDigitada.length < 6) {
        senhaDigitada += num;
        atualizarVisorSenha();
    }
}

function apagarSenha() {
    senhaDigitada = senhaDigitada.slice(0, -1);
    atualizarVisorSenha();
}

function confirmarSenha() {
    if (senhaDigitada === SENHA_CORRETA) {
        navegar('tela-inicio');
    } else {
        exibirErroSenha();
        senhaDigitada = "";
        atualizarVisorSenha();
    }
}

function exibirErroSenha() {
    const notificacao = document.getElementById('notificacao-erro');
    const visor = document.getElementById('visor-senha');

    // Mostra o balão vermelho
    notificacao.classList.remove('oculto');

    // Adiciona efeito de tremor no visor (opcional, mas muito bom para IHC)
    visor.style.border = "2px solid var(--cor-erro)";
    visor.style.transform = "translateX(5px)";
    
    setTimeout(() => {
        visor.style.transform = "translateX(-5px)";
        setTimeout(() => visor.style.transform = "translateX(0)", 50);
    }, 50);

    // Esconde o balão após 3 segundos
    setTimeout(() => {
        notificacao.classList.add('oculto');
        visor.style.border = "none";
    }, 3000);
}
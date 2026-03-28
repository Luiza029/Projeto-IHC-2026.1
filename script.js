// ==========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
let saldoApp = 200.00; 
let destinatarioAtual = ""; 
let valorContaPendente = 0; 
let tipoTransacaoAtual = ""; 
let valorDigitadoStr = "0"; 
let telaAnteriorConfirmacao = ""; 
const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

let saldoOculto = false;

const contasRecorrentes = [
    { nome: "Internet", valor: 99.00, diaVencimento: 10, pago: false },
    { nome: "Academia", valor: 150.00, diaVencimento: 5, pago: false },
    { nome: "Luz", valor: 120.00, diaVencimento: 15, pago: false }
];

function toggleSaldo() {
    const displaySaldo = document.getElementById('display-saldo');
    const btnToggle = document.getElementById('btn-toggle-saldo');
    
    saldoOculto = !saldoOculto;

    if (saldoOculto) {
        displaySaldo.textContent = "••••••";
        btnToggle.textContent = "👀";
    } else {
        displaySaldo.textContent = formatadorBRL.format(saldoApp);
        btnToggle.textContent = "👁️";
    }
}

// ==========================================
// MOTOR DE NAVEGAÇÃO (SPA)
// ==========================================
function navegar(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
    document.getElementById(idTela).classList.add('ativa');

    if (idTela === 'tela-inicio') {
        const displaySaldo = document.getElementById('display-saldo');
        displaySaldo.textContent = saldoOculto ? "••••••" : formatadorBRL.format(saldoApp);
    }
}

// ==========================================
// FUNÇÃO DE POP-UP (NOTIFICAÇÃO RÁPIDA)
// ==========================================
// Esta função faz a tarja vermelha aparecer no topo por 4 segundos
function mostrarPopUpErro(mensagem) {
    const notificacao = document.getElementById('notificacao-erro');
    notificacao.textContent = mensagem;
    notificacao.classList.remove('oculto');
    
    // Remove a notificação automaticamente após 4 segundos
    setTimeout(() => {
        notificacao.classList.add('oculto');
    }, 4000);
}

// ==========================================
// FLUXOS DE CAPTURA DE DADOS E VALIDAÇÕES
// ==========================================

function selecionarContato(nome) {
    destinatarioAtual = nome;
    document.getElementById('titulo-valor').textContent = `Qual valor para ${nome}?`;
    navegar('tela-valor');
}

function avancarOutraPessoa() {
    const input = document.getElementById('chave-pix').value.trim();
    
    // 1. Erro: Campo Vazio
    if (input === "") {
        mostrarPopUpErro("Digite um CPF, Celular ou E-mail.");
        return;
    }

    const apenasNumeros = input.replace(/\D/g, ''); 
    const temLetras = /[a-zA-Z]/.test(input); 

    // 2. Erro: E-mail sem @
    if (temLetras) {
        if (!input.includes('@')) {
            mostrarPopUpErro("E-mail precisa ter o símbolo @");
            return;
        }
    } 
    // 3. Erro: Celular ou CPF
    else {
        if (apenasNumeros.length > 0 && apenasNumeros.length <= 10) {
            mostrarPopUpErro("Celular precisa de 9 digitos");
            return;
        }
        if (apenasNumeros.length > 11) {
            mostrarPopUpErro("Chave muito longa. Máximo 11 números.");
            return;
        }
        if (apenasNumeros.length !== 11) {
            mostrarPopUpErro("CPF incompleto. Digite os 11 números.");
            return;
        }
    }

    selecionarContato(input);
}

// ==========================================
// TELA DE CONFIRMAÇÃO
// ==========================================
function prepararConfirmacao(tipo, nomeDestino, valor) {
    tipoTransacaoAtual = tipo;
    destinatarioAtual = nomeDestino;
    valorContaPendente = valor;
    
    if (tipo === "PIX") {
        telaAnteriorConfirmacao = "tela-valor";
        document.getElementById('legenda-confirmacao').textContent = "Você está enviando PIX para:";
    } else if (tipo === "Pagamento") {
        telaAnteriorConfirmacao = "tela-favoritas";
        document.getElementById('legenda-confirmacao').textContent = "Você está pagando a conta:";
    }

    document.getElementById('nome-confirmacao').textContent = nomeDestino;
    document.getElementById('valor-confirmacao').textContent = formatadorBRL.format(valor);
    
    navegar('tela-confirmacao');
}

function cancelarConfirmacao() {
    navegar(telaAnteriorConfirmacao);
}

// ==========================================
// PROCESSAMENTO
// ==========================================
function processarTransacao() {
    navegar('tela-carregando');
    setTimeout(() => {
        avaliarTransacao();
    }, 2000);
}

function avaliarTransacao() {
    const titulo = document.getElementById('titulo-feedback');
    const mensagem = document.getElementById('mensagem-feedback');
    const icone = document.getElementById('icone-feedback');
    const btnTentarNovamente = document.getElementById('btn-tentar-novamente');

    icone.className = 'icone-status';

    if (valorContaPendente > saldoApp) {
        titulo.textContent = "Saldo Insuficiente";
        titulo.style.color = "var(--cor-erro)";
        mensagem.innerHTML = `Você tentou pagar <strong>${formatadorBRL.format(valorContaPendente)}</strong>, mas seu saldo é <strong>${formatadorBRL.format(saldoApp)}</strong>.`;
        icone.classList.add('icone-erro');
        btnTentarNovamente.classList.remove('oculto');
        btnTentarNovamente.onclick = () => navegar('tela-valor');
    } else {
        saldoApp -= valorContaPendente;
        if (tipoTransacaoAtual === "PIX") {
        adicionarAoExtrato("PIX para " + destinatarioAtual, valorContaPendente);
    } else {
        adicionarAoExtrato("Pagamento: " + destinatarioAtual, valorContaPendente);
        marcarComoPago(destinatarioAtual);
    }
        titulo.textContent = "Transação Concluída!";
        titulo.style.color = "var(--cor-sucesso)";
        mensagem.innerHTML = `O valor de <strong>${formatadorBRL.format(valorContaPendente)}</strong> foi enviado para <strong>${destinatarioAtual}</strong>.`;
        icone.classList.add('icone-sucesso');
        btnTentarNovamente.classList.add('oculto');
    }

    navegar('tela-feedback');
}

function finalizarFluxo() {
    destinatarioAtual = ""; 
    valorContaPendente = 0;
    document.getElementById('chave-pix').value = ""; 
    navegar('tela-inicio');
}

// ==========================================
// LÓGICA DO TECLADO VALOR
// ==========================================
function abrirTeclado() {
    valorDigitadoStr = "0";
    atualizarVisor();
    navegar('tela-teclado');
}

function atualizarVisor() {
    const valorFloat = parseInt(valorDigitadoStr) / 100;
    document.getElementById('visor-valor').textContent = formatadorBRL.format(valorFloat);
}

function digitarNumero(num) {
    if (valorDigitadoStr === "0") {
        valorDigitadoStr = num;
    } else if (valorDigitadoStr.length < 7) {
        valorDigitadoStr += num;
    }
    atualizarVisor();
}

function apagarNumero() {
    valorDigitadoStr = (valorDigitadoStr.length > 1) ? valorDigitadoStr.slice(0, -1) : "0";
    atualizarVisor();
}

function confirmarValorTeclado() {
    const valorFloat = parseInt(valorDigitadoStr) / 100;
    if (valorFloat === 0) {
        mostrarPopUpErro("O valor precisa ser maior que zero.");
        return;
    }
    prepararConfirmacao('PIX', destinatarioAtual, valorFloat);
}

// ==========================================
// LÓGICA DE LOGIN (SENHA)
// ==========================================
let senhaDigitada = "";
const SENHA_CORRETA = "123456";

function atualizarVisorSenha() {
    const visor = document.getElementById('visor-senha');
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
        mostrarPopUpErro("Senha incorreta. Tente novamente!");
        senhaDigitada = "";
        atualizarVisorSenha();
    }
}

function abrirTecladoSenha() {
    senhaDigitada = "";
    atualizarVisorSenha();
    navegar('tela-senha-login');
}

function adicionarAoExtrato(nome, valor) {
  const lista = document.querySelector('.lista-extrato');

  const item = document.createElement('div');
  item.classList.add('item-extrato', 'saida');

  const data = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  item.innerHTML = `
    <div class="info-transacao">
      <span class="titulo">${nome}</span>
      <span class="data">${data}</span>
    </div>
    <span class="valor">- R$ ${valor.toFixed(2)}</span>
  `;

  lista.prepend(item); // adiciona no topo
}

function calcularProximaCobranca(dia) {
    const hoje = new Date();
    let proxima = new Date(hoje.getFullYear(), hoje.getMonth(), dia);

    if (hoje.getDate() > dia) {
        proxima.setMonth(proxima.getMonth() + 1);
    }

    return proxima.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
    });
}

function marcarComoPago(nome) {
    const contas = document.querySelectorAll('.btn-contato');

    contas.forEach(conta => {
        const titulo = conta.querySelector('.nome').textContent;

        if (titulo === nome) {
            conta.classList.add('pago');
            conta.querySelector('.status').classList.remove('oculto');
        }
    });
}
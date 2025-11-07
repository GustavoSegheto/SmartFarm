// server.js

// 1. Importa Express
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

// 2. Importa a Conexão com o Banco de Dados
// Certifique-se de que conexao.js está no mesmo diretório ou ajuste o caminho (./)
const db = require('./config/conexao');

// 3. Middlewares: Permite ao Express ler JSON e dados de formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================================================
// ROTA DE CADASTRO (POST)
// =========================================================================
app.post('/cadastro', (req, res) => {
    // req.body contém os dados enviados pelo formulário (ex: { nome: 'João', email: 'joao@ex.com', ... })
    const { nome, email, telefone, senha } = req.body;

    // SQL: Usamos '?' para placeholders, o que ajuda a prevenir SQL Injection
    const sql = 'INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)';

    // Valores a serem inseridos
    const values = [nome, email, telefone, senha];

    // Executa a consulta no banco de dados
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            // Envia uma resposta de erro para o frontend
            return res.status(500).json({ status: 'error', message: 'Erro ao registrar usuário.' });
        }

        console.log(`Usuário cadastrado com sucesso! ID: ${result.insertId}`);
        // Envia uma resposta de sucesso para o frontend
        res.status(201).json({ status: 'success', message: 'Usuário cadastrado com sucesso!' });
    });
});
// =========================================================================

// Rota de Teste Simples
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

/*app.get('/logincadastro', (req, res) => {
    res.sendFile(path.join);
});*/

// 4. Inicia o servidor
app.listen(PORT, () => {
    // Conecta ao DB quando o servidor inicia (Opcional, mas útil para testes)
    db.connect((err) => {
        if (err) {
            console.error('Erro ao conectar com o banco de dados:', err.stack);
            return;
        }
        console.log('Conectado ao MySQL como id ' + db.threadId);
    });
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
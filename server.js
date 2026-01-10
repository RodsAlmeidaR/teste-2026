const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Importa a conexão com o banco
const app = express();
const PORT = 3000;

//Configuração do EJS (motor de visualização)
app.set('view engine', 'ejs');

//Configuração de arquivos estáticos (CSS)
app.use(express.static('public'));

//Configuração para ler dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));

//rotas 

// principal - lista colaboradores
app.get('/', (req, res) => {
    const sql = "SELECT * FROM colaboradores";

    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render('index', { colaboradores: rows });
    });
});

//rota abrir formulário de adicionar
app.get('/adicionar', (req, res) => {
    res.render('adicionar');
});

//rota recebe dados e salva (Novo Cadastro)
app.post('/salvar', (req, res) => {
    const { nome, re, cargo, salario_atual, empresa } = req.body;

    //define valores padrão
    const status = 'Ativo';
    const salario_anterior = 0; // cadastro novo sem histórico
    
    const sql = `INSERT INTO colaboradores (nome, re, cargo, salario_atual, salario_anterior, status, empresa) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nome, re, cargo, salario_atual, salario_anterior, status, empresa], (err) => {
        if (err) {
            console.error("Erro ao salvar:", err.message);
            return res.send("Erro ao salvar colaborador: " + err.message);
        }
        console.log(`Colaborador ${nome} cadastrado com sucesso.`);
        res.redirect('/');
    });
});

//rota para inativar (AJAX)
app.post('/inativar/:id', (req, res) => {
    const id = req.params.id;
    
    const dataAtual = new Date().toLocaleString('pt-BR'); 

    const sql = `UPDATE colaboradores SET status = 'Inativo', data_desativacao = ? WHERE id = ?`;

    db.run(sql, [dataAtual, id], function(err) {
        if (err) {
            console.error("Erro ao inativar:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        res.json({ 
            success: true, 
            id: id, 
            novoStatus: 'Inativo',
            data: dataAtual
        });
    });
});

//abre a tela de edição (GET) e busca o histórico
app.get('/editar/:id', (req, res) => {
    const id = req.params.id;
    
    //busca os dados do colaborador
    db.get("SELECT * FROM colaboradores WHERE id = ?", [id], (err, colaborador) => {
        if (err) {
            return console.error(err.message);
        }
        if (!colaborador) {
            return res.send("Colaborador não encontrado!");
        }

        //busca o histórico na tabela 'historico_salarios'
        db.all("SELECT * FROM historico_salarios WHERE colaborador_id = ? ORDER BY id DESC", [id], (err, historico) => {
            if (err) {
                console.error("Erro ao buscar histórico:", err.message);
                historico = []; 
            }
            
            //renderiza passando AMBOS: colaborador E historico
            res.render('editar', { 
                colaborador: colaborador, 
                historico: historico || [] 
            });
        });
    });
});

//salva as alterações e calcula salário (POST)
app.post('/editar/:id', (req, res) => {
    const id = req.params.id;
    
    let { nome, re, cargo, percentual, bonus } = req.body;
    
    const percentualAumento = Number(percentual) || 0;
    const valorBonus = Number(bonus) || 0;

    db.get("SELECT * FROM colaboradores WHERE id = ?", [id], (err, row) => {
        if (err || !row) return res.send("Erro ao buscar colaborador.");

        const salarioAntigo = row.salario_atual;
        let novoSalario = salarioAntigo;
        let teveAlteracao = false;

        //bloqueia alteração se inativo
        if (row.status === 'Inativo') {
             console.log("Tentativa de alterar inativo bloqueada.");
             return res.redirect('/'); 
        }

        //regra da porcentagem
        if (percentualAumento > 0) {
            novoSalario = salarioAntigo + (salarioAntigo * (percentualAumento / 100));
            teveAlteracao = true;
        }

        //regra do bonus (< 1500)
        if (salarioAntigo < 1500 && valorBonus > 0) {
            novoSalario = novoSalario + valorBonus;
            teveAlteracao = true;
        }

        //se mudou o salário salva no histórico
        if (teveAlteracao) {
            const dataHora = new Date().toLocaleString('pt-BR');
            
            db.run(`INSERT INTO historico_salarios (colaborador_id, salario_anterior, salario_novo, data_alteracao) VALUES (?, ?, ?, ?)`, 
                [id, salarioAntigo, novoSalario, dataHora], (err) => {
                    if (err) console.error("Erro ao salvar histórico:", err.message);
                });
        }

        //atualiza o cadastro principal
        const sql = `UPDATE colaboradores SET nome = ?, re = ?, cargo = ?, salario_atual = ?, salario_anterior = ? WHERE id = ?`;

        db.run(sql, [nome, re, cargo, novoSalario, salarioAntigo, id], (err) => {
            if (err) {
                console.error(err.message);
                return res.send("Erro ao atualizar.");
            }
            console.log(`Colaborador ${id} atualizado. Salário: ${salarioAntigo} -> ${novoSalario}`);
            res.redirect('/');
        });
    });
});

// inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
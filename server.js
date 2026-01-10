const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); //importar a conexão com o banco
const app = express();
const PORT = 3000;

//configuracao do EJS (motor de visualização)
app.set('view engine', 'ejs');

//configuracao do css
app.use(express.static('public'));

//configuracao para ler dados do formulario
app.use(bodyParser.urlencoded({ extended: true }));

//ROTAS

//principal - lista colaboradores
app.get('/', (req, res) => {
    const sql = "SELECT * FROM colaboradores";

    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        //renderiza a pagina index.ejs passando os dados dos colaboradores
        res.render('index', { colaboradores: rows });
    });
});

//rota abrir formulario 
app.get('/adicionar', (req, res) => {
    res.render('adicionar');
});

//rota recebe dados e salva
app.post('/salvar', (req, res) => {
    const { nome, re, cargo, salario_atual, empresa } = req.body;

    //defini valores padrão
    const status = 'Ativo';
    const salario_anterior = 0; //cadastro novo sem historico
    
    //comando sql preparo
    const sql = `INSERT INTO colaboradores (nome, re, cargo, salario_atual, salario_anterior, status, empresa) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    //executa no banco
    db.run(sql, [nome, re, cargo, salario_atual, salario_anterior, status, empresa], (err) => {
        if (err) {
            console.error("Erro ao salvar:", err.message);
            return res.send("Erro ao salvar colaborador: " + err.message);
        }
        //sucesso volta para a lista principal
        console.log(`Colaborador ${nome} cadastrado com sucesso.`);
        res.redirect('/');
    });
});

//incia o servidor
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
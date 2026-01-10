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

//incia o servidor
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
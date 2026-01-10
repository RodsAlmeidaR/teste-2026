const sqlite3 = require('sqlite3').verbose();

//conecta banco e criar
const db = new sqlite3.Database('./cristalia_funcionarios.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

//tabela
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS colaboradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        re TEXT NOT NULL UNIQUE,
        cargo TEXT NOT NULL,
        salario_atual REAL NOT NULL,
        salario_anterior REAL,
        status TEXT DEFAULT 'ativo',
        empresa TEXT NOT NULL,
        data_desativacao TEXT
    )`);
});

//inserindo os 5 colaboradores
db.get("SELECT COUNT(*) AS count FROM colaboradores", (err, row) => {
    if (row.count === 0) {
        console.log("Banco vazio, inserindo dados iniciais...");
        // fix: 'colaboradores' e trocado 'salario_anterior' por 'status' para bater com os dados
        const sqlInsert = `INSERT INTO colaboradores (nome, re, cargo, salario_atual, status, empresa) VALUES (?, ?, ?, ?, ?, ?)`;
        const funcionarios = [
            ["João Silva", "1001", "Analista Jr", 2500.00, "Ativo", "Cristália"],
            ["Maria Oliveira", "1002", "Gerente", 8000.00, "Ativo", "Cristália"],
            ["Carlos Souza", "1003", "Assistente", 1400.00, "Ativo", "Cristália"],
            ["Ana Lima", "1004", "Desenvolvedora", 5000.00, "Ativo", "Cristália"],
            ["Roberto Costa", "1005", "Estagiário", 1200.00, "Ativo", "Cristália"]
        ];
        funcionarios.forEach(func => {
            db.run(sqlInsert, func, (err) => {
                if (!err) console.log(`Colaborador ${func[0]} inserido.`);
            });
        });
    }
});

module.exports = db;
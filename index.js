const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");

const app = express();

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");
app.use(express.urlencoded({ extended: false }));

// Função middleware para processar dados do usuário
app.use((req, res, next) => {
  const usersData = JSON.parse(fs.readFileSync("db/Users.json"));

  const user = usersData.users.find(
    (user) =>
      user.email === req.body.email && user.password === req.body.password
  );

  res.locals.username = user ? user.username : null; // Adiciona o nome do usuário aos locais globais
  next();
});

// Diretório das views
app.set("views", path.join(__dirname, "views"));

// Página inicial
app.get("/", (req, res) => {
  res.render("home", { username: res.locals.username });
});

// Página para cadastrar
app.get("/cadastrar", (req, res) => {
  res.render("cadastrar", { username: res.locals.username });
});

app.post("/cadastrar", (req, res) => {
  const newUser = ({ username, email, password, confirmpassword } = req.body);

  const usersData = JSON.parse(fs.readFileSync("db/Users.json"));

  // Verificação de Senha
  if (password !== confirmpassword) {
    return res.render("cadastrar", {
      error: "As senhas não coincidem",
      username: res.locals.username,
    });
  }

  // Verificação se Email já existe
  const emailExists = usersData.users.some((user) => user.email === email);

  if (emailExists) {
    return res.render("cadastrar", {
      erroremail: "Este email já está cadastrado",
      username: res.locals.username,
    });
  }

  usersData.users.push(newUser);

  fs.writeFileSync("db/Users.json", JSON.stringify(usersData, null, 2));

  res.redirect("/");
});

// Página de login
app.get("/login", (req, res) => {
  res.render("login", { username: res.locals.username });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const usersData = JSON.parse(fs.readFileSync("db/Users.json"));

  const user = usersData.users.find(
    (user) => user.email === email && user.password === password
  );

  if (user) {
    res.render("home", { username: user.username });
  } else {
    res.render("login", {
      errorlogin: "Confira o Email e a Senha",
      username: res.locals.username,
    });
  }
});

// Configuração do CSS
app.use(express.static(path.join(__dirname, "public")));

// Inicialização do servidor
app.listen(3000, () => {
  console.log("Servidor rodando na Porta 3000");
});

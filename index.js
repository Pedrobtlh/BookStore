const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const port = 3000;
const fs = require("fs");

const app = express();

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");
app.use(express.urlencoded({ extended: false }));

//DIRETÓRIO DAS VIEWS
app.set("views", path.join(__dirname, "views"));

//PÁGINA INICIAL
app.get("/", (req, res) => {
  res.render("home");
});

//PÁGINA PARA CADASTRAR
app.get("/cadastrar", (req, res) => {
  res.render("cadastrar");
});

app.post("/cadastrar", (req, res) => {
  const newUser = ({ username, email, password, confirmpassword } = req.body);

  const usersData = JSON.parse(fs.readFileSync("db/Users.json"));

  //Verificação de Senha
  if (password !== confirmpassword) {
    return res.render("cadastrar", { error: "As senhas não coincidem" });
  }

  //Verificação se Email já existe
  const emailExists = usersData.users.some((user) => user.email === email);

  if (emailExists) {
    return res.render("cadastrar", {
      erroremail: "Este email já está Cadastrado",
    });
  }

  usersData.users.push(newUser);

  fs.writeFileSync("db/Users.json", JSON.stringify(usersData, null, 2));

  res.redirect("/");
});

//PÁGINA DE LOGIN
app.get("/login", (req, res) => {
  res.render("login");
});

//UTILIZANDO O CSS
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Servidor rodando na Porta ${port}`);
});

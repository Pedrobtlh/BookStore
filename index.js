const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("express-flash");

const app = express();

app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");
app.use(express.urlencoded({ extended: false }));

// Express Flash
app.use(flash());

// Express Session
app.use(
  session({
    secret: "secretpassphrase",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Configuração do Passport
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log("Attempted login with email:", email);

    const usersData = JSON.parse(fs.readFileSync("db/Users.json"));

    const user = usersData.users.find(
      (user) => user.email === email && user.password === password
    );

    if (user) {
      console.log("Login successful:", user.username);
      return done(null, user);
    } else {
      console.log("Login failed: Invalid credentials");
      return done(null, false, { message: "Credenciais Inválidas" });
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const usersData = JSON.parse(fs.readFileSync("db/Users.json"));
  const user = usersData.users.find((user) => user.id === id);
  done(null, user);
});

// Middleware para adicionar variáveis locais ao res.locals
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.username = req.user ? req.user.username : null;
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
  const usersData = JSON.parse(fs.readFileSync("db/Users.json"));

  // Gerador de Id
  const newUserId = usersData.users.length + 1;

  const newUser = {
    id: newUserId,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    confirmpassword: req.body.confirmpassword,
  };

  // Verificação de Senha
  if (newUser.password !== newUser.confirmpassword) {
    return res.render("cadastrar", {
      error: "As senhas não coincidem",
      username: res.locals.username,
    });
  }

  // Verificação se Email já existe
  const emailExists = usersData.users.some(
    (user) => user.email === newUser.email
  );

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

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    if (!user) {
      console.log("Login failed:", info.message);
      return res.render("login", { errorlogin: info.message });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error(err);
        return next(err);
      }

      console.log("Login successful");
      return res.redirect("/");
    });
  })(req, res, next);
});

// Página de Logout
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    res.redirect("/"); // Redireciona para a página inicial ou qualquer outra página desejada
  });
});

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Exemplo de como usar o middleware para proteger uma rota
app.get("/rota_protegida", isAuthenticated, (req, res) => {
  res.send("Esta rota é protegida");
});

// Renderizar a página de criação de review
app.get("/createreview", isAuthenticated, (req, res) => {
  res.render("createreview", { username: req.user.username });
});

// Processar o envio do formulário de Criação de Review
app.post("/createreview", isAuthenticated, (req, res) => {
  // Lê os dados dos usuários do arquivo JSON
  const usersData = JSON.parse(fs.readFileSync("db/Users.json", "utf8"));

  // Encontra o índice do usuário logado
  const userIndex = usersData.users.findIndex(
    (user) => user.id === req.user.id
  );

  if (userIndex !== -1) {
    // Inicializa o array de reviews se ainda não existir
    if (!usersData.users[userIndex].reviews) {
      usersData.users[userIndex].reviews = [];
    }

    // Cria um novo objeto de review
    const newReview = {
      titulo: req.body.titulo,
      conteudo: req.body.conteudo,
      nota: parseInt(req.body.nota),
    };

    // Adiciona o novo review aos dados do usuário
    usersData.users[userIndex].reviews.push(newReview);

    // Escreve os dados atualizados no arquivo JSON
    fs.writeFileSync("db/Users.json", JSON.stringify(usersData, null, 2));

    // Redireciona para a página inicial ou outra página desejada
    res.redirect("/");
  } else {
    // Caso não encontre o usuário, lida com o erro
    res.status(500).send("Erro ao encontrar o usuário.");
  }
});
// Configuração do CSS
app.use(express.static(path.join(__dirname, "public")));

// Inicialização do servidor
app.listen(3000, () => {
  console.log("Servidor rodando na Porta 3000");
});

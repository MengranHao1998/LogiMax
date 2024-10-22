import express from "express";
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(express.static("public/public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended:true}))

// renderen pagina LOGIN
app.get("/",(req,res)=>{
  res.render("login",{activePage: "login"});
})

// test user
app.post('/', (req, res) => {
  const { username, password } = req.body;

  const correctUsername = 'JannesPeeters@Logimax.com';
  const correctPassword = 'WPL';

  if (username === correctUsername && password === correctPassword) {
      res.redirect('/home');
  } else {
    res.render('login', { invalidCredentials: true });
  }
});

// renderen pagina INDEX
app.get('/home', (req, res) => {
  res.render('index', { activePage: 'home' }); // activePage => voor gebruik nav item
});

// renderen pagina VOORRAAD
app.get('/voorraad', (req, res) => {
  res.render('voorraad', { activePage: 'voorraad' });
});

// renderen pagina PROCESSES
app.get('/processes', (req, res) => {
  res.render('processes', { activePage: 'processes' });
});


export {app};
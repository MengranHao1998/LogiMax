import express from "express";
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(express.static("public/public"));

// renderen pagina LOGIN
app.get("/login",(req,res)=>{
  res.render("login");
})

// renderen pagina INDEX
app.get('/', (req, res) => {
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
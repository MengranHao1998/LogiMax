import express from "express";
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(express.static('public'))

// renderen pagina INDEX
app.get("/",(req,res)=>{
  res.render("index");
})

// renderen pagina Login
app.get("/login",(req,res)=> {
    res.render("login");
})


app.listen(app.get("port"), ()=>console.log( "[server] http://localhost:" + app.get("port")));
import express from "express";
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(express.static("public/public"));

// renderen pagina INDEX
app.get("/",(req,res)=>{
  res.render("index");
})

// renderen pagina Login
app.get("/login",(req,res)=> {
    res.render("login");
})


export {app};
import express from "express";
import { Employee, Order, Shipment, Warehouse, Warehouses } from "./types";
import { MongoClient, Collection } from "mongodb";
import { countOrders, getWarehouses, countDelayedOrders } from "./db-warehouse";
import dotenv from "dotenv";
import {authenticateToken} from './middleware/authMiddleware'
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { loginUser, getUserByUsername } from "./db-users";
import { User } from "./types";
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(express.static("public/public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended:true}))

dotenv.config();

/*const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}
const client = new MongoClient(MONGODB_URI);

const warehousesCollection: Collection<Warehouse> = client.db("db-warehouses").collection<Warehouse>("warehouses");
const shipmentsCollection: Collection<Shipment> = client.db("db-warehouses").collection<Shipment>("shipments");
const ordersCollection: Collection<Order> = client.db("db-warehouses").collection<Order>("orders");
const employeesCollection: Collection<Employee> = client.db("db-warehouses").collection<Employee>("employees");
const usersCollection: Collection<User> = client.db("logimax-cluster").collection("users");*/

// renderen pagina LOGIN
app.get("/",(req,res)=>{
  res.render("login",{activePage: "login"});
})

/*// Login logica
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
      // Roep loginUser aan om te authenticeren en een JWT te genereren
      const token = await loginUser(username, password);

      // Verzend de token als een HTTP-Only cookie
      res.cookie("auth_token", token, { httpOnly: true, secure: true, sameSite: "strict" });

      // Redirect naar de homepagina na succesvolle login
      res.redirect("/home");
  } catch (error) {
      res.status(401).render("login", { invalidCredentials: true }); // Toon foutmelding bij mislukte login
  }
});
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
});*/

// renderen pagina INDEX
app.get('/home', async (req, res) => {

  const warehouses = await getWarehouses("19-11-2024");
  console.log(warehouses);

  const totalOrders = await countOrders("19-11-2024", 1);
  console.log(totalOrders);
  
  /*const delayedOrders = await ordersCollection.countDocuments({"warehouse_id": 1,
    $expr: { $eq: ["$order_date", "$delivery_deadline"] }
}); */

  const delayedOrders = await countDelayedOrders("19-11-2024", 1);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses?.warehouses[0].space_utilization || 0) * 100);
  //const spaceUtilization = Math.round(((await warehousesCollection.findOne({ "warehouse_id": 1 }))?.space_utilization || 0) * 100);

  res.render('index', {
    activePage: 'home',
    warehouses,
    stats: {
      totalOrders,
      delayedOrders,
      onTimePercentage,
      spaceUtilization
    }
  }); // activePage => voor gebruik nav item
});

// renderen pagina VOORRAAD
app.get('/voorraad', authenticateToken,(req, res) => {
  res.render('voorraad', { activePage: 'voorraad' });
});

// renderen pagina PROCESSES
app.get('/processes',authenticateToken, (req, res) => {
  res.render('processes', { activePage: 'processes' });
});

// renderen chart INDEX
app.get('/home',authenticateToken, (req, res) => {
  const chartData = [0]; // Example data
  res.render('index', { chartData });
});


export {app};
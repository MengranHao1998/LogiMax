import express from "express";
import { Employee, Order, Shipment, Warehouse, Warehouses } from "./types";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";
const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(express.static("public/public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended:true}))

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}
const client = new MongoClient(MONGODB_URI);

const warehousesCollection: Collection<Warehouse> = client.db("db-warehouses").collection<Warehouse>("warehouses");
const shipmentsCollection: Collection<Shipment> = client.db("db-warehouses").collection<Shipment>("shipments");
const ordersCollection: Collection<Order> = client.db("db-warehouses").collection<Order>("orders");
const employeesCollection: Collection<Employee> = client.db("db-warehouses").collection<Employee>("employees");

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
app.get('/home', async (req, res) => {

  const totalOrders = await ordersCollection.countDocuments({"warehouse_id": 1}); // Total orders van het New York warehouse
  const delayedOrders = await ordersCollection.countDocuments({"warehouse_id": 1,
    $expr: { $eq: ["$order_date", "$delivery_deadline"] }
}); 
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round(((await warehousesCollection.findOne({ "warehouse_id": 1 }))?.space_utilization || 0) * 100);

  res.render('index', { activePage: 'home', stats: {
    totalOrders,
    delayedOrders, onTimePercentage, spaceUtilization} }); // activePage => voor gebruik nav item
});

// renderen pagina VOORRAAD
app.get('/voorraad', (req, res) => {
  res.render('voorraad', { activePage: 'voorraad' });
});

// renderen pagina PROCESSES
app.get('/processes', (req, res) => {
  res.render('processes', { activePage: 'processes' });
});

// renderen chart INDEX
app.get('/home', (req, res) => {
  const chartData = [0]; // Example data
  res.render('index', { chartData });
});

export {app};
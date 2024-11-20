import express from "express";
import { Employee, Order, Shipment, Warehouse, Warehouses } from "./types";
import { MongoClient, Collection } from "mongodb";
import { countOrders, getWarehouses, countDelayedOrders } from "./db-warehouse";
import dotenv from "dotenv";
import {secureMiddleware} from './middleware/authMiddleware'
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import { loginUser, getUserByUsername } from "./db-users";
import { User } from "./types";

const app = express();

app.set("view engine", "ejs");
app.set("port", 3000);
app.use(cookieParser());
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

app.get("/login", (req, res) => {
  res.render("login", { activePage: "login" });
});

// Login logica
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await getUserByUsername(username);
      if (!user) {
          return res.status(401).render("login", { invalidCredentials: true });
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
          return res.status(401).render("login", { invalidCredentials: true });
      }

      // Generate a JWT token
      const token = jwt.sign(
          {
              username: user.username,
              role: user.role,
              accessibleWarehouses: user.accessibleWarehouses,
          },
          process.env.JWT_SECRET || "secretKey",
          { expiresIn: "1h" }
      );

      res.cookie("auth_token", token, { httpOnly: true, secure: true, sameSite: "strict" });
      res.redirect("/home");
  } catch (error) {
      console.error("Login error:", error);
      res.status(500).render("login", { invalidCredentials: true });
  }
});
/*// test user
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
app.get('/home', secureMiddleware, async (req, res) => {

  const user = res.locals.user;

  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);

  const warehouses = await getWarehouses("19-11-2024");
  console.log(warehouses);

  const totalOrders = await countOrders("19-11-2024", warehouseId);
  console.log(totalOrders);
  
  /*const delayedOrders = await ordersCollection.countDocuments({"warehouse_id": 1,
    $expr: { $eq: ["$order_date", "$delivery_deadline"] }
}); */

  const delayedOrders = await countDelayedOrders("19-11-2024", warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses?.warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses?.warehouses[warehouseId - 1].location;
  //const spaceUtilization = Math.round(((await warehousesCollection.findOne({ "warehouse_id": accessibleWarehouses }))?.space_utilization || 0) * 100);

  res.render('index', {
    activePage: 'home',
    warehouses,
    user: user,
    warehouseId,
    stats: {
      totalOrders,
      delayedOrders,
      onTimePercentage,
      spaceUtilization,
      location
    }
  }); // activePage => voor gebruik nav item
});

// renderen pagina VOORRAAD
app.get('/voorraad', secureMiddleware, async(req, res) => {
  const user = res.locals.user;

  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);

  const warehouses = await getWarehouses("19-11-2024");
  console.log(warehouses);

  const totalOrders = await countOrders("19-11-2024", warehouseId);
  console.log(totalOrders);
  
  /*const delayedOrders = await ordersCollection.countDocuments({"warehouse_id": 1,
    $expr: { $eq: ["$order_date", "$delivery_deadline"] }
}); */

  const delayedOrders = await countDelayedOrders("19-11-2024", warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses?.warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses?.warehouses[warehouseId - 1].location;
  //const spaceUtilization = Math.round(((await warehousesCollection.findOne({ "warehouse_id": accessibleWarehouses }))?.space_utilization || 0) * 100);

  res.render('voorraad', {
    activePage: 'voorraad',
    warehouses,
    user: user,
    warehouseId,
    stats: {
      totalOrders,
      delayedOrders,
      onTimePercentage,
      spaceUtilization,
      location
    }
  }); // activePage => voor gebruik nav item
});

// renderen pagina PROCESSES
app.get('/processes',secureMiddleware, async (req, res) => {
  const user = res.locals.user;

  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  
  const warehouses = await getWarehouses("19-11-2024");

  const totalOrders = await countOrders("19-11-2024", warehouseId);
  
  /*const delayedOrders = await ordersCollection.countDocuments({"warehouse_id": 1,
    $expr: { $eq: ["$order_date", "$delivery_deadline"] }
}); */

  const delayedOrders = await countDelayedOrders("19-11-2024", warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses?.warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses?.warehouses[warehouseId - 1].location;
  //const spaceUtilization = Math.round(((await warehousesCollection.findOne({ "warehouse_id": accessibleWarehouses }))?.space_utilization || 0) * 100);

  res.render('processes', {
    activePage: 'processes',
    warehouses,
    user: user,
    warehouseId,
    stats: {
      totalOrders,
      delayedOrders,
      onTimePercentage,
      spaceUtilization,
      location
    }
  }); 
});

// renderen chart INDEX
app.get('/home',secureMiddleware, async (req, res) => {
  const chartData = [0]; // Example data
  res.render('index', { chartData });
});


export {app};
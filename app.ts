import express from "express";
import { Employee, Order, Shipment, Warehouse, Product } from "./types";
import { MongoClient, Collection } from "mongodb";
import { countOrders, fetchWarehouses, countDelayedOrders, getOrders, LastObjectInCollections } from "./db-warehouse";
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

// renderen pagina INDEX
app.get('/home', secureMiddleware, async (req, res) => {

 const user = res.locals.user;

 const chosenDate =  await LastObjectInCollections();

 const today = new Date();
 
  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : chosenDate;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : chosenDate;

  const warehouses: Warehouse[] = await fetchWarehouses();
  const orders: Order[] = await getOrders(startDate, endDate, warehouseId);
  const totalOrders = await countOrders(startDate, endDate, warehouseId);

  //Totale waarde van alle items op voorraad
  const totalInventoryValue = (warehouseId: number) => {
    let totalValue: number = 0;
    const chosenWarehouseProducts: Product[] = warehouses[warehouseId - 1].products;

    for (let p of chosenWarehouseProducts) {
      let price: number = p.price.actualPrice === null ? p.price.discountPrice : p.price.actualPrice;
      let subtotal: number = price * p.quantity;
      totalValue += subtotal;
    }
    return totalValue;
  }

  //Totale waarde van alle items in orders
  const totalOrdersValue = (warehouseId: number) => {
    let totalValue: number = 0;
    for (let o of orders) {      
      const productsInOrders: Product[] = o.products;
      for (let p of productsInOrders) {
        if (o.warehouse_id === warehouseId) {
          let price: number = p.price.actualPrice === null ? p.price.discountPrice : p.price.actualPrice;
          let subtotal: number = price * p.quantity;
          totalValue += subtotal;
        }        
      }
    }
    return totalValue;
  }
  
  const ordersValue: number = totalOrdersValue(warehouseId);
  const inventoryValue: number = totalInventoryValue(warehouseId);
  const turnoverRate: number = Number((inventoryValue / ordersValue).toFixed(1));


  const delayedOrders = await countDelayedOrders(startDate, endDate, warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses[warehouseId - 1].location;

  res.render('index', {
    activePage: 'home',
    warehouses,
    user: user,
    warehouseId,
    startDate,
    endDate,
    stats: {
      totalOrders,
      delayedOrders,
      onTimePercentage,
      spaceUtilization,
      location,
      turnoverRate     
    }
  }); // activePage => voor gebruik nav item
});

// renderen pagina VOORRAAD
app.get('/voorraad', secureMiddleware, async(req, res) => {
  const user = res.locals.user;

 const today = new Date();
 let chosenDate: string = today.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});
  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : chosenDate;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : chosenDate;

  const warehouses: Warehouse[] = await fetchWarehouses();
  const orders: Order[] = await getOrders(startDate, endDate, warehouseId);
  const totalOrders = await countOrders(startDate, endDate, warehouseId);

  // LOGIC STAT CARDS
  const delayedOrders = await countDelayedOrders(startDate, endDate ,warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses[warehouseId - 1].location;

  //LOGIC TURNOVER RATE
  const totalInventoryValue = (warehouseId: number) => {
    let totalValue: number = 0;
    const chosenWarehouseProducts: Product[] = warehouses[warehouseId].products;

    for (let p of chosenWarehouseProducts) {
      let price: number = p.price.actualPrice === null ? p.price.discountPrice : p.price.actualPrice;
      let subtotal: number = price * p.quantity;
      totalValue += subtotal;
    }
    return totalValue;
  }

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

 const today = new Date();
 let chosenDate: string = today.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});
  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : chosenDate;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : chosenDate;

  const warehouses: Warehouse[] = await fetchWarehouses();
  const orders: Order[] = await getOrders(startDate, endDate, warehouseId);
  const totalOrders = await countOrders(startDate, endDate, warehouseId);

  const delayedOrders = await countDelayedOrders(startDate, endDate, warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses[warehouseId - 1].location;

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
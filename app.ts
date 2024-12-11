import express from "express";
import { Employee, Order, Shipment, Warehouse, Product, ProductTableInformation,WarehouseProductStockValue } from "./types";
import { MongoClient, Collection } from "mongodb";
import { countOrders_Optimized, fetchWarehouses, countDelayedOrders_Optimized, getOrders, getShipments, countIncomingShipments, countOutgoingShipments_Optimized, } from "./db-warehouse";
import dotenv from "dotenv";
import {secureMiddleware} from './middleware/authMiddleware'
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import { loginUser, getUserByUsername } from "./db-users";
import { User } from "./types";
import fs from "fs";
import path from "path";

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

 const chosenDate =  "03-12-2024";

 const today = new Date();
 
  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : chosenDate;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : chosenDate;

  const warehouses: Warehouse[] = await fetchWarehouses();
  const orders: Order[] = await getOrders(startDate, endDate, warehouseId);
  const totalOrders = await countOrders_Optimized(startDate, endDate, warehouseId);

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


  const delayedOrders = await countDelayedOrders_Optimized(startDate, endDate, warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses[warehouseId - 1].location;

  function getProductsFromSales(orders: Order[]): Product[] {
    let salesProducts: Product[] = [];
    let sales: Map<string, Product> = new Map(); // A map to store products by id
  
    // Collect all the products from all orders
    for (let o of orders) {
      for (let p of o.products) {
        salesProducts.push(p);
      }
    }
  
    // Loop through all products in salesProducts and update the sales map
    for (let sp of salesProducts) {
      if (sales.has(sp.id)) {
        // If the product is already in sales, update its quantity
        let existingProduct = sales.get(sp.id)!; // We know the product exists, so we can safely use '!'
        existingProduct.quantity += sp.quantity;
      } else {
        // If the product is not in sales, add it
        sales.set(sp.id, { ...sp }); // Add a copy of the product to the map
      }
    }
  
    // Convert the Map to an array and return it
    return Array.from(sales.values());
  }
  
  const allSoldProducts = getProductsFromSales(orders);
  let productSalesData: ProductTableInformation[] = [];
  
  for (let product of allSoldProducts) {
    const productForTable: ProductTableInformation = {
      id: product.id,
      title: product.title,
      link: product.link,
      image: product.image,
      price: product.price.actualPrice === null ? product.price.discountPrice : product.price.actualPrice,
      totalUnitsSold: product.quantity,
      totalRevenue: Math.round(product.price.discountPrice * product.quantity),
      currency: product.price.currency
    };
  
    productSalesData.push(productForTable);
  }

  productSalesData.sort((a, b) => b.totalRevenue - a.totalRevenue);

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
    },
    productSalesData
  }); // activePage => voor gebruik nav item
});

// renderen pagina VOORRAAD
app.get('/voorraad', secureMiddleware, async(req, res) => {
  const user = res.locals.user;

 const today = new Date();

 const chosenDate =  "03-12-2024";

  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : chosenDate;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : chosenDate;

  const warehouses: Warehouse[] = await fetchWarehouses();
  const orders: Order[] = await getOrders(startDate, endDate, warehouseId);
  const totalOrders = await countOrders_Optimized(startDate, endDate, warehouseId);
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
  // LOGIC STAT CARDS
  const delayedOrders = await countDelayedOrders_Optimized(startDate, endDate ,warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses[warehouseId - 1].location;
  const inventoryValue = totalInventoryValue(warehouseId);

  res.render('voorraad', {
    activePage: 'voorraad',
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
      inventoryValue
    }
  }); // activePage => voor gebruik nav item
});

// renderen pagina PROCESSES
app.get('/processes',secureMiddleware, async (req, res) => {
  const user = res.locals.user;

 const chosenDate =  "03-12-2024";

  let warehouseId = req.query.warehouseId || user.accessibleWarehouses[0];
  warehouseId = parseInt(warehouseId as string, 10);
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : chosenDate;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : chosenDate;

  const warehouses: Warehouse[] = await fetchWarehouses();

  const location = warehouses[warehouseId - 1].location;

  const shipments: Shipment[] = await getShipments(startDate, endDate, warehouseId);
  const incomingShipments = await countIncomingShipments(startDate, endDate, warehouseId);
  const outgoingShipments = await countOutgoingShipments_Optimized(startDate, endDate, warehouseId);

  const chartData = [
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-01"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-01"},
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-02"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-02"},
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-03"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-03"},
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-04"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-04"},
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-05"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-05"},
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-06"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-06"},
    {"Type": "Aangekomen", "Shipments": incomingShipments, "Date": "2023-12-07"},
    {"Type": "Verzendingen", "Shipments": outgoingShipments, "Date": "2023-12-07"}
] 

  res.render('processes', {
    activePage: 'processes',
    warehouses,
    user: user,
    warehouseId,
    startDate,
    endDate,
    chartData,
      stats: {
      shipments,
      incomingShipments,
      outgoingShipments,
      location
    }
  }); 
});

app.get('/api/products-stock-value', secureMiddleware, async (req, res) => {
  try {
    const user = res.locals.user;

    console.log("Fetching warehouse data...");
    const warehouses: Warehouse[] = await fetchWarehouses();
    const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string, 10) : null;

    if (warehouseId === null || isNaN(warehouseId) || warehouseId < 0 || warehouseId >= warehouses.length) {
      return res.status(400).json({ error: "Invalid warehouseId" });
    }

    const productsStockValue = (warehouseData: Warehouse[], warehouseId: number) => {
      let productsStockValue: WarehouseProductStockValue[] = [];

      for (let p of warehouseData[warehouseId].products) {
        const object: WarehouseProductStockValue = {
          warehouseId: warehouseId,
          id: p.id,
          title: p.title,
          link: p.link,
          image: p.image,
          price: p.price.actualPrice === null ? p.price.discountPrice : p.price.actualPrice,
          quantity: p.quantity,
          totalStockValue: Math.round(p.price.discountPrice * p.quantity),
          currency: p.price.currency,
        };

        productsStockValue.push(object);
      }

      return productsStockValue.slice(0, 10);
    };

    const result = productsStockValue(warehouses, warehouseId);
    console.log(`Generated Products Stock Value for Warehouse ${warehouseId}:`, result);

    res.json(result);
  } catch (error) {
    console.error("Error generating products stock value:", error);
    res.status(500).send("Internal Server Error");
  }
});


export {app};
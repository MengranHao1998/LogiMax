import express from "express";
import { Employee, Order, Shipment, Warehouse, Product, ProductTableInformation,WarehouseProductStockValue, EmployeePerformanceMetrics } from "./types";
import { MongoClient, Collection } from "mongodb";
import { countOrders_Optimized, fetchWarehouses, countDelayedOrders_Optimized, getOrders, getShipments, countIncomingShipments, countOutgoingShipments_Optimized, getRandomNumber, getOrdersByEmployee, getAmountOfOrdersByEmployee } from "./db-warehouse";
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

  //Totale stock quantity voor het magazijn
  let totalStockQuantity = 0;
  const chosenWarehouseProducts: Product[] = warehouses[warehouseId - 1].products;
  for (let p of chosenWarehouseProducts) {
    totalStockQuantity += p.quantity;
  }
  // Calculate warehouse utilization
  const warehouseCapacity = warehouses[warehouseId - 1].warehouse_capacity;
  const warehouseUtilization = totalStockQuantity / warehouseCapacity;
  const warehouseUtilizationPercentage = Math.round(warehouseUtilization * 100); // percentage value
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

  // Totale waarde van alle verkochte producten in orders
  const totalSalesValue = (warehouseId: number) => {
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
    const productId = product.id;
    const productForTable: ProductTableInformation = {
      id: product.id,
      title: product.title,
      link: product.link,
      image: product.image,
      price: product.price.actualPrice === null ? product.price.discountPrice : product.price.actualPrice,
      totalUnitsSold: product.quantity,
      totalRevenue: Math.round(product.price.discountPrice * product.quantity),
      currency: product.price.currency,
      currentStock: warehouses[warehouseId - 1].products.find((x) => x.id === productId)?.quantity || 0/*Math.round(getRandomNumber(10, 200))*/,
      get currentStockLevel() {
        if (this.currentStock < 60) return "low";
        if (this.currentStock < 120) return "medium";
        return "high";
      }
    };
    productSalesData.push(productForTable);
  }

  productSalesData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  // ---------------------------------------------------------------ray testen voorraadomzet index.ejs
  // Verzamelen van gegevens voor de top producten (top 7 op basis van voorraadomzet)
  const graphData = warehouses[warehouseId - 1].products.map(product => {
    const inventoryValue = totalInventoryValue(warehouseId); // Totale voorraadwaarde
    const salesValue = totalSalesValue(warehouseId); // Totale verkochte waarde
    const turnoverRate = salesValue !== 0 ? inventoryValue / salesValue : 0; // Voorkom deling door nul

    return {
      productId: product.id,
      productTitle: product.title,
      inventoryValue,
      salesValue,
      turnoverRate
    };
  });
// Sorteer de producten op voorraadomzet (turnoverRate) en beperk tot top 7
const topProducts = graphData.sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 7);

  //-----------------------------------------------------------------------------------------------------
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
      turnoverRate,
      warehouseUtilization: warehouseUtilizationPercentage, // Add warehouse utilization here
    },
    productSalesData,
    graphData: topProducts // Doorsturen van de top 7 producten voor de grafiek
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
   // Calculate total stock quantity for the warehouse
   let totalStockQuantity = 0;
   const chosenWarehouseProducts: Product[] = warehouses[warehouseId - 1].products;
   for (let p of chosenWarehouseProducts) {
     totalStockQuantity += p.quantity;
   }
    // Calculate warehouse utilization
  const warehouseCapacity = warehouses[warehouseId - 1].warehouse_capacity;
  const warehouseUtilization = totalStockQuantity / warehouseCapacity;
  const warehouseUtilizationPercentage = Math.round(warehouseUtilization * 100); // percentage value
  //LOGIC TURNOVER RATE
  const totalInventoryValue = (warehouseId: number) => {
    let totalValue: number = 0;
    const chosenWarehouseProducts: Product[] = warehouses[warehouseId - 1].products;

    for (let p of chosenWarehouseProducts) {
      let price: number = p.price.actualPrice === null ? p.price.discountPrice : p.price.actualPrice;
      let subtotal: number = price * p.quantity;
      totalValue += subtotal;
    }
    return Math.floor(totalValue).toLocaleString('nl-NL');
  }
  //Totale voorraad per magazijn berekenen
  const totalStockPerWarehouse = (warehouseId: number) => {
    const warehouse = warehouses[warehouseId - 1];
    let totalStock = 0;

    for (const product of warehouse.products) {
        totalStock += product.quantity;
    }

    return totalStock;
};
  // LOGIC STAT CARDS
  const delayedOrders = await countDelayedOrders_Optimized(startDate, endDate ,warehouseId);
  const onTimePercentage = Math.round(((totalOrders - delayedOrders) / totalOrders) * 100);
  const spaceUtilization = Math.round((warehouses[warehouseId - 1].space_utilization || 0) * 100);
  const location = warehouses[warehouseId - 1].location;
  const inventoryValue = totalInventoryValue(warehouseId);
  const inventoryStock = totalStockPerWarehouse(warehouseId);

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
      warehouseUtilization: warehouseUtilizationPercentage, // Add warehouse utilization here
      location,
      inventoryValue,
      inventoryStock
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
  const incomingShipments = Math.floor(await countIncomingShipments(startDate, endDate, warehouseId));
  const outgoingShipments = await countOutgoingShipments_Optimized(startDate, endDate, warehouseId);
  const shipmentsOnTheWay: number = Math.floor(outgoingShipments * getRandomNumber(0.5, 0.8));

  const lastDate = new Date(endDate.split("-").reverse().join("-")); // Parse endDate
    const shipmentData = [];
    for (let i = 6; i >= 0; i--) {
        const currentDate = new Date(lastDate);
        currentDate.setDate(lastDate.getDate() - i); // Subtract days
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        // Format as DD-MM-YYYY
        const formattedDateDMY = String(currentDate.getDate()).padStart(2, '0') + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + currentDate.getFullYear();
        const inc = Math.floor(await countIncomingShipments(formattedDateDMY, formattedDateDMY, warehouseId));
        const out = await countOutgoingShipments_Optimized(formattedDateDMY, formattedDateDMY, warehouseId);
        shipmentData.push(
            { Type: "Aangekomen", Shipments: inc, Date: formattedDate },
            { Type: "Verzendingen", Shipments: out, Date: formattedDate }
        );
    }

  // WERKNEMERSPRESTATIES LOGIC
  let employeePerformanceData: EmployeePerformanceMetrics[]  = [];
  
  for (let e of warehouses[warehouseId - 1].employees) {
    const ordersByEmployee: Order[] = await getOrdersByEmployee(startDate, endDate, e.employee_id);
    let amountOfPickedProducts: number = 0;
    if (e.department === "warehouse_employee") {
      let sum = ordersByEmployee.forEach(order => order.products.forEach(product => amountOfPickedProducts += product.quantity));
      const eData: EmployeePerformanceMetrics = {
        employeeId: e.employee_id,
        employeeName: e.firstName + " " + e.lastName,    
        completedOrders: ordersByEmployee,
        amountOfCompletedOrders: await getAmountOfOrdersByEmployee(startDate, endDate, e.employee_id), 
        amountOfPickedProducts: amountOfPickedProducts
      };
  
      employeePerformanceData.push(eData);
    }    
  }

  res.render('processes', {
    activePage: 'processes',
    warehouses,
    user: user,
    warehouseId,
    startDate,
    endDate,
    shipmentData,
      stats: {
      shipments,
      incomingShipments,
      outgoingShipments,
      shipmentsOnTheWay,
      location
    },
    employeePerformanceData
  }); 
});

app.get('/api/products-stock-value', secureMiddleware, async (req, res) => {
  try {
    const user = res.locals.user;

    console.log("Fetching warehouse data...");
    const warehouses: Warehouse[] = await fetchWarehouses();
    let warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;

    // 校正索引，确保从1开始的warehouseId可以正确映射到从0开始的数组索引
    if (warehouseId !== null) {
      warehouseId -= 1;  // 调整warehouseId以匹配数组索引
    }

    // 检查索引是否有效
    if (warehouseId === null || isNaN(warehouseId) || warehouseId < 0 || warehouseId >= warehouses.length) {
      return res.status(400).json({ error: "Invalid warehouseId" });
    }

    const productsStockValue = (warehouseData: Warehouse[], warehouseId: number) => {
      let productsStockValue: WarehouseProductStockValue[] = [];
      const currentProducts = warehouseData[warehouseId].products;
      const sortedProducts = [...currentProducts].sort((a, b) => b.quantity - a.quantity);
      const sortedByMost = sortedProducts.slice(0, limit);
      const sortedByLeast = sortedProducts.slice(-limit).reverse();
      const selectedProducts = sortedByMost.concat(sortedByLeast);

      for (let p of selectedProducts) {
        const object: WarehouseProductStockValue = {
          warehouseId: warehouseId + 1, // 加1恢复原来的ID
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

      return productsStockValue;
    };

    const result = productsStockValue(warehouses, warehouseId);
    console.log(`Generated Products Stock Value for Warehouse ${warehouseId + 1}:`, result);

    res.json(result);
  } catch (error) {
    console.error("Error generating products stock value:", error);
    res.status(500).send("Internal Server Error");
  }
});
export {app};
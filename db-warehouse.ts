import { Employee, Order, Shipment, Warehouse } from "./types";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const fs = require('fs');

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}
const client = new MongoClient(MONGODB_URI);

export const shipmentsCollection: Collection<Shipment> = client.db("db-warehouses").collection<Shipment>("shipments");
export const ordersCollection: Collection<Order> = client.db("db-warehouses").collection<Order>("orders");
export const employeesCollection: Collection<Employee> = client.db("db-warehouses").collection<Employee>("employees");

// ORDERS
export async function getOrders(startDate: string, endDate: string, warehouseId: number) {
    console.log(`Fetching orders between: ${startDate} and ${endDate} for warehouse ${warehouseId}`);
    return await ordersCollection.find<Order>({
        warehouse_id: warehouseId,
        order_date: {
            $gte: startDate, // Greater than or equal to startDate
            $lte: endDate  // Less than or equal to endDate
        },
    }).toArray();
}

export async function countOrders(startDate: string, endDate: string, warehouseId: number) {
    const allOrders: Order[] = await getOrders(startDate, endDate, warehouseId);
    let sumOfOrders: number = 0;

    if (!allOrders) {
        return sumOfOrders; // Return 0 if there are no orders
    }

    for (let order of allOrders) {
        if (order.warehouse_id === warehouseId) {
            sumOfOrders++;
        }
    }
    
    return sumOfOrders;
}

export async function countOrders_Optimized(startDate: string, endDate: string, warehouseId: number) {
    return ordersCollection.countDocuments({
        warehouse_id: warehouseId,
        order_date: { $gte: startDate, $lte: endDate }
    });
}

export async function countDelayedOrders(startDate: string, endDate: string, warehouse_id: number) {
    const allOrders: Order[] = await getOrders(startDate, endDate, warehouse_id);
    let sumOfDelayedOrders: number = 0;

    if (!allOrders) {
        return sumOfDelayedOrders; // Return 0 if there are no orders
    }

    for (let order of allOrders) {
        if (order.warehouse_id === warehouse_id) {
            if (order.order_date === order.delivery_deadline) {
                sumOfDelayedOrders++;
            }
        }        
    }
    
    return sumOfDelayedOrders;
}

export async function countDelayedOrders_Optimized(startDate: string, endDate: string, warehouseId: number) {
    return ordersCollection.countDocuments({
        warehouse_id: warehouseId,
        order_date: { $gte: startDate, $lte: endDate },
        $expr: { $eq: ["$order_date", "$delivery_deadline"] } //expression: {als volgende argumenten elkaar zijn aan elkaar [arg1, arg2]}
    });
}

//SHIPMENTS
export async function getShipments(startDate: string, endDate: string, warehouseId: number) {
    console.log(`Fetching shipments between: ${startDate} and ${endDate} for warehouse ${warehouseId}`);
    return await shipmentsCollection.find<Shipment>({
        warehouse_id: warehouseId,
        shipment_date: {
            $gte: startDate, // Greater than or equal to startDate
            $lte: endDate  // Less than or equal to endDate
        },
    }).toArray();
}

export async function countIncomingShipments(startDate: string, endDate: string, warehouseId: number) {
    const outgoingShipments: number = await countOutgoingShipments_Optimized(startDate, endDate, warehouseId);
    const simulatedIncomingShipments: number = outgoingShipments * getRandomNumber(0.8, 1.5);
    
    return simulatedIncomingShipments;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function countOutgoingShipments(startDate: string, endDate: string, warehouseId: number) {
    const allShipments: Shipment[] = await getShipments(startDate, endDate, warehouseId);
    let sumOfShipments: number = 0;

    if (!allShipments) {
        return sumOfShipments; // Return 0 if there are no shipments
    }

    // Loop through all shipments and count only outgoing ones for the specified warehouse
    for (let shipment of allShipments) {
        if (shipment.warehouse_id === warehouseId && shipment.type === "outgoing") {
            sumOfShipments++;
        }
    }

    return sumOfShipments;
}

export async function countOutgoingShipments_Optimized(startDate: string, endDate: string, warehouseId: number) {
    return shipmentsCollection.countDocuments({
        warehouse_id: warehouseId,
        type: "outgoing",
        shipment_date: {
            $gte: startDate, // Greater than or equal to startDate
            $lte: endDate  // Less than or equal to endDate
        }
    });
}

/*export async function fetchWarehouses() {
    const response = await fetch("https://logimax-api.onrender.com/warehouses/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();
    return data;
}*/

export async function fetchWarehouses() {
    const response = await fetch("https://raw.githubusercontent.com/MengranHao1998/LogiMax/refs/heads/main/warehouses.json");
    const data = await response.json();
    return data;
}

export async function fetchWarehousesProducts(warehouseId: number) {
    try {
      const response = await fetch(`https://logimax-api.onrender.com/warehouses/${warehouseId}/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch warehouse products: ${response.status}`);
      }
  
      const data = await response.json();
  
      return data.products.slice(0, 10);
    } catch (error) {
      console.error("Error in fetchWarehousesProducts:", error);
      throw error;
    }
  }

async function fetchShipments() {
    const response = await fetch("https://logimax-api.onrender.com/shipments/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();

    await shipmentsCollection.insertMany(data);
    console.log("Successfully wrote shipments data to db");
}

async function fetchOrders() {
    const response = await fetch("https://logimax-api.onrender.com/orders/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();

    await ordersCollection.insertMany(data);
    console.log("Successfully wrote orders data to db");
}

async function fetchEmployees() {    
    if (await employeesCollection.countDocuments() === 0) {
        const response = await fetch("https://logimax-api.onrender.com/employees/", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "authorization": "logimax-admin"
            }
        });
        const data = await response.json();
        await employeesCollection.insertMany(data);
        console.log("Successfully wrote employees data to db");
    }
    else {
        console.log("Employee data already found. No additional employee data written to db.");
    }
}

export async function PushToDatabase() {
    try {
        await client.connect();
        console.log("Successfully connected to the database");
        await fetchShipments();        
        await fetchOrders();
        await fetchEmployees();       
        process.on("SIGINT", DB_WHExit); // Ctrl + C handling
    } catch (e) {
        console.error("Error connecting to the database:", e);
    }
}

/*export async function LastObjectInCollections() {
    const o = (await ordersCollection.find<Order>({}).toArray()).reverse();
    console.log(`Date of last object in ORDERS collection: ${o[0].order_date}`);

    const s = (await shipmentsCollection.find<Shipment>({}).toArray()).reverse();
    console.log(`Date of last object in SHIPMENTS collection: ${s[0].shipment_date}`);
}*/
    
// Deze functie diende ENKEL om een nieuwe DB op te zetten!
export async function dbRedeployEmployees() {
    // Read the JSON file asynchronously
    const data = fs.readFileSync('./db-data/employees-collection-array.json', 'utf8');
    
    // Parse the JSON data into an array of objects
    const parsedData = JSON.parse(data);
    await employeesCollection.insertMany(parsedData);
    console.log("DONE");
}

// Deze functie diende ENKEL om een nieuwe DB op te zetten!
export async function dbRedeployShipments() {
    // Read the JSON file asynchronously
    const data = fs.readFileSync('./db-data/shipments-collection-array.json', 'utf8');
    
    // Parse the JSON data into an array of objects
    const parsedData = JSON.parse(data);
    await shipmentsCollection.insertMany(parsedData);
    console.log("DONE");
}


// Deze functie diende ENKEL om een nieuwe DB op te zetten!
export async function dbRedeployOrders() {
    // Read the JSON file asynchronously
    const data = fs.readFileSync('./db-data/orders-collection-array.json', 'utf8');
    
    // Parse the JSON data into an array of objects
    const parsedData = JSON.parse(data);
    await ordersCollection.insertMany(parsedData);
    console.log("DONE");
}

export async function DB_WHConnect() {
    try {
        await client.connect();
        console.log("Successfully connected to the database");
        process.on("SIGINT", DB_WHExit); // Ctrl + C handling
    } catch (e) {
        console.error("Error connecting to the database:", e);
    }
}

export async function DB_WHExit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error("Error while disconnecting from database:", error);
    }
    process.exit(0);
}
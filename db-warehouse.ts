import { Employee, Order, Shipment, Warehouse, Warehouses } from "./types";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}
const client = new MongoClient(MONGODB_URI);

// TESTING PURPOSES
const testCollection: Collection<Warehouses> = client.db("db-warehouses").collection<Warehouses>("test-warehouses");

const warehousesCollection: Collection<Warehouse> = client.db("db-warehouses").collection<Warehouse>("warehouses");
const shipmentsCollection: Collection<Shipment> = client.db("db-warehouses").collection<Shipment>("shipments");
const ordersCollection: Collection<Order> = client.db("db-warehouses").collection<Order>("orders");
const employeesCollection: Collection<Employee> = client.db("db-warehouses").collection<Employee>("employees");

// TESTING PURPOSES
async function test() {
    const response = await fetch("https://logimax-api.onrender.com/warehouses/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();

    const date: Date = new Date();
    const day: string = date.getDate().toString();
    const month: string = (date.getMonth() + 1).toString();
    const year: string = date.getFullYear().toString();
    const formattedDate: string = `${day}-${month}-${year}`;

    let test: Warehouses = {
        date: formattedDate,
        warehouses: data
    }
    
    await testCollection.insertOne(test);
}

async function fetchWarehouses() {
    const response = await fetch("https://logimax-api.onrender.com/warehouses/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();
    await warehousesCollection.insertMany(data);
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
}

async function fetchEmployees() {
    const response = await fetch("https://logimax-api.onrender.com/employees/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();

    await employeesCollection.insertMany(data);
}

async function DBConnect() {
    try {
        await client.connect();
        console.log("Successfully connected to the database");
        await fetchWarehouses();
        console.log("Successfully wrote warehouse data to db");
        await fetchShipments();
        console.log("Successfully wrote shipments data to db");
        await fetchOrders();
        console.log("Successfully wrote orders data to db");
        await fetchEmployees();
        console.log("Successfully wrote employees data to db");
        await test(); // TESTING PURPOSES
        console.log("test successfull"); // TESTING PURPOSES
        process.on("SIGINT", DBExit); // Ctrl + C handling
    } catch (e) {
        console.error("Error connecting to the database:", e);
    }
}

async function DBExit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error("Error while disconnecting from database:", error);
    }
    process.exit(0);
}

DBConnect();
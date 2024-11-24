import { Employee, Order, Shipment, Warehouse } from "./types";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}
const client = new MongoClient(MONGODB_URI);

export const shipmentsCollection: Collection<Shipment> = client.db("db-warehouses").collection<Shipment>("shipments");
export const ordersCollection: Collection<Order> = client.db("db-warehouses").collection<Order>("orders");
export const employeesCollection: Collection<Employee> = client.db("db-warehouses").collection<Employee>("employees");

// ORDERS
export async function getOrders(date: string) {
    return await ordersCollection.find<Order>({order_date: date}).toArray();
}

export async function countOrders(date: string, warehouse_id: number) {
    const allOrders: Order[] = await getOrders(date);
    let sumOfOrders: number = 0;

    if (!allOrders) {
        return sumOfOrders; // Return 0 if there are no orders
    }

    for (let order of allOrders) {
        if (order.warehouse_id === warehouse_id) {
            sumOfOrders++;
        }
    }
    
    return sumOfOrders;
}

export async function countDelayedOrders(date: string, warehouse_id: number) {
    const allOrders: Order[] = await getOrders(date);
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

export async function fetchWarehouses() {
    const response = await fetch("https://logimax-api.onrender.com/warehouses/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();
    return data;
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
        /*await fetchWarehouses();
        console.log("Successfully wrote warehouse data to db");
        await fetchShipments();
        console.log("Successfully wrote shipments data to db");
        await fetchOrders();
        console.log("Successfully wrote orders data to db");*/
        await fetchEmployees();        
        process.on("SIGINT", DBExit); // Ctrl + C handling
    } catch (e) {
        console.error("Error connecting to the database:", e);
    }
}

export async function DBConnect() {
    try {
        await client.connect();
        console.log("Successfully connected to the database");
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
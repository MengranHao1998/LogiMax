import { Employee, Order, Product, ProductPrice, Shipment, Warehouse } from "./types";
import { MongoClient, Collection } from "mongodb";

const MONGODB_URI = "mongodb+srv://db-admin:logimax@db-warehouses.uym2d.mongodb.net/?retryWrites=true&w=majority&appName=db-warehouses";
const client = new MongoClient(MONGODB_URI);

const warehousesCollection: Collection<Warehouse> = client.db("db-warehouses").collection<Warehouse>("warehouses");

async function fetchDataWarehouses() {
    const response = await fetch("https://logimax-api.onrender.com/warehouses/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();

    await warehousesCollection.deleteMany({}); // Telkens verwijderen voor testing's sake

    await warehousesCollection.insertMany(data);
}

async function DBConnect() {
    try {
        await client.connect();
        console.log("Successfully connected to the database");
        await fetchDataWarehouses();
        console.log("Successfully wrote data to db")
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
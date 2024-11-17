import { Employee, Order, Product, ProductPrice, Shipment, Warehouse } from "./types";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}
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
        console.log("Successfully wrote warehouse data to db")
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
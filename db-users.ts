import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

dotenv.config();

const MONGO_USER_URI = process.env.MONGO_USER_URI;
if (!MONGO_USER_URI) {
    throw new Error("MONGO_USER_URI is not defined in environment variables");
}

const client = new MongoClient(MONGO_USER_URI);
const usersCollection: Collection = client.db("logimax-cluster").collection("users");

// Functie om een gebruiker aan te maken
async function createUser(username: string, password: string, role: "CEO" | "TeamLeader", accessibleWarehouses: number[]) {
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
        console.log(`User ${username} already exists. Skipping creation.`);
        return;
    }

    if (!username || !password) {
        throw new Error("Username and password are required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
        username,
        password: hashedPassword,
        role,
        accessibleWarehouses
    };

    await usersCollection.insertOne(user);
    console.log(`User ${username} created successfully.`);
}


// Functie om warehouses op te halen en gebruikers te genereren
async function fetchWarehousesAndCreateUsers() {
    const API_URL = "https://logimax-api.onrender.com/warehouses/";
    const API_KEY = "logimax-admin";

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                authorization: API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch warehouses: ${response.statusText}`);
        }

        const warehouses = await response.json();

        await createUser("ceo@logimax.com", "password123", "CEO", warehouses.map((wh: any) => wh.warehouse_id));

        for (const warehouse of warehouses) {
            const teamLeader = warehouse.employees.find(
                (employee: any) => employee.department === "warehouse_manager"
            );

            if (teamLeader) {
                const username = `${teamLeader.firstName.toLowerCase()}.${teamLeader.lastName.toLowerCase()}@logimax.com`;
                const password = `password${warehouse.warehouse_id}`;
                await createUser(username, password, "TeamLeader", [warehouse.warehouse_id]);
            }
        }

        console.log("All users created successfully.");
    } catch (error) {
        console.error("Error fetching warehouses or creating users:", error);
    }
}


// Functie om gebruiker op te halen op basis van username
async function getUserByUsername(username: string) {
    try {
        if (!username) throw new Error("Username is required");
        
        const user = await usersCollection.findOne({ username });
        if (!user) {
            console.error(`User ${username} not found.`);
            return null;
        }

        return user;
    } catch (error) {
        console.error(`Error retrieving user with username ${username}:`, error);
        throw new Error("Unable to retrieve user");
    }
}


// Functie voor login: Verifieer de gebruikersnaam en wachtwoord, en genereer een JWT-token
async function loginUser(username: string, password: string) {
    try {
        const user = await getUserByUsername(username);
        if (!user) {
            console.error("Login failed: User not found");
            throw new Error("Invalid username or password");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            console.error("Login failed: Incorrect password");
            throw new Error("Invalid username or password");
        }

        const token = jwt.sign(
            {
                username: user.username,
                role: user.role,
                accessibleWarehouses: user.accessibleWarehouses,
            },
            process.env.JWT_SECRET || "secretKey",
            { expiresIn: "1h" }
        );

        return token;
    } catch (error) {
        console.error("Authentication error:", error);
        throw new Error("Authentication failed. Please try again.");
    }
}


// Database connectie
async function DBConnect() {
    try {
        await client.connect();
        console.log("Successfully connected to the database");

        await fetchWarehousesAndCreateUsers();

        process.on("SIGINT", DBExit);
    } catch (e) {
        console.error("Error connecting to the database:", e);
    }
}

// verbinding sluiten wanneer de app wordt afgesloten
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

export { createUser, fetchWarehousesAndCreateUsers, getUserByUsername, loginUser, DBConnect, DBExit };

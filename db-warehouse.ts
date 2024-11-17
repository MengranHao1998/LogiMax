import { Employee, Order, Product, ProductPrice, Shipment, Warehouse } from "./types";

async function fetchDataWarehouses() {
    const response = await fetch("https://logimax-api.onrender.com/warehouses/1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": "logimax-admin"
        }
    });
    const data = await response.json();
    console.log(data);
}

fetchDataWarehouses();
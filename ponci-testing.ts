  
import { Employee, Order, Shipment, Warehouse, Product, ProductTableInformation, WarehouseProductStockValue } from "./types";
import { countOrders, fetchWarehouses, countDelayedOrders, getOrders, getShipments, countIncomingShipments, countOutgoingShipments } from "./db-warehouse";

async function main() {
  let startDate: string = "03-12-2024";
  let endDate: string = "03-12-2024";
  let warehouseId = 2;

  const warehouses: Warehouse[] = await fetchWarehouses();
  const allOrders: Order[] = await getOrders(startDate, endDate, 2);
  const allShipments: Shipment[] = await getShipments(startDate, endDate, 6)
  /*for (let i = 0; i < allShipments.length; i++) {
    console.log(i+1 + " " + allShipments[i].shipment_id);
  }*/

  /*for (let i = 1; i <= 6; i++) {
    const incomingShipments = await countIncomingShipments(startDate, endDate, i);
    const outgoingShipments = await countOutgoingShipments(startDate, endDate, i);

    console.log(i + " " + incomingShipments);
    console.log(i + " " + outgoingShipments);
  }*/

  const productsStockValue = (warehouseData: Warehouse[], warehouseId: number) => {
    let productsStockValue: WarehouseProductStockValue [] = [];
  
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
        currency: p.price.currency
      };

      productsStockValue.push(object);      
    }
    return productsStockValue;
  };
  
  let test = productsStockValue(warehouses, warehouseId);
  console.log(test);
  
  const orders = getOrdersByWarehouse(allOrders, 2);
  const allProducts = getProductsInOrders(orders);
  //const productsTableData = calculateSalesPonci(allOrders);
  //productsTableData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  //console.log(productsTableData);

function getOrdersByWarehouse(orders: Order[], warehouseId: number): Order[] {
  return orders.filter(order => order.warehouse_id === warehouseId);
}

function getProductsInOrders(orders: Order[]) {
  return orders.flatMap(order => order.products);
}

/*function calculateSalesPonci(allOrders: Order[]) {
  let salesProducts: Product[] = [];
  let sales: Product[] = [];

  for (let o of allOrders) {
    for (let p of o.products) {
      salesProducts.push(p);
    }
  }

  for (let i = 0; i < 10; i++) {
    console.log(salesProducts[i]);
  }

  for (let sp of salesProducts) {
    //console.log(sp);
    for (let item of sales) {
      //console.log(item);
      if (item.id === sp.id) {
        item.quantity += sp.quantity;
      }
      else {
        sales.push(sp);
        console.log(sp);
      }
    }
  }

  for (let i = 0; i < 10; i++) {
    console.log(sales[i]);
  }
  

}*/

function getProductsFromSales(allOrders: Order[]): Product[] {
  let salesProducts: Product[] = [];
  let sales: Map<string, Product> = new Map(); // A map to store products by id

  // Collect all the products from all orders
  for (let o of allOrders) {
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

const allSoldProducts = getProductsFromSales(allOrders);
let productSalesData: ProductTableInformation[] = [];

for (let product of allSoldProducts) {
  const productForTable: ProductTableInformation = {
    id: product.id,
    title: product.title,
    link: product.link,
    image: product.image,
    price: product.price.actualPrice === null ? product.price.discountPrice : product.price.actualPrice,
    totalUnitsSold: product.quantity,
    totalRevenue: product.price.discountPrice * product.quantity,
    currency: product.price.currency
  };

  productSalesData.push(productForTable);
}

//console.log(allSoldProducts);
console.log("----------------------------------------------------------");
console.log("----------------------------------------------------------");
console.log("----------------------------------------------------------");
//console.log(productSalesData.sort((a, b) => b.totalRevenue - a.totalRevenue));

/*for (let i = 0; i < 10; i++) {
  console.log(test[i]);
}*/

  function calculateSales(products: Product[]) {
    return products.map(product => ({
      productId: product.id,
      title: product.title,
      link: product.link,
      image: product.image,
      totalUnitsSold: product.quantity,
      totalRevenue: product.price.discountPrice * product.quantity
    }));
  }

  /*const meh = () => {
    let totalValue: number = 0;
    let productSales;
    for (let o of orders) {
      //console.log(o);      
      const productsInOrders: Product[] = o.products;
      productSales = calculateSales(productsInOrders);
    }
    return productSales;
  }

  const p = meh();*/
  //console.log(p);
  //console.log(m);


  //Totale waarde van alle items op voorraad
  /*const totalInventoryValue = (warehouseId: number) => {
    let totalValue: number = 0;
    const chosenWarehouseProducts: Product[] = warehouses[warehouseId - 1].products;

    for (let p of chosenWarehouseProducts) {
      let price: number = p.price.actualPrice === null ? p.price.discountPrice : p.price.actualPrice;
      let subtotal: number = price * p.quantity;
      totalValue += subtotal;
    }
    return totalValue;
  }*/

  //Totale waarde van alle items in orders
  /*const totalOrdersValue = (warehouseId: number) => {
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
  const turnoverRate: number = Number((inventoryValue / ordersValue).toFixed(1));*/
}

main();

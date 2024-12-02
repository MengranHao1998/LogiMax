  
import { Employee, Order, Shipment, Warehouse, Product, ProductTableInformation } from "./types";
import { countOrders, fetchWarehouses, countDelayedOrders, getOrders } from "./db-warehouse";

  async function main() {
    let startDate: string = "24-11-2024";
    let endDate: string = "27-11-2024";
    let warehouseId = 2;
  
    const warehouses: Warehouse[] = await fetchWarehouses();
    const allOrders: Order[] = await getOrders(startDate, endDate, 2);
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

  function calculateSalesPonci(allOrders: Order[]) {
    let salesProducts: Product[] = [];
    let sales: Product[] = [];

    for (let o of allOrders) {
      for (let p of o.products) {
        salesProducts.push(p);
      }
    }

    /*for (let i = 0; i < 10; i++) {
      console.log(salesProducts[i]);
    }*/

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

    /*for (let i = 0; i < 10; i++) {
      console.log(sales[i]);
    }*/
    

  }

  calculateSalesPonci(allOrders);

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

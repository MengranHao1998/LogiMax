interface Product {
    product_id: number;
    name: string;
    stock: number;
    min_stock_level: number;
    max_stock_level: number;
    turnover_rate: number;
}

interface EmployeeProductivity {
    employee_id: number;
    name: string;
    orders_processed: number;
}

interface ShipmentProduct {
    product_id: number;
    quantity: number;
}

interface Shipment {
    shipment_id: number;
    shipment_date: string; // ISO date string
    incoming: boolean;
    order_ids?: number[]; // Optional as it may be absent in some shipments
    products: ShipmentProduct[];
}

interface Warehouse {
    warehouse_id: number;
    location: string;
    products: Product[];
    space_utilization: number;
    employee_productivity: EmployeeProductivity[];
    shipments: Shipment[];
}

interface OrderProduct {
    product_id: number;
    quantity: number;
}

interface Order {
    order_id: number;
    order_date: string; // ISO date string
    delivery_deadline: string; // ISO date string
    status: string;
    shipment_id: number;
    products: OrderProduct[];
}

interface InventoryData {
    warehouses: Warehouse[];
    orders: Order[];
}
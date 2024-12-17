// Interfaces /employees
export interface Employee {
    employee_id: string;
    warehouse_id: number;
    firstName: string;
    lastName: string;
    startDate: string;
    department: Department;
    birthDate: string; 
  }

type Department = // Union type var, department is 1 van deze 3 mogelijkheden
| "warehouse_manager"
| "hr_manager"
| "warehouse_employee";

export interface EmployeePerformanceMetrics {
    employeeId: string;
    employeeName: string;
    amountOfCompletedOrders: number;
    completedOrders: Order[];
    amountOfPickedProducts: number;
    /*employeePerformanceLevel: "high" | "mid" | "low"*/
}

// Interfaces /orders
export interface Order {
    order_id: string;
    warehouse_id: number;
    employee_id: string;
    order_date: string;
    delivery_deadline: string;
    products: Product[];
}

export interface Product {
    id: string;
    image: string;
    title: string;
    link: string;
    price: ProductPrice;
    quantity: number;
}

export interface ProductPrice {
    discountPrice: number;
    actualPrice: number | null;
    currency: string;
}

export interface ProductTableInformation {
    id: string;
    title: string;
    link: string;
    image: string;
    price: number;
    totalUnitsSold: number;
    totalRevenue: number;
    currency: string;
    currentStock: number;
    currentStockLevel: string;
}

// Interfaces /shipments
export interface Shipment {
    shipment_id: string;
    warehouse_id: number;
    shipment_date: string;
    type: "incoming" | "outgoing"; // Union type
    order_ids: string[];
    products: Product[];
}

//Interfaces /warehouses
export interface Warehouse {
    warehouse_id: number;
    location: string;
    employees: Employee[];
    products: Product[];
    warehouse_capacity: number;
    space_utilization: number;
}

export interface WarehouseProductStockValue {
    warehouseId: number;
    id: string;
    title: string;
    link: string;
    image: string;
    price: number;
    quantity: number;
    totalStockValue: number;
    currency: string;
}

// Interfaces /users
export interface User {
    username: string;          // Unieke gebruikersnaam
    password: string;          // Gehasht wachtwoord
    role: "CEO" | "TeamLeader"; // Rol van de gebruiker
    accessibleWarehouses: number[]; // Lijst van toegankelijke warehouse_ids
}
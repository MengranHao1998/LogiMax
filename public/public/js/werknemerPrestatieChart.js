// Initial Data
let werknemerData = [
    { id: 'Werknermer 1', orders: 120 },
    { id: 'Werknermer 2', orders: 190 },
    { id: 'Werknermer 3', orders: 30 },
    { id: 'Werknermer 4', orders: 50 },
    { id: 'Werknermer 5', orders: 20 },
    { id: 'Werknermer 6', orders: 30 },
    { id: 'Werknermer 7', orders: 90 }
];

// Get Context for Chart.js
const werknemerCtx = document.getElementById('werknemerPrestaties').getContext('2d');

// Create Chart
const werknemerChart = new Chart(werknemerCtx, {
    type: "bar",
    data: {
        labels: werknemerData.map(werknemer => werknemer.id),
        datasets: [{
            label: "Orders verwerkt",
            data: werknemerData.map(werknemer => werknemer.orders),
            backgroundColor: '#3E3DE0',
            borderColor: '#1E1E1E',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Sorting Functions
const sortById = () => {
    werknemerData.sort((a, b) => a.id.localeCompare(b.id));
    updateChart();
};

const sortByOrders = () => {
    werknemerData.sort((a, b) => b.orders - a.orders);
    updateChart();
};

// Update Chart Data
const updateChart = () => {
    werknemerChart.data.labels = werknemerData.map(werknemer => werknemer.id);
    werknemerChart.data.datasets[0].data = werknemerData.map(werknemer => werknemer.orders);
    werknemerChart.update();
};

// Attach Events to Buttons
document.getElementById('sortById').addEventListener('click', sortById);
document.getElementById('sortByOrders').addEventListener('click', sortByOrders);
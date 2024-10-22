// VOORAAD OMZET CHART
const ctx = document.getElementById('voorraadOmzet').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli'],
        datasets: [
            {
                label: 'IN',
                data: [120, 190, 30, 50, 20, 30, 90],
                backgroundColor: '#3E3DE0',
                borderColor: '#1E1E1E',
                borderWidth: 1
            },
            {
                label: 'OUT',
                data: [80, 140, 60, 90, 40, 50, 110],
                backgroundColor: '#3de0c6',
                borderColor: '#1E1E1E',
                borderWidth: 1
            }
        ]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// MEEST VERKOCHT CHART
const products = [
    { id: 'P001', name: 'Product 1', amountSold: 200, totalEarnings: 4000 },
    { id: 'P002', name: 'Product 2', amountSold: 150, totalEarnings: 3000 },
    { id: 'P003', name: 'Product 3', amountSold: 100, totalEarnings: 2000 },
    { id: 'P004', name: 'Product 4', amountSold: 80, totalEarnings: 1600 },
    { id: 'P005', name: 'Product 5', amountSold: 50, totalEarnings: 1000 }
];

function populateTable() {
    const tableBody = document.querySelector('#productTable tbody');

    products.forEach(product => {
        const row = document.createElement('tr');
        const idCell = document.createElement('td');
        idCell.textContent = product.id;

        const nameCell = document.createElement('td');
        nameCell.textContent = product.name;

        const amountCell = document.createElement('td');
        amountCell.textContent = product.amountSold;

        const earningsCell = document.createElement('td');
        earningsCell.textContent = product.totalEarnings;

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(earningsCell);

        tableBody.appendChild(row);
    });
}

window.onload = populateTable;

// RUIMTE GEBRUIK CHART
const doughnutCtx = document.getElementById('Ruimtegebruik').getContext('2d');

// Example data
const dataValue = 68.2; // in percentage

const Ruimtegebruik = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
        labels: ['Gebruikt 68.2%', 'Ongebruikt 31.8%'],
        datasets: [{
            data: [dataValue, 100 - dataValue],
            backgroundColor: ['#3E3DE0', '#3de0c6'], // Customize colors
            borderWidth: 1
        }]
    },
    options: {
        cutout: '80%', // Creates a hollow space in the middle
        responsive: true,
        plugins: {
            tooltip: {
                enabled: false // Disable the tooltip for clarity
            },
            legend: {
                display: true
            },
            // Plugin to display text in the center of the doughnut chart
            beforeDraw: function (chart) {
                const width = chart.width,
                      height = chart.height,
                      ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height / 120).toFixed(2);
                ctx.font = fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                const text = dataValue + "%",
                      textX = Math.round((width - ctx.measureText(text).width) / 2),
                      textY = height / 2;
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }
    }
});


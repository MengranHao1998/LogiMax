// VERZENDING EN ONTVANGST CHART
const verzendingOntvangstCtx = document.getElementById('verzendingOntvangstChart').getContext('2d');

const verzendingOntvangstData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
        {
            label: 'Verzending',
            data: [80, 40, 70, 80, 60, 90], // Example data
            borderColor: '#3E3DE0', // Blue color for Verzending line
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.4, // Smooth line
            pointBorderColor: 'white',
            pointBackgroundColor: '#3E3DE0',
            pointRadius: 4,
        },
        {
            label: 'Ontvangst',
            data: [60, 50, 60, 50, 40, 30], // Example data
            borderColor: '#3de0c6', // Aqua color for Ontvangst line
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.4, // Smooth line
            pointBorderColor: 'white',
            pointBackgroundColor: '#3de0c6',
            pointRadius: 4,
        }
    ]
};

const verzendingOntvangstChart = new Chart(verzendingOntvangstCtx, {
    type: 'line',
    data: verzendingOntvangstData,
    options: {
        scales: {
            y: {
                beginAtZero: true,
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'right'
            }
        }
    }
});
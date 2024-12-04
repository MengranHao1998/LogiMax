const ctx = document.getElementById('voorraadOmzetChart').getContext('2d');

        // Data and thresholds
        const dataValues = [100, 200, 400, 300, 600, 700]; // Example data
        const lowerLimit = 150; // Below this = red
        const upperLimit = 500; // Above this = blue; close to the limit = orange

        // Assign colors dynamically
        const backgroundColors = dataValues.map(value => {
            if (value < lowerLimit) {
                return '#ff3d67'; // Red (below lower limit)
            } else if (value >= lowerLimit && value <= upperLimit) {
                return '#007bff'; // Blue (within normal range)
            } else {
                return '#ff9f40'; // Orange (close to the upper limit)
            }
        });

        const data = {
            labels: ['0', '1', '2', '3', '4', '5'], // X-axis labels
            datasets: [
                {
                    label: 'Voorraad Omzet',
                    data: dataValues,
                    backgroundColor: backgroundColors, // Dynamically set bar colors
                }
            ]
        };

        const options = {
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        generateLabels: () => [
                            { text: 'Below Limit', fillStyle: '#ff3d67' },
                            { text: 'Normal Range', fillStyle: '#007bff' },
                            { text: 'Close to Limit', fillStyle: '#ff9f40' }
                        ]
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 100
                    }
                }
            }
        };

        new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
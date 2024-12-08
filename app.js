const airportCoordinates = {
    // Your airport coordinates data remains unchanged
};

// Function to fetch METAR data from the API
async function fetchMetarData() {
    try {
        const response = await fetch('https://api-preprod.avplan-efb.com/api/v4/opmet/metar', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 7KDDlultS24J5NlI5qUrJQ==' // Replace with your actual API key
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error('Error fetching METAR data:', data.error);
        } else {
            logRawMetarData(data);
            findWindyAirports(data);
            findGustyAirports(data);

            const nzAirports = filterAirportsStartingWithNZ(data);
            updateWindyAirportConditions(nzAirports, data);
            updateGustyAirportConditions(nzAirports, data);

            addMarkersToMap(nzAirports);
        }
    } catch (error) {
        console.error("Error fetching METAR data:", error);
    }
}

// Other unchanged functions...

// Add markers to the map for airports starting with 'NZ'
function addMarkersToMap(nzAirports) {
    nzAirports.forEach(airport => {
        const airportCode = airport.ident;
        const flightCategory = airport.flightcategory;
        const coordinates = airportCoordinates[airportCode];

        if (coordinates && coordinates.lat && coordinates.lon) {
            let markerColor = 'green'; // Default to 'vfr'

            if (flightCategory === 'IFR') markerColor = 'red';
            else if (flightCategory === 'MVFR') markerColor = 'yellow';
            else if (flightCategory === 'LIFR') markerColor = 'purple';
            else if (flightCategory === 'Windy') markerColor = 'blue';
            else if (flightCategory === 'Gusty') markerColor = 'magenta';

            L.circleMarker([coordinates.lat, coordinates.lon], {
                color: markerColor,
                radius: 8,
                fillOpacity: 0.8
            }).addTo(map)
            .bindPopup(`<b>${airportCode}</b><br>Flight Category: ${flightCategory}`);
        }
    });
}

// Create the Legend with responsiveness
function createLegend() {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        const categories = [
            { color: 'green', label: 'VFR', description: 'Visual Flight Rules: Ideal flying conditions.' },
            { color: 'yellow', label: 'MVFR', description: 'Marginal VFR: Conditions becoming worse but still flyable.' },
            { color: 'red', label: 'IFR', description: 'Instrument Flight Rules: Poor visibility, requires instruments for navigation.' },
            { color: 'purple', label: 'LIFR', description: 'Low IFR: Very poor visibility, highly restricted flying.' },
            { color: 'blue', label: 'Windy', description: 'Strong winds, possibly hazardous for certain flights.' },
            { color: 'magenta', label: 'Gusty', description: 'Intermittent gusts, could affect aircraft control.' }
        ];

        categories.forEach(category => {
            div.innerHTML += `
                <div>
                    <i style="background:${category.color}"></i>
                    <span class="key">${category.label}</span>
                    <span class="description">${category.description}</span>
                </div>`;
        });

        return div;
    };

    legend.addTo(map);

    // Add the legend toggle button
    const toggleButton = L.DomUtil.create('div', 'legend-toggle', map.getContainer());
    toggleButton.innerHTML = 'Legend &#9654;'; // Arrow pointing right
    toggleButton.onclick = function () {
        const legendDiv = document.querySelector('.legend');
        if (legendDiv.style.display === 'block' || legendDiv.style.display === '') {
            legendDiv.style.display = 'none';
            toggleButton.innerHTML = 'Legend &#9654;';
        } else {
            legendDiv.style.display = 'block';
            toggleButton.innerHTML = 'Legend &#9660;';
        }
    };
}

// Initialize the map (Leaflet.js)
const map = L.map('map').setView([-41.2867, 174.7762], 6);

// Add a tile layer (using OpenStreetMap tiles)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Fetch METAR data immediately when the page is loaded
fetchMetarData();

// Fetch METAR data again if the map fully loads
map.on('load', function () {
    fetchMetarData();
});


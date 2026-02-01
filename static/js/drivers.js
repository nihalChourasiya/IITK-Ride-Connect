// const usrlocation = localStorage.getItem("userLocation");
// document.getElementById("locationText").innerText =
//     `Showing drivers near: ${usrlocation}`;


// Fetch the rider location from server
fetch("/api/rider-location")
    .then(res => res.json())
    .then(data => {
        const userLocation = data.resolved_location;
        document.getElementById("locationText").innerText =
            `Showing drivers near: ${userLocation}`;

        // Now fetch drivers using this location
        fetchDrivers(userLocation);
    })
    .catch(err => {
        console.error("Failed to get rider location:", err);
        document.getElementById("locationText").innerText =
            "Showing drivers near: Unknown";
    });



fetchDrivers(location);

function fetchDrivers(location) {
    fetch("/api/get-drivers")
        .then(res => res.json())
        .then(data => renderDrivers(data))
        .catch(() => {
            document.getElementById("driversList").innerText =
                "Failed to load drivers.";
        });
}

function renderDrivers(drivers) {
    const list = document.getElementById("driversList");
    list.innerHTML = "";

    if (drivers.length === 0) {
        list.innerHTML = "<p>No drivers available nearby.</p>";
        return;
    }

    drivers.forEach(driver => {
    const card = document.createElement("div");
    card.className = "driver-card";

    let distanceText = "";
    if (driver.distance_km !== null && driver.distance_km !== undefined) {
        distanceText = `<p>${driver.distance_km} km away</p>`;
    }

    card.innerHTML = `
        <h3>${driver.name || "Unnamed Driver"}</h3>
        <p>Vehicle: ${driver.vehicle_type || "N/A"}</p>
        ${driver.location ? `<p>Location: ${driver.location}</p>` : ""}
        ${distanceText}
        <a class="call-btn" href="tel:${driver.phone}">
            📞 Call Driver
        </a>
    `;

    list.appendChild(card);
});

}


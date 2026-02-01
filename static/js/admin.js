document.addEventListener("DOMContentLoaded", () => {
    fetchDrivers();
});

function fetchDrivers() {
    fetch("/api/admin/drivers")
        .then(res => res.json())
        .then(drivers => renderDrivers(drivers))
        .catch(err => console.error(err));
}

function renderDrivers(drivers) {
    const list = document.getElementById("driversList");
    list.innerHTML = "";

    if(drivers.length === 0) {
        list.innerHTML = "<p>No drivers found.</p>";
        return;
    }

    drivers.forEach(driver => {
        const card = document.createElement("div");
        card.className = "driver-card";

        card.innerHTML = `
            <div class="driver-info">
                <input type="text" value="${driver.name}" placeholder="Name" data-field="name">
                <input type="text" value="${driver.phone}" placeholder="Phone" data-field="phone">
                <select data-field="vehicle_type">
                    <option value="Bike" ${driver.vehicle_type === "Bike" ? "selected": ""}>Bike</option>
                    <option value="Car" ${driver.vehicle_type === "Car" ? "selected": ""}>Car</option>
                    <option value="Auto" ${driver.vehicle_type === "Auto" ? "selected": ""}>Auto</option>
                </select>
                <select data-field="status">
                    <option value="AVLBL" ${driver.status === "AVLBL" ? "selected": ""}>Available</option>
                    <option value="UNAVLBL" ${driver.status === "UNAVLBL" ? "selected": ""}>Unavailable</option>
                </select>
                <input type="text" value="${driver.location || ''}" placeholder="Location" data-field="location">
            </div>
            <div class="driver-actions">
                <button class="update-btn" onclick="updateDriver('${driver._id}', this)">Update</button>
                <button class="delete-btn" onclick="deleteDriver('${driver._id}', this)">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}

function updateDriver(id, btn) {
    const card = btn.closest(".driver-card");
    const data = {};
    card.querySelectorAll("input, select").forEach(el => {
        data[el.dataset.field] = el.value;
    });

    fetch(`/api/admin/drivers/${id}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        if(res.success) alert("Driver updated!");
    })
    .catch(err => console.error(err));
}

function deleteDriver(id, btn) {
    if(!confirm("Are you sure you want to delete this driver?")) return;

    fetch(`/api/admin/drivers/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(res => {
        if(res.success) {
            btn.closest(".driver-card").remove();
        }
    })
    .catch(err => console.error(err));
}

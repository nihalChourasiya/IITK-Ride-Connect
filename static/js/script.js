function showRidePanel() {
    hideAllPanels();
    document.getElementById("ridePanel").classList.add("active");
}


function getLocation(mode) {
    const status = document.getElementById("locationStatus");

    // MANUAL MODE
    if (mode === 'manual') {
        const locationInput = document.querySelector(".location-input").value.trim();
        if (!locationInput) {
        // If input is empty
            status.innerText = "Please enter a location!";
            return; // stop here, do not send request
        }

        fetch("/api/rider-location", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: "manual",
                location: document.querySelector(".location-input").value.trim()
            })
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = "/drivers";
        })
        .catch(err => {
            status.innerText = "Error sending location to server.";
            console.error(err);
        });

        return; //  stop here
    }

    // GPS MODE
    if (!navigator.geolocation) {
        status.innerText = "Geolocation is not supported by your browser.";
        return;
    }

    status.innerText = "Fetching your location...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            status.innerText = "Location detected. Finding nearby drivers...";

            fetch("/api/rider-location", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: "gps",
                    lati: lat,
                    longi: lon
                })
            })
            .then(response => response.json())
            .then(data => {
                window.location.href = "/drivers";
            })
            .catch(err => {
                status.innerText = "Error sending location to server.";
                console.error(err);
            });
        },
        () => {
            status.innerText = "Unable to retrieve location. Please enter manually.";
        }
    );
}




function goToDrivers() {
    const locationInput = document.querySelector(".location-input").value.trim();

    if (!locationInput) {
        alert("Please enter your location or use GPS");
        return;
    }

    // Store location (simple + clean)
    localStorage.setItem("userLocation", locationInput);

    // Redirect to drivers page
    window.location.href = "/drivers";
}



//become driver
let availabilityState = null;

function hideAllPanels() {
    document.querySelectorAll(".ride-panel").forEach(p => {
        p.classList.remove("active");
    });
}

function showDriverMenu() {
    hideAllPanels();
    document.getElementById("driverMenu").classList.add("active");
}

function showDriverRegistration() {
    hideAllPanels();
    document.getElementById("driverRegistration").classList.add("active");
}

function showAvailabilityPanel() {
    hideAllPanels();
    document.getElementById("availabilityPanel").classList.add("active");
}

function submitDriver() {
    fetch("/register_driver", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: driverName.value,
            phone: driverPhone.value,
            vehicle: vehicleType.value
        })
    })
    .then(res => res.json())
    .then(data => {
        driverRegStatus.innerText = data.message;
    });
}

// let availabilityState = null;

function setAvailability(state) {
    const phone = document.getElementById("availPhone").value;

    if (!phone) {
        availabilityStatus.innerText = "❌ Phone number required";
        return;
    }

    availabilityState = state;

    if (state) {
        document.getElementById("locationBlock").style.display = "block";
    } else {
        document.getElementById("locationBlock").style.display = "none";
        submitAvailability();
    }
}


let driverLat = null;
let driverLon = null;

function getDriverLocation() {
    const status = document.getElementById("availabilityStatus");
    const locationInput = document.getElementById("availLocation");

    if (!navigator.geolocation) {
        status.innerText = "❌ Geolocation not supported.";
        return;
    }

    status.innerText = "📡 Detecting your location...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            driverLat = position.coords.latitude;
            driverLon = position.coords.longitude;

            try {
                status.innerText = "🗺️ Converting location...";

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${driverLat}&lon=${driverLon}`,
                    {
                        headers: {
                            "User-Agent": "IITK-Ride-Connect/1.0 (iitkride@example.com)"
                        }
                    }
                );

                const data = await response.json();

                const readableLocation =
                    data.display_name ||
                    data.address?.country ||
                    data.address?.suburb ||
                    data.address?.city ||
                    data.display_name;

                locationInput.value = readableLocation;

                status.innerText = "📍 Location detected. Please submit.";

            } catch (err) {
                console.error(err);
                status.innerText = "❌ Failed to reverse geocode. Enter manually.";
            }
        },
        () => {
            status.innerText = "❌ Unable to retrieve GPS location.";
        }
    );
}
function submitAvailability() {
    const phone = document.getElementById("availPhone").value;
    const location = document.getElementById("availLocation").value;
    const status = document.getElementById("availabilityStatus");

    if (!phone) {
        status.innerText = "❌ Phone required";
        return;
    }

    if (availabilityState && !location) {
        status.innerText = "❌ Location required";
        return;
    }

    fetch("/update_availability", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            phone: phone,
            available: availabilityState,
            location: location,
            lat: driverLat,
            lon: driverLon
        })
    })
    .then(res => res.json())
    .then(data => {
        availabilityStatus.innerText = data.message;
        status.innerText = "Submitted Successfully";
    })
    .catch(() => {
        availabilityStatus.innerText = "⚠️ Server error";
    });
}





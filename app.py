import os
from bson import ObjectId
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import requests
from pymongo import MongoClient
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
CORS(app)


latest_rider_location = {}

MONGODB_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGODB_URI)
db = client["mydb"]
drivers_col = db["vehicles"]


# @app.route("/api/get-drivers", methods=["GET"])
def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points
    Returns distance in kilometers
    """
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

@app.route("/api/get-drivers", methods=["GET"])
def get_drivers():
    # data = request.get_json()
    user_lat = session["user_lat"]
    user_lon = session["user_lon"]

    drivers = list(drivers_col.find({"status": "AVLBL"}, {"_id": 0}))

    for driver in drivers:
        driver_lat = driver.get("lat")
        driver_lon = driver.get("lon")
        if user_lat is not None and user_lon is not None and driver_lat is not None and driver_lon is not None:
            driver["distance_km"] = round(haversine(user_lat, user_lon, driver_lat, driver_lon), 2)
        else:
            driver["distance_km"] = None

    drivers.sort(key=lambda d: d["distance_km"] if d["distance_km"] is not None else float("inf"))
    return jsonify(drivers)





def reverse_geocode(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json"
    }
    headers = {
        "User-Agent": "IITK-Ride-App"
    }

    response = requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        data = response.json()
        return data.get("display_name", "Unknown Location")
    return "Unknown Location"


@app.route("/")
def index():
    session.clear()

    # Now create new session variables
    session['user_lat'] = None
    session['user_lon'] = None
    return render_template("index.html")

@app.route("/drivers")
def drivers():
    return render_template("drivers.html")



@app.route("/api/rider-location", methods=["POST"])
def save_rider_location():
    global latest_rider_location
    data = request.json

    if data["type"] == "manual":
        resolved_location = data["location"]

    elif data["type"] == "gps":
        lat = data["lati"]
        lon = data["longi"]
        session["user_lat"] = lat
        session["user_lon"] = lon
        resolved_location = reverse_geocode(lat, lon)
        print(resolved_location)

    else:
        return jsonify({"error": "Invalid type"}), 400

    latest_rider_location = {
        "resolved_location": resolved_location
    }

    return jsonify({
        "resolved_location": resolved_location
    })


@app.route("/api/rider-location", methods=["GET"])
def get_rider_location():
    print(latest_rider_location)
    return jsonify(latest_rider_location)





@app.route('/sms', methods=['POST'])
def sms_webhook():
    """
    Endpoint to process incoming SMS from gateway
    """
    # Get SMS data from gateway (Tasker/Twilio)
    from_number = "+"+request.form.get('From')
    sms_body = request.form.get('Body', '').strip()
    print(from_number)
    print(sms_body)
    # print(f"Received SMS from {from_number}: {sms_body}")

    # Only process SMS starting with IITKRC
    if not sms_body.upper().startswith('IITKRC'):
        return "Ignored", 200

    # Remove IITKRC prefix and split the rest
    command_text = sms_body[6:].strip()  # remove 'IITKRC'
    parts = command_text.split()
    
    if len(parts) == 0:
        return "No command found", 200

    command = parts[0].upper()

    # --- Handle Registration ---
    if command == 'REG' and len(parts) >= 3:
        driver_name = parts[1]
        vehicle_type = parts[2]
        drivers_col.update_one(
            {"phone": from_number},
            {"$set": {
                "name": driver_name,
                "vehicle_type": vehicle_type,
                "status": "UNAVLBL",
                "location": "",
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        return f"Driver {driver_name} registered.", 200

    # --- Handle Available ---
    elif command == 'AVLBL' and len(parts) >= 2:
        location = " ".join(parts[1:])
        drivers_col.update_one(
            {"phone": from_number},
            {"$set": {
                "status": "AVLBL",
                "location": location,
                "updated_at": datetime.utcnow()
            }}
        )
        return f"Status set to AVAILABLE at {location}.", 200

    # --- Handle Unavailable ---
    elif command == 'UNAVLBL':
        drivers_col.update_one(
            {"phone": from_number},
            {"$set": {
                "status": "UNAVLBL",
                "updated_at": datetime.utcnow()
            }}
        )
        return "Status set to UNAVAILABLE.", 200

    else:
        return "Invalid command format.", 200



@app.route("/register_driver", methods=["POST"])
def register_driver():
    data = request.get_json()

    name = data.get("name")
    phone = data.get("phone")
    vehicle_type = data.get("vehicle")

    if not all([name, phone, vehicle_type]):
        return jsonify({"message": "Missing fields"}), 400

    drivers_col.update_one(
        {"phone": phone},
        {"$set": {
            "name": name,
            "vehicle_type": vehicle_type,
            "status": "UNAVLBL",
            "location": "",
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )

    return jsonify({
        "message": f"✅ Driver {name} registered successfully"
    })


# ---------------- UPDATE AVAILABILITY ----------------
# @app.route("/update_availability", methods=["POST"])
# def update_availability():
#     data = request.get_json()

#     phone = data.get("phone")
#     available = data.get("available")
#     location = data.get("location", "")

#     if not phone:
#         return jsonify({"message": "Phone number required"}), 400

#     if available:
#         status = "AVLBL"
#     else:
#         status = "UNAVLBL"
#         location = ""

#     result = drivers_col.update_one(
#         {"phone": phone},
#         {"$set": {
#             "status": status,
#             "location": location,
#             "updated_at": datetime.utcnow()
#         }}
#     )

#     if result.matched_count == 0:
#         return jsonify({"message": " Driver not registered"}), 404

#     if status == "AVLBL":
#         return jsonify({
#             "message": f" You are now AVAILABLE at {location}"
#         })
#     else:
#         return jsonify({
#             "message": " You are now UNAVAILABLE"
#         })




@app.route("/update_availability", methods=["POST"])
def update_availability():
    data = request.get_json()

    phone = data.get("phone")
    available = data.get("available")
    location = data.get("location", "")
    lat = data.get("lat")
    lon = data.get("lon")
    # print(lat, lon)

    if not phone:
        return jsonify({"message": "Phone number required"}), 400

    if available:
        status = "AVLBL"
    else:
        status = "UNAVLBL"
        location = ""
        lat = None
        lon = None

    update_data = {
        "status": status,
        "location": location,
        "updated_at": datetime.utcnow()
    }

    # store GPS only if available
    if lat is not None and lon is not None:
        update_data["lat"] = lat
        update_data["lon"] = lon

    result = drivers_col.update_one(
        {"phone": phone},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"message": "❌ Driver not registered"}), 404

    if status == "AVLBL":
        return jsonify({
            "message": f"🟢 Available at {location}"
        })
    else:
        return jsonify({
            "message": "🔴 You are now unavailable"
        })





@app.route("/sms-guide")
def sms_guide():
    return render_template("sms_guide.html")




# @app.route("/api/drivers")
# def get_drivers():
#     # Dummy data for now
#     drivers = [
#         {"name": "Raju", "phone": "9876543210", "vehicleType": "Auto", "zone": "Hall 5"},
#         {"name": "Shyam", "phone": "9123456789", "vehicleType": "Taxi", "zone": "Main Gate"}
#     ]
#     return jsonify(drivers)



# @app.route("/set_location", methods=["POST"])
# def set_location():
#     data = request.json
#     session["lat"] = data["latitude"]
#     session["lon"] = data["longitude"]
#     return jsonify({"status": "ok"})

# Admin Page
@app.route("/admin")
def admin():
    return render_template("admin.html")

# Get all drivers (for JS fetch)
@app.route("/api/admin/drivers", methods=["GET"])
def get_drivers_admin():
    drivers = list(drivers_col.find({}, {"_id": 1, "name": 1, "phone": 1, "vehicle_type": 1, "status": 1, "location": 1}))
    for d in drivers:
        d["_id"] = str(d["_id"])  # convert ObjectId to string for JSON
    return jsonify(drivers)

# Update driver
@app.route("/api/admin/drivers/<driver_id>", methods=["POST"])
def update_driver(driver_id):
    data = request.get_json()
    drivers_col.update_one(
        {"_id": ObjectId(driver_id)},
        {"$set": data}
    )
    return jsonify({"success": True})

# Delete driver
@app.route("/api/admin/drivers/<driver_id>", methods=["DELETE"])
def delete_driver(driver_id):
    drivers_col.delete_one({"_id": ObjectId(driver_id)})
    return jsonify({"success": True})











if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True)

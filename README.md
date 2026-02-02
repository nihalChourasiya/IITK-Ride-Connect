# 🚖 IITK-RIDE-CONNECT

A **Flask + MongoDB** app to help riders find nearby drivers using **GPS or manual location**, and allow drivers to register/update availability via **SMS or Web**. Includes an **Admin Panel** for driver management.

---

## ✨ Key Features

### Rider
- Find rides using **GPS or manual input**
- Shows nearby available drivers sorted by distance

![Find Ride](https://github.com/user-attachments/assets/3cfd89d4-79af-494a-a10a-78f8be959257)

### Driver
- **SMS Registration** and availability updates  
  ![SMS Guide](https://github.com/user-attachments/assets/2d3673be-7977-48a9-b302-590f018105cd)
- **Web Registration & Availability**  
  ![Web Registration](https://github.com/user-attachments/assets/74463d6f-f7d6-4f03-82c5-0e73d56f0586)
  ![New Driver Registration](https://github.com/user-attachments/assets/d557df4e-72eb-447e-af1a-a46f6ca81ccd)
  ![Availability Update](https://github.com/user-attachments/assets/b97424eb-ec16-4472-8db3-4ed3a4459525)

### Nearby Drivers
- Distance-based sorting  
  ![Nearby Drivers](https://github.com/user-attachments/assets/eb91f868-14ef-4a18-83ef-3bbf73f76c89)

### Admin Panel
- View, edit, delete drivers  
  ![Admin Panel](https://github.com/user-attachments/assets/c3f95d9b-dbae-4573-96d6-b1fb2e9a9b9d)

---

## 🧰 Tech Stack
- **Backend:** Flask (Python)  
- **Database:** MongoDB Atlas  
- **Frontend:** HTML/CSS/JS  
- **Location:** GPS + OpenStreetMap API  
- **SMS Integration:** Twilio / Tasker  

---

## 🚀 Quick Setup

```bash
pip install -r requirements.txt
python app.py

# Quick Start Guide - Guest Features

## 🎯 New Features Overview

### 1️⃣ Upload Guest ID Card & Profile Picture
### 2️⃣ View Complete Guest Booking History

---

## 🚀 Quick Examples

### Example 1: Create Guest with Files (Postman/Insomnia)

**Endpoint:** `POST http://localhost:5001/api/guests`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| name | text | Sarah Williams |
| phone | text | +1234567893 |
| email | text | sarah@example.com |
| idCard | file | (select ID card image/PDF) |
| profilePicture | file | (select profile photo) |

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb6",
  "hostId": "694c39579553cc06d11f0eb3",
  "name": "Sarah Williams",
  "phone": "+1234567893",
  "email": "sarah@example.com",
  "idCard": "/uploads/guests/idCard-1703520000000-123456789.jpg",
  "profilePicture": "/uploads/guests/profilePicture-1703520000000-987654321.jpg",
  "createdAt": "2025-12-25T10:00:00.000Z",
  "updatedAt": "2025-12-25T10:00:00.000Z"
}
```

---

### Example 2: View Guest Booking History

**Endpoint:** `GET http://localhost:5001/api/guests/694c39579553cc06d11f0eb6/bookings`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "guest": {
    "id": "694c39579553cc06d11f0eb6",
    "name": "Sarah Williams",
    "email": "sarah@example.com",
    "phone": "+1234567893"
  },
  "bookings": [
    {
      "id": "booking123",
      "property_id": {
        "title": "Beach House",
        "location": "Miami"
      },
      "start_date": "2025-12-30",
      "end_date": "2026-01-05",
      "amount": 1500
    }
  ],
  "statistics": {
    "totalBookings": 5,
    "upcomingBookings": 2,
    "pastBookings": 2,
    "currentBookings": 1,
    "totalSpent": 7500,
    "totalNights": 25,
    "averageStayDuration": 5.0
  }
}
```

---

### Example 3: Update Guest ID Card

**Endpoint:** `PUT http://localhost:5001/api/guests/694c39579553cc06d11f0eb6`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| idCard | file | (select new ID card) |

*(Old ID card will be automatically deleted)*

---

### Example 4: Access Uploaded Files

**ID Card URL:**
```
http://localhost:5001/uploads/guests/idCard-1703520000000-123456789.jpg
```

**Profile Picture URL:**
```
http://localhost:5001/uploads/guests/profilePicture-1703520000000-987654321.jpg
```

Use these URLs in your frontend:
```html
<img src="http://localhost:5001/uploads/guests/profilePicture-1703520000000-987654321.jpg" 
     alt="Guest Profile">
```

---

## 📋 Frontend Integration (React Example)

### Upload Guest with Files

```javascript
import React, { useState } from 'react';

function CreateGuestForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idCard: null,
    profilePicture: null
  });

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    data.append('email', formData.email);
    
    if (formData.idCard) {
      data.append('idCard', formData.idCard);
    }
    if (formData.profilePicture) {
      data.append('profilePicture', formData.profilePicture);
    }

    const response = await fetch('http://localhost:5001/api/guests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: data
    });

    const guest = await response.json();
    console.log('Guest created:', guest);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        name="name" 
        placeholder="Name"
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required 
      />
      
      <input 
        type="email" 
        name="email" 
        placeholder="Email"
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required 
      />
      
      <input 
        type="tel" 
        name="phone" 
        placeholder="Phone"
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required 
      />
      
      <label>ID Card:</label>
      <input 
        type="file" 
        name="idCard" 
        accept="image/*,.pdf"
        onChange={handleFileChange}
      />
      
      <label>Profile Picture:</label>
      <input 
        type="file" 
        name="profilePicture" 
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <button type="submit">Create Guest</button>
    </form>
  );
}

export default CreateGuestForm;
```

### Display Guest Booking History

```javascript
import React, { useEffect, useState } from 'react';

function GuestBookingHistory({ guestId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingHistory = async () => {
      const response = await fetch(
        `http://localhost:5001/api/guests/${guestId}/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const result = await response.json();
      setData(result);
      setLoading(false);
    };

    fetchBookingHistory();
  }, [guestId]);

  if (loading) return <div>Loading...</div>;

  const { guest, bookings, statistics } = data;

  return (
    <div>
      <h2>{guest.name}'s Booking History</h2>
      
      {/* Guest Profile */}
      <div className="guest-profile">
        {guest.profilePicture && (
          <img 
            src={`http://localhost:5001${guest.profilePicture}`}
            alt={guest.name}
            width="100"
          />
        )}
        <p>Email: {guest.email}</p>
        <p>Phone: {guest.phone}</p>
      </div>

      {/* Statistics */}
      <div className="statistics">
        <h3>Statistics</h3>
        <p>Total Bookings: {statistics.totalBookings}</p>
        <p>Total Spent: ${statistics.totalSpent}</p>
        <p>Average Stay: {statistics.averageStayDuration} nights</p>
        <p>Upcoming Bookings: {statistics.upcomingBookings}</p>
      </div>

      {/* Booking List */}
      <div className="bookings">
        <h3>Bookings</h3>
        {bookings.map(booking => (
          <div key={booking.id} className="booking-card">
            <h4>{booking.property_id.title}</h4>
            <p>{booking.property_id.location}</p>
            <p>Check-in: {new Date(booking.start_date).toLocaleDateString()}</p>
            <p>Check-out: {new Date(booking.end_date).toLocaleDateString()}</p>
            <p>Amount: ${booking.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuestBookingHistory;
```

---

## 🎨 File Upload Best Practices

### Accepted File Types
- **ID Card:** JPEG, JPG, PNG, GIF, PDF
- **Profile Picture:** JPEG, JPG, PNG, GIF

### File Size Limits
- Maximum: 5MB per file
- Recommended: Under 2MB for faster uploads

### Recommended Image Sizes
- **Profile Picture:** 400x400px (square)
- **ID Card:** Original size (will be stored as-is)

---

## ❓ Common Use Cases

### Use Case 1: Guest Check-In
1. Get guest details: `GET /api/guests/:id`
2. View booking history: `GET /api/guests/:id/bookings`
3. Display guest photo and verify ID card
4. Check for any special preferences or notes

### Use Case 2: Guest Verification
1. Request guest to upload ID card during registration
2. Review ID card: Access via `guest.idCard` URL
3. Approve or request resubmission
4. Update guest verification status

### Use Case 3: Loyalty Program
1. Get guest booking history: `GET /api/guests/:id/bookings`
2. Check `statistics.totalBookings` and `statistics.totalSpent`
3. Assign loyalty tier based on metrics
4. Offer rewards for frequent guests

### Use Case 4: Guest Dashboard
1. Display guest profile picture
2. Show booking statistics
3. List upcoming and past bookings
4. Calculate guest lifetime value

---

## 🔍 Troubleshooting

### File Upload Fails
**Problem:** "Only images and PDF files are allowed!"
**Solution:** Ensure file is JPEG, PNG, GIF, or PDF format

**Problem:** "File too large"
**Solution:** Compress file to under 5MB

### Cannot Access Uploaded Files
**Problem:** 404 error when accessing file URL
**Solution:** Ensure server is serving static files from `/uploads` directory

### Booking History Empty
**Problem:** Returns empty bookings array
**Solution:** Ensure guest has associated bookings in the database

---

## 📞 API Endpoints Summary

| Method | Endpoint | Purpose | File Upload |
|--------|----------|---------|-------------|
| POST | `/api/guests` | Create guest | ✅ Optional |
| GET | `/api/guests/:id` | Get guest details | ❌ No |
| PUT | `/api/guests/:id` | Update guest | ✅ Optional |
| DELETE | `/api/guests/:id` | Delete guest | ❌ No |
| GET | `/api/guests/:id/bookings` | Get booking history | ❌ No |

---

## 🎓 Learn More

For complete documentation, see:
- **GUESTS_API.md** - Full API reference
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details

---

## 💡 Tips

1. **Always validate files on frontend** before upload to improve UX
2. **Show upload progress** for better user experience
3. **Cache booking history** to reduce API calls
4. **Display thumbnails** of ID cards for quick verification
5. **Implement lazy loading** for guest profile pictures
6. **Use guest statistics** to identify VIP customers

---

Happy coding! 🚀


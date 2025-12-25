# Bookings API Guide

## Overview
This guide provides comprehensive documentation for the Bookings API endpoints. The API allows you to manage property bookings, including creating, reading, updating, and deleting booking records.

**Base URL:** `http://localhost:5001/api/bookings`

**Version:** 1.0

---

## Authentication

All booking endpoints require authentication via JWT token.

### Required Header
```
Authorization: Bearer <your_jwt_token>
```

### How to Obtain Token
Make a POST request to `/api/auth/login` with valid credentials to receive a JWT token.

**Example:**
```javascript
const response = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'yourpassword'
  })
});
const { token } = await response.json();
```

---

## Data Model

### Booking Object
```javascript
{
  "id": "string (MongoDB ObjectId)",
  "hostId": "string (MongoDB ObjectId)",
  "property_id": "string (MongoDB ObjectId)",
  "guest_id": "string (MongoDB ObjectId)",
  "start_date": "string (ISO 8601 date)",
  "end_date": "string (ISO 8601 date)",
  "amount": "number (minimum: 0)",
  "discount": "number (minimum: 0, default: 0)",
  "status": "string (enum)",
  "payment_status": "string (enum)",
  "createdAt": "string (ISO 8601 timestamp)",
  "updatedAt": "string (ISO 8601 timestamp)"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Auto-generated | Unique booking identifier |
| `hostId` | String | Yes | Reference to the host user |
| `property_id` | String | Yes | Reference to the property being booked |
| `guest_id` | String | Yes | Reference to the guest making the booking |
| `start_date` | Date | Yes | Check-in date (ISO 8601 format) |
| `end_date` | Date | Yes | Check-out date (must be after start_date) |
| `amount` | Number | Yes | Total booking amount (non-negative) |
| `discount` | Number | No | Discount amount (default: 0, non-negative) |
| `status` | String | No | Booking status (default: 'pending') |
| `payment_status` | String | No | Payment status (default: 'unpaid') |
| `createdAt` | Date | Auto-generated | Record creation timestamp |
| `updatedAt` | Date | Auto-generated | Last update timestamp |

### Enum Values

**Booking Status:**
- `pending` - Booking is pending confirmation
- `confirmed` - Booking has been confirmed
- `checked-in` - Guest has checked in
- `checked-out` - Guest has checked out
- `cancelled` - Booking has been cancelled

**Payment Status:**
- `unpaid` - No payment received
- `partially-paid` - Partial payment received
- `paid` - Full payment received
- `refunded` - Payment has been refunded

---

## Endpoints

### 1. Get All Bookings

Retrieve all bookings with optional filtering by date range or period.

**Endpoint:** `GET /api/bookings`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | String (ISO 8601) | No | Filter bookings starting from this date |
| `endDate` | String (ISO 8601) | No | Filter bookings up to this date |
| `period` | String | No | Predefined period filter (see values below) |

**Period Values:**
- `today` - Bookings starting today
- `week` - Last 7 days
- `15days` - Last 15 days
- `month` - Last month
- `6months` - Last 6 months
- `year` - Last year

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "hostId": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "property_id": {
      "_id": "507f191e810c19729de860eb",
      "title": "Cozy Beach House",
      "location": "Miami, FL",
      "price": 150
    },
    "guest_id": {
      "_id": "507f191e810c19729de860ec",
      "name": "Jane Smith",
      "phone": "+1234567890",
      "email": "jane@example.com"
    },
    "start_date": "2025-01-01T00:00:00.000Z",
    "end_date": "2025-01-05T00:00:00.000Z",
    "amount": 600,
    "discount": 50,
    "status": "confirmed",
    "payment_status": "paid",
    "createdAt": "2024-12-20T10:00:00.000Z",
    "updatedAt": "2024-12-20T10:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

**JavaScript Example:**
```javascript
// Get all bookings
const response = await fetch('http://localhost:5001/api/bookings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const bookings = await response.json();

// Get bookings for last week
const weekBookings = await fetch('http://localhost:5001/api/bookings?period=week', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get bookings for custom date range
const customBookings = await fetch(
  'http://localhost:5001/api/bookings?startDate=2025-01-01&endDate=2025-01-31',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

### 2. Get Booking by ID

Retrieve a specific booking by its ID.

**Endpoint:** `GET /api/bookings/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Booking ID (MongoDB ObjectId) |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "hostId": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "_id": "507f191e810c19729de860eb",
    "title": "Cozy Beach House",
    "location": "Miami, FL",
    "price": 150
  },
  "guest_id": {
    "_id": "507f191e810c19729de860ec",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "email": "jane@example.com"
  },
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-01-05T00:00:00.000Z",
  "amount": 600,
  "discount": 50,
  "status": "confirmed",
  "payment_status": "paid",
  "createdAt": "2024-12-20T10:00:00.000Z",
  "updatedAt": "2024-12-20T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Booking not found
- `500 Internal Server Error` - Server error

**JavaScript Example:**
```javascript
const bookingId = '507f1f77bcf86cd799439011';
const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

if (response.ok) {
  const booking = await response.json();
  console.log('Booking:', booking);
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

---

### 3. Create New Booking

Create a new booking record.

**Endpoint:** `POST /api/bookings`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "property_id": "507f191e810c19729de860eb",
  "guest_id": "507f191e810c19729de860ec",
  "start_date": "2025-01-01",
  "end_date": "2025-01-05",
  "amount": 600,
  "discount": 50,
  "payment_status": "unpaid"
}
```

**Required Fields:**
- `property_id` (String) - Must be a valid property ID that belongs to the host
- `guest_id` (String) - Must be a valid guest ID that belongs to the host
- `start_date` (String/Date) - Check-in date in ISO 8601 format
- `end_date` (String/Date) - Check-out date (must be after start_date)
- `amount` (Number) - Total booking amount (must be >= 0)

**Optional Fields:**
- `discount` (Number) - Discount amount (default: 0, must be >= 0)
- `payment_status` (String) - One of: 'unpaid', 'partially-paid', 'paid', 'refunded' (default: 'unpaid')

**Success Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "hostId": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "_id": "507f191e810c19729de860eb",
    "title": "Cozy Beach House",
    "location": "Miami, FL",
    "price": 150
  },
  "guest_id": {
    "_id": "507f191e810c19729de860ec",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "email": "jane@example.com"
  },
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-01-05T00:00:00.000Z",
  "amount": 600,
  "discount": 50,
  "status": "pending",
  "payment_status": "unpaid",
  "createdAt": "2024-12-25T10:00:00.000Z",
  "updatedAt": "2024-12-25T10:00:00.000Z"
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "property_id, guest_id, start_date, end_date, and amount are required"
}
```

**400 Bad Request (Invalid amount):**
```json
{
  "error": "Amount must be a positive number"
}
```

**400 Bad Request (Invalid discount):**
```json
{
  "error": "Discount must be a non-negative number"
}
```

**400 Bad Request (Invalid payment status):**
```json
{
  "error": "Invalid payment status. Must be one of: unpaid, partially-paid, paid, refunded"
}
```

**400 Bad Request (Invalid date format):**
```json
{
  "error": "Invalid start_date format"
}
```

**400 Bad Request (Date validation):**
```json
{
  "error": "End date must be after start date"
}
```

**404 Not Found (Property):**
```json
{
  "error": "Property not found"
}
```

**404 Not Found (Guest):**
```json
{
  "error": "Guest not found"
}
```

**JavaScript Example:**
```javascript
const bookingData = {
  property_id: '507f191e810c19729de860eb',
  guest_id: '507f191e810c19729de860ec',
  start_date: '2025-01-01',
  end_date: '2025-01-05',
  amount: 600,
  discount: 50,
  payment_status: 'unpaid'
};

const response = await fetch('http://localhost:5001/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(bookingData)
});

if (response.ok) {
  const newBooking = await response.json();
  console.log('Booking created:', newBooking);
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

---

### 4. Update Booking

Update an existing booking (full update).

**Endpoint:** `PUT /api/bookings/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Booking ID (MongoDB ObjectId) |

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "property_id": "507f191e810c19729de860eb",
  "guest_id": "507f191e810c19729de860ec",
  "start_date": "2025-01-02",
  "end_date": "2025-01-06",
  "amount": 650,
  "discount": 100
}
```

**Available Fields:**
- `property_id` (String) - Update the property
- `guest_id` (String) - Update the guest
- `start_date` (String/Date) - Update check-in date
- `end_date` (String/Date) - Update check-out date
- `amount` (Number) - Update booking amount (must be >= 0)
- `discount` (Number) - Update discount (must be >= 0)

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "hostId": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "_id": "507f191e810c19729de860eb",
    "title": "Cozy Beach House",
    "location": "Miami, FL",
    "price": 150
  },
  "guest_id": {
    "_id": "507f191e810c19729de860ec",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "email": "jane@example.com"
  },
  "start_date": "2025-01-02T00:00:00.000Z",
  "end_date": "2025-01-06T00:00:00.000Z",
  "amount": 650,
  "discount": 100,
  "status": "pending",
  "payment_status": "unpaid",
  "createdAt": "2024-12-25T10:00:00.000Z",
  "updatedAt": "2024-12-25T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors (similar to create endpoint)
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Booking not found
- `500 Internal Server Error` - Server error

**JavaScript Example:**
```javascript
const bookingId = '507f1f77bcf86cd799439011';
const updateData = {
  amount: 650,
  discount: 100,
  end_date: '2025-01-06'
};

const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

if (response.ok) {
  const updatedBooking = await response.json();
  console.log('Booking updated:', updatedBooking);
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

---

### 5. Update Booking Status

Update only the booking status (partial update).

**Endpoint:** `PATCH /api/bookings/:id/status`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Booking ID (MongoDB ObjectId) |

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Required Fields:**
- `status` (String) - Must be one of: 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "hostId": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "_id": "507f191e810c19729de860eb",
    "title": "Cozy Beach House",
    "location": "Miami, FL",
    "price": 150
  },
  "guest_id": {
    "_id": "507f191e810c19729de860ec",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "email": "jane@example.com"
  },
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-01-05T00:00:00.000Z",
  "amount": 600,
  "discount": 50,
  "status": "confirmed",
  "payment_status": "unpaid",
  "createdAt": "2024-12-25T10:00:00.000Z",
  "updatedAt": "2024-12-25T12:00:00.000Z"
}
```

**Error Responses:**

**400 Bad Request (Missing status):**
```json
{
  "error": "Status is required"
}
```

**400 Bad Request (Invalid status):**
```json
{
  "error": "Invalid status. Must be one of: pending, confirmed, checked-in, checked-out, cancelled"
}
```

**401 Unauthorized:**
```json
{
  "error": "Not authorized to access this route"
}
```

**404 Not Found:**
```json
{
  "error": "Booking not found"
}
```

**JavaScript Example:**
```javascript
const bookingId = '507f1f77bcf86cd799439011';

// Confirm booking
const confirmResponse = await fetch(
  `http://localhost:5001/api/bookings/${bookingId}/status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'confirmed' })
  }
);

// Check-in guest
const checkinResponse = await fetch(
  `http://localhost:5001/api/bookings/${bookingId}/status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'checked-in' })
  }
);

// Cancel booking
const cancelResponse = await fetch(
  `http://localhost:5001/api/bookings/${bookingId}/status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'cancelled' })
  }
);
```

---

### 6. Update Payment Status

Update only the payment status (partial update).

**Endpoint:** `PATCH /api/bookings/:id/payment-status`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Booking ID (MongoDB ObjectId) |

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "payment_status": "paid"
}
```

**Required Fields:**
- `payment_status` (String) - Must be one of: 'unpaid', 'partially-paid', 'paid', 'refunded'

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "hostId": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "_id": "507f191e810c19729de860eb",
    "title": "Cozy Beach House",
    "location": "Miami, FL",
    "price": 150
  },
  "guest_id": {
    "_id": "507f191e810c19729de860ec",
    "name": "Jane Smith",
    "phone": "+1234567890",
    "email": "jane@example.com"
  },
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-01-05T00:00:00.000Z",
  "amount": 600,
  "discount": 50,
  "status": "confirmed",
  "payment_status": "paid",
  "createdAt": "2024-12-25T10:00:00.000Z",
  "updatedAt": "2024-12-25T13:00:00.000Z"
}
```

**Error Responses:**

**400 Bad Request (Missing payment status):**
```json
{
  "error": "Payment status is required"
}
```

**400 Bad Request (Invalid payment status):**
```json
{
  "error": "Invalid payment status. Must be one of: unpaid, partially-paid, paid, refunded"
}
```

**401 Unauthorized:**
```json
{
  "error": "Not authorized to access this route"
}
```

**404 Not Found:**
```json
{
  "error": "Booking not found"
}
```

**JavaScript Example:**
```javascript
const bookingId = '507f1f77bcf86cd799439011';

// Mark as paid
const paidResponse = await fetch(
  `http://localhost:5001/api/bookings/${bookingId}/payment-status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ payment_status: 'paid' })
  }
);

// Mark as partially paid
const partialResponse = await fetch(
  `http://localhost:5001/api/bookings/${bookingId}/payment-status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ payment_status: 'partially-paid' })
  }
);

// Refund payment
const refundResponse = await fetch(
  `http://localhost:5001/api/bookings/${bookingId}/payment-status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ payment_status: 'refunded' })
  }
);

if (paidResponse.ok) {
  const updatedBooking = await paidResponse.json();
  console.log('Payment status updated:', updatedBooking);
}
```

---

### 7. Delete Booking

Delete a booking record.

**Endpoint:** `DELETE /api/bookings/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | Yes | Booking ID (MongoDB ObjectId) |

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "message": "Booking deleted successfully"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Not authorized to access this route"
}
```

**404 Not Found:**
```json
{
  "error": "Booking not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error message here"
}
```

**JavaScript Example:**
```javascript
const bookingId = '507f1f77bcf86cd799439011';

const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

if (response.ok) {
  const result = await response.json();
  console.log(result.message); // "Booking deleted successfully"
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
Occurs when authentication token is missing or invalid.
```json
{
  "error": "Not authorized to access this route",
  "hint": "Please include Authorization header with Bearer token"
}
```

**Solution:** Include valid JWT token in Authorization header.

#### 403 Forbidden
Occurs when user doesn't have permission to access the resource (e.g., trying to access another host's booking).
```json
{
  "error": "Access denied"
}
```

**Solution:** Ensure the resource belongs to the authenticated user.

#### 404 Not Found
Occurs when the requested resource doesn't exist.
```json
{
  "error": "Booking not found"
}
```

**Solution:** Verify the booking ID is correct and the resource exists.

#### 400 Bad Request
Occurs when request validation fails.
```json
{
  "error": "Validation error message here"
}
```

**Solution:** Check the error message and fix the request data accordingly.

#### 500 Internal Server Error
Occurs when an unexpected server error happens.
```json
{
  "error": "Error message here"
}
```

**Solution:** Contact the backend team if this persists.

---

## Best Practices

### 1. Error Handling
Always check the response status and handle errors appropriately:

```javascript
async function getBookings(token) {
  try {
    const response = await fetch('http://localhost:5001/api/bookings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch bookings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}
```

### 2. Date Formatting
Always use ISO 8601 date format when sending dates:

```javascript
const startDate = new Date('2025-01-01').toISOString(); // "2025-01-01T00:00:00.000Z"
```

### 3. Token Management
Store and refresh tokens securely:

```javascript
// Store token in localStorage or secure storage
localStorage.setItem('authToken', token);

// Retrieve token for API calls
const token = localStorage.getItem('authToken');

// Remove token on logout
localStorage.removeItem('authToken');
```

### 4. Pagination (Future Enhancement)
Currently, all bookings are returned in one request. Use filtering by date range to limit results:

```javascript
// Get recent bookings only
const recentBookings = await fetch(
  'http://localhost:5001/api/bookings?period=month',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

---

## Complete React/JavaScript Example

Here's a complete example of a booking service module:

```javascript
// bookingService.js
const API_BASE_URL = 'http://localhost:5001/api/bookings';

class BookingService {
  constructor(token) {
    this.token = token;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAllBookings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_BASE_URL}?${queryParams}` : API_BASE_URL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }

  async getBookingById(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }

  async createBooking(bookingData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }

  async updateBooking(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }

  async updateBookingStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }

  async updatePaymentStatus(id, paymentStatus) {
    const response = await fetch(`${API_BASE_URL}/${id}/payment-status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ payment_status: paymentStatus })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }

  async deleteBooking(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  }
}

// Usage Example
const token = localStorage.getItem('authToken');
const bookingService = new BookingService(token);

// Get all bookings
const bookings = await bookingService.getAllBookings();

// Get bookings for last week
const weekBookings = await bookingService.getAllBookings({ period: 'week' });

// Create new booking
const newBooking = await bookingService.createBooking({
  property_id: '507f191e810c19729de860eb',
  guest_id: '507f191e810c19729de860ec',
  start_date: '2025-01-01',
  end_date: '2025-01-05',
  amount: 600,
  discount: 50
});

// Update booking status
await bookingService.updateBookingStatus(newBooking.id, 'confirmed');

// Update payment status
await bookingService.updatePaymentStatus(newBooking.id, 'paid');

// Delete booking
await bookingService.deleteBooking(newBooking.id);

export default BookingService;
```

---

## React Hook Example

```javascript
// useBookings.js
import { useState, useEffect } from 'react';
import BookingService from './bookingService';

export const useBookings = (token, filters = {}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bookingService = new BookingService(token);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getAllBookings(filters);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token, JSON.stringify(filters)]);

  const createBooking = async (bookingData) => {
    try {
      const newBooking = await bookingService.createBooking(bookingData);
      setBookings([newBooking, ...bookings]);
      return newBooking;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const updated = await bookingService.updateBookingStatus(id, status);
      setBookings(bookings.map(b => b.id === id ? updated : b));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteBooking = async (id) => {
    try {
      await bookingService.deleteBooking(id);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    updateBookingStatus,
    deleteBooking
  };
};

// Usage in Component
function BookingsPage() {
  const token = localStorage.getItem('authToken');
  const { bookings, loading, error, createBooking, updateBookingStatus } = 
    useBookings(token, { period: 'week' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Bookings</h1>
      {bookings.map(booking => (
        <div key={booking.id}>
          <h3>{booking.property_id.title}</h3>
          <p>Guest: {booking.guest_id.name}</p>
          <p>Status: {booking.status}</p>
          <button onClick={() => updateBookingStatus(booking.id, 'confirmed')}>
            Confirm
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing with cURL

For testing purposes, you can use cURL commands:

### Get All Bookings
```bash
curl -X GET http://localhost:5001/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Booking by ID
```bash
curl -X GET http://localhost:5001/api/bookings/BOOKING_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Booking
```bash
curl -X POST http://localhost:5001/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "507f191e810c19729de860eb",
    "guest_id": "507f191e810c19729de860ec",
    "start_date": "2025-01-01",
    "end_date": "2025-01-05",
    "amount": 600,
    "discount": 50
  }'
```

### Update Booking Status
```bash
curl -X PATCH http://localhost:5001/api/bookings/BOOKING_ID_HERE/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### Update Payment Status
```bash
curl -X PATCH http://localhost:5001/api/bookings/BOOKING_ID_HERE/payment-status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"payment_status": "paid"}'
```

### Delete Booking
```bash
curl -X DELETE http://localhost:5001/api/bookings/BOOKING_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Multi-Tenant Behavior

The API implements multi-tenant architecture:

- **Hosts**: Can only view/modify bookings associated with their properties and guests
- **Superadmins**: Can view/modify all bookings across all hosts
- The system automatically filters data based on the authenticated user's role

This is handled transparently by the backend middleware, so frontend developers don't need to implement additional filtering logic.

---

## Support

For issues, questions, or feature requests, please contact the backend development team.

**API Version:** 1.0  
**Last Updated:** December 25, 2025


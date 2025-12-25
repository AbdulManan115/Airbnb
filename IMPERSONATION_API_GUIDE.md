# Host Impersonation API Guide

## Overview
This guide provides comprehensive documentation for the Host Impersonation API endpoints. This feature allows superadmin users to switch into any host's account for troubleshooting and support purposes.

**Base URL:** `http://localhost:5001/api/superadmin`

**Version:** 1.0

---

## Table of Contents
1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Security Features](#security-features)
4. [Implementation Details](#implementation-details)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [Audit Logging](#audit-logging)

---

## Authentication

All impersonation endpoints require authentication via JWT token.

### Required Header
```
Authorization: Bearer <your_jwt_token>
```

### Permission Requirements
- **Impersonate Host:** Requires `role: "superadmin"`
- **Stop Impersonation:** Requires an active impersonation token

---

## Endpoints

### 1. Impersonate Host

Switch the current superadmin session to view the platform as a specific host.

**Endpoint:** `POST /api/superadmin/impersonate/:hostId`

**Authorization:** Superadmin only

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hostId` | String | Yes | MongoDB ObjectId of the host to impersonate |

**Headers:**
```
Authorization: Bearer <superadmin_jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": {
      "_id": "507f191e810c19729de860ea",
      "name": "host",
      "permissions": []
    },
    "host": true,
    "hostId": null,
    "permissions": [],
    "businessName": "John's Properties",
    "impersonatedBy": "superadmin",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-12-25T10:30:00.000Z"
  }
}
```

**Response Fields:**
- `success` (Boolean) - Indicates if the operation was successful
- `token` (String) - New JWT token representing the impersonated host session
- `user` (Object) - Complete host user object with all properties
- `user.impersonatedBy` (String) - ID of the superadmin performing impersonation (critical for frontend)

**Error Responses:**

**403 Forbidden - Not a Superadmin:**
```json
{
  "success": false,
  "error": "Unauthorized. Superadmin access required."
}
```

**404 Not Found - Host Not Found:**
```json
{
  "success": false,
  "error": "Host not found"
}
```

**400 Bad Request - Invalid Host ID Format:**
```json
{
  "success": false,
  "error": "Invalid host ID format"
}
```

**400 Bad Request - Not a Host User:**
```json
{
  "success": false,
  "error": "Cannot impersonate non-host users. User must be a host account."
}
```

**401 Unauthorized - Missing Token:**
```json
{
  "success": false,
  "error": "Authorization token not found"
}
```

**JavaScript Example:**
```javascript
// Impersonate a host
async function impersonateHost(hostId, superadminToken) {
  try {
    const response = await fetch(
      `http://localhost:5001/api/superadmin/impersonate/${hostId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${superadminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    
    // Store the new impersonation token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    // Check if we're impersonating
    if (data.user.impersonatedBy) {
      console.log('Now viewing as:', data.user.name);
      localStorage.setItem('isImpersonating', 'true');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to impersonate host:', error);
    throw error;
  }
}

// Usage
const hostId = '507f1f77bcf86cd799439011';
const superadminToken = localStorage.getItem('authToken');
const result = await impersonateHost(hostId, superadminToken);
```

---

### 2. Stop Impersonation

Return from an impersonated host session back to the original superadmin session.

**Endpoint:** `POST /api/superadmin/stop-impersonation`

**Authorization:** Requires active impersonation token

**Headers:**
```
Authorization: Bearer <impersonation_jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "superadmin",
    "id": "superadmin",
    "name": "Super Admin",
    "email": "admin@zuhahosts.com",
    "role": "superadmin",
    "permissions": ["all"],
    "isSuperAdmin": true
  }
}
```

**Response Fields:**
- `success` (Boolean) - Indicates if the operation was successful
- `token` (String) - Original superadmin JWT token
- `user` (Object) - Superadmin user object

**Error Responses:**

**400 Bad Request - Not Impersonating:**
```json
{
  "success": false,
  "error": "Not currently impersonating any user"
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**401 Unauthorized - Original Session Expired:**
```json
{
  "success": false,
  "error": "Original session has expired. Please login again."
}
```

**401 Unauthorized - Missing Token:**
```json
{
  "success": false,
  "error": "Authorization token not found"
}
```

**JavaScript Example:**
```javascript
// Stop impersonation
async function stopImpersonation(impersonationToken) {
  try {
    const response = await fetch(
      'http://localhost:5001/api/superadmin/stop-impersonation',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${impersonationToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    
    // Restore the original superadmin token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.removeItem('isImpersonating');
    
    console.log('Returned to superadmin session');
    
    return data;
  } catch (error) {
    console.error('Failed to stop impersonation:', error);
    throw error;
  }
}

// Usage
const currentToken = localStorage.getItem('authToken');
const result = await stopImpersonation(currentToken);
```

---

## Security Features

### 1. Embedded Token Architecture
The impersonation uses a stateless embedded token approach:
- When impersonating, the original superadmin token is embedded inside the new impersonation token
- No server-side session storage required
- The original token is retrieved when stopping impersonation
- Both tokens are validated for expiration

### 2. Token Expiration
- **Impersonation Token:** Default 8 hours (configurable via `IMPERSONATION_TOKEN_EXPIRY` env variable)
- **Original Token:** Must still be valid when stopping impersonation
- If the original token expires, superadmin must login again

### 3. Host Validation
The API validates that:
- The target user exists in the database
- The user has `host: true` field set
- The user has `hostId: null` (is not a team member)
- Only actual host accounts can be impersonated

### 4. Permission Verification
- Only users with `role: "superadmin"` can initiate impersonation
- Impersonation tokens are marked with `impersonation: true` flag
- The middleware automatically handles impersonated sessions

### 5. Audit Logging
All impersonation actions are logged to the database:
- **IMPERSONATION_START** - When impersonation begins
- **IMPERSONATION_END** - When impersonation ends
- **IMPERSONATION_ACTION** - Individual API calls (optional, configurable)

Each log includes:
- Superadmin ID and email
- Target host ID and email
- IP address
- User agent
- Timestamp
- Duration (for END actions)

---

## Implementation Details

### Token Structure

**Impersonation Token Payload:**
```javascript
{
  "userId": "507f1f77bcf86cd799439011",  // Host's user ID
  "role": "host",
  "host": true,
  "hostId": null,
  "impersonation": true,
  "impersonatedBy": "superadmin",         // Superadmin's ID
  "originalToken": "eyJhbGci...",         // Embedded original token
  "iat": 1735128000,
  "exp": 1735156800                        // 8 hours expiry
}
```

### Middleware Behavior

The authentication middleware (`authMiddleware.js`) automatically detects impersonation tokens:

1. Checks if token has `impersonation: true` flag
2. Logs the action if `ENABLE_IMPERSONATION_LOGGING=true`
3. Fetches the host user from database
4. Attaches user with `impersonatedBy` metadata to request
5. Sets `req.isImpersonating = true` for easy detection

### Multi-Tenant Compatibility

The impersonation feature works seamlessly with the existing multi-tenant architecture:

- When impersonating, all API calls are scoped to the host's data
- The `getEffectiveHostId()` middleware function returns the impersonated host's ID
- All existing endpoints work without modification
- Data isolation is maintained

---

## Error Handling

### Common Error Scenarios

#### 1. Attempting to Impersonate Without Superadmin Role
```javascript
// Response: 403 Forbidden
{
  "success": false,
  "error": "Unauthorized. Superadmin access required."
}
```

**Solution:** Ensure the user has superadmin role before attempting impersonation.

#### 2. Invalid Host ID
```javascript
// Response: 400 Bad Request
{
  "success": false,
  "error": "Invalid host ID format"
}
```

**Solution:** Verify the host ID is a valid 24-character MongoDB ObjectId.

#### 3. Host Not Found
```javascript
// Response: 404 Not Found
{
  "success": false,
  "error": "Host not found"
}
```

**Solution:** Check that the host exists in the database and hasn't been deleted.

#### 4. Impersonating Team Member Instead of Host
```javascript
// Response: 400 Bad Request
{
  "success": false,
  "error": "Cannot impersonate non-host users. User must be a host account."
}
```

**Solution:** Only impersonate users where `host: true` and `hostId: null`.

#### 5. Original Session Expired
```javascript
// Response: 401 Unauthorized
{
  "success": false,
  "error": "Original session has expired. Please login again."
}
```

**Solution:** The superadmin must re-authenticate. Stop impersonation is not possible.

#### 6. Not Currently Impersonating
```javascript
// Response: 400 Bad Request
{
  "success": false,
  "error": "Not currently impersonating any user"
}
```

**Solution:** This endpoint only works with impersonation tokens. Don't call it from regular sessions.

---

## Code Examples

### Complete React Implementation

```javascript
// services/impersonationService.js
const API_BASE_URL = 'http://localhost:5001/api/superadmin';

class ImpersonationService {
  async impersonateHost(hostId) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/impersonate/${hostId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to impersonate host');
    }

    const data = await response.json();
    
    // Store new token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('isImpersonating', 'true');
    localStorage.setItem('impersonatedHost', JSON.stringify({
      id: data.user._id,
      name: data.user.name,
      email: data.user.email
    }));

    return data;
  }

  async stopImpersonation() {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/stop-impersonation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop impersonation');
    }

    const data = await response.json();
    
    // Restore original token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.removeItem('isImpersonating');
    localStorage.removeItem('impersonatedHost');

    return data;
  }

  isCurrentlyImpersonating() {
    return localStorage.getItem('isImpersonating') === 'true';
  }

  getImpersonatedHost() {
    const hostData = localStorage.getItem('impersonatedHost');
    return hostData ? JSON.parse(hostData) : null;
  }
}

export default new ImpersonationService();
```

### React Component Example

```javascript
// components/ImpersonationBanner.jsx
import React from 'react';
import impersonationService from '../services/impersonationService';

function ImpersonationBanner() {
  const [loading, setLoading] = React.useState(false);
  const isImpersonating = impersonationService.isCurrentlyImpersonating();
  const impersonatedHost = impersonationService.getImpersonatedHost();

  if (!isImpersonating || !impersonatedHost) {
    return null;
  }

  const handleStopImpersonation = async () => {
    try {
      setLoading(true);
      await impersonationService.stopImpersonation();
      
      // Redirect to superadmin dashboard
      window.location.href = '/superadmin/dashboard';
    } catch (error) {
      alert(`Failed to stop impersonation: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">
            Viewing as: {impersonatedHost.name} ({impersonatedHost.email})
          </span>
        </div>
        <button
          onClick={handleStopImpersonation}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Returning...' : 'Return to Superadmin'}
        </button>
      </div>
    </div>
  );
}

export default ImpersonationBanner;
```

### Host Selection Dropdown

```javascript
// components/HostImpersonationDropdown.jsx
import React, { useState, useEffect } from 'react';
import impersonationService from '../services/impersonationService';

function HostImpersonationDropdown() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState('');

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5001/api/superadmin/hosts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setHosts(data.hosts || []);
    } catch (error) {
      console.error('Failed to fetch hosts:', error);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedHostId) {
      alert('Please select a host');
      return;
    }

    try {
      setLoading(true);
      await impersonationService.impersonateHost(selectedHostId);
      
      // Redirect to host dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      alert(`Failed to impersonate: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <select
        value={selectedHostId}
        onChange={(e) => setSelectedHostId(e.target.value)}
        className="border rounded px-3 py-2"
        disabled={loading}
      >
        <option value="">Select a host to impersonate...</option>
        {hosts.map(host => (
          <option key={host._id} value={host._id}>
            {host.name} ({host.email})
          </option>
        ))}
      </select>
      <button
        onClick={handleImpersonate}
        disabled={!selectedHostId || loading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Impersonating...' : 'View as Host'}
      </button>
    </div>
  );
}

export default HostImpersonationDropdown;
```

---

## Audit Logging

### Audit Log Schema

All impersonation actions are logged to the `auditlogs` collection:

```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "action": "IMPERSONATION_START",              // Enum: START, END, ACTION
  "superadminId": "superadmin",                 // ID of superadmin
  "superadminEmail": "admin@zuhahosts.com",
  "targetUserId": "507f191e810c19729de860ea",  // ID of host
  "targetUserEmail": "host@example.com",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api/bookings",                  // For ACTION logs
  "method": "GET",                              // For ACTION logs
  "duration": 3600000,                          // For END logs (in ms)
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

### Querying Audit Logs

You can query audit logs to track impersonation activity:

```javascript
// Get all impersonation sessions by a superadmin
const logs = await AuditLog.find({
  superadminId: 'superadmin',
  action: { $in: ['IMPERSONATION_START', 'IMPERSONATION_END'] }
})
.sort({ timestamp: -1 })
.limit(100);

// Get all impersonations of a specific host
const hostLogs = await AuditLog.find({
  targetUserId: 'host-id-here',
  action: 'IMPERSONATION_START'
})
.sort({ timestamp: -1 });

// Get recent impersonation activity
const recentActivity = await AuditLog.find({
  action: { $in: ['IMPERSONATION_START', 'IMPERSONATION_END'] },
  timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
})
.sort({ timestamp: -1 });
```

### Log Retention

- Audit logs are automatically deleted after 90 days (configurable in model)
- TTL index ensures automatic cleanup
- Can be disabled by removing the TTL index

### Action Logging (Optional)

Individual API calls during impersonation can be logged by setting:

```bash
ENABLE_IMPERSONATION_LOGGING=true
```

This creates an `IMPERSONATION_ACTION` log for every API request made while impersonating.

**Warning:** This can generate a large volume of logs. Use only for debugging or compliance requirements.

---

## Environment Variables

Add these to your `.env` file:

```bash
# Impersonation Token Expiry (default: 8h)
IMPERSONATION_TOKEN_EXPIRY=8h

# Enable detailed action logging (default: false)
# Warning: Generates high volume of logs
ENABLE_IMPERSONATION_LOGGING=false

# JWT Secret (required)
JWT_SECRET=your-secret-key-change-in-production

# JWT Expiry for regular tokens (default: 7d)
JWT_EXPIRE=7d
```

---

## Testing

### Manual Testing with cURL

**1. Get Superadmin Token:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "your-password"
  }'
```

**2. Impersonate a Host:**
```bash
curl -X POST http://localhost:5001/api/superadmin/impersonate/HOST_ID_HERE \
  -H "Authorization: Bearer SUPERADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**3. Test Host Endpoints (with impersonation token):**
```bash
curl -X GET http://localhost:5001/api/bookings \
  -H "Authorization: Bearer IMPERSONATION_TOKEN_HERE"
```

**4. Stop Impersonation:**
```bash
curl -X POST http://localhost:5001/api/superadmin/stop-impersonation \
  -H "Authorization: Bearer IMPERSONATION_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Test Checklist

- [ ] Superadmin can successfully impersonate a valid host
- [ ] Non-superadmin users receive 403 when attempting impersonation
- [ ] Invalid host ID returns 400
- [ ] Non-existent host returns 404
- [ ] Attempting to impersonate team member returns 400
- [ ] Impersonation token contains `impersonatedBy` field
- [ ] Impersonated token works for host-specific endpoints
- [ ] Host's data is returned correctly (properties, bookings, etc.)
- [ ] Stop impersonation returns original superadmin token
- [ ] Stop impersonation fails when not impersonating
- [ ] Audit logs are created for start and end actions
- [ ] Token expiration works correctly
- [ ] Expired original token is rejected on stop impersonation

---

## Best Practices

### 1. Always Check Impersonation Status in Frontend
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
if (user.impersonatedBy) {
  // Show impersonation banner
  // Add visual indicators
  // Provide easy way to exit impersonation
}
```

### 2. Store Original State
Before impersonating, store the current state to restore later:
```javascript
const originalState = {
  token: localStorage.getItem('authToken'),
  user: localStorage.getItem('currentUser'),
  route: window.location.pathname
};
sessionStorage.setItem('preImpersonationState', JSON.stringify(originalState));
```

### 3. Handle Token Expiration
```javascript
// Periodically check if impersonation token is still valid
setInterval(async () => {
  if (impersonationService.isCurrentlyImpersonating()) {
    try {
      await fetch('/api/auth/test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
    } catch (error) {
      // Token expired - prompt user to login again
      alert('Session expired. Please login again.');
      window.location.href = '/login';
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

### 4. Visual Indicators
Always show a prominent banner when impersonating:
- Use warning colors (yellow/orange)
- Display host name and email
- Provide easy "Return to Superadmin" button
- Consider adding watermark or overlay

### 5. Logging and Monitoring
Monitor impersonation activity:
- Track frequency of impersonations
- Alert on unusual patterns
- Review audit logs regularly
- Consider notifying hosts (optional)

---

## Troubleshooting

### Issue: "Not currently impersonating any user" when trying to stop

**Cause:** The current token is not an impersonation token.

**Solution:** This error occurs when trying to stop impersonation with a regular token. Only call stop-impersonation with an active impersonation token.

### Issue: "Original session has expired. Please login again."

**Cause:** The embedded original superadmin token has expired.

**Solution:** The superadmin must login again. The impersonation session cannot be recovered.

### Issue: Cannot see host's data after impersonating

**Cause:** Multi-tenant middleware might not be recognizing the impersonation token.

**Solution:** Verify that `req.user.host` is `true` and `req.user.hostId` is `null` when impersonating. Check the `getEffectiveHostId()` function.

### Issue: Audit logs not being created

**Cause:** Database connection issues or AuditLog model not properly registered.

**Solution:** Verify MongoDB connection and ensure AuditLog model is imported in the application.

---

## Support

For issues, questions, or feature requests related to the impersonation API, please contact the backend development team.

**API Version:** 1.0  
**Last Updated:** December 25, 2025  
**Feature Status:** Production Ready


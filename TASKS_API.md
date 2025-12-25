# Tasks API Documentation

## Overview
Complete API documentation for managing tasks in the Airbnb management system.

**Tasks are:**
- Work assignments for property maintenance and operations
- Linked to specific properties
- Assigned to team members (hosts or staff)
- Track status from pending to completion
- Essential for property management workflow
- Support filtering by status, assignee, and property

---

## Base URL
```
http://localhost:5001/api/tasks
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## Task Model

```javascript
{
  "id": "string",
  "hostId": {                          // Populated host object
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "property_id": {                     // Populated property object
    "id": "string",
    "title": "string",
    "location": "string",
    "status": "string"
  },
  "assigned_to": {                     // Populated user object
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  },
  "title": "string",                   // Task title (3-100 characters)
  "description": "string",             // Task description (min 5 characters)
  "status": "string",                  // pending | in_progress | completed | cancelled
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## Task Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| `pending` | Task created, not started yet | Default status for new tasks |
| `in_progress` | Task is currently being worked on | Team member started working |
| `completed` | Task finished successfully | Work completed and verified |
| `cancelled` | Task cancelled or no longer needed | Task no longer relevant |

---

## Endpoints

### 1. Get All Tasks
**GET** `/api/tasks`

**Access:** 
- Superadmin: Can see all tasks (across all hosts)
- Hosts: Can see only their tasks
- Host Staff: Can see their host's tasks (based on permissions)

Get a list of tasks with optional filtering.

**Query Parameters (Optional):**
- `status` - Filter by task status: `pending`, `in_progress`, `completed`, `cancelled`
- `assigned_to` - Filter by assigned user ID
- `property_id` - Filter by property ID

**Examples:**
```
GET /api/tasks                                    # All tasks
GET /api/tasks?status=pending                     # Only pending tasks
GET /api/tasks?assigned_to=694c39579553cc06d11f0eb3  # Tasks for specific user
GET /api/tasks?property_id=694c39579553cc06d11f0eb7  # Tasks for specific property
GET /api/tasks?status=in_progress&property_id=694c39579553cc06d11f0eb7  # Combined filters
```

**Response:**
```json
[
  {
    "id": "694c39579553cc06d11f0eba",
    "hostId": {
      "id": "694c39579553cc06d11f0eb3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "property_id": {
      "id": "694c39579553cc06d11f0eb7",
      "title": "Beautiful Beach House",
      "location": "123 Ocean Drive, Miami, FL",
      "status": "available"
    },
    "assigned_to": {
      "id": "694c39579553cc06d11f0eb4",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "host_staff"
    },
    "title": "Deep cleaning before guest arrival",
    "description": "Complete deep cleaning of all rooms, change linens, and restock amenities",
    "status": "pending",
    "createdAt": "2025-12-24T10:00:00.000Z",
    "updatedAt": "2025-12-24T10:00:00.000Z"
  },
  {
    "id": "694c39579553cc06d11f0ebb",
    "hostId": {
      "id": "694c39579553cc06d11f0eb3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "property_id": {
      "id": "694c39579553cc06d11f0eb7",
      "title": "Beautiful Beach House",
      "location": "123 Ocean Drive, Miami, FL",
      "status": "available"
    },
    "assigned_to": {
      "id": "694c39579553cc06d11f0eb5",
      "name": "Mike Johnson",
      "email": "mike@example.com",
      "role": "host_staff"
    },
    "title": "Pool maintenance",
    "description": "Check pool chemicals, clean filters, and vacuum pool floor",
    "status": "in_progress",
    "createdAt": "2025-12-23T14:30:00.000Z",
    "updatedAt": "2025-12-24T08:00:00.000Z"
  }
]
```

**Notes:**
- Tasks are sorted by creation date (newest first)
- All related objects (host, property, assigned user) are populated
- Empty array returned if no tasks match filters

---

### 2. Create Task
**POST** `/api/tasks`

**Access:** 
- Superadmin: Can create tasks for any host
- Hosts: Can create tasks for their properties
- Host Staff: Can create tasks (based on permissions)

Create a new task assignment.

**Request Body:**
```json
{
  "property_id": "694c39579553cc06d11f0eb7",
  "title": "Deep cleaning before guest arrival",
  "description": "Complete deep cleaning of all rooms, change linens, and restock amenities",
  "assigned_to": "694c39579553cc06d11f0eb4",
  "status": "pending"
}
```

**Required Fields:**
- `property_id` (string, valid Property ObjectId)
- `title` (string, 3-100 characters)
- `description` (string, minimum 5 characters)
- `assigned_to` (string, valid User ObjectId)

**Optional Fields:**
- `status` (string, one of: `pending`, `in_progress`, `completed`, `cancelled`)
  - Default: `pending` if not provided

**Validations:**
- Property must exist and belong to the host
- Assigned user must exist and belong to the same host
- Title must be 3-100 characters
- Description must be at least 5 characters
- Status must be one of the valid values

**Note:** The `hostId` is automatically set based on the authenticated user.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eba",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "id": "694c39579553cc06d11f0eb7",
    "title": "Beautiful Beach House",
    "location": "123 Ocean Drive, Miami, FL",
    "status": "available"
  },
  "assigned_to": {
    "id": "694c39579553cc06d11f0eb4",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "host_staff"
  },
  "title": "Deep cleaning before guest arrival",
  "description": "Complete deep cleaning of all rooms, change linens, and restock amenities",
  "status": "pending",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T10:00:00.000Z"
}
```

---

### 3. Update Task
**PUT** `/api/tasks/:id`

**Access:** 
- Superadmin: Can update any task
- Hosts: Can update only their tasks
- Host Staff: Can update their host's tasks (based on permissions)

Update task information or status.

**Request Body:**
```json
{
  "status": "completed",
  "description": "Complete deep cleaning of all rooms, change linens, restock amenities, and verified all appliances working"
}
```

**Optional Fields (provide only fields to update):**
- `property_id` (string, valid Property ObjectId)
- `title` (string, 3-100 characters)
- `description` (string, minimum 5 characters)
- `assigned_to` (string, valid User ObjectId)
- `status` (string, one of: `pending`, `in_progress`, `completed`, `cancelled`)

**Validations:**
- If updating property_id, property must exist
- If updating assigned_to, user must exist
- If updating title, must be 3-100 characters
- If updating description, must be at least 5 characters
- If updating status, must be a valid status value

**Common Updates:**
- Change status to `in_progress` when work starts
- Change status to `completed` when finished
- Change status to `cancelled` if task no longer needed
- Reassign task to different team member
- Update description with progress notes

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eba",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "id": "694c39579553cc06d11f0eb7",
    "title": "Beautiful Beach House",
    "location": "123 Ocean Drive, Miami, FL",
    "status": "available"
  },
  "assigned_to": {
    "id": "694c39579553cc06d11f0eb4",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "host_staff"
  },
  "title": "Deep cleaning before guest arrival",
  "description": "Complete deep cleaning of all rooms, change linens, restock amenities, and verified all appliances working",
  "status": "completed",
  "createdAt": "2025-12-24T10:00:00.000Z",
  "updatedAt": "2025-12-24T16:30:00.000Z"
}
```

---

### 4. Delete Task
**DELETE** `/api/tasks/:id`

**Access:** 
- Superadmin: Can delete any task
- Hosts: Can delete only their tasks
- Host Staff: Can delete their host's tasks (based on permissions)

Delete a task record.

**Note:** Consider marking tasks as `cancelled` instead of deleting for audit trail purposes.

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "property_id, title, description, and assigned_to are required"
}
```

```json
{
  "error": "Title must be at least 3 characters long"
}
```

```json
{
  "error": "Description must be at least 5 characters long"
}
```

```json
{
  "error": "Invalid status. Must be one of: pending, in_progress, completed, cancelled"
}
```

```json
{
  "error": "Invalid property_id"
}
```

```json
{
  "error": "Invalid assigned_to (user_id)"
}
```

### 401 Unauthorized
```json
{
  "error": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "error": "Task not found"
}
```

```json
{
  "error": "Property not found"
}
```

```json
{
  "error": "Assigned user not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message here"
}
```

---

## Usage Examples

### Example 1: Create Task (Host)
```bash
curl -X POST http://localhost:5001/api/tasks \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "694c39579553cc06d11f0eb7",
    "title": "Deep cleaning before guest arrival",
    "description": "Complete deep cleaning of all rooms, change linens, and restock amenities",
    "assigned_to": "694c39579553cc06d11f0eb4",
    "status": "pending"
  }'
```

### Example 2: Get All Tasks (Host)
```bash
curl -X GET http://localhost:5001/api/tasks \
  -H "Authorization: Bearer <host_token>"
```

### Example 3: Get Pending Tasks Only
```bash
curl -X GET "http://localhost:5001/api/tasks?status=pending" \
  -H "Authorization: Bearer <host_token>"
```

### Example 4: Get Tasks for Specific Property
```bash
curl -X GET "http://localhost:5001/api/tasks?property_id=694c39579553cc06d11f0eb7" \
  -H "Authorization: Bearer <host_token>"
```

### Example 5: Get Tasks Assigned to Specific User
```bash
curl -X GET "http://localhost:5001/api/tasks?assigned_to=694c39579553cc06d11f0eb4" \
  -H "Authorization: Bearer <host_token>"
```

### Example 6: Update Task Status to In Progress
```bash
curl -X PUT http://localhost:5001/api/tasks/694c39579553cc06d11f0eba \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### Example 7: Complete Task
```bash
curl -X PUT http://localhost:5001/api/tasks/694c39579553cc06d11f0eba \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Example 8: Reassign Task to Different User
```bash
curl -X PUT http://localhost:5001/api/tasks/694c39579553cc06d11f0eba \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": "694c39579553cc06d11f0eb5"
  }'
```

### Example 9: Delete Task
```bash
curl -X DELETE http://localhost:5001/api/tasks/694c39579553cc06d11f0eba \
  -H "Authorization: Bearer <host_token>"
```

---

## Access Control Summary

| Action | Superadmin | Host | Host Staff |
|--------|------------|------|------------|
| **List Tasks** | All tasks | Own tasks | Host's tasks |
| **Create Task** | ✅ Yes | ✅ Yes | ⚠️ If permitted |
| **Update Task** | Any task | Own tasks | ⚠️ If permitted |
| **Delete Task** | Any task | Own tasks | ⚠️ If permitted |
| **Filter Tasks** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Filtering Tasks

### By Status
Get tasks in specific status:
```bash
GET /api/tasks?status=pending        # All pending tasks
GET /api/tasks?status=in_progress    # All in-progress tasks
GET /api/tasks?status=completed      # All completed tasks
GET /api/tasks?status=cancelled      # All cancelled tasks
```

### By Assignee
Get tasks assigned to specific user:
```bash
GET /api/tasks?assigned_to=USER_ID
```

### By Property
Get tasks for specific property:
```bash
GET /api/tasks?property_id=PROPERTY_ID
```

### Combined Filters
Combine multiple filters:
```bash
GET /api/tasks?status=pending&property_id=PROPERTY_ID
GET /api/tasks?status=in_progress&assigned_to=USER_ID
```

---

## Complete Task Workflow

### Scenario: Pre-Arrival Cleaning

#### Step 1: Create Cleaning Task
```bash
POST /api/tasks
{
  "property_id": "694c39579553cc06d11f0eb7",
  "title": "Pre-arrival cleaning",
  "description": "Deep clean, change linens, restock amenities",
  "assigned_to": "694c39579553cc06d11f0eb4",
  "status": "pending"
}
# Returns: Task with status "pending"
```

#### Step 2: Staff Member Starts Work
```bash
PUT /api/tasks/694c39579553cc06d11f0eba
{
  "status": "in_progress"
}
# Task status updated to "in_progress"
```

#### Step 3: Work Completed
```bash
PUT /api/tasks/694c39579553cc06d11f0eba
{
  "status": "completed",
  "description": "Deep clean completed. All linens changed. Amenities restocked. Kitchen cleaned and organized. Bathrooms sanitized."
}
# Task status updated to "completed" with detailed notes
```

#### Step 4: View Completed Tasks for Property
```bash
GET /api/tasks?property_id=694c39579553cc06d11f0eb7&status=completed
# Shows all completed tasks for this property
```

---

## Common Task Types

### 1. Cleaning Tasks
```json
{
  "title": "Deep cleaning before guest check-in",
  "description": "Complete cleaning of all rooms, change linens, restock amenities, sanitize bathrooms"
}
```

### 2. Maintenance Tasks
```json
{
  "title": "HVAC filter replacement",
  "description": "Replace air filters in all HVAC units. Check thermostat functionality."
}
```

### 3. Inspection Tasks
```json
{
  "title": "Post-checkout inspection",
  "description": "Inspect property for damages, missing items, and general condition. Document with photos."
}
```

### 4. Landscaping Tasks
```json
{
  "title": "Weekly lawn maintenance",
  "description": "Mow lawn, trim hedges, water plants, clean pool area"
}
```

### 5. Guest Preparation Tasks
```json
{
  "title": "Welcome package preparation",
  "description": "Prepare welcome basket, print local guides, set temperature, turn on lights"
}
```

### 6. Urgent Repairs
```json
{
  "title": "URGENT: Fix leaking faucet in kitchen",
  "description": "Guest reported leaking faucet. Schedule plumber ASAP."
}
```

---

## Common Scenarios

### Scenario 1: Daily Task Dashboard
```javascript
// Get all pending tasks
GET /api/tasks?status=pending

// Get all in-progress tasks
GET /api/tasks?status=in_progress

// Display on dashboard with counts
const pendingCount = pendingTasks.length;
const inProgressCount = inProgressTasks.length;
```

### Scenario 2: Staff Member's Task List
```javascript
// Get tasks assigned to specific staff member
GET /api/tasks?assigned_to=STAFF_ID&status=pending

// Staff member starts a task
PUT /api/tasks/TASK_ID
{
  "status": "in_progress"
}

// Staff member completes task
PUT /api/tasks/TASK_ID
{
  "status": "completed"
}
```

### Scenario 3: Property Preparation
```javascript
// Create multiple tasks for property preparation
const tasks = [
  {
    title: "Deep cleaning",
    description: "Complete deep clean of entire property",
    assigned_to: cleaningStaffId
  },
  {
    title: "Pool maintenance",
    description: "Clean pool, check chemicals, vacuum",
    assigned_to: maintenanceStaffId
  },
  {
    title: "Stock amenities",
    description: "Restock toiletries, towels, kitchen supplies",
    assigned_to: hostStaffId
  }
];

// Create each task
tasks.forEach(task => POST /api/tasks);
```

### Scenario 4: Task Reassignment
```javascript
// Staff member unavailable, reassign task
PUT /api/tasks/TASK_ID
{
  "assigned_to": newStaffMemberId
}
```

### Scenario 5: Cancel Task
```javascript
// Task no longer needed
PUT /api/tasks/TASK_ID
{
  "status": "cancelled"
}
```

### Scenario 6: Property Dashboard
```javascript
// Get all tasks for a property
GET /api/tasks?property_id=PROPERTY_ID

// Group by status
const tasksByStatus = {
  pending: tasks.filter(t => t.status === 'pending'),
  in_progress: tasks.filter(t => t.status === 'in_progress'),
  completed: tasks.filter(t => t.status === 'completed')
};
```

---

## Best Practices

### Creating Tasks
1. **Clear Titles:** Use descriptive, actionable titles
2. **Detailed Descriptions:** Include all necessary information and requirements
3. **Assign Appropriately:** Match task to team member's skills
4. **Set Priorities:** Consider adding priority field in future
5. **Due Dates:** Consider adding deadline field for time-sensitive tasks

### Managing Tasks
1. **Update Status Promptly:** Keep task status current
2. **Add Notes:** Update descriptions with progress notes
3. **Regular Reviews:** Review pending and in-progress tasks daily
4. **Archive Completed:** Keep completed tasks for record keeping
5. **Communication:** Notify assignees of new tasks
6. **Tracking:** Monitor completion rates and times

### Deleting Tasks
1. **Prefer Cancelling:** Use `cancelled` status instead of deleting
2. **Audit Trail:** Keep records of all tasks for accountability
3. **Review First:** Check if task is linked to bookings or events
4. **Documentation:** Document reason for deletion if necessary

---

## Task Status Workflow

```
┌─────────┐
│ PENDING │ ──────────────────┐
└────┬────┘                   │
     │                        │
     │ Start Work             │ Cancel
     ▼                        │
┌──────────────┐              │
│ IN_PROGRESS  │              │
└──────┬───────┘              │
       │                      │
       │ Finish Work          │
       ▼                      │
  ┌───────────┐               │
  │ COMPLETED │               │
  └───────────┘               │
                              │
                        ┌─────▼─────┐
                        │ CANCELLED │
                        └───────────┘
```

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| property_id | Required, valid ObjectId, exists | "Property not found" |
| title | Required, 3-100 chars | "Title must be at least 3 characters long" |
| description | Required, min 5 chars | "Description must be at least 5 characters long" |
| assigned_to | Required, valid ObjectId, exists | "Assigned user not found" |
| status | Optional, valid enum value | "Invalid status. Must be one of: ..." |

---

## Related APIs

- **Properties API:** Tasks are linked to properties
- **Users API:** Tasks are assigned to team members
- **Bookings API:** Tasks may be created for booking-related work

---

## Future Enhancements

Potential features to consider:

### 1. Task Priority
Add priority field to manage urgent tasks:
```javascript
priority: ['low', 'medium', 'high', 'urgent']
```

### 2. Task Due Dates
Add deadline tracking:
```javascript
due_date: Date,
is_overdue: Boolean (virtual field)
```

### 3. Task Categories
Categorize tasks for better organization:
```javascript
category: ['cleaning', 'maintenance', 'inspection', 'landscaping', 'other']
```

### 4. Task Attachments
Upload photos or documents:
```javascript
attachments: [{ type: String, description: String }]
```

### 5. Task Comments
Allow team communication on tasks:
```bash
POST /api/tasks/:id/comments
GET /api/tasks/:id/comments
```

### 6. Task Templates
Create reusable task templates:
```bash
GET /api/task-templates
POST /api/tasks/from-template/:templateId
```

### 7. Recurring Tasks
Schedule automatic task creation:
```javascript
recurring: {
  enabled: Boolean,
  frequency: String, // daily, weekly, monthly
  next_occurrence: Date
}
```

### 8. Task Time Tracking
Track time spent on tasks:
```javascript
time_started: Date,
time_completed: Date,
duration_minutes: Number
```

### 9. Task Notifications
Notify assignees of new or updated tasks:
```bash
POST /api/tasks/:id/notify
```

### 10. Task Statistics
```bash
GET /api/tasks/stats

# Response
{
  "totalTasks": 150,
  "pendingTasks": 25,
  "inProgressTasks": 10,
  "completedTasks": 100,
  "cancelledTasks": 15,
  "averageCompletionTime": "2.5 hours",
  "completionRate": 86.7
}
```

### 11. Bulk Task Operations
```bash
POST /api/tasks/bulk-update
{
  "task_ids": ["id1", "id2", "id3"],
  "updates": { "status": "completed" }
}
```

### 12. Task Dependencies
Link tasks that depend on each other:
```javascript
depends_on: [TaskId],
blocks: [TaskId]
```

---

## Integration Examples

### Task Management Dashboard

```javascript
// Get task overview
const fetchTaskOverview = async () => {
  const [pending, inProgress, completed] = await Promise.all([
    fetch('/api/tasks?status=pending'),
    fetch('/api/tasks?status=in_progress'),
    fetch('/api/tasks?status=completed')
  ]);

  return {
    pending: await pending.json(),
    inProgress: await inProgress.json(),
    completed: await completed.json()
  };
};
```

### Staff Task List

```javascript
// Get tasks for logged-in staff member
const fetchMyTasks = async (userId) => {
  const response = await fetch(
    `/api/tasks?assigned_to=${userId}&status=pending`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

### Property Task Board

```javascript
// Kanban-style task board for property
const fetchPropertyTasks = async (propertyId) => {
  const response = await fetch(
    `/api/tasks?property_id=${propertyId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const tasks = await response.json();
  
  // Group by status for kanban board
  return {
    pending: tasks.filter(t => t.status === 'pending'),
    inProgress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  };
};
```

---

## Performance Tips

### Optimizing Task Queries

1. **Use Filters:** Filter on backend rather than client-side
```javascript
// Good: Filter on server
GET /api/tasks?status=pending

// Bad: Fetch all and filter on client
GET /api/tasks
// then filter in JavaScript
```

2. **Pagination:** For large task lists, implement pagination
```javascript
GET /api/tasks?page=1&limit=50
```

3. **Selective Population:** Only populate fields you need
4. **Caching:** Cache task lists with short TTL
5. **Indexes:** Task schema has indexes on common query fields

---

## Security Considerations

### Access Control
1. **Multi-Tenant Isolation:** Tasks are strictly isolated by host
2. **Role-Based Access:** Staff can only see tasks assigned to them or their host
3. **Validation:** All inputs validated on server-side
4. **Authentication:** All endpoints require valid JWT token

### Best Practices
- Never expose tasks from other hosts
- Validate user permissions before task assignment
- Sanitize all input data
- Log task creations and status changes for audit trail
- Implement rate limiting to prevent abuse

---

## Notes

1. **Multi-Tenant Isolation:** Each host can only see and manage their own tasks
2. **Superadmin Access:** Superadmin can see and manage all tasks across all hosts
3. **Auto-Assignment:** The `hostId` is automatically set based on the authenticated user
4. **Populated Objects:** Tasks return with fully populated host, property, and user objects
5. **Sorting:** Tasks are returned sorted by creation date (newest first)
6. **Status Workflow:** Tasks typically flow: pending → in_progress → completed
7. **Filtering Support:** Built-in support for filtering by status, assignee, and property

---

## Summary

The Tasks API provides complete CRUD operations for managing property tasks with:
- ✅ Multi-tenant isolation (hosts see only their tasks)
- ✅ Flexible filtering (status, assignee, property)
- ✅ Status workflow management (pending to completed)
- ✅ Comprehensive validation
- ✅ Populated property and user objects
- ✅ Integration with properties and users
- ✅ Superadmin platform-wide access
- ✅ Team collaboration support

---

## Quick Reference

| Method | Endpoint | Purpose | Auth Required | Filters |
|--------|----------|---------|---------------|---------|
| GET | `/api/tasks` | List all tasks | ✅ Yes | status, assigned_to, property_id |
| POST | `/api/tasks` | Create task | ✅ Yes | ❌ No |
| PUT | `/api/tasks/:id` | Update task | ✅ Yes | ❌ No |
| DELETE | `/api/tasks/:id` | Delete task | ✅ Yes | ❌ No |

**Available Status Values:** `pending` | `in_progress` | `completed` | `cancelled`


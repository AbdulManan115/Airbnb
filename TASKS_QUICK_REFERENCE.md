# Tasks API - Quick Reference Guide

## 🎯 Overview

The Tasks API manages work assignments for property maintenance and operations.

**Base URL:** `http://localhost:5001/api/tasks`

---

## 📋 Task Status Values

| Status | Description |
|--------|-------------|
| `pending` | Task not started yet (default) |
| `in_progress` | Currently being worked on |
| `completed` | Finished successfully |
| `cancelled` | Cancelled or no longer needed |

---

## 🚀 Quick Examples

### 1. Create New Task

**Endpoint:** `POST /api/tasks`

**Body:**
```json
{
  "property_id": "694c39579553cc06d11f0eb7",
  "title": "Deep cleaning before guest arrival",
  "description": "Complete deep cleaning of all rooms, change linens, and restock amenities",
  "assigned_to": "694c39579553cc06d11f0eb4",
  "status": "pending"
}
```

### 2. Get All Tasks

```bash
GET /api/tasks
```

### 3. Get Pending Tasks Only

```bash
GET /api/tasks?status=pending
```

### 4. Get Tasks for Specific Property

```bash
GET /api/tasks?property_id=694c39579553cc06d11f0eb7
```

### 5. Get Tasks Assigned to User

```bash
GET /api/tasks?assigned_to=694c39579553cc06d11f0eb4
```

### 6. Update Task Status

**Endpoint:** `PUT /api/tasks/:id`

**Start Work:**
```json
{
  "status": "in_progress"
}
```

**Complete Task:**
```json
{
  "status": "completed"
}
```

### 7. Reassign Task

```json
{
  "assigned_to": "new_user_id"
}
```

### 8. Delete Task

```bash
DELETE /api/tasks/:id
```

---

## 🔍 Filtering

### Single Filter
```bash
GET /api/tasks?status=pending
GET /api/tasks?assigned_to=USER_ID
GET /api/tasks?property_id=PROPERTY_ID
```

### Combined Filters
```bash
GET /api/tasks?status=pending&property_id=PROPERTY_ID
GET /api/tasks?status=in_progress&assigned_to=USER_ID
```

---

## 📊 Common Task Types

### Cleaning Task
```json
{
  "title": "Pre-arrival deep cleaning",
  "description": "Clean all rooms, change linens, restock amenities"
}
```

### Maintenance Task
```json
{
  "title": "HVAC filter replacement",
  "description": "Replace air filters in all units"
}
```

### Inspection Task
```json
{
  "title": "Post-checkout inspection",
  "description": "Inspect for damages and missing items"
}
```

### Urgent Repair
```json
{
  "title": "URGENT: Fix leaking faucet",
  "description": "Guest reported leak. Schedule plumber ASAP"
}
```

---

## 🔄 Task Workflow

```
PENDING → (start work) → IN_PROGRESS → (finish) → COMPLETED
   ↓                          ↓
   └──────── (cancel) ────────┴─────→ CANCELLED
```

---

## 💻 Frontend Integration

### React - Fetch Tasks

```javascript
const fetchTasks = async () => {
  const response = await fetch('http://localhost:5001/api/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### React - Create Task

```javascript
const createTask = async (taskData) => {
  const response = await fetch('http://localhost:5001/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  return response.json();
};
```

### React - Update Task Status

```javascript
const updateTaskStatus = async (taskId, status) => {
  const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};
```

### React - Task Dashboard Component

```javascript
import React, { useEffect, useState } from 'react';

function TaskDashboard() {
  const [tasks, setTasks] = useState({
    pending: [],
    inProgress: [],
    completed: []
  });

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('http://localhost:5001/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const allTasks = await response.json();
      
      setTasks({
        pending: allTasks.filter(t => t.status === 'pending'),
        inProgress: allTasks.filter(t => t.status === 'in_progress'),
        completed: allTasks.filter(t => t.status === 'completed')
      });
    };

    fetchTasks();
  }, []);

  return (
    <div className="task-dashboard">
      <div className="task-column">
        <h2>Pending ({tasks.pending.length})</h2>
        {tasks.pending.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      
      <div className="task-column">
        <h2>In Progress ({tasks.inProgress.length})</h2>
        {tasks.inProgress.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      
      <div className="task-column">
        <h2>Completed ({tasks.completed.length})</h2>
        {tasks.completed.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

### React - Staff Task List

```javascript
function MyTasks({ userId }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchMyTasks = async () => {
      const response = await fetch(
        `http://localhost:5001/api/tasks?assigned_to=${userId}&status=pending`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setTasks(data);
    };

    fetchMyTasks();
  }, [userId]);

  const startTask = async (taskId) => {
    await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'in_progress' })
    });
    // Refresh tasks
  };

  return (
    <div>
      <h2>My Tasks</h2>
      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>Property: {task.property_id.title}</p>
          <button onClick={() => startTask(task.id)}>
            Start Task
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 Required Fields

| Field | Type | Validation |
|-------|------|------------|
| property_id | String (ObjectId) | Must exist |
| title | String | 3-100 characters |
| description | String | Minimum 5 characters |
| assigned_to | String (ObjectId) | Must exist |
| status | String (optional) | pending, in_progress, completed, cancelled |

---

## ✅ Validation Rules

- **Title:** 3-100 characters
- **Description:** Minimum 5 characters  
- **Status:** Must be valid enum value
- **Property:** Must exist and belong to host
- **Assigned User:** Must exist and belong to same host

---

## 🎯 Common Use Cases

### Use Case 1: Create Pre-Arrival Tasks
```javascript
// Create multiple tasks before guest arrival
const tasks = [
  {
    property_id: propertyId,
    title: "Deep cleaning",
    description: "Complete deep clean of entire property",
    assigned_to: cleaningStaffId,
    status: "pending"
  },
  {
    property_id: propertyId,
    title: "Stock amenities",
    description: "Restock toiletries, towels, kitchen supplies",
    assigned_to: hostStaffId,
    status: "pending"
  }
];

for (const task of tasks) {
  await createTask(task);
}
```

### Use Case 2: Staff Member Workflow
```javascript
// 1. Get my pending tasks
const myTasks = await fetch(
  `/api/tasks?assigned_to=${myId}&status=pending`
);

// 2. Start working on a task
await updateTask(taskId, { status: 'in_progress' });

// 3. Complete the task
await updateTask(taskId, { 
  status: 'completed',
  description: 'Task completed with notes...'
});
```

### Use Case 3: Property Dashboard
```javascript
// Get all tasks for property
const propertyTasks = await fetch(
  `/api/tasks?property_id=${propertyId}`
);

// Count by status
const stats = {
  pending: propertyTasks.filter(t => t.status === 'pending').length,
  inProgress: propertyTasks.filter(t => t.status === 'in_progress').length,
  completed: propertyTasks.filter(t => t.status === 'completed').length
};
```

### Use Case 4: Urgent Task Assignment
```javascript
// Create urgent task and notify
const urgentTask = await createTask({
  property_id: propertyId,
  title: "URGENT: Guest reported issue",
  description: "AC not working. Guest checking in today.",
  assigned_to: maintenanceStaffId,
  status: "pending"
});

// Send notification (implement separately)
await notifyUser(maintenanceStaffId, urgentTask);
```

---

## 🔐 Access Control

| Role | Can View | Can Create | Can Update | Can Delete |
|------|----------|------------|------------|------------|
| Superadmin | All tasks | ✅ Yes | All tasks | All tasks |
| Host | Own tasks | ✅ Yes | Own tasks | Own tasks |
| Host Staff | Host's tasks | ⚠️ If permitted | ⚠️ If permitted | ⚠️ If permitted |

---

## ⚡ Performance Tips

1. **Use Filters:** Filter on server, not client
2. **Implement Pagination:** For large task lists
3. **Cache Task Lists:** Short TTL caching
4. **Selective Loading:** Only load what you need
5. **Batch Updates:** Group status updates when possible

---

## 🐛 Common Errors

### "Property not found"
**Cause:** Invalid property_id or property doesn't belong to host  
**Solution:** Verify property exists and belongs to authenticated user

### "Assigned user not found"
**Cause:** Invalid assigned_to user ID  
**Solution:** Verify user exists and belongs to same host

### "Title must be at least 3 characters long"
**Cause:** Title too short  
**Solution:** Provide title with 3+ characters

### "Invalid status"
**Cause:** Status value not in allowed list  
**Solution:** Use: pending, in_progress, completed, or cancelled

---

## 📖 Full Documentation

For complete API documentation, see:
**TASKS_API.md** - Comprehensive API reference

---

## 🎓 Quick Tips

1. ✅ Use descriptive task titles
2. ✅ Include detailed descriptions
3. ✅ Update status promptly
4. ✅ Add notes in description when completing
5. ✅ Use `cancelled` instead of deleting
6. ✅ Filter tasks to reduce data transfer
7. ✅ Implement task notifications
8. ✅ Track completion times for analytics

---

## 📞 API Endpoints Summary

```
GET    /api/tasks              # List all tasks (with filters)
POST   /api/tasks              # Create new task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
```

**Available Filters:**
- `?status=pending|in_progress|completed|cancelled`
- `?assigned_to=USER_ID`
- `?property_id=PROPERTY_ID`

---

Happy task managing! 🚀


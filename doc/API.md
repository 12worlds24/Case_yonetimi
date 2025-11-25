# API Documentation

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@3-d.com.tr",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "department_id": 1,
    "roles": [{"id": 1, "name": "Admin"}]
  }
}
```

### Verify Token
```http
POST /api/auth/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Customers

### Get Customers
```http
GET /api/customers?skip=0&limit=100&search=keyword
Authorization: Bearer <token>
```

### Get Customer by ID
```http
GET /api/customers/{customer_id}
Authorization: Bearer <token>
```

### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+90 555 123 4567",
  "product_ids": [1, 2]
}
```

### Update Customer
```http
PUT /api/customers/{customer_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

### Delete Customer
```http
DELETE /api/customers/{customer_id}
Authorization: Bearer <token>
```

## Products

### Get Products
```http
GET /api/products?skip=0&limit=100&search=keyword
Authorization: Bearer <token>
```

### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "code": "PROD-001",
  "description": "Product description"
}
```

## Cases

### Get Cases
```http
GET /api/cases?skip=0&limit=100&status_filter=bekleyen&priority_filter=high&assigned_to_me=true
Authorization: Bearer <token>
```

### Create Case
```http
POST /api/cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Case Title",
  "description": "Problem description",
  "customer_id": 1,
  "product_id": 1,
  "priority": "high",
  "support_type": "email",
  "assigned_user_ids": [1, 2]
}
```

### Close Case
```http
POST /api/cases/{case_id}/close
Authorization: Bearer <token>
Content-Type: application/json

{
  "solution": "Problem solved by...",
  "end_date": "2024-01-01T12:00:00Z",
  "time_spent_hours": 5,
  "assigned_user_ids": [1, 2]
}
```

### Assign Case
```http
POST /api/cases/{case_id}/assign?user_id=1
Authorization: Bearer <token>
```

### Add Comment
```http
POST /api/cases/{case_id}/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "This is a comment",
  "is_internal": 0
}
```

### Upload File
```http
POST /api/cases/{case_id}/files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
```

## Users

### Get Users (Admin only)
```http
GET /api/users?skip=0&limit=100
Authorization: Bearer <token>
```

### Create User (Admin only)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name",
  "department_id": 1,
  "role_ids": [1, 2]
}
```

### Get Departments
```http
GET /api/users/departments
Authorization: Bearer <token>
```

### Get Roles
```http
GET /api/users/roles
Authorization: Bearer <token>
```

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Ticket Support System",
  "version": "1.0.0",
  "performance": {
    "rss_mb": 150.5,
    "cpu_percent": 2.3
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

Tokens expire after 24 hours (1440 minutes) by default. This can be configured in `config.json`.


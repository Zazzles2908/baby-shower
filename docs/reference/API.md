# API Documentation Reference - Baby Shower App

**Last Updated**: 2026-01-02  
**Version**: 1.0  
**Purpose**: Complete API documentation for the Baby Shower application

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Base URLs](#base-urls)
3. [Authentication](#authentication)
4. [Endpoints](#endpoints)
5. [Request Format](#request-format)
6. [Response Format](#response-format)
7. [Error Codes](#error-codes)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)

---

## API Overview

The Baby Shower app provides two API layers:

1. **Supabase Edge Functions** - Primary API for all submissions
2. **Vercel API Routes** - Health check and legacy endpoints

---

## Base URLs

### Supabase Edge Functions (Primary)

```
https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/
```

### Vercel API Routes (Health Check)

```
https://baby-shower-qr-app.vercel.app/api/
```

---

## Authentication

### Supabase Edge Functions

All requests require:

```http
Authorization: Bearer <ANON_KEY>
apikey: <ANON_KEY>
```

### Getting Your Anon Key

1. Go to Supabase Dashboard > Settings > API
2. Copy the **anon public** key

---

## Endpoints

### Health Check

**GET** `/api`

```bash
curl https://baby-shower-qr-app.vercel.app/api
```

**Response (200)**:
```json
{
  "result": "success",
  "message": "Baby Shower API is running",
  "endpoints": [
    "POST /api/guestbook",
    "POST /api/pool",
    "POST /api/quiz",
    "POST /api/advice",
    "POST /api/vote"
  ],
  "timestamp": "2026-01-02T00:00:00.000Z"
}
```

---

### Guestbook

**POST** `/functions/v1/guestbook`

Submit a wish message to the guestbook.

**Request**:
```json
{
  "name": "Guest Name",
  "relationship": "Friend",
  "message": "Congratulations on your baby girl!"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Wish saved successfully!",
  "data": {
    "id": 42,
    "created_at": "2026-01-02T00:15:00Z"
  }
}
```

---

### Vote

**POST** `/functions/v1/vote`

Submit name votes (select up to 3 names).

**Request**:
```json
{
  "names": ["Emma", "Olivia", "Sophia"],
  "name": "Voter Name"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Your votes have been recorded!",
  "data": {
    "id": 43,
    "created_at": "2026-01-02T00:15:01Z"
  }
}
```

---

### Pool

**POST** `/functions/v1/pool`

Submit a birth prediction.

**Request**:
```json
{
  "name": "Predictor Name",
  "date_guess": "2026-03-15",
  "time_guess": "14:30",
  "weight_guess": 3.4,
  "length_guess": 51
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Your prediction has been recorded!",
  "data": {
    "id": 44,
    "created_at": "2026-01-02T00:15:02Z"
  }
}
```

---

### Quiz

**POST** `/functions/v1/quiz`

Submit emoji puzzle answers.

**Request**:
```json
{
  "name": "Quizzer Name",
  "answers": ["Baby Shower", "Three Little Pigs", "Rock a Bye Baby", "Baby Bottle", "Diaper Change"],
  "score": 5,
  "totalQuestions": 5
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Your answers have been submitted!",
  "data": {
    "id": 45,
    "created_at": "2026-01-02T00:15:03Z"
  }
}
```

---

### Advice

**POST** `/functions/v1/advice`

Submit parenting advice.

**Request**:
```json
{
  "name": "Advisor Name",
  "advice": "Sleep when the baby sleeps!",
  "category": "For Parents"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Thank you for sharing your wisdom!",
  "data": {
    "id": 46,
    "created_at": "2026-01-02T00:15:04Z"
  }
}
```

---

## Request Format

### Headers

```http
Content-Type: application/json
Authorization: Bearer <ANON_KEY>
apikey: <ANON_KEY>
```

### Body

All requests use JSON format:

```json
{
  "name": "Required - Guest name",
  "activity_type": "Activity-specific fields",
  "activity_data": {
    // Activity data
  }
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": {
    "id": 42,
    "created_at": "2026-01-02T00:15:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Endpoint not found |
| 500 | Internal Error | Server error |

### Common Errors

**Missing required field**:
```json
{
  "success": false,
  "error": "Validation failed: name is required"
}
```

**Invalid JSON**:
```json
{
  "success": false,
  "error": "Invalid JSON in request body"
}
```

**Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized: Invalid API key"
}
```

---

## Rate Limiting

Supabase Free Tier limits:
- 50,000 API requests per month
- 500,000 row reads per month
- 100,000 row writes per month

For baby shower event (~50 guests, ~200 submissions):
- Well within free tier limits

---

## Examples

### Complete Test Script

```bash
#!/bin/bash

# Configuration
ANON_KEY="your-anon-key"
BASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1"

# Test guestbook
echo "Testing guestbook..."
curl -X POST "$BASE_URL/guestbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -d '{"name":"Test Guest","message":"Test message","relationship":"Friend"}'

echo -e "\n\nTesting vote..."
curl -X POST "$BASE_URL/vote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -d '{"names":["Emma","Olivia"],"name":"Test Voter"}'

echo -e "\n\nTesting pool..."
curl -X POST "$BASE_URL/pool" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -d '{"name":"Test Pooler","date_guess":"2026-03-15","weight_guess":3.4,"length_guess":51}'

echo -e "\n\nTesting quiz..."
curl -X POST "$BASE_URL/quiz" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -d '{"name":"Test Quizzer","answers":["a","b","c","d","e"],"score":5,"totalQuestions":5}'

echo -e "\n\nTesting advice..."
curl -X POST "$BASE_URL/advice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -d '{"name":"Test Advisor","advice":"Test advice","category":"For Parents"}'
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Maintained By**: Development Team

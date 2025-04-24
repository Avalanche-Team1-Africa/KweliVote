# Testing Authentication APIs

This document provides instructions on how to test the KweliVote authentication APIs before integrating with the frontend.

## Testing with curl

### 1. Obtain an Authentication Token

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

This will return a JSON response with `access` and `refresh` tokens, along with user information:

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI...",
  "nationalid": "12345678",
  "role": "admin",
  "name": "John Doe"
}
```

### 2. Access Protected Endpoints

Use the access token to make authenticated requests:

```bash
curl -X GET http://localhost:8000/api/user/info/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI..."
```

This will return your user information if authentication is successful.

### 3. Refresh Your Token

When your access token expires, use the refresh token to get a new one:

```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI..."}'
```

### 4. Verify a Token

To check if a token is valid:

```bash
curl -X POST http://localhost:8000/api/token/verify/ \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI..."}'
```

## Testing with Python requests

Save this script as `test_auth_api.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8000"

def get_token(username, password):
    url = f"{BASE_URL}/api/token/"
    data = {
        "username": username,
        "password": password
    }
    response = requests.post(url, json=data)
    print("Token Response:", response.status_code)
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print("Error:", response.text)
        return None

def get_user_info(access_token):
    url = f"{BASE_URL}/api/user/info/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.get(url, headers=headers)
    print("\nUser Info Response:", response.status_code)
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print("Error:", response.text)

def refresh_token(refresh_token):
    url = f"{BASE_URL}/api/token/refresh/"
    data = {
        "refresh": refresh_token
    }
    response = requests.post(url, json=data)
    print("\nToken Refresh Response:", response.status_code)
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print("Error:", response.text)
        return None

def verify_token(token):
    url = f"{BASE_URL}/api/token/verify/"
    data = {
        "token": token
    }
    response = requests.post(url, json=data)
    print("\nToken Verify Response:", response.status_code)
    if response.status_code == 200:
        print("Token is valid")
    else:
        print("Token is invalid:", response.text)

if __name__ == "__main__":
    username = input("Enter username: ")
    password = input("Enter password: ")
    
    # Get initial token
    token_data = get_token(username, password)
    
    if token_data:
        access_token = token_data["access"]
        refresh_token = token_data["refresh"]
        
        # Test authenticated endpoint
        get_user_info(access_token)
        
        # Verify token
        verify_token(access_token)
        
        # Test refreshing the token
        new_token_data = refresh_token(refresh_token)
        if new_token_data and "access" in new_token_data:
            # Test with new token
            get_user_info(new_token_data["access"])
```

Run with:
```bash
python test_auth_api.py
```

## Using the DRF Browsable API

1. Start the Django development server:
   ```bash
   cd /home/quest/myrepos/KweliVote/kwelivote-app/backend
   python manage.py runserver
   ```

2. Open your browser and go to:
   - Token endpoint: http://localhost:8000/api/token/
   - API root: http://localhost:8000/

3. For the token endpoint, you'll need to manually enter JSON data for username/password

4. After getting a token, you can use tools like ModHeader browser extension to add the Authorization header to your requests.

## Using Postman

1. Create a new collection for KweliVote API
2. Add requests for each endpoint
3. For authentication flow:
   - Create a POST request to /api/token/
   - Use the "Tests" tab to save the tokens to variables:
   ```js
   var jsonData = JSON.parse(responseBody);
   pm.globals.set("accessToken", jsonData.access);
   pm.globals.set("refreshToken", jsonData.refresh);
   ```
   - In other requests, use the Authorization tab and select "Bearer Token" with the variable `{{accessToken}}`
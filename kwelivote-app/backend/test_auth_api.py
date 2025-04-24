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

def test_api_endpoints(access_token):
    """Test access to the various API endpoints"""
    endpoints = [
        "/api/voters/",
        "/api/keypersons/",
        "/api/candidates/",
        "/api/resultscount/"
    ]
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print("\n--- Testing API Endpoints ---")
    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        print(f"\nTesting {url}")
        response = requests.get(url, headers=headers)
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            # Print only the first result if it's a list
            data = response.json()
            if isinstance(data, list) and data:
                print("First item in response:")
                print(json.dumps(data[0], indent=2))
            elif isinstance(data, dict):
                if "results" in data and data["results"]:
                    print("First item in results:")
                    print(json.dumps(data["results"][0], indent=2))
                else:
                    print("Response preview:")
                    print(json.dumps({k: data[k] for k in list(data.keys())[:3]}, indent=2))
        else:
            print("Error:", response.text)

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
        
        # Test API endpoints
        test_api_endpoints(access_token)
        
        # Test refreshing the token
        print("\n--- Testing Token Refresh ---")
        new_token_data = refresh_token(refresh_token)
        if new_token_data and "access" in new_token_data:
            # Test with new token
            get_user_info(new_token_data["access"])
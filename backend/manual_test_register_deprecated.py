import requests
res = requests.post('http://127.0.0.1:8000/api/auth/register/', json={
    'name': 'Test User', 'username': 'testuser2',
    'email': 'invalid-email', 'password': 'password123'
})
print("STATUS:", res.status_code)
print("BODY:", res.json())
res_check = requests.get('http://127.0.0.1:8000/api/auth/register/') # might not work if it's POST only

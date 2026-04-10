async function testLogin() {
  const email = 'admin@travelapp.com';
  const password = 'admin123';
  
  const urls = [
    'http://localhost:3002/api/admin/auth/login',
    'http://localhost:3002/api/login',
    'http://localhost:3002/admin/auth/login',
    'http://localhost:3002/login'
  ];

  for (const url of urls) {
    try {
      console.log(`Testing URL: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log(`Success with ${url}:`, data);
      } else {
        console.log(`Failed with ${url}: ${response.status}`, data);
      }
    } catch (error) {
      console.log(`Error with ${url}:`, error.message);
    }
  }
}

testLogin();

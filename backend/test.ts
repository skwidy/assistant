import fetch from 'node-fetch';

async function testBackend() {
  try {
    console.log('Testing backend API...');
    
    const response = await fetch('http://localhost:3001/health');
    const health = await response.json();
    console.log('Health check:', health);
    
    const chatResponse = await fetch('http://localhost:3001/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me with a simple question?',
      }),
    });
    
    const chatData = await chatResponse.json();
    console.log('Chat response:', chatData);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBackend(); 
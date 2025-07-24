import React from 'react';

const SimpleLogin = () => {
  return (
    <div style={{ padding: '20px', color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1>Simple Login Test</h1>
      <p>If you can see this, the routing works.</p>
      <form>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input type="email" style={{ marginLeft: '10px', padding: '5px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input type="password" style={{ marginLeft: '10px', padding: '5px' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>Login</button>
      </form>
    </div>
  );
};

export default SimpleLogin;

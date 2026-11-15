import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
  {/* Google Maps is provided inside App, around the /app routes only. */}
  <App />
</React.StrictMode>);

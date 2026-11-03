import React from 'react';
import ReactDOM from 'react-dom/client';
import { APIProvider } from '@vis.gl/react-google-maps';
import App from './App';
import { GOOGLE_MAPS_API_KEY } from './components/map/googleMaps';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
  <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="ar" region="SA">
    <App />
  </APIProvider>
</React.StrictMode>);

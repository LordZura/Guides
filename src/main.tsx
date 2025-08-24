import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import { AuthProvider } from './contexts/AuthProvider';
import { ToursProvider } from './contexts/ToursContext';
import './index.css';

// Define theme with primary colors
const theme = extendTheme({
  colors: {
    primary: {
      50: '#e6f6ff',
      100: '#bae3ff',
      200: '#8dcfff',
      300: '#5fbcff',
      400: '#38a9ff',
      500: '#2195eb', // primary color
      600: '#1677c7',
      700: '#0d5aa4',
      800: '#043c80',
      900: '#01254d',
    },
  },
});

// Mount the React app into #root
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <ToursProvider>
            <App />
          </ToursProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
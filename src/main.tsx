import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import { AuthProvider } from "./contexts/AuthProvider";
import { ModalProvider } from "./contexts/ModalContext";
import { ReviewsProvider } from "./contexts/ReviewsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TourTemplateProvider } from "./contexts/TourTemplateContext";
import "./index.css";

// Define theme with primary colors and mobile-first responsive settings
const theme = extendTheme({
  colors: {
    primary: {
      50: "#e6f6ff",
      100: "#bae3ff",
      200: "#8dcfff",
      300: "#5fbcff",
      400: "#38a9ff",
      500: "#2195eb",
      600: "#1677c7",
      700: "#0d5aa4",
      800: "#043c80",
      900: "#01254d",
    },
  },
  // Enhanced breakpoints for better mobile experience
  breakpoints: {
    base: "0px",
    sm: "480px",
    md: "768px",
    lg: "992px",
    xl: "1280px",
    "2xl": "1536px",
  },
  // Mobile-first font sizes
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  // Better mobile spacing
  space: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    32: "8rem",
  },
  // Mobile-optimized components
  components: {
    Button: {
      baseStyle: {
        borderRadius: "lg",
        fontWeight: "semibold",
      },
      sizes: {
        lg: {
          h: "48px",
          fontSize: "md",
          px: 8,
        },
        md: {
          h: "44px",
          fontSize: "sm",
          px: 6,
        },
        sm: {
          h: "40px",
          fontSize: "sm",
          px: 4,
        },
      },
    },
    Input: {
      sizes: {
        lg: {
          field: {
            h: "48px",
            fontSize: "md",
          },
        },
        md: {
          field: {
            h: "44px",
            fontSize: "sm",
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          mx: { base: 0, md: 4 },
          my: { base: 0, md: 4 },
          borderRadius: { base: 0, md: "xl" },
        },
      },
    },
  },
});

// Mount the React app into #root
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <BrowserRouter basename="/Guides">
          <AuthProvider>
            <ModalProvider>
              <NotificationProvider>
                <TourTemplateProvider>
                  <ReviewsProvider>
                    <App />
                  </ReviewsProvider>
                </TourTemplateProvider>
              </NotificationProvider>
            </ModalProvider>
          </AuthProvider>
        </BrowserRouter>
      </ChakraProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

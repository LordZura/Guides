import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import { AuthProvider } from "./contexts/AuthProvider";
import { ModalProvider } from "./contexts/ModalContext";
import { ReviewsProvider } from "./contexts/ReviewsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TourTemplateProvider } from "./contexts/TourTemplateContext";
import theme from "./theme";
import "./index.css";

// Mount the React app into #root
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
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

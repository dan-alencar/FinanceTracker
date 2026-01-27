import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Transactions from "./pages/Transactions";
import Missions from "./pages/Missions";
import Budgets from "./pages/Budgets";
import Shop from "./pages/Shop";
import Insights from "./pages/Insights";
import Inbox from "./pages/Inbox";
import AdminCounselor from "./pages/AdminCounselor";
import Achievements from "./pages/Achievements";
import Login from "./pages/Login";
import "./i18n";
import "./styles/global.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "login", element: <Login /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "onboarding", element: <Onboarding /> },
          { path: "transactions", element: <Transactions /> },
          { path: "missions", element: <Missions /> },
          { path: "budgets", element: <Budgets /> },
          { path: "shop", element: <Shop /> },
          { path: "insights", element: <Insights /> },
          { path: "achievements", element: <Achievements /> },
          { path: "inbox", element: <Inbox /> },
          { path: "admin", element: <AdminCounselor /> }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);

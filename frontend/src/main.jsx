import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Transactions from "./pages/Transactions";
import Missions from "./pages/Missions";
import Shop from "./pages/Shop";
import Inbox from "./pages/Inbox";
import AdminCounselor from "./pages/AdminCounselor";
import "./styles/global.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "onboarding", element: <Onboarding /> },
      { path: "transactions", element: <Transactions /> },
      { path: "missions", element: <Missions /> },
      { path: "shop", element: <Shop /> },
      { path: "inbox", element: <Inbox /> },
      { path: "admin", element: <AdminCounselor /> }
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

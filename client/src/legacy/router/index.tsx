import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "", element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

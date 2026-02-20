import { useRoutes } from "react-router-dom";
import { authRoute } from "./routerLink";
import React from "react";

const Router: React.FC = () => {
  return useRoutes(authRoute);
};

export default Router;

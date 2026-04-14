import React from "react";
import { Navigate } from "react-router-dom";
import { AuthProperties } from './types';

export function Authenticate({ children }: AuthProperties): React.ReactElement {
  const session = localStorage.getItem("session");

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

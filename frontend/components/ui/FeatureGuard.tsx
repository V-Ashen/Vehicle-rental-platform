"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
  const { activePackage, loading } = useAuth();

  if (loading) return null;

  // If there's no package data or the specific feature is not enabled
  if (!activePackage || !activePackage.features) {
    return <>{fallback}</>;
  }

  // If the feature is explicitly true or the package has the "allFeatures" master flag
  if (activePackage.features[feature] === true || activePackage.features.allFeatures === true) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

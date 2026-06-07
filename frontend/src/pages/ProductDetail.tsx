import { Navigate, useParams } from "react-router-dom";

/**
 * Legacy route kept for backward-compat with /s/:slug/p/:id links from the
 * multi-product days. In a single-product store, the storefront home IS the
 * product page — just redirect there.
 */
export default function ProductDetail() {
  const { slug = "" } = useParams();
  return <Navigate to={`/s/${slug}`} replace />;
}

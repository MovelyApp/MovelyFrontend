import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("cadastro", "routes/cadastro.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("register-activity", "routes/register-activity.tsx"),
  route("registrar", "routes/registrar.tsx"),
] satisfies RouteConfig;

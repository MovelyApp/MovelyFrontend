import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("cadastro", "routes/cadastro.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("groups", "routes/groups.tsx"),
  route("register-activity", "routes/register-activity.tsx"),
  route("registrar", "routes/registrar.tsx"),
  route("stats", "routes/stats.tsx"),
  route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;

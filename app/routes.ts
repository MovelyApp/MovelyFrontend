import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("cadastro", "routes/cadastro.tsx"),
  route("groups/new", "routes/groups-new.tsx"),
  route("groups/:id/members", "routes/group-members.tsx"),
] satisfies RouteConfig;

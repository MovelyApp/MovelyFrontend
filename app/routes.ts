import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/dashboard.tsx"),
    // route("groups", "routes/groups.tsx"),
    // route("register-activity", "routes/register-activity.tsx"),
    // route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;
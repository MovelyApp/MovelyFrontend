import { Link, useLocation } from "react-router";

type NavItem = {
    label: string;
    to: string;
    icon: React.ReactNode;
};

function HomeIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5Z"
                stroke={active ? "#3C3489" : "#888"}
                strokeWidth="1.8"
                strokeLinejoin="round"
                fill={active ? "#EEEDFE" : "none"}
            />
        </svg>
    );
}

function GroupsIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3.5" stroke={active ? "#3C3489" : "#888"} strokeWidth="1.8" fill={active ? "#EEEDFE" : "none"} />
            <circle cx="17" cy="10" r="2.5" stroke={active ? "#3C3489" : "#888"} strokeWidth="1.8" fill={active ? "#EEEDFE" : "none"} />
            <path
                d="M3 19c0-3 2.5-5 6-5s6 2 6 5M15 19c0-2 1.5-3.5 4-3.5"
                stroke={active ? "#3C3489" : "#888"}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function ChartIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d="M4 20V10M10 20V4M16 20v-7M22 20H2"
                stroke={active ? "#3C3489" : "#888"}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function UserIcon({ active }: { active: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={active ? "#3C3489" : "#888"} strokeWidth="1.8" fill={active ? "#EEEDFE" : "none"} />
            <path
                d="M4 21c0-4 3.5-7 8-7s8 3 8 7"
                stroke={active ? "#3C3489" : "#888"}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function BottomNav() {
    const location = useLocation();

    const isActive = (to: string) =>
        to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEEDFE] flex justify-around items-center px-2 py-2 z-50 safe-area-bottom">

            <NavLink to="/dashboard" label="Início" active={isActive("/dashboard")}>
                <HomeIcon active={isActive("/dashboard")} />
            </NavLink>

            <NavLink to="/groups" label="Grupos" active={isActive("/groups")}>
                <GroupsIcon active={isActive("/groups")} />
            </NavLink>

            <Link
                to="/register-activity"
                className="flex items-center justify-center w-14 h-14 rounded-full bg-[#534AB7] hover:bg-[#3C3489] transition-colors -mt-6 shadow-lg shadow-[#534AB7]/30"
            >
                <PlusIcon />
            </Link>

            <NavLink to="/stats" label="Stats" active={isActive("/stats")}>
                <ChartIcon active={isActive("/stats")} />
            </NavLink>

            <NavLink to="/profile" label="Perfil" active={isActive("/profile")}>
                <UserIcon active={isActive("/profile")} />
            </NavLink>

        </nav>
    );
}

function NavLink({
    to,
    label,
    active,
    children,
}: {
    to: string;
    label: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            to={to}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
        >
            {children}
            <span
                className={`text-[10px] font-medium ${
                    active ? "text-[#3C3489]" : "text-[#888]"
                }`}
            >
                {label}
            </span>
        </Link>
    );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { clearToken, getCurrentUser, getStoredUser } from "../lib/api";

export default function MobileHeader() {
    const navigate = useNavigate();
    const [username, setUsername] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = getStoredUser();
        setUsername(storedUser?.username ?? null);

        getCurrentUser()
            .then((user) => setUsername(user.username || null))
            .catch(() => setUsername(null));
    }, []);

    function handleLogout() {
        clearToken();
        navigate("/login");
    }

    return (
        <header className="sticky top-0 bg-[#FAFAF8] z-40 px-5 pt-4 pb-3">

            <div className="flex justify-between items-center">

                <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#3C3489] flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border-2 border-[#AFA9EC]" />
                    </div>
                    <span className="text-base font-medium text-[#3C3489]">movely</span>
                </Link>

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-9 h-9 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-sm font-medium"
                >
                    {username ? username.charAt(0).toUpperCase() : "?"}
                </button>

            </div>

            {menuOpen && (
                <div className="absolute top-14 right-5 bg-white border border-[#EEEDFE] rounded-xl shadow-lg py-1 min-w-[160px]">
                    <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#FAFAF8]"
                    >
                        {username || "Perfil"}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-[#534AB7] hover:bg-[#FAFAF8] border-t border-[#EEEDFE]"
                    >
                        Sair
                    </button>
                </div>
            )}

        </header>
    );
}

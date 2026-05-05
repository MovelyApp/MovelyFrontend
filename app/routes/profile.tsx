import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { clearToken, getCurrentUser, getStoredUser, getToken } from "../lib/api";

export function meta() {
  return [
    { title: "Movely | Perfil" },
    {
      name: "description",
      content: "Veja seu perfil no Movely.",
    },
  ];
}

export default function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    const storedUser = getStoredUser();
    if (storedUser) {
      setUsername(storedUser.username);
      setUserId(String(storedUser.id || ""));
      setEmail(storedUser.email || "");
      setRole(storedUser.role || "");
    }

    getCurrentUser()
      .then((user) => {
        setUsername(user.username || "Usuario Movely");
        setUserId(String(user.id || ""));
        setEmail(user.email || "");
        setRole(user.role || "");
      })
      .catch(() => setUsername("Usuario Movely"));
  }, [navigate]);

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  async function copyInviteEmail() {
    const value = email || username;

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <MobileHeader />

      <main className="px-5">
        <section className="mb-6">
          <p className="text-sm text-[#888]">Conta</p>
          <h1 className="text-2xl font-medium text-[#1a1a1a]">Perfil</h1>
        </section>

        <section className="bg-[#3C3489] rounded-2xl p-6 mb-6 text-white">
          <div className="w-14 h-14 rounded-2xl bg-[#534AB7] flex items-center justify-center text-2xl font-medium mb-4">
            {username.charAt(0).toUpperCase() || "M"}
          </div>
          <p className="text-sm font-medium text-[#CECBF6]">Voce esta logado como</p>
          <p className="text-3xl font-medium mt-1">{username || "..."}</p>
        </section>

        <section className="bg-[#EEEDFE] rounded-2xl p-5 mb-4">
          <p className="text-xs font-medium text-[#534AB7] mb-1">
            Email para entrar em grupos
          </p>
          <div className="flex items-center justify-between gap-4">
            <strong className="text-2xl font-medium text-[#3C3489] break-all">
              {email || username || "..."}
            </strong>
            <button
              className="px-4 py-2 bg-[#534AB7] text-white rounded-xl text-sm font-medium disabled:opacity-60"
              disabled={!email && !username}
              onClick={copyInviteEmail}
              type="button"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-[#534AB7] mt-2">
            Passe esse email para alguem te adicionar em um grupo.
          </p>
        </section>

        <section className="bg-white border border-[#EEEDFE] rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between gap-4 py-2 border-b border-[#EEEDFE]">
            <span className="text-sm text-[#888]">ID da conta</span>
            <strong className="text-sm text-[#1a1a1a]">{userId || "..."}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 border-b border-[#EEEDFE]">
            <span className="text-sm text-[#888]">Usuario</span>
            <strong className="text-sm text-[#1a1a1a]">{username || "..."}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-[#888]">Perfil</span>
            <strong className="text-sm text-[#1a1a1a]">{role || "User"}</strong>
          </div>
          {email && (
            <div className="flex items-center justify-between gap-4 py-2 border-t border-[#EEEDFE]">
              <span className="text-sm text-[#888]">Email</span>
              <strong className="text-sm text-[#1a1a1a] truncate">{email}</strong>
            </div>
          )}
        </section>

        <section className="bg-white border border-[#EEEDFE] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">Atividade</p>
              <p className="text-xs text-[#888] mt-1">
                Registre uma meta nos seus grupos.
              </p>
            </div>
            <Link
              to="/register-activity"
              className="px-4 py-2 bg-[#EEEDFE] text-[#534AB7] rounded-lg text-sm font-medium flex-shrink-0"
            >
              Registrar
            </Link>
          </div>
        </section>

        <button
          className="w-full h-12 bg-white border border-[#EEEDFE] text-[#534AB7] rounded-xl text-sm font-medium"
          onClick={handleLogout}
          type="button"
        >
          Sair da conta
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

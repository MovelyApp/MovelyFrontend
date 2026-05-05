import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/profile";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, clearToken, getToken } from "../lib/api";

export function meta({}: Route.MetaArgs) {
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    setUserId(window.localStorage.getItem("movely_user_id") ?? "");

    apiFetch("/me")
      .then((response) => (response.ok ? response.text() : ""))
      .then((name) => setUsername(name || "Usuário Movely"))
      .catch(() => setUsername("Usuário Movely"));
  }, [navigate]);

  function saveUserId() {
    window.localStorage.setItem("movely_user_id", userId.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
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
          <p className="text-sm font-medium text-[#CECBF6]">Você está logado como</p>
          <p className="text-3xl font-medium mt-1">{username || "..."}</p>
        </section>

        <section className="bg-white border border-[#EEEDFE] rounded-2xl p-5 mb-4">
          <label className="field">
            <span>ID do usuário</span>
            <input
              inputMode="numeric"
              onChange={(event) => {
                setUserId(event.target.value);
                setSaved(false);
              }}
              placeholder="1"
              type="number"
              value={userId}
            />
          </label>

          <button
            className="w-full h-12 mt-4 bg-[#534AB7] text-white rounded-xl text-sm font-medium"
            onClick={saveUserId}
            type="button"
          >
            {saved ? "ID salvo" : "Salvar ID"}
          </button>
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

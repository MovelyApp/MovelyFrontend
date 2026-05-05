import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getCurrentUser, getToken, readError } from "../lib/api";

type RegisterEntry = {
  id: number;
  dateTime?: string;
  ml?: number;
  steps?: number;
  hours?: number;
  quality?: number;
  workoutType?: string;
  durationMin?: number;
};

type Group = {
  id: string;
  name: string;
};

type GroupsResponse = {
  content?: Group[];
};

export function meta() {
  return [
    { title: "Movely | Estatisticas" },
    {
      name: "description",
      content: "Acompanhe suas estatisticas no Movely.",
    },
  ];
}

export default function Stats() {
  const navigate = useNavigate();
  const [registers, setRegisters] = useState<RegisterEntry[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    getCurrentUser()
      .then(async (user) => {
        const [groupList, registerList] = await Promise.all([
          apiFetch("/api/groups").then(async (response) => {
            if (!response.ok) {
              throw new Error(await readError(response, "Erro ao buscar grupos"));
            }

            const data = (await response.json()) as GroupsResponse | Group[];
            return Array.isArray(data) ? data : data.content ?? [];
          }),
          apiFetch(`/api/registers/user/${user.id}`).then(async (response) => {
            if (!response.ok) {
              throw new Error(await readError(response, "Erro ao buscar registros"));
            }

            return response.json() as Promise<RegisterEntry[]>;
          }),
        ]);

        setGroups(groupList);
        setRegisters(registerList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao buscar dados");
        setLoading(false);
      });
  }, [navigate]);

  const todayTypes = useMemo(() => {
    const grouped = registers
      .filter(isTodayRegister)
      .reduce<Record<string, number>>((acc, register) => {
        const label = getRegisterLabel(register);
        acc[label] = (acc[label] ?? 0) + 1;
        return acc;
      }, {});

    return Object.entries(grouped);
  }, [registers]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <MobileHeader />

      <main className="px-5">
        <section className="mb-6">
          <p className="text-sm text-[#888]">Resumo</p>
          <h1 className="text-2xl font-medium text-[#1a1a1a]">Estatisticas</h1>
        </section>

        <section className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Registros hoje" loading={loading} value={todayTypes.reduce((sum, [, count]) => sum + count, 0)} />
          <StatCard label="Grupos" loading={loading} value={groups.length} />
        </section>

        <section className="bg-[#EEEDFE] rounded-2xl p-5 mb-6">
          <p className="text-xs font-medium text-[#534AB7] mb-1">
            Proximo registro
          </p>
          <p className="text-xl font-medium text-[#3C3489]">
            Atualize uma meta dentro de um grupo onde voce e membro.
          </p>
          <Link
            to="/register-activity"
            className="inline-block mt-4 px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
          >
            Registrar atividade
          </Link>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-red-700">Erro: {error}</p>
            <p className="text-xs text-red-600 mt-1">
              Verifique seu login e tente novamente.
            </p>
          </div>
        )}

        <section>
          <h2 className="text-base font-medium text-[#1a1a1a] mb-4">
            Feitas hoje
          </h2>

          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  className="h-16 bg-[#F1EFE8] rounded-2xl animate-pulse"
                  key={item}
                />
              ))}
            </div>
          )}

          {!loading && todayTypes.length === 0 && !error && (
            <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
              <p className="text-sm text-[#888] mb-3">
                Nenhum registro feito hoje
              </p>
              <Link
                to="/register-activity"
                className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
              >
                Registrar agora
              </Link>
            </div>
          )}

          {!loading && todayTypes.length > 0 && (
            <div className="flex flex-col gap-3">
              {todayTypes.map(([label, count]) => (
                <div
                  className="bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center justify-between"
                  key={label}
                >
                  <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
                  <p className="text-base font-medium text-[#534AB7]">{count}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  label,
  loading,
  value,
}: {
  label: string;
  loading: boolean;
  value: number;
}) {
  return (
    <div className="bg-white border border-[#EEEDFE] rounded-2xl p-5">
      <p className="text-xs font-medium text-[#888] mb-2">{label}</p>
      <p className="text-3xl font-medium text-[#3C3489]">
        {loading ? "..." : value}
      </p>
    </div>
  );
}

function isTodayRegister(register: RegisterEntry) {
  if (!register.dateTime) {
    return false;
  }

  const registerDate = new Date(register.dateTime);
  const today = new Date();

  return (
    registerDate.getFullYear() === today.getFullYear() &&
    registerDate.getMonth() === today.getMonth() &&
    registerDate.getDate() === today.getDate()
  );
}

function getRegisterLabel(register: RegisterEntry) {
  if (typeof register.ml === "number") {
    return "Agua";
  }

  if (typeof register.steps === "number") {
    return "Passos";
  }

  if (register.workoutType || typeof register.durationMin === "number") {
    return "Treino";
  }

  if (typeof register.quality === "number") {
    return "Sono";
  }

  if (typeof register.hours === "number") {
    return "Estudo";
  }

  return "Registro";
}

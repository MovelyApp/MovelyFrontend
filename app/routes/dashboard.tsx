import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/bottomnav";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getCurrentUser, getToken, readError } from "../lib/api";

type HabitKey = "water" | "steps" | "sleep" | "workout" | "study";

type RegisterEntry = {
    id: number;
    groupId?: string;
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

const dailyTasks: Array<{
    key: HabitKey;
    label: string;
    helper: string;
    short: string;
}> = [
    { key: "water", label: "Agua", helper: "Registrar consumo de agua", short: "Ag" },
    { key: "steps", label: "Passos", helper: "Registrar passos do dia", short: "Ps" },
    { key: "sleep", label: "Sono", helper: "Registrar sono e qualidade", short: "So" },
    { key: "workout", label: "Treino", helper: "Registrar treino feito", short: "Tr" },
    { key: "study", label: "Estudo", helper: "Registrar tempo estudado", short: "Es" },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("Movely");
    const [groups, setGroups] = useState<Group[]>([]);
    const [registers, setRegisters] = useState<RegisterEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!getToken()) {
            navigate("/login");
            return;
        }

        setLoading(true);
        setError(null);

        getCurrentUser()
            .then(async (user) => {
                setUsername(user.email || user.username || "Movely");

                const [groupList, registerList] = await Promise.all([
                    apiFetch("/api/groups").then(async (response) => {
                        if (response.status === 401) {
                            navigate("/login");
                            throw new Error("Sessao expirada. Entre novamente.");
                        }

                        if (!response.ok) {
                            throw new Error(await readError(response, "Erro ao buscar grupos"));
                        }

                        const data = (await response.json()) as GroupsResponse | Group[];
                        return Array.isArray(data) ? data : data.content ?? [];
                    }),
                    apiFetch(`/api/registers/user/${user.id}`).then(async (response) => {
                        if (response.status === 401) {
                            navigate("/login");
                            throw new Error("Sessao expirada. Entre novamente.");
                        }

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
                setError(err instanceof Error ? err.message : "Erro ao carregar inicio");
                setLoading(false);
            });
    }, [navigate]);

    const completedToday = useMemo(() => {
        const completed = new Set<HabitKey>();

        registers.filter(isTodayRegister).forEach((register) => {
            const habit = getHabitFromRegister(register);
            if (habit) {
                completed.add(habit);
            }
        });

        return completed;
    }, [registers]);

    const completedCount = completedToday.size;
    const totalTasks = dailyTasks.length;
    const progress = Math.round((completedCount / totalTasks) * 100);
    const points = completedCount * 80;
    const hasGroups = groups.length > 0;

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-24">
            <MobileHeader />

            <main className="px-5">
                <section className="mb-6">
                    <p className="text-sm text-[#888]">Bom dia,</p>
                    <h1 className="text-2xl font-medium text-[#1a1a1a] truncate">
                        {username || "Movely"}
                    </h1>
                </section>

                <section className="bg-[#3C3489] rounded-2xl p-6 mb-6 text-white">
                    <div className="flex justify-between items-baseline mb-3">
                        <p className="text-sm font-medium text-[#CECBF6]">Pontos hoje</p>
                        <p className="text-xs text-[#AFA9EC]">{completedCount}/{totalTasks} feitas</p>
                    </div>
                    <p className="text-5xl font-medium mb-4">{loading ? "..." : points}</p>
                    <div className="h-1.5 bg-[#534AB7] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${loading ? 0 : progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-[#AFA9EC] mt-2">
                        {loading ? "Carregando progresso..." : `${progress}% das tarefas de hoje`}
                    </p>
                </section>

                <section className="bg-[#EEEDFE] rounded-2xl p-5 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#534AB7] mb-1">Status</p>
                        <p className="text-2xl font-medium text-[#3C3489]">
                            {completedCount === totalTasks ? "Tudo feito" : `${totalTasks - completedCount} pendentes`}
                        </p>
                    </div>
                    <p className="text-xs text-[#534AB7] max-w-[42%] text-right">
                        {hasGroups ? `${groups.length} grupo${groups.length === 1 ? "" : "s"}` : "Sem grupo ativo"}
                    </p>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-medium text-[#1a1a1a]">
                            Metas de hoje
                        </h2>
                        <Link
                            to="/register-activity"
                            className="text-xs text-[#534AB7] hover:text-[#3C3489] font-medium"
                        >
                            Registrar
                        </Link>
                    </div>

                    {loading && (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-20 bg-[#F1EFE8] rounded-2xl animate-pulse"
                                />
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                            <p className="text-sm text-red-700">Erro: {error}</p>
                            <p className="text-xs text-red-600 mt-1">
                                Verifique seu login e tente entrar de novo.
                            </p>
                        </div>
                    )}

                    {!loading && !error && !hasGroups && (
                        <div className="bg-white border border-[#EEEDFE] rounded-2xl p-8 text-center">
                            <p className="text-sm text-[#888] mb-3">
                                Voce ainda nao esta em nenhum grupo.
                            </p>
                            <Link
                                to="/groups/new"
                                className="inline-block px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium"
                            >
                                Criar grupo
                            </Link>
                        </div>
                    )}

                    {!loading && !error && hasGroups && (
                        <div className="flex flex-col gap-3">
                            {dailyTasks.map((task) => (
                                <GoalCard
                                    completed={completedToday.has(task.key)}
                                    helper={task.helper}
                                    key={task.key}
                                    label={task.label}
                                    short={task.short}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <BottomNav />
        </div>
    );
}

function GoalCard({
    completed,
    helper,
    label,
    short,
}: {
    completed: boolean;
    helper: string;
    label: string;
    short: string;
}) {
    return (
        <div className="bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center gap-3">
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                style={{ backgroundColor: completed ? "#CECBF6" : "#EEEDFE", color: "#534AB7" }}
            >
                {short}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] truncate">
                    {label}
                </p>
                <p className="text-xs text-[#888] truncate">{completed ? "Concluida hoje" : helper}</p>
                <div className="h-1 bg-[#F1EFE8] rounded-full overflow-hidden mt-2">
                    <div
                        className="h-full rounded-full bg-[#534AB7]"
                        style={{ width: completed ? "100%" : "0%" }}
                    />
                </div>
            </div>

            <p className="text-sm font-medium flex-shrink-0 text-[#534AB7]">
                {completed ? "100%" : "0%"}
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

function getHabitFromRegister(register: RegisterEntry): HabitKey | null {
    if (typeof register.ml === "number") {
        return "water";
    }

    if (typeof register.steps === "number") {
        return "steps";
    }

    if (register.workoutType || typeof register.durationMin === "number") {
        return "workout";
    }

    if (typeof register.quality === "number") {
        return "sleep";
    }

    if (typeof register.hours === "number") {
        return "study";
    }

    return null;
}

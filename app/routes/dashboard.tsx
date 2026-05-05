import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/bottomnav";
import HabitIcon from "../components/HabitIcon";
import MobileHeader from "../components/mobileheader";
import { apiFetch, getCurrentUser, getToken, readError } from "../lib/api";

type HabitKey = "water" | "steps" | "sleep" | "workout" | "study";

type RegisterEntry = {
    id: number;
    groupId?: string;
    dateTime?: string;
    notes?: string;
    description?: string;
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

type GroupInvite = {
    id: number;
    groupName: string;
    invitedByEmail?: string;
};

const dailyTasks: Array<{
    key: HabitKey;
    label: string;
    helper: string;
}> = [
    { key: "water", label: "Agua", helper: "Registrar consumo de agua" },
    { key: "steps", label: "Passos", helper: "Registrar passos do dia" },
    { key: "sleep", label: "Sono", helper: "Registrar sono e qualidade" },
    { key: "workout", label: "Treino", helper: "Registrar treino feito" },
    { key: "study", label: "Estudo", helper: "Registrar tempo estudado" },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("Movely");
    const [groups, setGroups] = useState<Group[]>([]);
    const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
    const [registers, setRegisters] = useState<RegisterEntry[]>([]);
    const [selectedHabit, setSelectedHabit] = useState<HabitKey | null>(null);
    const [loading, setLoading] = useState(true);
    const [actingInviteId, setActingInviteId] = useState<number | null>(null);
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

                const [groupList, registerList, inviteList] = await Promise.all([
                    apiFetch("/api/groups").then(async (response) => {
                        if (response.status === 401) {
                            navigate("/login");
                            throw new Error("Sua sessão expirou. Entre novamente.");
                        }

                        if (!response.ok) {
                            throw new Error(await readError(response, "Não foi possível carregar seus grupos."));
                        }

                        const data = (await response.json()) as GroupsResponse | Group[];
                        return Array.isArray(data) ? data : data.content ?? [];
                    }),
                    apiFetch(`/api/registers/user/${user.id}`).then(async (response) => {
                        if (response.status === 401) {
                            navigate("/login");
                            throw new Error("Sua sessão expirou. Entre novamente.");
                        }

                        if (!response.ok) {
                            throw new Error(await readError(response, "Não foi possível carregar seus registros."));
                        }

                        return response.json() as Promise<RegisterEntry[]>;
                    }),
                    apiFetch("/api/groups/invites/mine").then(async (response) => {
                        if (!response.ok) {
                            return [];
                        }

                        return response.json() as Promise<GroupInvite[]>;
                    }),
                ]);

                setGroups(groupList);
                setRegisters(registerList);
                setPendingInvites(inviteList);
                setLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Não foi possível carregar o início.");
                setLoading(false);
            });
    }, [navigate]);

    async function handleInviteAction(inviteId: number, action: "accept" | "decline") {
        setActingInviteId(inviteId);
        setError(null);

        try {
            const response = await apiFetch(`/api/groups/invites/${inviteId}/${action}`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(await readError(response, "Não foi possível responder o convite."));
            }

            setPendingInvites((current) => current.filter((invite) => invite.id !== inviteId));

            if (action === "accept") {
                const groupsResponse = await apiFetch("/api/groups");
                if (groupsResponse.ok) {
                    const data = (await groupsResponse.json()) as GroupsResponse | Group[];
                    setGroups(Array.isArray(data) ? data : data.content ?? []);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível responder o convite.");
        } finally {
            setActingInviteId(null);
        }
    }

    const uniqueRegisters = useMemo(() => dedupeRegistersByActivity(registers), [registers]);

    const completedToday = useMemo(() => {
        const completed = new Set<HabitKey>();

        uniqueRegisters.filter(isTodayRegister).forEach((register) => {
            const habit = getHabitFromRegister(register);
            if (habit) {
                completed.add(habit);
            }
        });

        return completed;
    }, [uniqueRegisters]);

    const todayRegistersByHabit = useMemo(() => {
        return uniqueRegisters.filter(isTodayRegister).reduce<Record<HabitKey, RegisterEntry[]>>(
            (acc, register) => {
                const habit = getHabitFromRegister(register);

                if (habit) {
                    acc[habit].push(register);
                }

                return acc;
            },
            {
                water: [],
                steps: [],
                sleep: [],
                workout: [],
                study: [],
            },
        );
    }, [uniqueRegisters]);

    const selectedTask = dailyTasks.find((task) => task.key === selectedHabit) ?? null;
    const selectedHabitRegisters = selectedHabit ? todayRegistersByHabit[selectedHabit] : [];
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

                {!loading && pendingInvites.length > 0 && (
                    <section className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-base font-medium text-[#1a1a1a]">
                                Convites de grupo
                            </h2>
                            <span className="text-xs text-[#534AB7] font-medium">
                                {pendingInvites.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {pendingInvites.map((invite) => (
                                <article
                                    className="bg-white border border-[#CECBF6] rounded-2xl p-4"
                                    key={invite.id}
                                >
                                    <p className="text-sm font-medium text-[#1a1a1a]">
                                        {invite.groupName}
                                    </p>
                                    <p className="text-xs text-[#888] mt-1">
                                        Convite de {invite.invitedByEmail || "Movely"}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            className="flex-1 h-10 rounded-xl bg-[#534AB7] text-white text-xs font-medium disabled:opacity-60"
                                            disabled={actingInviteId === invite.id}
                                            onClick={() => handleInviteAction(invite.id, "accept")}
                                            type="button"
                                        >
                                            Aceitar
                                        </button>
                                        <button
                                            className="flex-1 h-10 rounded-xl border border-[#CECBF6] text-[#534AB7] text-xs font-medium disabled:opacity-60"
                                            disabled={actingInviteId === invite.id}
                                            onClick={() => handleInviteAction(invite.id, "decline")}
                                            type="button"
                                        >
                                            Recusar
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

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
                            <p className="text-sm text-red-700">{error}</p>
                            <p className="text-xs text-red-600 mt-1">
                                Atualize a página ou entre novamente.
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
                                    count={todayRegistersByHabit[task.key].length}
                                    helper={task.helper}
                                    key={task.key}
                                    label={task.label}
                                    habit={task.key}
                                    onClick={() => setSelectedHabit(task.key)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {selectedTask && (
                <HabitDetailsSheet
                    groups={groups}
                    onClose={() => setSelectedHabit(null)}
                    registers={selectedHabitRegisters}
                    title={selectedTask.label}
                />
            )}

            <BottomNav />
        </div>
    );
}

function GoalCard({
    completed,
    count,
    habit,
    helper,
    label,
    onClick,
}: {
    completed: boolean;
    count: number;
    habit: HabitKey;
    helper: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            className="w-full text-left bg-white border border-[#EEEDFE] rounded-2xl p-4 flex items-center gap-3"
            onClick={onClick}
            type="button"
        >
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                style={{ backgroundColor: completed ? "#CECBF6" : "#EEEDFE", color: "#534AB7" }}
            >
                <HabitIcon type={habit} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] truncate">
                    {label}
                </p>
                <p className="text-xs text-[#888] truncate">
                    {completed ? `${count} registro${count === 1 ? "" : "s"} hoje` : helper}
                </p>
                <div className="h-1 bg-[#F1EFE8] rounded-full overflow-hidden mt-2">
                    <div
                        className="h-full rounded-full bg-[#534AB7]"
                        style={{ width: completed ? "100%" : "0%" }}
                    />
                </div>
            </div>

            <p className="text-sm font-medium flex-shrink-0 text-[#534AB7]">
                {completed ? "Ver" : "0%"}
            </p>
        </button>
    );
}

function HabitDetailsSheet({
    groups,
    onClose,
    registers,
    title,
}: {
    groups: Group[];
    onClose: () => void;
    registers: RegisterEntry[];
    title: string;
}) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end px-4 pb-24">
            <section className="w-full max-w-md mx-auto bg-white rounded-2xl p-5 max-h-[75vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <p className="text-xs font-medium text-[#534AB7] mb-1">Detalhes de hoje</p>
                        <h2 className="text-xl font-medium text-[#1a1a1a]">{title}</h2>
                    </div>
                    <button
                        className="w-9 h-9 rounded-full bg-[#EEEDFE] text-[#534AB7] text-sm font-medium"
                        onClick={onClose}
                        type="button"
                    >
                        x
                    </button>
                </div>

                {registers.length === 0 && (
                    <div className="bg-[#FAFAF8] border border-[#EEEDFE] rounded-2xl p-5 text-center">
                        <p className="text-sm text-[#888]">Nada registrado nessa meta hoje.</p>
                    </div>
                )}

                {registers.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {registers.map((register) => (
                            <article className="bg-[#FAFAF8] border border-[#EEEDFE] rounded-2xl p-4" key={register.id}>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <p className="text-sm font-medium text-[#1a1a1a]">
                                        {getRegisterValue(register)}
                                    </p>
                                    <span className="text-xs text-[#534AB7] font-medium">
                                        {formatRegisterTime(register.dateTime)}
                                    </span>
                                </div>
                                <p className="text-xs text-[#888]">
                                    {getGroupName(groups, register.groupId)}
                                </p>
                                {getRegisterNotes(register) && (
                                    <p className="text-sm text-[#3C3489] mt-3">
                                        {getRegisterNotes(register)}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
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

function dedupeRegistersByActivity(registers: RegisterEntry[]) {
    const seen = new Set<string>();

    return registers.filter((register) => {
        const key = getRegisterFingerprint(register);

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function getRegisterFingerprint(register: RegisterEntry) {
    const minute = getRegisterMinute(register.dateTime);
    const habit = getHabitFromRegister(register) ?? "register";
    const notes = getRegisterNotes(register).trim().toLowerCase();

    if (typeof register.ml === "number") {
        return `${minute}|${habit}|ml:${register.ml}|${notes}`;
    }

    if (typeof register.steps === "number") {
        return `${minute}|${habit}|steps:${register.steps}|${notes}`;
    }

    if (register.workoutType || typeof register.durationMin === "number") {
        return `${minute}|${habit}|workout:${register.workoutType ?? ""}|duration:${register.durationMin ?? ""}|${notes}`;
    }

    if (typeof register.quality === "number") {
        return `${minute}|${habit}|hours:${register.hours ?? ""}|quality:${register.quality}|${notes}`;
    }

    if (typeof register.hours === "number") {
        return `${minute}|${habit}|hours:${register.hours}|${notes}`;
    }

    return `id:${register.id}`;
}

function getRegisterMinute(dateTime?: string) {
    if (!dateTime) {
        return "sem-data";
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
        return dateTime;
    }

    return date.toISOString().slice(0, 16);
}

function getRegisterValue(register: RegisterEntry) {
    if (typeof register.ml === "number") {
        return `${register.ml} ml de agua`;
    }

    if (typeof register.steps === "number") {
        return `${register.steps} passos`;
    }

    if (register.workoutType || typeof register.durationMin === "number") {
        const duration = typeof register.durationMin === "number" ? `${register.durationMin} min` : "Treino";
        return register.workoutType ? `${register.workoutType} - ${duration}` : duration;
    }

    if (typeof register.quality === "number") {
        return `${register.hours ?? 0} h de sono - qualidade ${register.quality}/5`;
    }

    if (typeof register.hours === "number") {
        return `${register.hours} h de estudo`;
    }

    return "Registro";
}

function getRegisterNotes(register: RegisterEntry) {
    return register.notes || register.description || "";
}

function formatRegisterTime(dateTime?: string) {
    if (!dateTime) {
        return "--:--";
    }

    return new Date(dateTime).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getGroupName(groups: Group[], groupId?: string) {
    return groups.find((group) => group.id === groupId)?.name || "Grupo Movely";
}

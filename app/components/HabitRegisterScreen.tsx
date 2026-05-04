import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiFetch, getToken } from "../lib/api";

type HabitType = "water" | "steps" | "sleep" | "workout" | "study";
type LoadStatus = "loading" | "ready" | "error";
type SubmitStatus = "idle" | "submitting" | "success" | "error";

type Group = {
  id: string;
  name: string;
  description?: string;
  urlImagem?: string;
};

type GroupsResponse = {
  content?: Group[];
};

type FormValues = {
  userId: string;
  notes: string;
  ml: string;
  steps: string;
  hours: string;
  quality: string;
  workoutType: string;
  durationMin: string;
  weight: string;
};

const habits: Record<
  HabitType,
  {
    label: string;
    helper: string;
    endpoint: string;
    accent: string;
    short: string;
  }
> = {
  water: {
    label: "Água",
    helper: "Quantidade em ml",
    endpoint: "/registers/water",
    accent: "blue",
    short: "Ag",
  },
  steps: {
    label: "Passos",
    helper: "Total de passos",
    endpoint: "/registers/steps",
    accent: "green",
    short: "Ps",
  },
  workout: {
    label: "Treino",
    helper: "Tipo e duração",
    endpoint: "/registers/workout",
    accent: "orange",
    short: "Tr",
  },
  sleep: {
    label: "Sono",
    helper: "Horas e qualidade",
    endpoint: "/registers/sleep",
    accent: "pink",
    short: "So",
  },
  study: {
    label: "Estudo",
    helper: "Tempo estudado",
    endpoint: "/registers/study",
    accent: "purple",
    short: "Es",
  },
};

const emptyValues: FormValues = {
  userId: "",
  notes: "",
  ml: "",
  steps: "",
  hours: "",
  quality: "3",
  workoutType: "",
  durationMin: "",
  weight: "",
};

function getStoredUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem("movely_user_id") ?? "";
}

function saveStoredUserId(userId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("movely_user_id", userId);
  }
}

function getValidationMessage(
  habitType: HabitType,
  groupId: string,
  values: FormValues,
) {
  if (!groupId) {
    return "Escolha um grupo.";
  }

  if (!Number(values.userId) || Number(values.userId) < 1) {
    return "Informe um ID de usuário válido.";
  }

  if (habitType === "water" && (!Number(values.ml) || Number(values.ml) <= 0)) {
    return "Informe a quantidade de água.";
  }

  if (
    habitType === "steps" &&
    (!Number(values.steps) || Number(values.steps) <= 0)
  ) {
    return "Informe a quantidade de passos.";
  }

  if (
    (habitType === "sleep" || habitType === "study") &&
    (!Number(values.hours) || Number(values.hours) <= 0)
  ) {
    return "Informe a quantidade de horas.";
  }

  if (
    habitType === "workout" &&
    (!values.workoutType.trim() ||
      !Number(values.durationMin) ||
      Number(values.durationMin) <= 0)
  ) {
    return "Informe o tipo e a duração do treino.";
  }

  return "";
}

function buildPayload(habitType: HabitType, groupId: string, values: FormValues) {
  const payload = {
    userId: Number(values.userId),
    groupId,
    notes: values.notes.trim(),
  };

  if (habitType === "water") {
    return { ...payload, ml: Number(values.ml) };
  }

  if (habitType === "steps") {
    return { ...payload, steps: Number(values.steps) };
  }

  if (habitType === "sleep") {
    return {
      ...payload,
      hours: Number(values.hours),
      quality: Number(values.quality),
    };
  }

  if (habitType === "workout") {
    return {
      ...payload,
      workoutType: values.workoutType.trim(),
      durationMin: Number(values.durationMin),
      weight: values.weight ? Number(values.weight) : null,
    };
  }

  return { ...payload, hours: Number(values.hours) };
}

async function readError(response: Response) {
  const text = await response.text();

  if (!text) {
    return response.statusText || "Não foi possível salvar o registro.";
  }

  try {
    const data = JSON.parse(text) as { mensagem?: string; message?: string };
    return data.mensagem ?? data.message ?? text;
  } catch {
    return text;
  }
}

export function HabitRegisterScreen() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [habitType, setHabitType] = useState<HabitType>("water");
  const [values, setValues] = useState<FormValues>({
    ...emptyValues,
    userId: getStoredUserId(),
  });
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId),
    [groups, selectedGroupId],
  );
  const activeHabit = habits[habitType];

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    apiFetch("/groups")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = (await response.json()) as GroupsResponse | Group[];
        return Array.isArray(data) ? data : data.content ?? [];
      })
      .then((groupList) => {
        setGroups(groupList);
        setSelectedGroupId((current) => current || groupList[0]?.id || "");
        setLoadStatus("ready");
      })
      .catch((error) => {
        setLoadStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os grupos.",
        );
      });
  }, [navigate]);

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validationMessage = getValidationMessage(
      habitType,
      selectedGroupId,
      values,
    );

    if (validationMessage) {
      setSubmitStatus("error");
      setMessage(validationMessage);
      return;
    }

    setSubmitStatus("submitting");

    try {
      const response = await apiFetch(activeHabit.endpoint, {
        method: "POST",
        body: JSON.stringify(buildPayload(habitType, selectedGroupId, values)),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      saveStoredUserId(values.userId);
      setSubmitStatus("success");
      setMessage(
        selectedGroup
          ? `Registro salvo em ${selectedGroup.name}.`
          : "Registro salvo.",
      );
      setValues((current) => ({
        ...emptyValues,
        userId: current.userId,
      }));
    } catch (error) {
      setSubmitStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o registro.",
      );
    }
  }

  return (
    <main className="habit-page">
      <section className="habit-shell" aria-label="Registrar hábito">
        <header className="habit-header">
          <Link className="habit-back" to="/dashboard">
            Voltar
          </Link>
          <div>
            <p>Movely</p>
            <h1>Registrar hábito</h1>
          </div>
        </header>

        <form className="habit-form" onSubmit={handleSubmit}>
          <section className="habit-section">
            <div className="section-title">
              <span>1</span>
              <div>
                <h2>Grupo</h2>
                <p>{selectedGroup?.description || "Escolha onde registrar"}</p>
              </div>
            </div>

            {loadStatus === "loading" && (
              <div className="habit-loading">
                <span />
                <span />
              </div>
            )}

            {loadStatus === "error" && (
              <p className="form-message error" role="status">
                {message}
              </p>
            )}

            {loadStatus === "ready" && groups.length === 0 && (
              <div className="empty-state">
                <strong>Nenhum grupo encontrado</strong>
                <p>Crie ou entre em um grupo antes de registrar hábitos.</p>
              </div>
            )}

            {groups.length > 0 && (
              <div className="group-choice-list">
                {groups.map((group) => (
                  <button
                    className={selectedGroupId === group.id ? "active" : ""}
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    type="button"
                  >
                    <span>
                      <strong>{group.name}</strong>
                      <small>{group.description || "Grupo Movely"}</small>
                    </span>
                    <em>{selectedGroupId === group.id ? "Selecionado" : "Usar"}</em>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="habit-section">
            <div className="section-title">
              <span>2</span>
              <div>
                <h2>Hábito</h2>
                <p>{activeHabit.helper}</p>
              </div>
            </div>

            <div className="habit-type-grid">
              {(Object.keys(habits) as HabitType[]).map((type) => {
                const habit = habits[type];

                return (
                  <button
                    className={`habit-type-card ${habit.accent} ${
                      habitType === type ? "active" : ""
                    }`}
                    key={type}
                    onClick={() => {
                      setHabitType(type);
                      setSubmitStatus("idle");
                      setMessage("");
                    }}
                    type="button"
                  >
                    <span>{habit.short}</span>
                    <strong>{habit.label}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="habit-section">
            <div className="section-title">
              <span>3</span>
              <div>
                <h2>Dados</h2>
                <p>{activeHabit.label}</p>
              </div>
            </div>

            <div className="field-row">
              <label className="field">
                <span>ID do usuário</span>
                <input
                  inputMode="numeric"
                  min="1"
                  onChange={(event) => updateValue("userId", event.target.value)}
                  placeholder="1"
                  type="number"
                  value={values.userId}
                />
              </label>

              {habitType === "water" && (
                <label className="field">
                  <span>Mililitros</span>
                  <input
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => updateValue("ml", event.target.value)}
                    placeholder="500"
                    type="number"
                    value={values.ml}
                  />
                </label>
              )}

              {habitType === "steps" && (
                <label className="field">
                  <span>Passos</span>
                  <input
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => updateValue("steps", event.target.value)}
                    placeholder="8200"
                    type="number"
                    value={values.steps}
                  />
                </label>
              )}

              {(habitType === "sleep" || habitType === "study") && (
                <label className="field">
                  <span>Horas</span>
                  <input
                    inputMode="decimal"
                    min="0.1"
                    onChange={(event) => updateValue("hours", event.target.value)}
                    placeholder={habitType === "sleep" ? "7.5" : "2"}
                    step="0.1"
                    type="number"
                    value={values.hours}
                  />
                </label>
              )}
            </div>

            {habitType === "sleep" && (
              <label className="field">
                <span>Qualidade</span>
                <select
                  onChange={(event) => updateValue("quality", event.target.value)}
                  value={values.quality}
                >
                  <option value="1">Ruim</option>
                  <option value="2">Regular</option>
                  <option value="3">Boa</option>
                  <option value="4">Muito boa</option>
                  <option value="5">Excelente</option>
                </select>
              </label>
            )}

            {habitType === "workout" && (
              <>
                <label className="field">
                  <span>Tipo de treino</span>
                  <input
                    onChange={(event) =>
                      updateValue("workoutType", event.target.value)
                    }
                    placeholder="Musculação"
                    type="text"
                    value={values.workoutType}
                  />
                </label>

                <div className="field-row">
                  <label className="field">
                    <span>Minutos</span>
                    <input
                      inputMode="numeric"
                      min="1"
                      onChange={(event) =>
                        updateValue("durationMin", event.target.value)
                      }
                      placeholder="45"
                      type="number"
                      value={values.durationMin}
                    />
                  </label>

                  <label className="field">
                    <span>Carga</span>
                    <input
                      inputMode="decimal"
                      min="0"
                      onChange={(event) => updateValue("weight", event.target.value)}
                      placeholder="20"
                      step="0.1"
                      type="number"
                      value={values.weight}
                    />
                  </label>
                </div>
              </>
            )}

            <label className="field">
              <span>Observação</span>
              <textarea
                onChange={(event) => updateValue("notes", event.target.value)}
                placeholder="Como foi hoje?"
                value={values.notes}
              />
            </label>
          </section>

          {message && submitStatus !== "idle" && (
            <p className={`form-message ${submitStatus}`} role="status">
              {message}
            </p>
          )}

          <button
            className="primary-button habit-submit"
            disabled={submitStatus === "submitting" || loadStatus !== "ready"}
            type="submit"
          >
            {submitStatus === "submitting" ? "Salvando..." : "Salvar registro"}
          </button>
        </form>
      </section>
    </main>
  );
}

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import BottomNav from "./bottomnav";
import HabitIcon from "./HabitIcon";
import MobileHeader from "./mobileheader";
import { apiFetch, getCurrentUser, getFriendlyErrorMessage, getStoredUser, getToken, readError } from "../lib/api";

type HabitType = "water" | "steps" | "sleep" | "workout" | "study";
type LoadStatus = "loading" | "ready" | "error";
type SubmitStatus = "idle" | "submitting" | "success" | "error";
type FlowStep = "group" | "register";

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
  }
> = {
  water: {
    label: "Água",
    helper: "Quantidade em ml",
    endpoint: "/api/registers/water",
    accent: "blue",
  },
  steps: {
    label: "Passos",
    helper: "Total de passos",
    endpoint: "/api/registers/steps",
    accent: "green",
  },
  workout: {
    label: "Treino",
    helper: "Tipo e duração",
    endpoint: "/api/registers/workout",
    accent: "orange",
  },
  sleep: {
    label: "Sono",
    helper: "Horas e qualidade",
    endpoint: "/api/registers/sleep",
    accent: "pink",
  },
  study: {
    label: "Estudo",
    helper: "Tempo estudado",
    endpoint: "/api/registers/study",
    accent: "purple",
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

  const storedUser = getStoredUser();
  return storedUser?.id ? String(storedUser.id) : window.localStorage.getItem("movely_user_id") ?? "";
}

function saveStoredUserId(userId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("movely_user_id", userId);
  }
}

function getGroupInitial(group?: Group) {
  return group?.name.trim().charAt(0).toUpperCase() || "M";
}

function getValidationMessage(
  habitType: HabitType,
  groupIds: string[],
  values: FormValues,
) {
  if (groupIds.length === 0) {
    return "Escolha um grupo.";
  }

  if (!Number(values.userId) || Number(values.userId) < 1) {
    return "Sessao expirada. Entre novamente.";
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

export function HabitRegisterScreen() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [step, setStep] = useState<FlowStep>("group");
  const [habitType, setHabitType] = useState<HabitType>("water");
  const [values, setValues] = useState<FormValues>({
    ...emptyValues,
    userId: getStoredUserId(),
  });
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedGroupIds.includes(group.id)),
    [groups, selectedGroupIds],
  );
  const selectedGroup = selectedGroups[0];
  const selectedGroupCount = selectedGroupIds.length;
  const selectedGroupLabel =
    selectedGroupCount === 0
      ? "Nenhum grupo selecionado"
      : selectedGroup?.name || "1 grupo selecionado";
  const selectedGroupNames = selectedGroups.map((group) => group.name).join(", ");
  const selectedTargetText = "grupo selecionado";
  const activeHabit = habits[habitType];

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    Promise.all([
      getCurrentUser(),
      apiFetch("/api/groups").then(async (response) => {
        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = (await response.json()) as GroupsResponse | Group[];
        return Array.isArray(data) ? data : data.content ?? [];
      }),
    ])
      .then(([user, groupList]) => {
        setValues((current) => ({ ...current, userId: String(user.id) }));
        setGroups(groupList);
        setSelectedGroupIds((current) => {
          const validIds = current.filter((id) =>
            groupList.some((group) => group.id === id),
          );

          if (validIds.length > 0) {
            return [validIds[0]];
          }

          return groupList[0]?.id ? [groupList[0].id] : [];
        });
        setLoadStatus("ready");
      })
      .catch((error) => {
        setLoadStatus("error");
        setMessage(
          error instanceof Error
            ? getFriendlyErrorMessage(error.message, "Não foi possível carregar seus dados.")
            : "Não foi possível carregar seus dados.",
        );
      });
  }, [navigate]);

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function toggleGroupSelection(groupId: string) {
    setSelectedGroupIds((current) =>
      current.includes(groupId) ? [] : [groupId],
    );
  }

  function handleGoToRegister() {
    if (selectedGroupIds.length === 0) {
      setSubmitStatus("error");
      setMessage("Escolha um grupo para continuar.");
      return;
    }

    setSubmitStatus("idle");
    setMessage("");
    setStep("register");
  }

  function handleBackToGroups() {
    setSubmitStatus("idle");
    setMessage("");
    setStep("group");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validationMessage = getValidationMessage(
      habitType,
      selectedGroupIds,
      values,
    );

    if (validationMessage) {
      setSubmitStatus("error");
      setMessage(validationMessage);
      return;
    }

    setSubmitStatus("submitting");

    try {
      for (const groupId of selectedGroupIds) {
        const targetGroup = groups.find((group) => group.id === groupId);
        const response = await apiFetch(activeHabit.endpoint, {
          method: "POST",
          body: JSON.stringify(buildPayload(habitType, groupId, values)),
        });

        if (!response.ok) {
          const groupName = targetGroup?.name || "Grupo";
          throw new Error(`${groupName}: ${await readError(response)}`);
        }
      }

      saveStoredUserId(values.userId);
      setSubmitStatus("success");
      setMessage(selectedGroup ? `Registro salvo em ${selectedGroup.name}.` : "Registro salvo.");
      setValues((current) => ({
        ...emptyValues,
        userId: current.userId,
      }));
    } catch (error) {
      setSubmitStatus("error");
      setMessage(
        error instanceof Error
          ? getFriendlyErrorMessage(error.message, "Não foi possível salvar o registro.")
          : "Não foi possível salvar o registro.",
      );
    }
  }

  return (
    <div className="habit-page">
      <MobileHeader />

      <main className="habit-shell" aria-label="Registrar hábito">
        <div className="habit-topbar">
          {step === "group" ? (
            <Link className="habit-back" to="/dashboard">
              Voltar
            </Link>
          ) : (
            <button className="habit-back" onClick={handleBackToGroups} type="button">
              Voltar
            </button>
          )}
          <span>{step === "group" ? "Escolha do grupo" : "Registro da meta"}</span>
        </div>

        {step === "group" ? (
          <>
            <section className="habit-hero">
              <p>Registrar atividade</p>
              <h1>Escolha o grupo</h1>
              <span>
                Selecione o grupo onde esse registro vai contar.
              </span>
            </section>

            <section className="habit-panel habit-step-panel">
              <div className="habit-panel-heading">
                <div>
                  <span className="habit-kicker">Seus grupos</span>
                  <strong>{selectedGroupLabel}</strong>
                </div>
                <p>Toque para escolher ou remover o grupo.</p>
              </div>

              {loadStatus === "loading" && (
                <div className="habit-loading group-loading" aria-label="Carregando grupos">
                  <span />
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
                  <p>Entre em um grupo antes de registrar metas.</p>
                </div>
              )}

              {groups.length > 0 && (
                <div className="habit-group-list">
                  {groups.map((group) => (
                    <button
                      className={`habit-group-card ${
                        selectedGroupIds.includes(group.id) ? "active" : ""
                      }`}
                      key={group.id}
                      onClick={() => {
                        toggleGroupSelection(group.id);
                        setSubmitStatus("idle");
                        setMessage("");
                      }}
                      type="button"
                    >
                      {group.urlImagem ? (
                        <img alt="" className="habit-group-avatar" src={group.urlImagem} />
                      ) : (
                        <span className="habit-group-avatar">{getGroupInitial(group)}</span>
                      )}
                      <span className="habit-group-copy">
                        <strong>{group.name}</strong>
                        <small>{group.description || "Grupo Movely"}</small>
                      </span>
                      <em>
                        {selectedGroupIds.includes(group.id)
                          ? "Selecionado"
                          : "Escolher"}
                      </em>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {message && submitStatus === "error" && (
              <p className="form-message error" role="status">
                {message}
              </p>
            )}

            <button
              className="primary-button habit-submit"
              disabled={
                loadStatus !== "ready" ||
                groups.length === 0 ||
                selectedGroupIds.length === 0
              }
              onClick={handleGoToRegister}
              type="button"
            >
              Continuar
            </button>
          </>
        ) : (
          <>
            <section className="habit-hero">
              <p>{selectedGroupLabel}</p>
              <h1>Registrar meta</h1>
              <span>Agora escolha o tipo e preencha o registro de hoje.</span>
            </section>

            {selectedGroupCount > 0 && (
              <div className="habit-selected-group">
                {selectedGroupCount === 1 && selectedGroup?.urlImagem ? (
                  <img alt="" className="habit-group-avatar" src={selectedGroup.urlImagem} />
                ) : (
                  <span className="habit-group-avatar">
                    {selectedGroupCount > 1
                      ? selectedGroupCount
                      : getGroupInitial(selectedGroup)}
                  </span>
                )}
                <div>
                  <span>Registrando em</span>
                  <strong>{selectedGroupLabel}</strong>
                  {selectedGroupNames && <small>{selectedGroupNames}</small>}
                </div>
                <button onClick={handleBackToGroups} type="button">
                  Trocar
                </button>
              </div>
            )}

            <form className="habit-form" onSubmit={handleSubmit}>
              <section className="habit-panel">
                <div className="habit-panel-heading">
                  <div>
                    <span className="habit-kicker">Tipo de meta</span>
                    <strong>{activeHabit.label}</strong>
                  </div>
                  <p>{activeHabit.helper}</p>
                </div>

                <div
                  className="habit-type-grid"
                  role="group"
                  aria-label="Tipo de meta"
                >
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
                        <span>
                          <HabitIcon type={type} />
                        </span>
                        <strong>{habit.label}</strong>
                        <small>{habit.helper}</small>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={`habit-panel habit-details ${activeHabit.accent}`}>
                <div className="habit-panel-heading">
                  <div>
                    <span className="habit-kicker">Dados do registro</span>
                    <strong>{activeHabit.label}</strong>
                  </div>
                  <p>Essas informações vão para o {selectedTargetText}.</p>
                </div>

                <div className="field-row habit-primary-fields">
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
                      onChange={(event) =>
                        updateValue("quality", event.target.value)
                      }
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
                          onChange={(event) =>
                            updateValue("weight", event.target.value)
                          }
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
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { apiFetch, apiJson, getCurrentUser, getToken, readError } from "../lib/api";

type RequestStatus = "idle" | "loading" | "submitting" | "success" | "error";

type User = {
  id: number;
  username: string;
  email?: string | null;
};

type Group = {
  id: string;
  name: string;
  description?: string;
  urlImagem?: string;
  imageUrl?: string;
  ownerId?: number | null;
  ownerEmail?: string | null;
  users?: User[];
};

type PageResponse<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
};

function getPageItems<T>(response: PageResponse<T> | T[] | null) {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  return response.content ?? response.items ?? response.data ?? [];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getGroupImage(group?: Group | null) {
  return group?.urlImagem || group?.imageUrl || "";
}

function GroupAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className="group-avatar lavender">
      {imageUrl ? <img alt="" src={imageUrl} /> : <span>{getInitials(name)}</span>}
    </div>
  );
}

function UserAvatar({ username, id }: { username: string; id: number }) {
  const colors = ["lavender", "green", "blue", "pink", "amber"];

  return (
    <div className={`group-avatar ${colors[id % colors.length]}`}>
      <span>{getInitials(username)}</span>
    </div>
  );
}

function GroupTopBar({ title, backTo = "/groups" }: { title: string; backTo?: string }) {
  return (
    <header className="group-topbar">
      <Link aria-label="Voltar" className="group-back-button" to={backTo}>
        <span aria-hidden="true">&lt;</span>
      </Link>
      <div>
        <p>Movely grupos</p>
        <h1>{title}</h1>
      </div>
    </header>
  );
}

export function CreateGroupScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");

  const canSubmit = name.trim().length > 0 && description.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!getToken()) {
      navigate("/login");
      return;
    }

    if (!canSubmit) {
      setStatus("error");
      setMessage("Preencha nome e descricao para criar o grupo.");
      return;
    }

    setStatus("submitting");

    try {
      const createdGroup = await apiJson<Group>("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          urlImagem: imageUrl.trim() || undefined,
        }),
      });

      setStatus("success");
      setMessage("Grupo criado com sucesso.");

      window.setTimeout(() => {
        navigate(createdGroup?.id ? `/groups/${createdGroup.id}/members` : "/groups");
      }, 650);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel criar o grupo.");
    }
  }

  return (
    <main className="group-page">
      <section className="group-phone" aria-label="Criar grupo Movely">
        <GroupTopBar title="Criar Grupo" />

        <form className="group-form" onSubmit={handleSubmit}>
          <button
            aria-label="Adicionar imagem do grupo"
            className="group-photo-button"
            onClick={() => setShowImageField((current) => !current)}
            type="button"
          >
            {imageUrl ? <img alt="Preview do grupo" src={imageUrl} /> : <span aria-hidden="true">+</span>}
          </button>
          <p className="group-photo-help">Toque para adicionar uma imagem ao grupo.</p>

          {showImageField && (
            <label className="field group-field">
              <span>URL da imagem</span>
              <input
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                type="url"
                value={imageUrl}
              />
            </label>
          )}

          <label className="field group-field">
            <span>Nome do grupo</span>
            <input
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Desafio da semana"
              type="text"
              value={name}
            />
          </label>

          <label className="field group-field">
            <span>Descricao</span>
            <textarea
              maxLength={220}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Conte o objetivo do grupo."
              value={description}
            />
          </label>

          <div className="group-preview-card">
            <GroupAvatar imageUrl={imageUrl || undefined} name={name || "Movely"} />
            <div>
              <p>{name || "Seu grupo Movely"}</p>
              <span>{description || "Agua, passos, sono, treino e estudo em conjunto."}</span>
            </div>
          </div>

          {message && (
            <p className={`form-message ${status}`} role="status">
              {message}
            </p>
          )}

          <button
            className="primary-button group-bottom-button"
            disabled={status === "submitting" || !canSubmit}
          >
            {status === "submitting" ? "Criando..." : "Criar Grupo"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function AddMembersScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memberEmail, setMemberEmail] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [message, setMessage] = useState("");

  const members = group?.users ?? [];
  const foundUserEmail = foundUser?.email || foundUser?.username || "";
  const foundUserIsMember = foundUser
    ? members.some((member) => member.id === foundUser.id)
    : false;
  const foundUserWasInvited = invitedEmails.includes(foundUserEmail.toLowerCase());
  const canManageMembers = group ? !group.ownerId || currentUserId === group.ownerId : false;
  const groupId = group?.id || id || "";

  async function loadData() {
    if (!id) {
      setStatus("error");
      setMessage("Grupo nao encontrado.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const [groupsResponse, currentUser] = await Promise.all([
        apiJson<PageResponse<Group> | Group[]>("/api/groups?size=100"),
        getCurrentUser().catch(() => null),
      ]);
      const foundGroup = getPageItems(groupsResponse).find((item) => item.id === id) ?? null;

      setCurrentUserId(currentUser?.id ?? null);
      setGroup(foundGroup);
      setStatus(foundGroup ? "idle" : "error");
      setMessage(foundGroup ? "" : "Grupo nao encontrado.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o grupo.");
    }
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    loadData();
  }, [id, navigate]);

  async function handleSearchByEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) {
      setStatus("error");
      setMessage("Grupo nao encontrado.");
      return;
    }

    const normalizedEmail = memberEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Digite o email da pessoa.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    setFoundUser(null);

    try {
      const usersResponse = await apiJson<PageResponse<User> | User[]>("/api/users");
      const user = getPageItems(usersResponse).find((item) => {
        const itemEmail = (item.email || item.username || "").trim().toLowerCase();
        const itemUsername = (item.username || "").trim().toLowerCase();

        return itemEmail === normalizedEmail || itemUsername === normalizedEmail;
      });

      if (!user) {
        throw new Error("Nenhum usuario encontrado com esse email.");
      }

      setFoundUser(user);
      setStatus("success");
      setMessage("Usuario encontrado. Agora voce pode enviar o convite.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nenhum usuario encontrado com esse email.");
    }
  }

  async function handleInviteUser() {
    if (!groupId || !foundUserEmail) {
      setStatus("error");
      setMessage("Grupo ou usuario nao identificado.");
      return;
    }

    if (foundUserIsMember) {
      setStatus("error");
      setMessage("Essa pessoa ja esta no grupo.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/groups/add?groupId=${encodeURIComponent(groupId)}&userId=${foundUser?.id ?? ""}&email=${encodeURIComponent(foundUserEmail)}`,
        {
          method: "POST",
          body: JSON.stringify({
            groupId,
            userId: foundUser?.id,
            email: foundUserEmail,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response, "Nao foi possivel enviar o convite."));
      }

      await response.json();
      setInvitedEmails((current) => [...current, foundUserEmail.toLowerCase()]);
      setMemberEmail("");
      setStatus("success");
      setMessage("Convite enviado. A pessoa precisa aceitar para entrar no grupo.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel enviar o convite.");
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!groupId) {
      setStatus("error");
      setMessage("Grupo nao encontrado.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await apiFetch("/api/groups/remove", {
        method: "POST",
        body: JSON.stringify({
          groupId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Nao foi possivel remover o membro."));
      }

      const updatedGroup = (await response.json()) as Group;
      setGroup(updatedGroup);
      setStatus("success");
      setMessage("Membro removido do grupo.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel remover o membro.");
    }
  }

  return (
    <main className="group-page">
      <section className="group-phone" aria-label="Adicionar membros ao grupo">
        <GroupTopBar title={canManageMembers ? "Adicionar Membros" : "Membros do Grupo"} />

        {group && (
          <div className="group-current-card">
            <GroupAvatar imageUrl={getGroupImage(group)} name={group.name} />
            <div>
              <p>{group.name}</p>
              <span>{group.description || "Grupo Movely"}</span>
            </div>
          </div>
        )}

        {status === "loading" && (
          <p className="form-message success" role="status">
            Carregando dados do grupo...
          </p>
        )}

        {message && status !== "loading" && (
          <p className={`form-message ${status === "success" ? "success" : "error"}`} role="status">
            {message}
          </p>
        )}

        {group && canManageMembers ? (
          <>
            <form className="member-id-form" onSubmit={handleSearchByEmail}>
              <label className="field group-field">
                <span>Email do membro</span>
                <input
                  autoComplete="email"
                  inputMode="email"
                  onChange={(event) => {
                    setMemberEmail(event.target.value);
                    setFoundUser(null);
                    setMessage("");
                  }}
                  placeholder="pessoa@email.com"
                  type="email"
                  value={memberEmail}
                />
              </label>
              <button
                className="invite-button member-id-button"
                disabled={status === "submitting"}
                type="submit"
              >
                {status === "submitting" ? "Buscando..." : "Buscar"}
              </button>
              <p>Digite o email completo. O Movely so mostra resultado se esse usuario existir.</p>
            </form>

            <section className="group-section">
              <div className="group-section-heading">
                <h2>Resultado</h2>
                <span>{foundUser ? 1 : 0}</span>
              </div>

              <div className="member-list">
                {foundUser ? (
                  <article className="member-row">
                    <UserAvatar id={foundUser.id} username={foundUser.username} />
                    <div>
                      <p>{foundUser.username}</p>
                      <span>{foundUserEmail}</span>
                    </div>
                    <button
                      className={`invite-button ${foundUserWasInvited ? "invited" : ""}`}
                      disabled={status === "submitting" || foundUserIsMember || foundUserWasInvited}
                      onClick={handleInviteUser}
                      type="button"
                    >
                      {foundUserIsMember ? "Ja esta" : foundUserWasInvited ? "Convidado" : "Adicionar"}
                    </button>
                  </article>
                ) : (
                  <div className="member-empty">
                    <strong>Nenhum email buscado</strong>
                    <span>Procure pelo email exato para enviar um convite privado.</span>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : group ? (
          <div className="member-empty">
            <strong>Convites ficam com quem criou o grupo</strong>
            <span>Voce pode ver os membros, mas so a pessoa criadora consegue convidar ou remover.</span>
          </div>
        ) : null}

        <section className="group-section">
          <div className="group-section-heading">
            <h2>Membros no grupo</h2>
            <span>{members.length}</span>
          </div>

          <div className="member-list">
            {members.map((member) => (
              <article className="member-row" key={member.id}>
                <UserAvatar id={member.id} username={member.username} />
                <div>
                  <p>{member.username}</p>
                  <span>{member.email || member.username}</span>
                </div>
                {canManageMembers && (
                  <button
                    aria-label={`Remover ${member.username}`}
                    className="remove-member-button"
                    disabled={status === "submitting"}
                    onClick={() => handleRemoveMember(member.id)}
                    type="button"
                  >
                    x
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        <Link className="primary-button group-bottom-button" to="/groups">
          Concluir
        </Link>
      </section>
    </main>
  );
}

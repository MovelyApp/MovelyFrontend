import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";

type AuthMode = "login" | "register";
type RequestStatus = "idle" | "submitting" | "success" | "error";

type AuthScreenProps = {
  mode: AuthMode;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const authCopy = {
  login: {
    title: "Bem-vindo de volta",
    eyebrow: "Movely",
    subtitle: "Entre para acompanhar metas, pontos e desafios com seu grupo.",
    button: "Entrar",
    loading: "Entrando...",
    success: "Login realizado. Seu token foi salvo neste navegador.",
    alternateText: "Ainda não tem conta?",
    alternateLink: "Criar conta",
    alternateHref: "/cadastro",
  },
  register: {
    title: "Crie sua conta",
    eyebrow: "Comece no Movely",
    subtitle: "Monte seu perfil e entre nos desafios de hábitos saudáveis.",
    button: "Cadastrar",
    loading: "Criando conta...",
    success: "Conta criada. Agora você já pode entrar no Movely.",
    alternateText: "Já tem uma conta?",
    alternateLink: "Entrar",
    alternateHref: "/login",
  },
} as const;

function getFriendlyError(message: string) {
  if (!message) {
    return "Não foi possível concluir agora. Tente novamente.";
  }

  if (message.includes("User already exists")) {
    return "Esse usuário já existe. Tente entrar ou escolha outro nome.";
  }

  if (message.includes("Bad credentials") || message.includes("Unauthorized")) {
    return "Usuário ou senha inválidos.";
  }

  return message;
}

function extractToken(responseText: string) {
  const trimmedText = responseText.trim();

  if (!trimmedText) {
    return "";
  }

  try {
    const data = JSON.parse(trimmedText) as {
      token?: string;
      accessToken?: string;
      jwt?: string;
    };

    return data.token ?? data.accessToken ?? data.jwt ?? "";
  } catch {
    return trimmedText;
  }
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const navigate = useNavigate();
  const copy = authCopy[mode];
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setStatus("error");
      setMessage("Preencha usuário e senha para continuar.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas precisam ser iguais.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch(
        `${API_BASE_URL}${isRegister ? "/auth/register" : "/auth/login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: trimmedUsername,
            password,
          }),
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || response.statusText);
      }

      if (!isRegister && typeof window !== "undefined") {
        const token = extractToken(responseText);

        if (!token) {
          throw new Error("Login realizado, mas o backend nao retornou um token.");
        }

        if (remember) {
          window.localStorage.setItem("movely_token", token);
        } else {
          window.sessionStorage.setItem("movely_token", token);
        }
      }

      setStatus("success");
      setMessage(copy.success);

      if (!isRegister) {
        navigate("/dashboard");
        return;
      }

      if (isRegister) {
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        getFriendlyError(error instanceof Error ? error.message : ""),
      );
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout" aria-label="Autenticação Movely">
        <div className="auth-phone">
          <div className="brand-row">
            <div className="brand-mark">M</div>
            <div>
              <p>{copy.eyebrow}</p>
              <strong>movely</strong>
            </div>
          </div>

          <div className="auth-heading">
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <nav className="auth-segment" aria-label="Escolher tela">
            <Link
              className={mode === "login" ? "active" : ""}
              to="/login"
              aria-current={mode === "login" ? "page" : undefined}
            >
              Entrar
            </Link>
            <Link
              className={mode === "register" ? "active" : ""}
              to="/cadastro"
              aria-current={mode === "register" ? "page" : undefined}
            >
              Cadastro
            </Link>
          </nav>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Usuário</span>
              <input
                autoComplete="username"
                name="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="seu.usuario"
                type="text"
                value={username}
              />
            </label>

            <label className="field">
              <span>Senha</span>
              <div className="password-control">
                <input
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="mínimo 6 caracteres"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="ghost-button"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            {isRegister && (
              <label className="field">
                <span>Confirmar senha</span>
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="repita sua senha"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                />
              </label>
            )}

            {!isRegister && (
              <label className="remember-row">
                <input
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                <span>Manter conectado</span>
              </label>
            )}

            {message && (
              <p className={`form-message ${status}`} role="status">
                {message}
              </p>
            )}

            <button className="primary-button" disabled={status === "submitting"}>
              {status === "submitting" ? copy.loading : copy.button}
            </button>
          </form>

          <p className="auth-switch">
            {copy.alternateText}{" "}
            <Link to={copy.alternateHref}>{copy.alternateLink}</Link>
          </p>
        </div>

      </section>
    </main>
  );
}

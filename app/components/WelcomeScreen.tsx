import { useState } from "react";
import { Link } from "react-router";
import movelyIcon from "../../images/movelyicon.png";

const slides = [
  {
    title: "Metas que viram rotina",
    description:
      "Acompanhe água, passos, treino, sono e estudo em um só lugar.",
    tone: "goals",
    previewTitle: "Hoje",
    previewValue: "82%",
    previewLabel: "do desafio concluído",
  },
  {
    title: "Desafios com seu grupo",
    description:
      "Crie objetivos em conjunto e veja todo mundo evoluindo no mesmo ritmo.",
    tone: "group",
    previewTitle: "Família Verão",
    previewValue: "5",
    previewLabel: "metas ativas",
  },
  {
    title: "Ranking para manter o foco",
    description:
      "Some pontos, suba posições e transforme pequenos hábitos em progresso.",
    tone: "ranking",
    previewTitle: "Sua posição",
    previewValue: "3º",
    previewLabel: "270 pts para subir",
  },
] as const;

export function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const isLastSlide = activeIndex === slides.length - 1;

  function handleNext() {
    if (!isLastSlide) {
      setActiveIndex((current) => current + 1);
    }
  }

  return (
    <main className="welcome-page">
      <section className="welcome-card" aria-label="Apresentação do Movely">
        <header className="welcome-top">
          <div className="brand-row compact">
            <img alt="" className="brand-mark brand-logo-image" src={movelyIcon} />
            <div>
              <p>Movely</p>
              <strong>movely</strong>
            </div>
          </div>
          <Link className="skip-link" to="/login">
            Pular
          </Link>
        </header>

        <div className={`welcome-visual ${activeSlide.tone}`}>
          <div className="visual-orbit">
            <span />
            <span />
            <span />
          </div>
          <div className="visual-card">
            <span>{activeSlide.previewTitle}</span>
            <strong>{activeSlide.previewValue}</strong>
            <p>{activeSlide.previewLabel}</p>
          </div>
        </div>

        <div className="welcome-copy">
          <p className="welcome-step">
            {activeIndex + 1} de {slides.length}
          </p>
          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.description}</p>
        </div>

        <div className="welcome-dots" aria-label="Etapas da apresentação">
          {slides.map((slide, index) => (
            <button
              aria-label={`Ir para ${slide.title}`}
              aria-current={activeIndex === index ? "step" : undefined}
              className={activeIndex === index ? "active" : ""}
              key={slide.title}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>

        <div className="welcome-actions">
          {isLastSlide ? (
            <Link className="primary-button welcome-button" to="/login">
              Começar
            </Link>
          ) : (
            <button
              className="primary-button welcome-button"
              onClick={handleNext}
              type="button"
            >
              Próximo
            </button>
          )}

          <Link className="secondary-link" to="/cadastro">
            Criar conta agora
          </Link>
        </div>
      </section>
    </main>
  );
}

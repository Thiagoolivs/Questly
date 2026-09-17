import React from "react";
import Icon from "../core/Icon.jsx";

/**
 * Linha de lista do LGrow.
 *
 * Além da API original (icon/title/meta/count/danger), aceita o que o Questly
 * precisa para listas acionáveis: `subtitle`, um controle à direita (`trailing`)
 * e o chevron opcional — numa linha com checkbox o chevron não faz sentido.
 *
 * `leading` substitui o ícone quando a esquerda precisa ser um controle de
 * verdade (checkbox, avatar, posição no ranking) e não um glifo.
 */
export default function ListRow({
  icon,
  leading,
  title,
  subtitle,
  meta,
  count,
  trailing,
  chevron,
  danger = false,
  muted = false,
  divider = true,
  onClick,
  style,
  ...rest
}) {
  // Por padrão a linha leva a algum lugar (chevron), salvo quando há um
  // controle próprio à direita ou quando ela não é clicável.
  const showChevron = chevron ?? (trailing == null && onClick != null);
  const titleColor = danger
    ? "var(--danger)"
    : muted
      ? "var(--text-tertiary)"
      : "var(--text-primary)";

  return (
    <div
      onClick={onClick}
      {...rest}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-5)",
        padding: "12px 0",
        borderBottom: divider ? "1px solid var(--line-hairline)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {leading ??
        (icon ? (
          <Icon
            name={icon}
            size={16}
            color={danger ? "var(--danger)" : "var(--text-secondary)"}
          />
        ) : null)}

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--fs-body)",
            color: titleColor,
            textDecoration: muted ? "line-through" : "none",
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <span
            style={{
              display: "block",
              marginTop: 2,
              fontFamily: "var(--font-ui)",
              fontSize: "var(--fs-body-sm)",
              color: "var(--text-tertiary)",
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>

      {meta ? (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--fs-body-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          {meta}
        </span>
      ) : null}
      {count != null ? (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--fs-body-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          {count}
        </span>
      ) : null}
      {trailing}
      {showChevron ? (
        <Icon name="chevron-right" size={15} color="var(--text-tertiary)" />
      ) : null}
    </div>
  );
}

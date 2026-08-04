/*
 * Selector "¿quién juega?" de la cuenta de tutor con varios perfiles (ADR-004
 * §6). Al elegir un perfil con PIN configurado, la app pide el PIN antes de
 * abrirlo (el pestillo lo aplica quien orquesta, AppRoot). Con un solo perfil
 * este selector no se muestra (AppRoot entra directo).
 */
import { useTranslation } from "react-i18next";
import { PageLayout, Button, Icon } from "@/components";
import { avatarById, nicknameKey } from "@/lib/profile";
import type { ChildProfile } from "@/lib/firebase/firestore";
import styles from "./account.module.css";

interface ChildSelectorScreenProps {
  children: ChildProfile[];
  lockedIds: string[];
  canAdd: boolean;
  onSelect: (child: ChildProfile) => void;
  onAdd: () => void;
  onSignOut: () => void;
}

export function ChildSelectorScreen({
  children,
  lockedIds,
  canAdd,
  onSelect,
  onAdd,
  onSignOut,
}: ChildSelectorScreenProps) {
  const { t } = useTranslation(["account", "content"]);
  const locked = new Set(lockedIds);

  return (
    <PageLayout width="narrow">
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t("account:selector.title")}</h1>
        <p className={styles.subtitle}>{t("account:selector.subtitle")}</p>

        <ul className={styles.choices} role="list">
          {children.map((c) => {
            const av = avatarById(c.avatar);
            const name = t(nicknameKey(c.mote));
            return (
              <li key={c.id}>
                <button type="button" className={styles.bigChoice} onClick={() => onSelect(c)}>
                  <span className={styles.choiceTitle}>
                    <span aria-hidden="true">{av.emoji} </span>
                    {name}
                    {locked.has(c.id) ? (
                      <span aria-label={t("account:selector.locked")}>
                        {" "}
                        <Icon name="lock" size={16} aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.actions}>
          {canAdd ? (
            <Button variant="secondary" size="md" onClick={onAdd}>
              {t("account:selector.add")}
            </Button>
          ) : null}
          <Button variant="ghost" size="md" onClick={onSignOut}>
            {t("account:selector.manage")}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

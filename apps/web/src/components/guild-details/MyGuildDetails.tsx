import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { PATHS } from "../../constants/paths";
import { fetchMyGuild, leaveGuild } from "../../features/guild/api";
import { toDisplayGuild, type DisplayGuild } from "../../features/guild/presentation";
import { BACK_NAVIGATION_SE_SRC, useBackNavigationSe } from "../../hooks/useBackNavigationSe";
import { steppedEase } from "../../lib/animationUtils";
import { ApiError } from "../../lib/api/client";
import styles from "./MyGuildDetails.module.css";

interface MyGuildDetailsProps {
  onNavigate: (path: string) => void;
}

interface GuildMember {
  id: string;
  name: string;
  title: string;
  avatar: string;
  contributionCp: number;
  isCurrentUser?: boolean;
}

const MEMBERS: GuildMember[] = [
  {
    id: "current-user",
    name: "TypeSmith",
    title: "Generic Hero",
    avatar: "YOU",
    contributionCp: 35420,
    isCurrentUser: true,
  },
  {
    id: "null-mage",
    name: "NullMage",
    title: "Void Debugger",
    avatar: "NM",
    contributionCp: 31980,
  },
  {
    id: "pixel-ninja",
    name: "PixelNinja",
    title: "UI Shinobi",
    avatar: "PN",
    contributionCp: 28640,
  },
  {
    id: "loop-knight",
    name: "LoopKnight",
    title: "Iteration Paladin",
    avatar: "LK",
    contributionCp: 25110,
  },
];

const panelTransition = { duration: 0.34, ease: steppedEase(6) };

export function MyGuildDetails({ onNavigate }: MyGuildDetailsProps) {
  const { backNavigationSeRef, navigateBackWithSe } = useBackNavigationSe(onNavigate);
  const [guild, setGuild] = useState<DisplayGuild | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const stats = useMemo(() => {
    const displayGuild = guild;

    return [
      { label: "GUILD LEVEL", value: displayGuild ? `LV.${displayGuild.sortOrder + 1}` : "--" },
      {
        label: "LAST SEASON CP",
        value: displayGuild ? displayGuild.previousSeasonCp.toLocaleString() : "--",
      },
      {
        label: "MEMBERS",
        value: displayGuild ? displayGuild.memberCount.toLocaleString() : "--",
      },
    ];
  }, [guild]);

  useEffect(() => {
    let isMounted = true;

    fetchMyGuild()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        if (!data?.guild) {
          onNavigate(PATHS.GUILD_SELECT);
          return;
        }

        setGuild(toDisplayGuild(data.guild));
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.error("failed to fetch my guild details", error);
        setStatusMessage("ギルド情報を取得できませんでした。時間を置いて再度お試しください。");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onNavigate]);

  const leaveCurrentGuild = async () => {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);
    setStatusMessage(null);
    try {
      await leaveGuild();
      onNavigate(PATHS.GUILD_SELECT);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        onNavigate(PATHS.GUILD_SELECT);
        return;
      }

      console.error("failed to leave guild", error);
      setStatusMessage("ギルド脱退に失敗しました。少し時間を置いて再度お試しください。");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <main className={styles.main}>
      <audio
        ref={backNavigationSeRef}
        src={BACK_NAVIGATION_SE_SRC}
        preload="none"
        aria-hidden="true"
      />

      <div className={styles.shell}>
        <div className={styles.topBar}>
          <motion.button
            className={styles.backButton}
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 2, scale: 0.98 }}
            onClick={() => void navigateBackWithSe("/guild")}
          >
            &lt; GUILD BASE
          </motion.button>
          <p className={styles.routeLabel}>MY GUILD / OPERATIONS ROOM</p>
        </div>

        <div className={styles.layout}>
          <motion.section
            className={`${styles.panel} ${styles.guildPanel}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={panelTransition}
            aria-labelledby="my-guild-title"
          >
            <div className={styles.identity}>
              <div className={styles.emblem} aria-hidden="true" style={{ color: guild?.color }}>
                {isLoading ? "..." : (guild?.icon ?? "--")}
              </div>
              <div>
                <span className={styles.eyebrow}>
                  CURRENT GUILD / {guild?.slug ?? (isLoading ? "SYNCING" : "NONE")}
                </span>
                <h1 className={styles.title} id="my-guild-title">
                  {guild ? `${guild.name} Guild` : "Loading Guild"}
                </h1>
              </div>
            </div>

            <p className={styles.description}>
              {guild?.description ??
                "所属ギルドの作戦情報を同期しています。接続が完了すると現在のギルドが表示されます。"}
            </p>

            <div className={styles.stats} aria-label="Guild stats">
              {stats.map((stat) => (
                <div className={styles.statCard} key={stat.label}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <strong className={styles.statValue}>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <motion.button
                className={styles.copyButton}
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 2, scale: 0.98 }}
              >
                INVITE LINK
              </motion.button>
              <motion.button
                className={styles.leaveButton}
                type="button"
                disabled={isLeaving || isLoading || !guild}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ y: 2, scale: 0.98 }}
                onClick={() => void leaveCurrentGuild()}
              >
                {isLeaving ? "LEAVING..." : "LEAVE GUILD"}
              </motion.button>
            </div>
            {statusMessage && (
              <p className={styles.statusMessage} role="alert">
                {statusMessage}
              </p>
            )}
          </motion.section>

          <motion.section
            className={`${styles.panel} ${styles.memberPanel}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...panelTransition, delay: 0.08 }}
            aria-labelledby="member-list-title"
          >
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle} id="member-list-title">
                MEMBER CONTRIBUTION
              </h2>
              <span className={styles.online}>{MEMBERS.length} OPERATORS ONLINE</span>
            </header>

            <div className={styles.memberList}>
              {MEMBERS.map((member, index) => (
                <motion.article
                  className={`${styles.memberRow} ${
                    member.isCurrentUser ? styles.memberRowSelf : ""
                  }`}
                  key={member.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06, duration: 0.28, ease: steppedEase(5) }}
                  aria-label={member.isCurrentUser ? `${member.name}, current user` : member.name}
                >
                  <div className={styles.avatar} aria-hidden="true">
                    {member.avatar}
                  </div>
                  <div>
                    <strong className={styles.memberName}>{member.name}</strong>
                    <span className={styles.memberTitle}>{member.title}</span>
                  </div>
                  <strong className={styles.memberCp}>
                    {member.contributionCp.toLocaleString()} CP
                  </strong>
                </motion.article>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

      <div className={styles.scanline} aria-hidden="true" />
    </main>
  );
}

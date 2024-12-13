import { useEffect, useRef } from "react";
import styles from "./home.module.scss";
import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";
import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
} from "../constant";
import { Link, useNavigate } from "react-router-dom";
import { useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import Image from "next/image";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: { metaKey: any; altKey: any; ctrlKey: any; key: string; }) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        const n = chatStore.sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = chatStore.currentSessionIndex;
        if (e.key === "ArrowUp") {
          chatStore.selectSession(limit(i - 1));
        } else if (e.key === "ArrowDown") {
          chatStore.selectSession(limit(i + 1));
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? 300);
  const lastUpdateTime = useRef(Date.now());

  const handleMouseMove = useRef((e: { clientX: number; }) => {
    if (Date.now() < lastUpdateTime.current + 50) {
      return;
    }
    lastUpdateTime.current = Date.now();
    const d = e.clientX - startX.current;
    const nextWidth = limit(startDragWidth.current + d);
    config.update((config) => (config.sidebarWidth = nextWidth));
  });

  const handleMouseUp = useRef(() => {
    startDragWidth.current = config.sidebarWidth ?? 300;
    window.removeEventListener("mousemove", handleMouseMove.current);
    window.removeEventListener("mouseup", handleMouseUp.current);
  });

  const onDragMouseDown = (e: { clientX: number; }) => {
    startX.current = e.clientX;

    window.addEventListener("mousemove", handleMouseMove.current);
    window.addEventListener("mouseup", handleMouseUp.current);
  };
  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? 300);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragMouseDown,
    shouldNarrow,
  };
}

export function SideBar(props: { className: any; }) {
  const chatStore = useChatStore();
  const { onDragMouseDown, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        color: "#fff",
        boxShadow: "2px 0 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className={styles["sidebar-header"]}>
        <div className={styles["sidebar-title"]}>
          <Image
            src="/logo.svg"
            alt="logo"
            width={120}
            height={50}
            draggable={false}
            className="select-none"
          />
        </div>
        <div className={styles["sidebar-sub-title"]}>
          <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Empower your workflow with AI.
          </p>
        </div>
      </div>

      <div className={styles["sidebar-body"]}>
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-actions"]}>
        <IconButton
          icon={<AddIcon />}
          text={shouldNarrow ? undefined : "New Chat"}
          className={styles["sidebar-bar-button"]}
          onClick={() => {
            if (config.dontShowMaskSplashScreen) {
              chatStore.newSession();
              navigate(Path.Chat);
            } else {
              navigate(Path.NewChat);
            }
          }}
        />
        <IconButton
          icon={<SettingsIcon />}
          text={shouldNarrow ? undefined : "Settings"}
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.Settings)}
        />
      </div>

      <div
        className={styles["sidebar-tail"]}
        style={{ padding: "1rem 0", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
      >
        <IconButton
          icon={<CloseIcon />}
          onClick={() => {
            if (confirm(Locale.Home.DeleteChat)) {
              chatStore.deleteSession(chatStore.currentSessionIndex);
            }
          }}
        />
      </div>

      <div
        className={styles["sidebar-drag"]}
        onMouseDown={(e) => onDragMouseDown(e)}
      ></div>
    </div>
  );
}

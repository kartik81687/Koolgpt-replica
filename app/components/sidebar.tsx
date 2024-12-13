import { useEffect, useRef, useState } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import Locale from "../locales";
import chatStyle from "./chat.module.scss";

import { Theme, useAppConfig, useChatStore } from "../store";

import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showToast } from "./ui-lib";
import Image from "next/image";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

  const handleMouseMove = useRef((e: MouseEvent) => {
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

  const onDragMouseDown = (e: MouseEvent) => {
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
export function ChatActions(props: {
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  onSpeechStart: () => void;
  onBarding: () => void;
  onClauding: () => void;
  onChinese: () => void;
  setSpeaking: (param: boolean) => void;
  hitBottom: boolean;
  recording: boolean;
  barding: boolean;
  clauding: boolean;
  chinese: boolean;
  speaking: boolean;
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const [isChecked, setIsChecked] = useState(false)

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }
  return (
    <div  >
      <div
      className={styles["sidebar-header-bar"]}
        
        onClick={nextTheme}
      >
        {theme === Theme.Auto ? (
          <AutoIcon />
        ) : theme === Theme.Light ? (
          <LightIcon />
        ) : theme === Theme.Dark ? (
          <DarkIcon />
        ) : null}
      </div>
      <div className="w-full flex items-center justify-center">
  {/* <div className="bg-[#d3d3d3] dark:bg-[#0E0F13] rounded-full flex items-center p-1 w-24 h-10">
    <button
      className="bg-[#69A606] dark:bg-[#0E0F13] text-white dark:text-white rounded-full w-10 h-8 flex items-center justify-center transition-all duration-300 ease-in-out"
      onClick={nextTheme}
      aria-label="Light Mode"
    >
      <img className="w-[20px] h-[20px]" alt="Light Mode" src="/images/light.svg" />
    </button>

    <button
      className="bg-[#d3d3d3] dark:bg-neutral-800 dark:text-white rounded-full w-10 h-8 flex items-center justify-center transition-all duration-300 ease-in-out"
      onClick={nextTheme}
      aria-label="Dark Mode"
    >
      <img className="w-[20px] h-[20px]" alt="Dark Mode" src="/images/dark.svg" />
    </button>
  </div> */}
    <div className='relative'>
          <input
            type='checkbox'
            checked={isChecked}
            onChange={handleCheckboxChange}
            className='sr-only'
          />
          <div className='block h-8 w-14 rounded-full bg-[#E5E7EB]'></div>
          <div className='dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition'></div>
        </div>
</div>

    </div>
  );
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragMouseDown, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
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
      {/* <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<MaskIcon />}
          text={shouldNarrow ? undefined : Locale.Mask.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => navigate(Path.NewChat, { state: { fromHome: true } })}
          shadow
        />
      </div>{" "} */}
      <Link to={Path.Settings} className={styles["sidebar-link"]}>
        <div className={styles["sidebar-header-bar"]}>
          <IconButton
            icon={<SettingsIcon />}
            text={shouldNarrow ? undefined : "Settings"}
            className={styles["sidebar-bar-button"]}
            shadow
          />
        </div>
      </Link>
      <div className={styles["sidebar-header-bar"]}>
        <IconButton
          icon={<AddIcon />}
          text={shouldNarrow ? undefined : Locale.Home.NewChat}
          className={styles["sidebar-bar-button"]}
          onClick={() => {
            if (config.dontShowMaskSplashScreen) {
              chatStore.newSession();
              navigate(Path.Chat);
            } else {
              navigate(Path.NewChat);
            }
          }}
          shadow
        />
      </div>{" "}
      <div
        className={styles["sidebar-body"]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>
      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"] + " " + styles.mobile}>
            <IconButton
              icon={<CloseIcon />}
              onClick={() => {
                if (confirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div>
          {/* <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div> */}
        </div>
        {/* <div>
          <IconButton
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
            shadow
          />
        </div> */}
      </div>
      <div
        className={styles["sidebar-drag"]}
        onMouseDown={(e) => onDragMouseDown(e as any)}
      ></div>
       <ChatActions showPromptModal={function (): void {
        throw new Error("Function not implemented.");
      } } scrollToBottom={function (): void {
        throw new Error("Function not implemented.");
      } } showPromptHints={function (): void {
        throw new Error("Function not implemented.");
      } } onSpeechStart={function (): void {
        throw new Error("Function not implemented.");
      } } onBarding={function (): void {
        throw new Error("Function not implemented.");
      } } onClauding={function (): void {
        throw new Error("Function not implemented.");
      } } onChinese={function (): void {
        throw new Error("Function not implemented.");
      } } setSpeaking={function (param: boolean): void {
        throw new Error("Function not implemented.");
      } } hitBottom={false} recording={false} barding={false} clauding={false} chinese={false} speaking={false}/>
    </div>
   
  );
}

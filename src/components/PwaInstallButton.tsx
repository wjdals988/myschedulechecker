"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HomeIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallStatus = "idle" | "ready" | "installed" | "unsupported" | "dismissed";

export function PwaInstallButton({ className }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [status, setStatus] = useState<InstallStatus>("idle");
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    registerServiceWorker().then((ready) => {
      setServiceWorkerReady(ready);
    });

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setStatus("ready");
    }

    function handleInstalled() {
      setPromptEvent(null);
      setStatus("installed");
      setGuideOpen(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (isStandalone() || status === "installed") {
      setStatus("installed");
      setGuideOpen(true);
      return;
    }

    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      setStatus(choice.outcome === "accepted" ? "installed" : "dismissed");
      if (choice.outcome !== "accepted") {
        setGuideOpen(true);
      }
      return;
    }

    setStatus(serviceWorkerReady ? "unsupported" : "idle");
    setGuideOpen(true);
  }

  const label = status === "installed" ? "설치됨" : status === "ready" ? "앱 설치" : serviceWorkerReady ? "설치" : "준비";

  return (
    <>
      <button
        type="button"
        onClick={installApp}
        className={cn(
          "app-button-secondary inline-flex h-10 items-center justify-center gap-1 px-3 text-sm font-semibold shadow-[var(--shadow-soft)] hover:border-[var(--accent)]",
          status === "ready" && "border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]",
          className,
        )}
        title="홈 화면에 앱 설치"
      >
        <HomeIcon className="h-4 w-4" />
        <span className="hidden min-[390px]:inline sm:inline">{label}</span>
      </button>

      {guideOpen && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[80] bg-black/24 backdrop-blur-[1.5px]"
                aria-label="앱 설치 안내 닫기"
                onClick={() => setGuideOpen(false)}
              />
              <section
                className="fixed inset-x-0 bottom-0 z-[90] rounded-t-[22px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
                role="dialog"
                aria-modal="true"
                aria-label="앱 설치 안내"
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border-strong)] sm:hidden" />
                <p className="app-kicker text-[0.7rem] font-bold">Install</p>
                <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">{getGuideTitle(status)}</h2>
                <InstallGuide status={status} serviceWorkerReady={serviceWorkerReady} />
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="app-button-primary mt-5 h-11 w-full px-4 text-sm font-semibold"
                >
                  확인
                </button>
              </section>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function InstallGuide({
  status,
  serviceWorkerReady,
}: {
  status: InstallStatus;
  serviceWorkerReady: boolean;
}) {
  const environment = getInstallEnvironment();

  if (environment === "ios-safari") {
    return (
      <ol className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[var(--muted)]">
        <li>1. Safari 하단 또는 상단의 공유 버튼을 누릅니다.</li>
        <li>2. 목록에서 홈 화면에 추가를 선택합니다.</li>
        <li>3. 추가를 누르면 바탕화면에 앱 아이콘이 생성됩니다.</li>
      </ol>
    );
  }

  if (environment === "ios-other") {
    return (
      <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[var(--muted)]">
        <p>iPhone/iPad에서는 Safari에서 열어야 홈 화면 추가가 안정적으로 동작합니다.</p>
        <p>Safari로 이 방 링크를 연 뒤 공유 버튼에서 홈 화면에 추가를 선택해 주세요.</p>
      </div>
    );
  }

  if (environment === "android") {
    return (
      <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[var(--muted)]">
        {status === "ready" ? (
          <p>설치 준비가 완료되었습니다. 다시 설치 버튼을 누르면 브라우저 설치 팝업이 열립니다.</p>
        ) : null}
        {!serviceWorkerReady ? (
          <p>설치 준비를 마치는 중입니다. 이 안내를 닫고 2-3초 뒤 다시 설치 버튼을 눌러보세요.</p>
        ) : null}
        <ol className="space-y-2">
          <li>1. Android Chrome 기준으로 우측 상단 ⋮ 메뉴를 누릅니다.</li>
          <li>2. 앱 설치 또는 홈 화면에 추가를 선택합니다.</li>
          <li>3. 버튼 설치 팝업이 안 뜨면 페이지를 새로고침한 뒤 다시 설치를 눌러주세요.</li>
        </ol>
        <p className="text-xs leading-5 text-[var(--muted-soft)]">
          카카오톡, 네이버앱, 일부 인앱 브라우저에서는 설치 팝업이 막힐 수 있습니다. 이 경우 Chrome으로 열어야 합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[var(--muted)]">
      <p>설치 팝업이 바로 뜨지 않으면 브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택해 주세요.</p>
      <p>Chrome, Edge, Samsung Internet 계열에서는 설치 조건이 충족되면 이 버튼으로 설치 팝업이 열립니다.</p>
    </div>
  );
}

function getGuideTitle(status: InstallStatus) {
  if (status === "installed") return "이미 설치된 상태입니다";
  if (status === "dismissed") return "설치가 취소되었습니다";
  return "홈 화면에 추가하는 방법";
}

function getInstallEnvironment() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  const isIosSafari = isIos && /safari/i.test(userAgent) && !/(crios|fxios|edgios|opios)/i.test(userAgent);

  if (isIosSafari) return "ios-safari";
  if (isIos) return "ios-other";
  if (isAndroid) return "android";
  return "other";
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return false;
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return false;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    registration.update().catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

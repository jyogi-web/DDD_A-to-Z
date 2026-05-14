import { useCallback, useEffect, useRef } from "react";

export function useHomeAudio(onNavigate: (path: string) => void) {
  const homeBgmRef = useRef<HTMLAudioElement | null>(null);
  const confirmModalSeRef = useRef<HTMLAudioElement | null>(null);
  const modalCancelSeRef = useRef<HTMLAudioElement | null>(null);
  const returnTitleSeRef = useRef<HTMLAudioElement | null>(null);
  const gopherTalkSeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = homeBgmRef.current;
    if (!audio) {
      return;
    }

    let isUnlocked = false;
    audio.volume = 0.34;

    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", unlockBgm);
      window.removeEventListener("keydown", unlockBgm);
    };

    const playBgm = () => {
      if (isUnlocked) {
        return;
      }

      void audio
        .play()
        .then(() => {
          isUnlocked = true;
          removeUnlockListeners();
        })
        .catch(() => {
          // ブラウザの自動再生制限で止められた場合は、最初のユーザー操作で再試行する。
        });
    };

    const unlockBgm = () => {
      playBgm();
    };

    playBgm();
    window.addEventListener("pointerdown", unlockBgm);
    window.addEventListener("keydown", unlockBgm);

    return () => {
      removeUnlockListeners();
      audio.pause();
    };
  }, []);

  const playSe = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browser autoplay restrictions can still block sound in unusual navigation paths.
    });
  }, []);

  const playSeUntilEnd = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let timeoutId: number | undefined;

      const finish = () => {
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
        resolve();
      };

      audio.currentTime = 0;
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      timeoutId = window.setTimeout(finish, 500);

      void audio.play().catch(finish);
    });
  }, []);

  const playModalOpen = useCallback(() => {
    playSe(confirmModalSeRef.current);
  }, [playSe]);

  const playModalCancel = useCallback(() => {
    playSe(modalCancelSeRef.current);
  }, [playSe]);

  const playReturnTitle = useCallback(async () => {
    await playSeUntilEnd(returnTitleSeRef.current);
    onNavigate("/");
  }, [onNavigate, playSeUntilEnd]);

  const playGopherTalk = useCallback(() => {
    playSe(gopherTalkSeRef.current);
  }, [playSe]);

  return {
    audioRefs: {
      homeBgmRef,
      confirmModalSeRef,
      modalCancelSeRef,
      returnTitleSeRef,
      gopherTalkSeRef,
    },
    playGopherTalk,
    playModalCancel,
    playModalOpen,
    playReturnTitle,
  };
}

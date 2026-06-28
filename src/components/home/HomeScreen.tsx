"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleLogoIcon, KakaoLogoIcon } from "@/components/auth/OAuthIcons";

interface HomeScreenProps {
  onCreate: () => void;
  onLoad: () => void;
  authError?: string | null;
}

export function HomeScreen({ onCreate, onLoad, authError }: HomeScreenProps) {
  const {
    configured,
    loading,
    user,
    displayName,
    signInWithGoogle,
    signInWithKakao,
    signOut,
  } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const busy = loading || signingOut;
  const errorMessage = actionError ?? authError;

  const handleGoogle = async () => {
    setActionError(null);
    try {
      await signInWithGoogle();
    } catch {
      setActionError("구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleKakao = async () => {
    setActionError(null);
    try {
      await signInWithKakao();
    } catch {
      setActionError("카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleSignOut = async () => {
    setActionError(null);
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setActionError("로그아웃하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--toss-gray-100)] px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="mb-6 text-center text-2xl font-semibold text-[var(--foreground)]">
          AI 작가
        </h1>

        {loading ? (
          <p className="text-[15px] text-[var(--toss-gray-600)]">로그인 상태 확인 중…</p>
        ) : user ? (
          <>
            <p className="toss-home-greeting">
              <span className="toss-auth-greeting-name">{displayName}</span>님, 안녕하세요
            </p>

            <p className="max-w-sm text-center text-[15px] leading-relaxed text-[var(--toss-gray-600)]">
              소설의 컨셉부터, 등장인물, 세계관, 전체 플롯, 원고까지
              <br />
              이곳에서 만들 수 있어요.
            </p>

            <div className="mt-10 flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={onCreate}
                className="toss-btn-primary w-full py-4 text-base"
              >
                소설 만들기
              </button>
              <button
                type="button"
                onClick={onLoad}
                className="toss-btn-secondary w-full py-4 text-base"
              >
                소설 불러오기
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={busy}
              className="toss-home-signout"
            >
              {signingOut ? "로그아웃 중…" : "로그아웃"}
            </button>
          </>
        ) : (
          <>
            <p className="max-w-sm text-center text-[15px] leading-relaxed text-[var(--toss-gray-600)]">
              소설의 컨셉부터, 등장인물, 세계관, 전체 플롯, 원고까지
              <br />
              이곳에서 만들 수 있어요.
            </p>

            {configured ? (
              <div className="toss-auth-buttons mt-12 w-full">
                <button
                  type="button"
                  onClick={() => void handleKakao()}
                  disabled={busy}
                  className="toss-auth-btn toss-auth-btn-kakao"
                >
                  <KakaoLogoIcon className="toss-auth-btn-icon" />
                  카카오로 시작하기
                </button>
                <button
                  type="button"
                  onClick={() => void handleGoogle()}
                  disabled={busy}
                  className="toss-auth-btn toss-auth-btn-google"
                >
                  <GoogleLogoIcon className="toss-auth-btn-icon" />
                  Google로 시작하기
                </button>
              </div>
            ) : (
              <p className="mt-12 text-center text-[14px] leading-relaxed text-[var(--toss-gray-600)]">
                로그인 설정이 필요해요. Supabase 환경 변수를 확인해 주세요.
              </p>
            )}
          </>
        )}

        {errorMessage ? (
          <p className="toss-auth-error mt-4" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

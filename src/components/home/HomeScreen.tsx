"use client";

interface HomeScreenProps {
  onCreate: () => void;
  onLoad: () => void;
}

export function HomeScreen({ onCreate, onLoad }: HomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--toss-gray-100)] px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="mb-6 text-center text-2xl font-semibold text-[var(--foreground)]">
          AI 작가
        </h1>

        <p className="max-w-sm text-center text-[15px] leading-relaxed text-[var(--toss-gray-600)]">
          소설의 컨셉부터, 등장인물, 세계관, 전체 플롯, 원고까지
          <br />
          이곳에서 만들 수 있어요.
        </p>

        <div className="mt-12 flex w-full flex-col gap-3">
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
      </div>
    </div>
  );
}

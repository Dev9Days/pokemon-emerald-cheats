import type { Metadata } from "next";

const targetPath = "/emerald/cheats/";

export const metadata: Metadata = {
  alternates: {
    canonical: targetPath,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(targetPath)})` }} />
      <p>
        <a href={targetPath}>포켓몬스터 에메랄드 치트로 이동</a>
      </p>
    </main>
  );
}

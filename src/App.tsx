import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BuildLoadingOverlay } from "./components/BuildLoadingOverlay";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BuildSelector } from "./components/BuildSelector";
import { CheatGroupView } from "./components/CheatGroupView";
import { CommentsButton } from "./components/CommentsButton";
import { CommentsPanel } from "./components/CommentsPanel";
import { MobileSectionOverlay } from "./components/MobileSectionOverlay";
import { RomDropOverlay } from "./components/RomDropOverlay";
import { SearchResultsLayer } from "./components/SearchResultsLayer";
import { SectionNav } from "./components/SectionNav";
import { builds } from "./data/builds";
import { getCheatsForBuild } from "./data";
import type { CheatBuildId } from "./types/cheat";
import { filterGroups, getSectionNavItems } from "./utils/cheats";
import { detectRomBuild } from "./utils/romBuildDetector";
import { isProgrammaticSectionScroll, scrollToSection } from "./utils/sectionScroll";

const STORAGE_KEY = "pokemon-emerald-cheats:selected-build";

function getInitialBuild(): CheatBuildId | null {
  const saved = localStorage.getItem(STORAGE_KEY) as CheatBuildId | null;
  return saved && builds.some((build) => build.id === saved) ? saved : null;
}

export function App() {
  const [selectedBuild, setSelectedBuild] = useState<CheatBuildId | null>(getInitialBuild);
  const [query, setQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isBuildLoading, setIsBuildLoading] = useState(false);
  const [buildLoadingLabel, setBuildLoadingLabel] = useState<string | null>(null);
  const [isSearchSessionActive, setIsSearchSessionActive] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isRomDragging, setIsRomDragging] = useState(false);
  const [romStatus, setRomStatus] = useState<string | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const buildLoadTokenRef = useRef(0);
  const dragDepthRef = useRef(0);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const build = selectedBuild ? builds.find((item) => item.id === selectedBuild)! : null;
  const groups = useMemo(() => (selectedBuild ? getCheatsForBuild(selectedBuild) : []), [selectedBuild]);
  const normalizedFilterQuery = filterQuery.trim().toLowerCase();
  const hasFilterQuery = normalizedFilterQuery.length > 0;
  const isSearchActive = isSearchSessionActive;
  const filteredGroups = useMemo(() => (hasFilterQuery ? filterGroups(groups, normalizedFilterQuery) : []), [
    hasFilterQuery,
    groups,
    normalizedFilterQuery,
  ]);
  const displayedGroups = isSearchActive ? filteredGroups : groups;
  const sectionNavItems = useMemo(() => getSectionNavItems(displayedGroups), [displayedGroups]);
  const activeSectionTitle =
    sectionNavItems.find((item) => item.id === activeSectionId)?.title ?? sectionNavItems[0]?.title ?? "분류";
  useEffect(() => {
    setActiveSectionId(sectionNavItems[0]?.id ?? null);
  }, [sectionNavItems]);

  useEffect(() => {
    if (sectionNavItems.length === 0) return;

    let frameId = 0;

    function updateActiveSection() {
      frameId = 0;
      if (isProgrammaticSectionScroll()) return;

      const anchorTop = 96;
      let nextActive = sectionNavItems[0]?.id ?? null;

      for (const item of sectionNavItems) {
        const element = document.getElementById(item.id);
        if (!element) continue;

        if (element.getBoundingClientRect().top <= anchorTop) {
          nextActive = item.id;
        } else {
          break;
        }
      }

      setActiveSectionId((currentId) => (currentId === nextActive ? currentId : nextActive));
    }

    function requestUpdate() {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveSection);
    }

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [sectionNavItems]);

  useLayoutEffect(() => {
    function updateToolbarHeight() {
      setToolbarHeight(toolbarRef.current?.getBoundingClientRect().height ?? 0);
    }

    updateToolbarHeight();
    window.addEventListener("resize", updateToolbarHeight);
    window.visualViewport?.addEventListener("resize", updateToolbarHeight);

    return () => {
      window.removeEventListener("resize", updateToolbarHeight);
      window.visualViewport?.removeEventListener("resize", updateToolbarHeight);
    };
  }, [build]);

  useLayoutEffect(() => {
    if (!isMobileSearchFocused) return;

    function updateToolbarMetrics() {
      const toolbarRect = toolbarRef.current?.getBoundingClientRect();
      setToolbarHeight(toolbarRect?.height ?? 0);
    }

    updateToolbarMetrics();
    window.addEventListener("resize", updateToolbarMetrics);
    window.visualViewport?.addEventListener("resize", updateToolbarMetrics);
    window.visualViewport?.addEventListener("scroll", updateToolbarMetrics);

    return () => {
      window.removeEventListener("resize", updateToolbarMetrics);
      window.visualViewport?.removeEventListener("resize", updateToolbarMetrics);
      window.visualViewport?.removeEventListener("scroll", updateToolbarMetrics);
    };
  }, [isMobileSearchFocused, isSearchActive]);

  useEffect(() => {
    function hasFiles(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function handleDragEnter(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsRomDragging(true);
    }

    function handleDragOver(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }

    function handleDragLeave(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsRomDragging(false);
    }

    function handleDrop(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsRomDragging(false);

      const file = event.dataTransfer?.files[0];
      if (file) {
        void selectBuildFromRomFile(file);
      }
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  function selectBuild(buildId: CheatBuildId) {
    const nextBuild = builds.find((item) => item.id === buildId);
    const token = buildLoadTokenRef.current + 1;
    buildLoadTokenRef.current = token;
    setBuildLoadingLabel(nextBuild ? `${nextBuild.label} 불러오는 중` : "치트 목록 불러오는 중");
    setIsBuildLoading(true);
    resetSearch();
    setIsMobileOverlayOpen(false);
    setIsMobileSearchFocused(false);

    window.requestAnimationFrame(() => {
      if (buildLoadTokenRef.current !== token) return;

      localStorage.setItem(STORAGE_KEY, buildId);
      setSelectedBuild(buildId);

      window.requestAnimationFrame(() => {
        if (buildLoadTokenRef.current !== token) return;
        setIsBuildLoading(false);
      });
    });
  }

  async function selectBuildFromRomFile(file: File) {
    setRomStatus("ROM 확인 중...");

    try {
      const result = await detectRomBuild(file, builds);

      if (!result.matched) {
        setRomStatus(`지원하지 않는 ROM입니다. MD5: ${result.md5}`);
        return;
      }

      selectBuild(result.build.id);
      setRomStatus(`${result.build.label}로 선택됨`);
    } catch {
      setRomStatus("ROM 파일을 읽지 못했습니다.");
    }
  }

  function navigateToSection(id: string) {
    setIsMobileOverlayOpen(false);
    scrollToSection(id, () => setActiveSectionId(id));
  }

  function resetSearch() {
    setIsSearchSessionActive(false);
    setQuery("");
    setFilterQuery("");
  }

  function handleSearchQueryChange(nextQuery: string, isComposing: boolean) {
    setQuery(nextQuery);

    if (nextQuery.length > 0 || isComposing) {
      setIsSearchSessionActive(true);
    }

    if (!isComposing) {
      setFilterQuery(nextQuery);
    }
  }

  function handleSearchCompositionEnd(nextQuery: string) {
    setQuery(nextQuery);
    setFilterQuery(nextQuery);

    if (nextQuery.length > 0) {
      setIsSearchSessionActive(true);
    }
  }

  return (
    <main className="app-shell" style={{ "--toolbar-height": `${toolbarHeight}px` } as CSSProperties}>
      <AppHeader
        build={build}
        builds={builds}
        onSelectBuild={selectBuild}
        onSelectRomFile={(file) => void selectBuildFromRomFile(file)}
        romStatus={romStatus}
      />

      {!build ? (
        <BuildSelector builds={builds} onSelectBuild={selectBuild} />
      ) : (
        <section className="browser-shell" aria-label={`${build.label} 치트 목록`}>
          <BrowserToolbar
            activeSectionTitle={activeSectionTitle}
            isInputFocused={isMobileSearchFocused}
            isSearching={isSearchActive}
            onClearSearch={resetSearch}
            onOpenComments={() => setIsCommentsOpen(true)}
            onOpenNavigation={() => setIsMobileOverlayOpen(true)}
            onQueryChange={handleSearchQueryChange}
            onSearchCompositionEnd={handleSearchCompositionEnd}
            onSearchCompositionStart={() => setIsSearchSessionActive(true)}
            onSearchBlur={() => setIsMobileSearchFocused(false)}
            onSearchFocus={() => setIsMobileSearchFocused(true)}
            query={query}
            toolbarRef={toolbarRef}
          />
          <div
            className="toolbar-spacer"
            style={{ height: isSearchActive ? `${toolbarHeight}px` : undefined }}
            aria-hidden="true"
          />

          <div className="browser-layout">
            <div className="group-list">
              {groups.map((group) => (
                <CheatGroupView key={group.id} group={group} />
              ))}
            </div>
            {groups.length > 0 ? (
              <SectionNav items={sectionNavItems} activeId={activeSectionId} onNavigate={navigateToSection} />
            ) : null}
          </div>

          <SearchResultsLayer
            groups={filteredGroups}
            hasQuery={hasFilterQuery}
            isSearching={isSearchActive}
            resetKey={normalizedFilterQuery}
          />

          {isMobileOverlayOpen ? (
            <MobileSectionOverlay
              activeId={activeSectionId}
              activeTitle={activeSectionTitle}
              items={sectionNavItems}
              onClose={() => setIsMobileOverlayOpen(false)}
              onNavigate={navigateToSection}
            />
          ) : null}
          <CommentsButton onClick={() => setIsCommentsOpen(true)} />
          <CommentsPanel isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} />
        </section>
      )}
      <RomDropOverlay isActive={isRomDragging} />
      <BuildLoadingOverlay isActive={isBuildLoading} label={buildLoadingLabel} />
    </main>
  );
}

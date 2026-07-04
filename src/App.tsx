import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BuildLoadingOverlay } from "./components/BuildLoadingOverlay";
import { BrowserToolbar } from "./components/BrowserToolbar";
import { BuildSelector } from "./components/BuildSelector";
import { CommentsButton } from "./components/CommentsButton";
import { CommentsPanel } from "./components/CommentsPanel";
import { MobileSectionOverlay } from "./components/MobileSectionOverlay";
import { ProgressiveCheatGroupList } from "./components/ProgressiveCheatGroupList";
import { RomDropOverlay } from "./components/RomDropOverlay";
import { SearchResultsLayer } from "./components/SearchResultsLayer";
import { SectionNav } from "./components/SectionNav";
import { Toast } from "./components/Toast";
import { builds } from "./data/builds";
import {
  getCheatStructure,
  getEntryCodesForBuild,
  getVariantCodesForBuild,
  preloadCheatStructure,
} from "./data";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useSubmittedSearch } from "./hooks/useSubmittedSearch";
import type { CheatBuildId, CheatGroup } from "./types/cheat";
import { filterGroups, getSectionNavItems } from "./utils/cheats";
import { isProgrammaticSectionScroll, scrollToSection } from "./utils/sectionScroll";

const STORAGE_KEY = "pokemon-emerald-cheats:selected-build";
const BUILD_LOADING_OVERLAY_DELAY_MS = 150;
const SEARCH_RESULTS_CLEANUP_DELAY_MS = 180;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

function getInitialBuild(): CheatBuildId | null {
  const saved = localStorage.getItem(STORAGE_KEY) as CheatBuildId | null;
  return saved && builds.some((build) => build.id === saved) ? saved : null;
}

export function App() {
  const initialBuildRef = useRef<CheatBuildId | null>(getInitialBuild());
  const [selectedBuild, setSelectedBuild] = useState<CheatBuildId | null>(initialBuildRef.current);
  const [groups, setGroups] = useState<CheatGroup[]>([]);
  const [warmedBuildId, setWarmedBuildId] = useState<CheatBuildId | null>(null);
  const [warmedGroups, setWarmedGroups] = useState<CheatGroup[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isBuildPending, setIsBuildPending] = useState(false);
  const [isBuildLoading, setIsBuildLoading] = useState(false);
  const [buildLoadingLabel, setBuildLoadingLabel] = useState<string | null>(null);
  const [isInitialBuildLoading, setIsInitialBuildLoading] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isRomDragging, setIsRomDragging] = useState(false);
  const [romStatus, setRomStatus] = useState<string | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const buildLoadTokenRef = useRef(0);
  const pendingBuildRenderTokenRef = useRef<number | null>(null);
  const currentBuildIdRef = useRef<CheatBuildId | null>(null);
  const dragDepthRef = useRef(0);
  const isBuildLoadingActiveRef = useRef(false);
  const loadingOverlayTimerRef = useRef<number | null>(null);
  const warmRenderTokenRef = useRef(0);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const warmToolbarRef = useRef<HTMLDivElement | null>(null);
  const {
    hasFilterQuery,
    isSearchActive,
    normalizedFilterQuery,
    query,
    resetSearch,
    submitSearch,
  } = useSubmittedSearch(SEARCH_RESULTS_CLEANUP_DELAY_MS);

  const build = selectedBuild ? builds.find((item) => item.id === selectedBuild)! : null;
  const warmedBuild = warmedBuildId ? builds.find((item) => item.id === warmedBuildId)! : null;
  const filteredGroups = useMemo(() => (hasFilterQuery ? filterGroups(groups, normalizedFilterQuery) : []), [
    hasFilterQuery,
    groups,
    normalizedFilterQuery,
  ]);
  const sectionNavItems = useMemo(() => getSectionNavItems(groups), [groups]);
  const warmedSectionNavItems = useMemo(() => getSectionNavItems(warmedGroups), [warmedGroups]);
  const activeSectionTitle =
    sectionNavItems.find((item) => item.id === activeSectionId)?.title ?? sectionNavItems[0]?.title ?? "분류";

  const getEntryCodeText = useCallback(async (entryId: string) => {
    const buildId = currentBuildIdRef.current;
    if (!buildId) return "";
    return (await getEntryCodesForBuild(buildId, entryId)).join("\n");
  }, []);

  const getVariantCodeText = useCallback(async (entryId: string, variantId: string) => {
    const buildId = currentBuildIdRef.current;
    if (!buildId) return "";
    return (await getVariantCodesForBuild(buildId, entryId, variantId)).join("\n");
  }, []);

  useEffect(() => {
    setActiveSectionId(sectionNavItems[0]?.id ?? null);
  }, [sectionNavItems]);

  useEffect(() => {
    const initialBuild = initialBuildRef.current;
    initialBuildRef.current = null;
    if (initialBuild) void loadBuild(initialBuild, { persist: false, resetView: false, showOverlay: false });
  }, []);

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

  useBodyScrollLock(isSearchActive);

  useEffect(() => {
    return () => {
      if (loadingOverlayTimerRef.current !== null) window.clearTimeout(loadingOverlayTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const isSlowConnection = connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
    if (selectedBuild || isSlowConnection) return;

    let cancelled = false;
    void nextPaint().then(() => {
      if (!cancelled) void warmRenderBuild(builds[0].id);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedBuild]);

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
    void loadBuild(buildId, { persist: true, resetView: true, showOverlay: true });
  }

  async function loadBuild(
    buildId: CheatBuildId,
    options: { persist: boolean; resetView: boolean; showOverlay: boolean },
  ) {
    const nextBuild = builds.find((item) => item.id === buildId);
    const token = buildLoadTokenRef.current + 1;
    buildLoadTokenRef.current = token;
    const label = nextBuild ? `${nextBuild.label} 불러오는 중` : "치트 목록 불러오는 중";
    setBuildLoadingLabel(label);
    setIsBuildPending(true);
    setIsInitialBuildLoading(!options.showOverlay);
    if (options.showOverlay) showBuildLoading(label);

    if (options.resetView) {
      resetSearch();
      setIsMobileOverlayOpen(false);
      setIsMobileSearchFocused(false);
    }

    await nextPaint();
    if (buildLoadTokenRef.current !== token) return;

    try {
      const nextGroups = warmedGroups.length > 0 ? warmedGroups : await getCheatStructure();
      if (buildLoadTokenRef.current !== token) return;

      currentBuildIdRef.current = buildId;
      pendingBuildRenderTokenRef.current = !options.showOverlay && nextGroups.length > 0 ? token : null;
      setGroups(nextGroups);
      setSelectedBuild(buildId);
      if (options.persist) localStorage.setItem(STORAGE_KEY, buildId);
      await nextPaint();
    } catch {
      if (buildLoadTokenRef.current === token) {
        pendingBuildRenderTokenRef.current = null;
        currentBuildIdRef.current = null;
        setGroups([]);
        setSelectedBuild(null);
        if (options.persist) localStorage.removeItem(STORAGE_KEY);
      }
    } finally {
      if (buildLoadTokenRef.current === token) {
        if (pendingBuildRenderTokenRef.current === null) setIsBuildPending(false);
        setIsInitialBuildLoading(false);
        stopBuildLoading();
      }
    }
  }

  async function selectBuildFromRomFile(file: File) {
    setRomStatus("ROM 확인 중...");

    try {
      const { detectRomBuild } = await import("./utils/romBuildDetector");
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

  function showBuildLoading(label: string) {
    setBuildLoadingLabel(label);
    if (isBuildLoadingActiveRef.current) return;

    if (loadingOverlayTimerRef.current !== null) window.clearTimeout(loadingOverlayTimerRef.current);
    loadingOverlayTimerRef.current = window.setTimeout(() => {
      loadingOverlayTimerRef.current = null;
      isBuildLoadingActiveRef.current = true;
      setIsBuildLoading(true);
    }, BUILD_LOADING_OVERLAY_DELAY_MS);
  }

  function stopBuildLoading() {
    if (loadingOverlayTimerRef.current !== null) {
      window.clearTimeout(loadingOverlayTimerRef.current);
      loadingOverlayTimerRef.current = null;
    }

    isBuildLoadingActiveRef.current = false;
    setIsBuildLoading(false);
  }

  const handleBuildRenderComplete = useCallback(() => {
    if (pendingBuildRenderTokenRef.current !== buildLoadTokenRef.current) return;

    pendingBuildRenderTokenRef.current = null;
    setIsBuildPending(false);
  }, []);

  async function warmRenderBuild(buildId: CheatBuildId) {
    if (selectedBuild || (warmedBuildId === buildId && warmedGroups.length > 0)) return;

    const token = warmRenderTokenRef.current + 1;
    warmRenderTokenRef.current = token;
    await preloadCheatStructure();
    const nextGroups = await getCheatStructure();
    await nextPaint();
    if (warmRenderTokenRef.current !== token || selectedBuild) return;

    setWarmedGroups(nextGroups);
    setWarmedBuildId(buildId);
  }

  function nextPaint() {
    return new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  }

  function handleSearchSubmit(nextQuery: string) {
    submitSearch(nextQuery);
    if (nextQuery.trim().length === 0) setIsMobileSearchFocused(false);
  }

  const browserBuild = build ?? warmedBuild;
  const browserGroups = build ? groups : warmedGroups;
  const browserSectionNavItems = build ? sectionNavItems : warmedSectionNavItems;
  const browserActiveSectionTitle = build ? activeSectionTitle : (warmedSectionNavItems[0]?.title ?? "분류");
  const isBrowserVisible = Boolean(build);

  return (
    <main className="app-shell" style={{ "--toolbar-height": `${toolbarHeight}px` } as CSSProperties}>
      <AppHeader
        build={build}
        builds={builds}
        isBuildLoading={isBuildPending}
        onSelectBuild={selectBuild}
        onSelectRomFile={(file) => void selectBuildFromRomFile(file)}
        romStatus={romStatus}
      />

      {!build ? (
        <BuildSelector builds={builds} onSelectBuild={selectBuild} />
      ) : null}

      {browserBuild ? (
        <section
          className={`browser-shell${isBrowserVisible ? "" : " browser-shell--prewarm"}`}
          aria-hidden={!isBrowserVisible}
          aria-label={`${browserBuild.label} 치트 목록`}
        >
          <BrowserToolbar
            activeSectionTitle={browserActiveSectionTitle}
            isInputFocused={isMobileSearchFocused}
            isSearching={isSearchActive}
            onClearSearch={resetSearch}
            onOpenComments={() => setIsCommentsOpen(true)}
            onOpenNavigation={() => setIsMobileOverlayOpen(true)}
            onSearchBlur={() => setIsMobileSearchFocused(false)}
            onSearchFocus={() => setIsMobileSearchFocused(true)}
            onSearch={handleSearchSubmit}
            query={query}
            toolbarRef={isBrowserVisible ? toolbarRef : warmToolbarRef}
          />
          <div
            className="toolbar-spacer"
            style={{ height: isSearchActive ? `${toolbarHeight}px` : undefined }}
            aria-hidden="true"
          />

          <div className="browser-layout">
            <div className="group-list">
              {isInitialBuildLoading && browserGroups.length === 0 ? (
                <p className="empty-state">{buildLoadingLabel ?? "치트 목록 불러오는 중"}</p>
              ) : (
                <ProgressiveCheatGroupList
                  key="browse"
                  groups={browserGroups}
                  isProgressive={pendingBuildRenderTokenRef.current !== null}
                  getEntryCodeText={getEntryCodeText}
                  getVariantCodeText={getVariantCodeText}
                  onRenderComplete={isBrowserVisible ? handleBuildRenderComplete : undefined}
                />
              )}
            </div>
            {browserGroups.length > 0 ? (
              <SectionNav items={browserSectionNavItems} activeId={activeSectionId} onNavigate={navigateToSection} />
            ) : null}
          </div>

          <SearchResultsLayer
            groups={filteredGroups}
            getEntryCodeText={getEntryCodeText}
            getVariantCodeText={getVariantCodeText}
            hasQuery={hasFilterQuery}
            isSearching={isSearchActive}
            resetKey={normalizedFilterQuery}
          />

          {isMobileOverlayOpen ? (
            <MobileSectionOverlay
              activeId={activeSectionId}
              activeTitle={browserActiveSectionTitle}
              items={browserSectionNavItems}
              onClose={() => setIsMobileOverlayOpen(false)}
              onNavigate={navigateToSection}
            />
          ) : null}
          <CommentsButton onClick={() => setIsCommentsOpen(true)} />
          <CommentsPanel isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} />
        </section>
      ) : null}
      <RomDropOverlay isActive={isRomDragging} />
      <BuildLoadingOverlay isActive={isBuildLoading} label={buildLoadingLabel} />
      <Toast />
    </main>
  );
}

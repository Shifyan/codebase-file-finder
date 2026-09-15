import { useEffect, useState } from "react";
import {
  Search,
  HardDrive,
  Filter,
  FileText,
  FolderSearch,
  Zap,
  Code2,
  Hash,
  Square,
  TriangleAlert,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useTheme } from "../../theme-provider";
import {
  GetAvaliableServices,
  GetDiskStats,
} from "../../../wailsjs/go/main/App";
import { storage } from "../../../wailsjs/go/models";
import { SearchCriteria, SearchMode } from "../../hooks/use-file-search";

const LANGUAGES = [
  { name: "JavaScript", ext: "*.js, *.jsx, *.mjs", category: "Web" },
  { name: "TypeScript", ext: "*.ts, *.tsx", category: "Web" },
  { name: "Python", ext: "*.py, *.pyw", category: "Backend" },
  { name: "Go", ext: "*.go", category: "Backend" },
  { name: "Rust", ext: "*.rs", category: "System" },
  { name: "Java", ext: "*.java, *.jar", category: "Backend" },
  { name: "C#", ext: "*.cs", category: "Backend" },
  { name: "C++", ext: "*.cpp, *.h, *.hpp", category: "System" },
  { name: "PHP", ext: "*.php", category: "Web" },
  { name: "Ruby", ext: "*.rb", category: "Backend" },
];

const MAX_RESULT_PRESETS = [1_000, 5_000, 20_000, 50_000] as const;

const SCAN_MODES = [
  {
    value: "fast",
    label: "Fast Index",
    hint: "Lewati node_modules, .git, dist, dan ikuti .gitignore",
  },
  {
    value: "deep",
    label: "Deep Scan",
    hint: "Telusuri semuanya tanpa mengabaikan apa pun (lambat)",
  },
] as const;

type HeaderProps = {
  onSearch: (criteria: SearchCriteria) => void;
  onCancel: () => void;
  searching: boolean;
  foundCount: number;
  truncated: boolean;
  cancelled: boolean;
  error: string | null;
};

function formatSpace(bytes: number) {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function driveLabel(path: string) {
  return path.replace(/[\\/]+$/, "");
}

export function Header({
  onSearch,
  onCancel,
  searching,
  foundCount,
  truncated,
  cancelled,
  error,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<string | null>(null);
  const [drive, setDrive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scanMode, setScanMode] = useState<SearchMode>("fast");
  const [maxResults, setMaxResults] = useState<number>(20_000);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [confirmDeepOpen, setConfirmDeepOpen] = useState(false);
  const [drives, setDrives] = useState<storage.DiskStats[]>([]);

  const selectedDrive = drives.find((item) => item.path === drive) ?? null;
  const selectedLangInfo = LANGUAGES.find((item) => item.name === language);
  const activeScanMode =
    SCAN_MODES.find((mode) => mode.value === scanMode) ?? SCAN_MODES[0];

  const driveUsagePercent = selectedDrive?.totalBytes
    ? Math.round((selectedDrive.usedBytes / selectedDrive.totalBytes) * 100)
    : 0;

  useEffect(() => {
    (async () => {
      const paths = await GetAvaliableServices();
      const results = await Promise.allSettled(
        paths.map((path) => GetDiskStats(path)),
      );
      setDrives(
        results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        ),
      );
    })().catch((err) => console.error("Gagal memuat daftar drive:", err));
  }, []);

  function buildCriteria(): SearchCriteria | null {
    if (!selectedLangInfo || !drive) return null;
    return {
      root: drive,
      patterns: selectedLangInfo.ext.split(",").map((ext) => ext.trim()),
      keyword: query,
      mode: scanMode,
      maxResults,
      language: selectedLangInfo.name,
    };
  }

  function handleSearch() {
    if (searching) return;
    const criteria = buildCriteria();
    if (!criteria) return;

    // Deep Scan menelusuri node_modules, .git, dan folder sistem sekaligus, jadi
    // perlu konfirmasi dulu sebelum dijalankan.
    if (criteria.mode === "deep") {
      setConfirmDeepOpen(true);
      return;
    }

    onSearch(criteria);
  }

  function handleConfirmDeep() {
    setConfirmDeepOpen(false);
    const criteria = buildCriteria();
    if (criteria) onSearch(criteria);
  }

  const filteredLanguages = activeCategory
    ? LANGUAGES.filter((l) => l.category === activeCategory)
    : LANGUAGES;

  // Angka berkas yang terus berubah selama pemindaian terlalu berisik untuk
  // diumumkan; yang dibacakan hanya hasil akhirnya.
  const statusAnnouncement = searching
    ? ""
    : error
      ? `Pemindaian gagal: ${error}`
      : cancelled
        ? `Pemindaian dihentikan. ${foundCount} berkas ditemukan.`
        : truncated
          ? `Pemindaian mencapai batas ${maxResults} berkas.`
          : foundCount > 0
            ? `Pemindaian selesai. ${foundCount} berkas ditemukan.`
            : "";

  return (
    <header className="flex flex-col gap-3 p-4">
      {/* SECTION 1: Top Navigation Bar & Action Trigger */}
      <div className="raised flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
            <Code2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              Codebase File Finder
              <Badge variant="outline" className="text-[10px] font-mono py-0">
                v1.2
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Analisis dan temukan berkas pemrograman berdasarkan ekstensi
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative"
                aria-label="Ubah tema"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) =>
                setTheme(value as "light" | "dark" | "system")
              }
            >
              <DropdownMenuRadioItem value="light" className="py-1.5">
                <Sun className="h-4 w-4" />
                Terang
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="py-1.5">
                <Moon className="h-4 w-4" />
                Gelap
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="py-1.5">
                <Monitor className="h-4 w-4" />
                Sistem
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* SECTION 2: Vertical Layout Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Left Column: Primary Inputs & Search Action Button (7 Cols) */}
        <div className="raised lg:col-span-7 flex flex-col justify-between gap-3 rounded-xl p-4">
          {/* Input Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 ">
            {/* Drive Selector */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="drive"
                className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
              >
                <HardDrive className="h-3.5 w-3.5 text-primary" /> Target
                Storage
              </Label>
              <Select value={drive ?? ""} onValueChange={setDrive}>
                <SelectTrigger
                  id="drive"
                  className="h-9 py-[17.5px] w-full rounded-md recessed px-3 text-sm box-border flex items-center justify-between text-well-text"
                >
                  <SelectValue placeholder="Pilih Drive" />
                </SelectTrigger>
                <SelectContent>
                  {drives.map((item) => (
                    <SelectItem
                      className={"py-2"}
                      key={item.path}
                      value={item.path}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {driveLabel(item.path)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatSpace(item.freeBytes)} sisa)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Selector */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="language"
                className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
              >
                <Filter className="h-3.5 w-3.5 text-primary" /> Bahasa /
                Ekstensi
              </Label>
              <Select value={language ?? ""} onValueChange={setLanguage}>
                <SelectTrigger
                  id="language"
                  className="h-9 py-[17.5px] w-full rounded-md recessed px-3 text-sm box-border flex items-center justify-between text-well-text"
                >
                  <SelectValue placeholder="Pilih Bahasa" />
                </SelectTrigger>
                <SelectContent className={""}>
                  {filteredLanguages.map((item) => (
                    <SelectItem
                      key={item.name}
                      value={item.name}
                      className={"py-2"}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {item.ext}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Results Selector */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="max-results"
                className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
              >
                <Hash className="h-3.5 w-3.5 text-primary" /> Batas Hasil
              </Label>
              <Select
                value={String(maxResults)}
                onValueChange={(value) => setMaxResults(Number(value))}
              >
                <SelectTrigger
                  id="max-results"
                  className="h-9 py-[17.5px] w-full rounded-md recessed px-3 text-sm box-border flex items-center justify-between text-well-text"
                >
                  <SelectValue placeholder="Batas Hasil" />
                </SelectTrigger>
                <SelectContent>
                  {MAX_RESULT_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset}
                      value={String(preset)}
                      className={"py-2"}
                    >
                      <span className="font-medium">
                        {preset.toLocaleString("id-ID")} berkas
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Keyword Query */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="query"
                className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-primary" /> Filter Kata
                Kunci
              </Label>
              <Input
                id="query"
                placeholder="Cari nama berkas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-md recessed px-3 py-1 text-sm box-border flex items-center justify-between text-well-text"
              />
            </div>
          </div>

          {/* Action Bar inside Left Section */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-edge-line">
            <div className="flex items-center">
              <div className="me-3">
                <p>Mode: </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div
                        role="radiogroup"
                        aria-label="Mode pemindaian"
                        className="flex h-10 items-center gap-0.5 rounded-lg groove p-1 me-2"
                      >
                        {SCAN_MODES.map((mode) => {
                          const active = scanMode === mode.value;
                          return (
                            <Button
                              key={mode.value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              variant="ghost"
                              size="sm"
                              disabled={searching}
                              onClick={() => setScanMode(mode.value)}
                              className={cn(
                                "h-full rounded-md px-3 text-xs font-medium",
                                active
                                  ? "control text-foreground"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Zap
                                className={cn(
                                  "mr-1.5 h-3.5 w-3.5",
                                  active && "text-amber-500 fill-amber-500",
                                )}
                              />
                              {mode.label}
                            </Button>
                          );
                        })}
                      </div>
                    }
                  />
                  <TooltipContent>
                    <p className="text-xs">
                      {activeScanMode.label}: {activeScanMode.hint}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-[12px] self-end py-0.5 dark:text-white/35 text-black/35">
                *Mengabaikan .git & node_modules
              </p>
            </div>
            {searching ? (
              <Button
                size="sm"
                variant="destructive"
                className="h-10 p-2 flex min-w-35.75 justify-center items-center px-5 font-semibold"
                onClick={onCancel}
              >
                <Square className="mr-2 h-3.5 w-3.5 fill-current" />
                Hentikan
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-10 p-2 flex min-w-35.75 justify-center items-center px-5 font-semibold"
                onClick={handleSearch}
                disabled={!language || !drive}
              >
                <Search className="mr-2 h-3.5 w-3.5" />
                Mulai Memindai
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Taller Storage Info Widget (5 Cols) */}
        <div className="lg:col-span-5 flex">
          {selectedDrive ? (
            <div className="raised flex flex-col justify-between gap-3 rounded-xl p-4 w-full min-h-[135px]">
              {/* Top Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Storage Stats
                  </span>
                  <span className="font-bold text-lg text-foreground">
                    Drive {driveLabel(selectedDrive.path)}
                  </span>
                </div>
                <Badge
                  variant={driveUsagePercent > 85 ? "destructive" : "secondary"}
                  className="text-xs px-2.5 py-0.5 font-mono"
                >
                  {driveUsagePercent}% Kapasitas
                </Badge>
              </div>

              {/* Dynamic Progress Indicator */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Terpakai:{" "}
                    <strong className="text-foreground">
                      {formatSpace(selectedDrive.usedBytes)}
                    </strong>
                  </span>
                  <span>
                    Bebas:{" "}
                    <strong className="text-foreground">
                      {formatSpace(selectedDrive.freeBytes)}
                    </strong>
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full groove p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      driveUsagePercent > 85 ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${driveUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Footer info */}
              <div className="text-[11px] text-muted-foreground border-t border-edge-line pt-2 flex justify-between items-center">
                <span>
                  Total Ukuran:{" "}
                  <strong className="text-foreground">
                    {formatSpace(selectedDrive.totalBytes)}
                  </strong>
                </span>
                <span className="font-mono text-[10px]">NTFS File System</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground rounded-xl border border-dashed border-edge-line p-4 w-full min-h-[135px] text-center">
              <FolderSearch className="h-6 w-6 text-muted-foreground/60" />
              <div>
                <p className="font-semibold text-foreground">
                  Belum Ada Drive Terpilih
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Pilih drive target di panel kiri untuk melihat detail
                  penyimpanan
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Presets & Category Quick Filters Bar */}
      {/* <div className="flex flex-wrap items-center justify-between border-t px-6 py-2 bg-muted/10 text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Preset Kategori:
          </span>
          <div className="flex items-center gap-1.5">
            {[null, "Web", "Backend", "System"].map((cat) => (
              <Button
                key={cat ?? "all"}
                type="button"
                variant={activeCategory === cat ? "default" : "ghost"}
                size="sm"
                className="h-6 px-2.5 text-[11px] rounded-full"
                onClick={() => setActiveCategory(cat)}
              >
                {cat ?? "Semua"}
              </Button>
            ))}
          </div>
        </div>

        {selectedLangInfo && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Filter Aktif:</span>
            <Badge
              variant="secondary"
              className="font-mono text-[10px] bg-background border"
            >
              {selectedLangInfo.name} ({selectedLangInfo.ext})
            </Badge>
          </div>
        )}
      </div> */}

      {/* SECTION 4: Scan Status */}
      {searching && (
        <div className="raised flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_6px_1px_var(--ring)]"></span>
          </span>
          <span className="font-medium">
            Memindai {drive} • {selectedLangInfo?.name}...
          </span>
          <span className="ml-auto tabular-nums text-muted-foreground">
            {foundCount.toLocaleString("id-ID")} berkas ditemukan
          </span>
        </div>
      )}

      {truncated && !searching && (
        <div className="raised flex items-start gap-2 rounded-xl px-5 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert
            className="mt-px size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>
            Pemindaian dihentikan pada batas{" "}
            {maxResults.toLocaleString("id-ID")} berkas. Naikkan Batas Hasil
            atau persempit filter untuk hasil yang lebih lengkap.
          </span>
        </div>
      )}

      {cancelled && !searching && !truncated && (
        <div className="raised rounded-xl px-5 py-2.5 text-xs text-muted-foreground">
          Pemindaian dihentikan. Menampilkan{" "}
          {foundCount.toLocaleString("id-ID")} berkas yang sempat ditemukan.
        </div>
      )}

      {error && !searching && (
        <div className="raised flex items-start gap-2 rounded-xl px-5 py-2.5 text-xs text-destructive">
          <TriangleAlert
            className="mt-px size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>Pemindaian gagal: {error}</span>
        </div>
      )}

      <div role="status" className="sr-only">
        {statusAnnouncement}
      </div>

      <AlertDialog open={confirmDeepOpen} onOpenChange={setConfirmDeepOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Jalankan Deep Scan?</AlertDialogTitle>
            <AlertDialogDescription>
              Deep Scan tidak mengabaikan apa pun, termasuk{" "}
              <strong className="text-foreground">node_modules</strong>,{" "}
              <strong className="text-foreground">.git</strong>, dan folder
              sistem. Pemindaian bisa sangat lambat dan akan berhenti begitu
              mencapai Batas Hasil ({maxResults.toLocaleString("id-ID")}{" "}
              berkas).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeep}>
              Ya, jalankan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

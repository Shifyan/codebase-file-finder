import { useEffect, useState } from "react";
import {
  Search,
  HardDrive,
  RefreshCw,
  Filter,
  FileText,
  FolderSearch,
  Zap,
  Code2,
  SlidersHorizontal,
  FolderOpen,
  ArrowRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
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
import { Progress } from "../ui/progress";
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
import { useTheme } from "../../theme-provider";

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

const DRIVES = [
  { name: "C:", total: 476.9, used: 312.4, free: 164.5 },
  { name: "D:", total: 931.5, used: 402.1, free: 529.4 },
  { name: "E:", total: 238.4, used: 88.7, free: 149.7 },
];

function formatSpace(gb: number) {
  return `${gb.toFixed(1)} GB`;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<string | null>(null);
  const [drive, setDrive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scanMode, setScanMode] = useState<"fast" | "deep">("fast");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [searching, setSearching] = useState(false);

  const selectedDrive = DRIVES.find((item) => item.name === drive) ?? null;
  const selectedLangInfo = LANGUAGES.find((item) => item.name === language);

  const driveUsagePercent = selectedDrive
    ? Math.round((selectedDrive.used / selectedDrive.total) * 100)
    : 0;

  useEffect(() => {
    if (!searching) return;
    if (progress >= 100) {
      setSearching(false);
      return;
    }
    const id = window.setTimeout(() => {
      setProgress((current) => Math.min(current + 5, 100));
    }, 100);
    return () => window.clearTimeout(id);
  }, [searching, progress]);

  function handleSearch() {
    if (!language || !drive || searching) return;
    setProgress(0);
    setSearching(true);
  }

  const filteredLanguages = activeCategory
    ? LANGUAGES.filter((l) => l.category === activeCategory)
    : LANGUAGES;

  return (
    <header className="flex flex-col border-b bg-background shadow-sm">
      {/* SECTION 1: Top Navigation Bar & Action Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-3.5 bg-muted/20">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-stretch">
        {/* Left Column: Primary Inputs & Search Action Button (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3 bg-muted/10 rounded-xl p-3.5 border">
          {/* Input Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ">
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
                  className="h-9 py-[17.5px] w-full rounded-md border border-input bg-background px-3 text-sm box-border flex items-center justify-between"
                >
                  <SelectValue placeholder="Pilih Drive" />
                </SelectTrigger>
                <SelectContent>
                  {DRIVES.map((item) => (
                    <SelectItem
                      className={"py-2"}
                      key={item.name}
                      value={item.name}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatSpace(item.free)} sisa)
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
                  className="h-9 py-[17.5px] w-full rounded-md border border-input bg-background px-3 text-sm box-border flex items-center justify-between"
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
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm box-border flex items-center justify-between"
              />
            </div>
          </div>

          {/* Action Bar inside Left Section */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant={scanMode === "fast" ? "secondary" : "outline"}
                      size="sm"
                      className="h-10 p-2 flex justify-center items-center px-3 text-xs font-medium"
                      onClick={() =>
                        setScanMode(scanMode === "fast" ? "deep" : "fast")
                      }
                    >
                      <Zap
                        className={`h-3.5 w-3.5 mr-1.5 ${scanMode === "fast" ? "text-amber-500 fill-amber-500" : ""}`}
                      />
                      Mode: {scanMode === "fast" ? "Fast Index" : "Deep Scan"}
                    </Button>
                  }
                />
                <TooltipContent>
                  <p className="text-xs">
                    {scanMode === "fast"
                      ? "Fast Index: Memindai cache sistem"
                      : "Deep Scan: Memindai direktori sektor"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="sm"
              className="h-10 p-2 flex justify-center items-center px-5 font-semibold shadow-sm"
              onClick={handleSearch}
              disabled={!language || !drive || searching}
            >
              {searching ? (
                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="mr-2 h-3.5 w-3.5" />
              )}
              Mulai Memindai
            </Button>
          </div>
        </div>

        {/* Right Column: Taller Storage Info Widget (5 Cols) */}
        <div className="lg:col-span-5 flex">
          {selectedDrive ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm w-full min-h-[135px]">
              {/* Top Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Storage Stats
                  </span>
                  <span className="font-bold text-lg text-foreground">
                    Drive {selectedDrive.name}
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
                      {formatSpace(selectedDrive.used)}
                    </strong>
                  </span>
                  <span>
                    Bebas:{" "}
                    <strong className="text-foreground">
                      {formatSpace(selectedDrive.free)}
                    </strong>
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted border p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      driveUsagePercent > 85 ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${driveUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Footer info */}
              <div className="text-[11px] text-muted-foreground border-t pt-2 flex justify-between items-center">
                <span>
                  Total Ukuran:{" "}
                  <strong className="text-foreground">
                    {formatSpace(selectedDrive.total)}
                  </strong>
                </span>
                <span className="font-mono text-[10px]">NTFS File System</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed rounded-xl p-4 bg-muted/10 w-full min-h-[135px] text-center">
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

      {/* SECTION 4: Dynamic Progress Bar & Scan Status */}
      {(searching || progress > 0) && (
        <div className="border-t bg-background px-6 py-2.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {progress === 100
                ? "Pemindaian Selesai"
                : `Memindai direktori ${drive}...`}
            </span>
            <span className="font-mono font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 w-full" />
        </div>
      )}
    </header>
  );
}

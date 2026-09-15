import { useCallback, useState } from "react";
import { Header } from "./../components/MainPage/Header";
import { Body } from "./../components/MainPage/Body";
import { SearchCriteria, useFileSearch } from "./../hooks/use-file-search";

export default function MainPage() {
  const {
    results,
    status,
    truncated,
    cancelled,
    error,
    runId,
    start,
    cancel,
  } = useFileSearch();
  const [meta, setMeta] = useState({ language: "", root: "" });

  const handleSearch = useCallback(
    (criteria: SearchCriteria) => {
      setMeta({ language: criteria.language, root: criteria.root });
      void start(criteria);
    },
    [start],
  );

  return (
    <div className="flex h-screen flex-col">
      <Header
        onSearch={handleSearch}
        onCancel={cancel}
        searching={status === "scanning"}
        foundCount={results.length}
        truncated={truncated}
        cancelled={cancelled}
        error={error}
      />
      <Body
        results={results}
        language={meta.language}
        root={meta.root}
        runId={runId}
      />
    </div>
  );
}

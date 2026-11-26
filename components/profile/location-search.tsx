"use client";

import { MapPin, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type LocationSearchProps = {
  cantons: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
  cities: Array<{
    name: string;
    slug: string;
    cantonSlug: string;
    count: number;
  }>;
  initialCantonSlug?: string;
  initialCitySlug?: string;
};

type LocationOption = {
  key: string;
  kind: "canton" | "city";
  label: string;
  detail: string;
  count: number;
  cantonSlug: string;
  citySlug: string | null;
};

const MAX_RESULTS = 40;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const collator = new Intl.Collator("de-CH");

/**
 * One field for canton and place on /explore: typing "Winterthur" or "Zürich" picks either directly,
 * without choosing a canton first. Submits `canton` and `city` as hidden inputs with the filter form.
 */
export function LocationSearch({ cantons, cities, initialCantonSlug = "", initialCitySlug = "" }: LocationSearchProps) {
  const listId = useId();

  const options = useMemo<LocationOption[]>(() => {
    const cantonNames = new Map(cantons.map((canton) => [canton.slug, canton.name]));

    const cantonOptions = cantons
      .map((canton) => ({
        key: `canton:${canton.slug}`,
        kind: "canton" as const,
        label: canton.name,
        detail: "Kanton",
        count: canton.count,
        cantonSlug: canton.slug,
        citySlug: null,
      }))
      .sort((a, b) => collator.compare(a.label, b.label));

    const cityOptions = cities
      .map((city) => ({
        key: `city:${city.cantonSlug}:${city.slug}`,
        kind: "city" as const,
        label: city.name,
        detail: cantonNames.get(city.cantonSlug) ?? city.cantonSlug.toUpperCase(),
        count: city.count,
        cantonSlug: city.cantonSlug,
        citySlug: city.slug,
      }))
      .sort((a, b) => collator.compare(a.label, b.label));

    return [...cantonOptions, ...cityOptions];
  }, [cantons, cities]);

  const initial =
    options.find((option) =>
      initialCitySlug ? option.citySlug === initialCitySlug && option.cantonSlug === initialCantonSlug : option.kind === "canton" && option.cantonSlug === initialCantonSlug,
    ) ?? null;

  const [selected, setSelected] = useState<LocationOption | null>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const needle = normalize(query.trim());

    if (!needle) {
      return options;
    }

    const startsWith = options.filter((option) => normalize(option.label).startsWith(needle));
    const contains = options.filter((option) => !normalize(option.label).startsWith(needle) && normalize(option.label).includes(needle));

    return [...startsWith, ...contains];
  }, [options, query]);

  const visible = matches.slice(0, MAX_RESULTS);

  function choose(option: LocationOption | null) {
    setSelected(option);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name="canton" value={selected?.cantonSlug ?? ""} />
      <input type="hidden" name="city" value={selected?.citySlug ?? ""} />

      <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />

      <input
        type="text"
        role="combobox"
        aria-label="Ort oder Kanton"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={selected ? selected.label : "Ort oder Kanton"}
        value={open ? query : (selected?.label ?? "")}
        onFocus={() => {
          setQuery("");
          setActiveIndex(0);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, visible.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            const option = visible.at(activeIndex);

            if (option) {
              choose(option);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-11 w-full rounded-md border border-white/10 bg-zinc-950 pr-9 pl-9 text-sm text-zinc-300 outline-none placeholder:text-zinc-500 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
      />

      {selected ? (
        <button
          type="button"
          aria-label="Ort zurücksetzen"
          onClick={() => choose(null)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : null}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full min-w-64 overflow-y-auto rounded-md border border-white/10 bg-zinc-950 py-1 shadow-xl shadow-black/40"
        >
          {visible.length === 0 ? <li className="px-3 py-2 text-sm text-zinc-500">Kein Ort mit Profilen gefunden</li> : null}

          {visible.map((option, index) => (
            <li
              key={option.key}
              role="option"
              aria-selected={option.key === selected?.key}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm text-zinc-300",
                index === activeIndex && "bg-white/10 text-white",
                option.key === selected?.key && "font-semibold text-rose-300",
              )}
            >
              <span className="min-w-0 truncate">
                {option.label}
                <span className="ml-1.5 text-xs text-zinc-500">{option.detail}</span>
              </span>

              <span className="shrink-0 text-xs text-zinc-500">{option.count}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type CityComboboxProps = {
  id?: string;
  name: string;
  cities: Array<{
    id: string;
    name: string;
  }>;
  value: string;
  onChange: (cityId: string) => void;
  disabled?: boolean;
  placeholder: string;
};

const MAX_RESULTS = 50;

/** Lower case without accents, so "zurich" finds "Zürich" and "geneve" finds "Genève". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Searchable city picker: cantons like Bern have more than 300 municipalities, too many for a plain select.
 * The chosen city is submitted through a hidden input under `name`.
 */
export function CityCombobox({ id, name, cities, value, onChange, disabled = false, placeholder }: CityComboboxProps) {
  const listId = useId();
  const selected = cities.find((city) => city.id === value) ?? null;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const needle = normalize(query.trim());

    if (!needle) {
      return cities;
    }

    // Names starting with the query first, then names containing it.
    const startsWith = cities.filter((city) => normalize(city.name).startsWith(needle));
    const contains = cities.filter((city) => !normalize(city.name).startsWith(needle) && normalize(city.name).includes(needle));

    return [...startsWith, ...contains];
  }, [cities, query]);

  const visible = matches.slice(0, MAX_RESULTS);

  function choose(cityId: string) {
    onChange(cityId);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />

      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />

      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={selected ? selected.name : placeholder}
        value={open ? query : (selected?.name ?? "")}
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
            // Enter picks the highlighted city instead of submitting the form.
            event.preventDefault();
            const city = visible.at(activeIndex);

            if (city) {
              choose(city.id);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-950 py-2 pr-3 pl-9 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-white/10 bg-zinc-950 py-1 shadow-xl shadow-black/40"
        >
          {visible.length === 0 ? <li className="px-3 py-2 text-sm text-zinc-500">Kein Ort gefunden</li> : null}

          {visible.map((city, index) => (
            <li
              key={city.id}
              role="option"
              aria-selected={city.id === value}
              // mousedown instead of click, so the choice lands before the input's blur closes the list.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(city.id);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-zinc-300",
                index === activeIndex && "bg-white/10 text-white",
                city.id === value && "font-semibold text-rose-300",
              )}
            >
              {city.name}
            </li>
          ))}

          {matches.length > MAX_RESULTS ? (
            <li className="px-3 py-2 text-xs text-zinc-500">{matches.length - MAX_RESULTS} weitere Orte, bitte genauer suchen</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

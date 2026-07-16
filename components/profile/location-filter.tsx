"use client";

import { useMemo, useState } from "react";

type CantonOption = {
  name: string;
  slug: string;
  count: number;
};

type CityOption = {
  name: string;
  slug: string;
  cantonSlug: string;
  count: number;
};

type LocationFilterProps = {
  cantons: CantonOption[];
  cities: CityOption[];
  initialCantonSlug?: string;
  initialCitySlug?: string;
};

export function LocationFilter({ cantons, cities, initialCantonSlug = "", initialCitySlug = "" }: LocationFilterProps) {
  const [cantonSlug, setCantonSlug] = useState(initialCantonSlug);
  const [citySlug, setCitySlug] = useState(initialCitySlug);

  const filteredCities = useMemo(() => cities.filter((city) => city.cantonSlug === cantonSlug), [cities, cantonSlug]);

  return (
    <>
      <select
        name="canton"
        value={cantonSlug}
        onChange={(event) => {
          setCantonSlug(event.target.value);
          setCitySlug("");
        }}
        className="h-11 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
      >
        <option value="">Alle Kantone</option>

        {cantons.map((canton) => (
          <option key={canton.slug} value={canton.slug}>
            {canton.name} ({canton.count})
          </option>
        ))}
      </select>

      <select
        name="city"
        value={citySlug}
        disabled={!cantonSlug}
        onChange={(event) => {
          setCitySlug(event.target.value);
        }}
        className="h-11 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{cantonSlug ? "Alle Städte" : "Zuerst Kanton wählen"}</option>

        {filteredCities.map((city) => (
          <option key={`${city.cantonSlug}-${city.slug}`} value={city.slug}>
            {city.name} ({city.count})
          </option>
        ))}
      </select>
    </>
  );
}

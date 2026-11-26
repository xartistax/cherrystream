"use client";

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";

import { CityCombobox } from "./city-combobox";

type CantonOption = {
  id: string;
  name: string;
  slug: string;
};

type CityOption = {
  id: string;
  name: string;
  slug: string;
  cantonId: string;
};

type LocationSelectorProps = {
  cantons: CantonOption[];
  cities: CityOption[];
  initialCantonId: string | null;
  initialCityId: string | null;
  cantonError?: string[];
  cityError?: string[];
};

export function LocationSelector({ cantons, cities, initialCantonId, initialCityId, cantonError, cityError }: LocationSelectorProps) {
  const [cantonId, setCantonId] = useState(initialCantonId ?? "");

  const [cityId, setCityId] = useState(initialCityId ?? "");

  const filteredCities = useMemo(() => cities.filter((city) => city.cantonId === cantonId), [cities, cantonId]);

  function handleCantonChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCantonId = event.target.value;

    setCantonId(nextCantonId);

    const currentCityStillValid = cities.some((city) => city.id === cityId && city.cantonId === nextCantonId);

    if (!currentCityStillValid) {
      setCityId("");
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-rose-400" />

          <h2 className="text-lg font-bold text-white">Standort</h2>
        </div>

        <p className="mt-1 text-sm text-zinc-500">Dein Standort wird für die Suche und regionale Filter verwendet.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cantonId">Kanton</Label>

          <select
            id="cantonId"
            name="cantonId"
            value={cantonId}
            onChange={handleCantonChange}
            className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="">Kanton auswählen</option>

            {cantons.map((canton) => (
              <option key={canton.id} value={canton.id}>
                {canton.name}
              </option>
            ))}
          </select>

          {cantonError?.length ? <p className="text-sm text-rose-400">{cantonError[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityId">Ort</Label>

          <CityCombobox
            id="cityId"
            name="cityId"
            cities={filteredCities}
            value={cityId}
            onChange={setCityId}
            disabled={!cantonId}
            placeholder={cantonId ? "Ort suchen …" : "Zuerst Kanton auswählen"}
          />

          {cityError?.length ? <p className="text-sm text-rose-400">{cityError[0]}</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
        <p className="text-xs text-zinc-500">Land</p>

        <p className="mt-1 text-sm font-medium text-white">Schweiz</p>
      </div>
    </section>
  );
}

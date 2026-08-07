"use client";

import { useRef, useState } from "react";
import { isGoogleMapsUrl } from "@/lib/maps";

export type NominatimResult = { display_name: string; lat: string; lon: string };
export type Location = { lat: number; lng: number };
export type LinkStatus = "idle" | "resolving" | "error";

/**
 * Encapsulates the three ways a location gets set (Nominatim search, paste a Google
 * Maps link, tap-to-pin + reverse geocode) so it can be used more than once in the same
 * form (e.g. a walk's start and end points) without duplicating the search/resolve logic.
 */
export function useLocationPicker() {
  const [placeText, setPlaceText] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("idle");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  function reset(initial?: { placeName: string; lat: number; lng: number } | null) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (initial) {
      setPlaceText(initial.placeName);
      setLocation({ lat: initial.lat, lng: initial.lng });
    } else {
      setPlaceText("");
      setLocation(null);
    }
    setSuggestions([]);
    setSearching(false);
    setLinkStatus("idle");
  }

  async function reverseGeocode(loc: Location) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`
      );
      const data = await res.json();
      if (data?.display_name) {
        skipNextSearch.current = true;
        setPlaceText(data.display_name.split(",").slice(0, 2).join(","));
      }
    } catch {
      // leave the place field blank for the user to type
    }
  }

  /** Sets a location from a map tap and fills in a best-guess name via reverse geocoding. */
  function setFromTap(loc: Location) {
    setLocation(loc);
    reverseGeocode(loc);
  }

  async function resolveMapsLink(url: string) {
    setLinkStatus("resolving");
    setSuggestions([]);
    try {
      const res = await fetch("/api/geocode/resolve-maps-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkStatus("error");
        return;
      }
      setLocation({ lat: data.lat, lng: data.lng });
      if (data.placeName) {
        skipNextSearch.current = true;
        setPlaceText(data.placeName);
      }
      setLinkStatus("idle");
    } catch {
      setLinkStatus("error");
    }
  }

  function handlePlaceChange(value: string) {
    setPlaceText(value);
    setLocation(null);

    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (isGoogleMapsUrl(value)) {
      setSuggestions([]);
      searchTimer.current = setTimeout(() => resolveMapsLink(value.trim()), 350);
      return;
    }

    setLinkStatus("idle");
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value)}`
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function selectSuggestion(result: NominatimResult) {
    skipNextSearch.current = true;
    setPlaceText(result.display_name.split(",").slice(0, 2).join(","));
    setLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setSuggestions([]);
  }

  return {
    placeText,
    location,
    suggestions,
    searching,
    linkStatus,
    reset,
    setFromTap,
    handlePlaceChange,
    selectSuggestion,
  };
}

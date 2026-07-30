"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  normalizeLocationText,
  parseAddressSuggestion,
  uniqueBy,
} from "../lib/location";

function SuggestionInput({
  label,
  name,
  value,
  onChange,
  onSelect,
  loadSuggestions,
  required,
  placeholder,
  autoComplete,
}) {
  const id = useId();
  const timerRef = useRef(null);
  const requestRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    requestRef.current?.abort();
  }, []);

  const requestSuggestions = (query) => {
    clearTimeout(timerRef.current);
    requestRef.current?.abort();
    const normalized = normalizeLocationText(query);
    if (normalized.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      try {
        const results = await loadSuggestions(normalized, controller.signal);
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 320);
  };

  const choose = (suggestion) => {
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <label className="signup-label location-autocomplete">
      <span>{label}{required && <span className="text-red-400"> *</span>}</span>
      <div className="location-autocomplete__control">
        <input
          name={name}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-expanded={open}
          aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            requestSuggestions(event.target.value);
          }}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (!open || !suggestions.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              choose(suggestions[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {loading && <span className="location-autocomplete__loading" aria-label="Recherche en cours" />}
      </div>
      {open && (
        <ul id={`${id}-listbox`} role="listbox" className="location-autocomplete__list">
          {suggestions.map((suggestion, index) => (
            <li
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              key={suggestion.key}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                className={index === activeIndex ? "active" : ""}
              >
                <strong>{suggestion.title}</strong>
                {suggestion.subtitle && <small>{suggestion.subtitle}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

async function loadAddresses(query, signal) {
  const params = new URLSearchParams({ type: "address", q: query });
  const response = await fetch(`/api/location/suggest?${params}`, { signal });
  if (!response.ok) throw new Error("Service d'adresse indisponible");
  const payload = await response.json();
  return uniqueBy(payload.results || [], (item) => item.fulltext).map((item) => ({
    key: `${item.fulltext}-${item.x}-${item.y}`,
    title: item.fulltext,
    subtitle: item.kind === "housenumber" ? "Adresse exacte" : "Voie",
    raw: item,
  }));
}

async function loadCities(query, signal) {
  const params = new URLSearchParams({ type: "city", q: query });
  const response = await fetch(`/api/location/suggest?${params}`, { signal });
  if (!response.ok) throw new Error("Service des communes indisponible");
  const payload = await response.json();
  return uniqueBy(payload, (item) => item.code).map((item) => ({
    key: item.code,
    title: item.nom,
    subtitle: `${item.codesPostaux?.[0] || ""}${item.departement?.nom ? ` · ${item.departement.nom}` : ""}`,
    raw: item,
  }));
}

async function loadDepartments(query, signal) {
  const params = new URLSearchParams({ type: "department", q: query });
  const response = await fetch(`/api/location/suggest?${params}`, { signal });
  if (!response.ok) throw new Error("Service des départements indisponible");
  const payload = await response.json();
  return uniqueBy(payload, (item) => item.code).map((item) => ({
    key: item.code,
    title: item.nom,
    subtitle: `Département ${item.code}`,
    raw: item,
  }));
}

async function resolveDepartment(code) {
  if (!code) return null;
  const params = new URLSearchParams({ type: "department-code", q: code });
  const response = await fetch(`/api/location/suggest?${params}`);
  return response.ok ? response.json() : null;
}

export default function FrenchLocationFields({
  address = "",
  city = "",
  department = "",
  postalCode = "",
  onChange,
  required = true,
  showAddress = true,
  addressName = "adresse",
  cityName = "ville",
  departmentName = "departement",
  postalCodeName = "codePostal",
  cityCodeName = "codeCommune",
  departmentCodeName = "codeDepartement",
  addressLabel = "Adresse",
  cityLabel = "Ville",
}) {
  const [values, setValues] = useState({
    address,
    city,
    department,
    postalCode,
    cityCode: "",
    departmentCode: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    setValues((current) => ({
      ...current,
      address,
      city,
      department,
      postalCode,
      ...(!address && !city && !department && !postalCode
        ? { cityCode: "", departmentCode: "", latitude: null, longitude: null }
        : {}),
    }));
  }, [address, city, department, postalCode]);

  const update = (patch) => {
    setValues((current) => {
      const next = { ...current, ...patch };
      onChange?.(next);
      return next;
    });
  };

  return (
    <>
      {showAddress && (
        <SuggestionInput
          label={addressLabel}
          name={addressName}
          value={values.address}
          required={required}
          placeholder="Commencez à saisir une adresse…"
          autoComplete="street-address"
          onChange={(value) => update({ address: value, cityCode: "", departmentCode: "" })}
          loadSuggestions={loadAddresses}
          onSelect={async (suggestion) => {
            const parsed = parseAddressSuggestion(suggestion.raw);
            let departmentNameValue = values.department;
            const resolvedDepartment = await resolveDepartment(parsed.departmentCode).catch(() => null);
            if (resolvedDepartment?.nom) departmentNameValue = resolvedDepartment.nom;
            update({
              address: parsed.address,
              city: parsed.city,
              department: departmentNameValue,
              postalCode: parsed.postalCode,
              cityCode: parsed.cityCode,
              departmentCode: parsed.departmentCode,
              latitude: parsed.latitude,
              longitude: parsed.longitude,
            });
          }}
        />
      )}
      <SuggestionInput
        label={cityLabel}
        name={cityName}
        value={values.city}
        required={required}
        placeholder="Commencez à saisir une ville…"
        autoComplete="address-level2"
        onChange={(value) => update({ city: value, cityCode: "" })}
        loadSuggestions={loadCities}
        onSelect={async (suggestion) => {
          const resolvedDepartment = await resolveDepartment(
            suggestion.raw.codeDepartement
          ).catch(() => null);
          update({
            city: suggestion.raw.nom,
            department:
              suggestion.raw.departement?.nom ||
              resolvedDepartment?.nom ||
              values.department,
            postalCode: suggestion.raw.codesPostaux?.[0] || values.postalCode,
            cityCode: suggestion.raw.code,
            departmentCode: suggestion.raw.codeDepartement,
            longitude: suggestion.raw.centre?.coordinates?.[0] ?? null,
            latitude: suggestion.raw.centre?.coordinates?.[1] ?? null,
          });
        }}
      />
      <SuggestionInput
        label="Département"
        name={departmentName}
        value={values.department}
        required={required}
        placeholder="Commencez à saisir un département…"
        autoComplete="address-level1"
        onChange={(value) => update({ department: value, departmentCode: "" })}
        loadSuggestions={loadDepartments}
        onSelect={(suggestion) => update({
          department: suggestion.raw.nom,
          departmentCode: suggestion.raw.code,
        })}
      />
      <label className="signup-label">
        <span>Code postal{required && <span className="text-red-400"> *</span>}</span>
        <input
          name={postalCodeName}
          value={values.postalCode}
          required={required}
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          autoComplete="postal-code"
          placeholder="69002"
          onChange={(event) => update({ postalCode: event.target.value.replace(/\D/g, "").slice(0, 5) })}
        />
      </label>
      <input type="hidden" name={cityCodeName} value={values.cityCode} />
      <input type="hidden" name={departmentCodeName} value={values.departmentCode} />
    </>
  );
}

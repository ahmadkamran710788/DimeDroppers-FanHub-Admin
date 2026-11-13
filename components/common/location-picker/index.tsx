"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { APIProvider, AdvancedMarker, ColorScheme, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";
import { config } from "@/config";
import { cn } from "@/utils/cn";
import FloatingPanel, { MENU_ITEM } from "@/components/common/floating-panel";
import BusinessChoice from "@/components/common/location-picker/business-choice";
import {
  businessTypeOf,
  businessesAt,
  findBusinessByName,
  type FoundBusiness,
} from "@/components/common/location-picker/find-business";

// The middle of the contiguous US, for a map with no pin yet.
const US_CENTER = { lat: 39.5, lng: -98.35 };
const US_ZOOM = 4;
// Street level, where a pin can sit on the exact building.
const PIN_ZOOM = 16;
// Suggestions are asked for once typing pauses this long, from this many characters.
const SEARCH_DELAY_MS = 250;
const SEARCH_MIN_CHARS = 3;
// A picked place's details: the address and point (Place Details Essentials), plus, when the owner wants the
// business type, whether it's a business and its type. primaryTypeDisplayName is a Pro field, so asking for
// it bills the whole call as Pro.
const ADDRESS_FIELDS = ["addressComponents", "location"];
const BUSINESS_FIELDS = ["types", "primaryTypeDisplayName"];

// A picked address, split the way the location forms hold it.
export interface PickedPlace {
  street: string;
  city: string;
  // Two-letter code, e.g. "TX".
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  // Prefix of the search box's and the map's ids; unique on the page.
  name: string;
  // The pin as the form holds it ("" while there is none).
  latitude: string;
  longitude: string;
  // A search suggestion was picked: its address and point.
  onPlace: (place: PickedPlace) => void;
  // The pin was dragged, or the map clicked.
  onPin: (latitude: number, longitude: number) => void;
  // Shown under the map (e.g. "Pick your location on the map").
  error?: string;
  labelClassName?: string;
  inputClassName?: string;
  // Google's type for the business at a picked place (e.g. "Department Store"), for a category. Set, it's
  // called with null on every pick, then with the type once known: at once for a business picked from the
  // search; for a plain address, from the business named `businessName` there, or the one picked from the
  // businesses there. The lookups are Google Pro-priced searches.
  onBusinessType?: (businessType: string | null) => void;
  // The business's name as typed in the form, to find it at a picked address.
  businessName?: string;
}

// The form's pin as a point, or null while it isn't a valid pair yet.
function pointOf(latitude: string, longitude: string): google.maps.LatLngLiteral | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

// Street, city, state and ZIP from a place's address parts. A city can come as a locality, a postal town or
// (New York's boroughs) a sublocality.
function addressOf(components: google.maps.places.AddressComponent[]) {
  const part = (type: string, short = false) => {
    const component = components.find((c) => c.types.includes(type));
    return (short ? component?.shortText : component?.longText) ?? "";
  };
  return {
    street: [part("street_number"), part("route")].filter(Boolean).join(" "),
    city: part("locality") || part("postal_town") || part("sublocality_level_1") || part("sublocality"),
    state: part("administrative_area_level_1", true),
    zip: part("postal_code"),
  };
}

// Address search (Google Places, US only) above a map whose pin can be dragged, or moved by clicking the map,
// onto the exact spot. The owner keeps the address fields and the pin; this fills them. Without a Google Maps
// key it only says so, and the owner's latitude and longitude fields are typed instead.
export default function LocationPicker(props: LocationPickerProps) {
  if (!config.googleMapsApiKey) {
    return (
      <p className="text-sm text-white/70">
        The map isn’t available right now. Enter the latitude and longitude of the location below.
      </p>
    );
  }
  return (
    <APIProvider apiKey={config.googleMapsApiKey}>
      <PickerBody {...props} />
    </APIProvider>
  );
}

function PickerBody({
  name,
  latitude,
  longitude,
  onPlace,
  onPin,
  error,
  labelClassName,
  inputClassName,
  onBusinessType,
  businessName = "",
}: LocationPickerProps) {
  const places = useMapsLibrary("places");
  const map = useMap(name);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState("");
  // The businesses at a picked address, offered when none was found by name.
  const [businesses, setBusinesses] = useState<FoundBusiness[]>([]);
  // Counts picks, so a slow business lookup for an earlier one is dropped.
  const picks = useRef(0);
  // One billing session from the first keystroke to the picked place's details.
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // The pin just moved on the map itself: the map stays where it is.
  const movedOnMap = useRef(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;
  const searchId = `${name}-search`;

  const pin = pointOf(latitude, longitude);
  const typed = query.trim();
  const shown = typed.length >= SEARCH_MIN_CHARS ? suggestions : [];
  const listOpen = open && shown.length > 0;

  // Suggestions for what's typed, once typing pauses.
  useEffect(() => {
    if (!places || typed.length < SEARCH_MIN_CHARS) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      session.current ??= new places.AutocompleteSessionToken();
      try {
        const answer = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: typed,
          sessionToken: session.current,
          includedRegionCodes: ["us"],
        });
        if (cancelled) return;
        setSuggestions(answer.suggestions.filter((s) => s.placePrediction));
        setActive(0);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [places, typed]);

  // A pin set from outside the map (a picked address, typed coordinates) is brought into view, close up.
  const pinLat = pin?.lat;
  const pinLng = pin?.lng;
  useEffect(() => {
    if (!map || pinLat === undefined || pinLng === undefined) return;
    if (movedOnMap.current) {
      movedOnMap.current = false;
      return;
    }
    map.panTo({ lat: pinLat, lng: pinLng });
    if ((map.getZoom() ?? 0) < PIN_ZOOM - 4) map.setZoom(PIN_ZOOM);
  }, [map, pinLat, pinLng]);

  const close = useCallback(() => setOpen(false), []);

  function moveOnMap(point: google.maps.LatLngLiteral | null) {
    if (!point) return;
    movedOnMap.current = true;
    setFailed("");
    onPin(point.lat, point.lng);
  }

  async function pick(suggestion: google.maps.places.AutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    setOpen(false);
    setQuery(prediction.text.text);
    setBusinesses([]);
    const pickId = ++picks.current;
    const place = prediction.toPlace();
    try {
      await place.fetchFields({ fields: onBusinessType ? [...ADDRESS_FIELDS, ...BUSINESS_FIELDS] : ADDRESS_FIELDS });
    } catch {
      setFailed("Couldn’t load that address. Try again, or click the map where it is.");
      return;
    } finally {
      // The details end the session; the next search starts a new one.
      session.current = null;
    }
    // Another place was picked meanwhile.
    if (pickId !== picks.current) return;
    if (!place.location) {
      setFailed("That address has no point on the map. Click the map where it is.");
      return;
    }
    setFailed("");
    const point = { lat: place.location.lat(), lng: place.location.lng() };
    onPlace({ ...addressOf(place.addressComponents ?? []), latitude: point.lat, longitude: point.lng });
    if (onBusinessType) void findBusinessType(pickId, place, prediction.text.text, point, onBusinessType);
  }

  // The business type for a picked place: its own for a business. For a plain address, the business by the
  // form's name there, else the businesses there are offered. A failed lookup leaves the category to the list.
  async function findBusinessType(
    pickId: number,
    place: google.maps.places.Place,
    address: string,
    point: google.maps.LatLngLiteral,
    report: (businessType: string | null) => void
  ) {
    const own = businessTypeOf(place);
    report(own);
    if (own || !places) return;
    try {
      const name = businessName.trim();
      const named = name ? await findBusinessByName(places, name, address, point) : null;
      if (pickId !== picks.current) return;
      if (named) {
        report(named.type);
        return;
      }
      const nearby = await businessesAt(places, point);
      if (pickId === picks.current) setBusinesses(nearby);
    } catch {
      // Nothing found; the sponsor picks from the list.
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!listOpen) {
      // Enter in the search box never submits the form around it (e.g. the sign-up step).
      if (e.key === "Enter") e.preventDefault();
      if (e.key === "ArrowDown" && shown.length) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + shown.length) % shown.length);
    } else if (e.key === "Enter") {
      // Picks the highlighted address instead of submitting the form.
      e.preventDefault();
      void pick(shown[active]);
    }
  }

  const message = error || failed;

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={searchId} className={labelClassName}>
        Search address
      </label>
      <div ref={anchorRef} className="relative flex items-center">
        <Search className="absolute left-[14px] size-4 text-white/60 pointer-events-none" strokeWidth={2} aria-hidden />
        <input
          id={searchId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-activedescendant={listOpen ? optionId(active) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setBusinesses([]);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for the address or business"
          autoComplete="off"
          className={cn(
            "w-full h-12 rounded-[8px] border outline-none bg-black/30 text-white border-white/25 placeholder:text-white/50",
            "focus:border-steel-blue transition-colors",
            inputClassName,
            "pl-10"
          )}
        />
      </div>
      {listOpen && (
        <FloatingPanel anchorRef={anchorRef} onClose={close} align="start">
          <ul id={listId} role="listbox" aria-label="Addresses" className="max-h-[320px] overflow-y-auto">
            {shown.map((s, i) => {
              const prediction = s.placePrediction;
              if (!prediction) return null;
              return (
                <li
                  key={prediction.placeId}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  // Keep focus in the search box so the keyboard handling keeps working.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => void pick(s)}
                  className={cn(MENU_ITEM, "flex flex-col cursor-pointer whitespace-normal", i === active && "bg-white/10")}
                >
                  <span className="font-semibold">{prediction.mainText?.text ?? prediction.text.text}</span>
                  {prediction.secondaryText && (
                    <span className="text-xs text-white/60">{prediction.secondaryText.text}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </FloatingPanel>
      )}
      {onBusinessType && businesses.length > 0 && (
        <BusinessChoice
          businesses={businesses}
          onPick={(business) => {
            setBusinesses([]);
            onBusinessType(business.type);
          }}
          onDismiss={() => setBusinesses([])}
        />
      )}

      <Map
        id={name}
        mapId={config.googleMapsMapId}
        colorScheme={ColorScheme.DARK}
        defaultCenter={pin ?? US_CENTER}
        defaultZoom={pin ? PIN_ZOOM : US_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        onClick={(e) => moveOnMap(e.detail.latLng)}
        className={cn("h-[240px] w-full rounded-[12px] overflow-hidden border", message ? "border-error" : "border-white/15")}
      >
        {pin && (
          <AdvancedMarker
            position={pin}
            draggable
            onDragEnd={(e) => moveOnMap(e.latLng ? { lat: e.latLng.lat(), lng: e.latLng.lng() } : null)}
          />
        )}
      </Map>
      {message ? (
        <p className="text-sm text-error">{message}</p>
      ) : (
        <p className="text-sm text-white/70">
          {pin
            ? "Drag the pin, or click the map, to put it on the exact spot."
            : "Search for the address, or click the map where it is."}
        </p>
      )}
    </div>
  );
}

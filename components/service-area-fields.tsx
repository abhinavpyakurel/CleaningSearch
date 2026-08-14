import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { US_STATE_OPTIONS } from "@/lib/location/service-area-form";

type ServiceAreaFieldsProps = {
  defaultCity?: string;
  defaultState?: string;
  defaultZipCode?: string;
  defaultRadiusMiles?: string;
  idPrefix?: string;
};

export function ServiceAreaFields({
  defaultCity = "",
  defaultState = "",
  defaultZipCode = "",
  defaultRadiusMiles = "",
  idPrefix = "",
}: ServiceAreaFieldsProps) {
  const prefix = idPrefix ? `${idPrefix}_` : "";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Service area</p>
        <p className="text-xs text-muted-foreground">
          Clients discover you based on where you work and how far you travel.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}service_city`}>Service city</Label>
        <Input
          id={`${prefix}service_city`}
          name="service_city"
          type="text"
          autoComplete="address-level2"
          required
          defaultValue={defaultCity}
          placeholder="San Marcos"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${prefix}service_state`}>State</Label>
          <select
            id={`${prefix}service_state`}
            name="service_state"
            required
            defaultValue={defaultState}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select state
            </option>
            {US_STATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${prefix}service_zip_code`}>ZIP code</Label>
          <Input
            id={`${prefix}service_zip_code`}
            name="service_zip_code"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            required
            maxLength={5}
            defaultValue={defaultZipCode}
            placeholder="78666"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}service_radius_miles`}>
          Service radius (miles)
        </Label>
        <Input
          id={`${prefix}service_radius_miles`}
          name="service_radius_miles"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={defaultRadiusMiles}
        />
      </div>
    </div>
  );
}

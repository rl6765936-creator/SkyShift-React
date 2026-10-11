import type { CatalogIdentification, SpecificationAccuracy, VehicleMetadata } from "./types";

type DisplaySource = VehicleMetadata & { identification?: CatalogIdentification | null };

export const vehicleDisplay = (vehicle: DisplaySource) => {
  const manufacturer = vehicle.manufacturer && vehicle.manufacturer !== "Unidentified" ? vehicle.manufacturer : null;
  const model = vehicle.modelName || "SkyShift";
  return {
    modelName: manufacturer && vehicle.modelName ? `${manufacturer} ${vehicle.modelName}` : model,
    // Road speed from the catalog; legacy vehicles fall back to their old free-form value.
    speedKmh: vehicle.maxRoadSpeedKmh ?? vehicle.maxSpeedKmh ?? null,
    speedAccuracy: (vehicle.maxRoadSpeedAccuracy ?? null) as SpecificationAccuracy | null,
    seats: vehicle.seats ?? null,
    seatsAccuracy: (vehicle.seatsAccuracy ?? null) as SpecificationAccuracy | null,
    imageUrl: vehicle.imageUrl || null,
    isCatalog: vehicle.catalogItemId != null || vehicle.identification != null,
    isVisualInspiration: (vehicle.catalogIdentification ?? vehicle.identification) === "VisualInspiration",
  };
};

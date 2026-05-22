export type WorkshopServiceArea = {
  id: string;
  workshopId: string;
  city: string;
  district?: string;
  supportsWorkshop: boolean;
  supportsField: boolean;
  isPrimary: boolean;
};

export type WorkshopPricingOverride = {
  workshopSar: number | null;
  fieldSar: number | null;
  currency: string;
  platformWorkshopSar: number | null;
  platformFieldSar: number | null;
};

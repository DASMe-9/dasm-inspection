import { redirect } from "next/navigation";

export default function LegacyVehicleFilePage({
  params,
}: {
  params: { carId: string };
}) {
  const carId = decodeURIComponent(params.carId);
  redirect(`/my-vehicles/${encodeURIComponent(carId)}`);
}

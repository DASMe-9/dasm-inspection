import { WorkshopInstallBanner } from "@/components/workshop/WorkshopInstallBanner";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PwaRegister />
      <WorkshopInstallBanner />
      {children}
    </>
  );
}

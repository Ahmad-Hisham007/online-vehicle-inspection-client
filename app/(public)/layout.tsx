import Footer from "./Components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

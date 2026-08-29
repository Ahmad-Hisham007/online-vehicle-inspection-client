import { RequestsListing } from "@/app/components/admin/RequestsListing";

// interface RequestRow {
//   id: number;
//   status: InspectionStatus;
//   date: string;
//   user: string;
//   location: string;
// }

// const SAMPLE_REQUESTS: RequestRow[] = [
//   {
//     id: 16406,
//     status: "pending",
//     date: "2026-08-22T19:02:00",
//     user: "Reggie Ramirez",
//     location: "Michigan (USA)",
//   },
//   {
//     id: 16405,
//     status: "paid",
//     date: "2026-08-22T11:02:00",
//     user: "OceanView Rides",
//     location: "Florida (USA)",
//   },
//   {
//     id: 16404,
//     status: "payment_failed",
//     date: "2026-08-22T07:47:00",
//     user: "Joshua Sanchez",
//     location: "California (USA)",
//   },
//   {
//     id: 16403,
//     status: "in_progress",
//     date: "2026-08-21T16:30:00",
//     user: "Bilson Mathew",
//     location: "Texas (USA)",
//   },
//   {
//     id: 16402,
//     status: "paid",
//     date: "2026-08-21T10:15:00",
//     user: "Yazid Hussein",
//     location: "Ontario (CA)",
//   },
// ];

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}
export default async function RequestsPage({ searchParams }: PageProps) {
  // const pageSize = 10;

  // const filtered = useMemo(() => {
  //   const q = search.trim().toLowerCase();
  //   return SAMPLE_REQUESTS.filter((r) => {
  //     if (filter !== "all" && r.status !== filter) return false;
  //     if (!q) return true;
  //     return (
  //       String(r.id).includes(q) ||
  //       r.user.toLowerCase().includes(q) ||
  //       r.location.toLowerCase().includes(q)
  //     );
  //   }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // }, [search, filter]);

  // const pageRows = useMemo(
  //   () => filtered.slice((page - 1) * pageSize, page * pageSize),
  //   [filtered, page],
  // );

  return <RequestsListing searchParams={searchParams} />;
}

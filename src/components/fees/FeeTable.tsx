import { Table, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatUGX } from "@/lib/utils/format";

export interface FeeTableRow {
  studentName: string;
  totalDue: number;
  totalPaid: number;
}

export function FeeTable({ rows }: { rows: FeeTableRow[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <TableHead>Student</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Status</TableHead>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const balance = row.totalDue - row.totalPaid;
          const status = balance <= 0 ? "success" : row.totalPaid > 0 ? "warning" : "danger";
          const label = balance <= 0 ? "Paid" : row.totalPaid > 0 ? "Partial" : "Unpaid";
          return (
            <tr key={row.studentName}>
              <TableCell>{row.studentName}</TableCell>
              <TableCell>{formatUGX(row.totalDue)}</TableCell>
              <TableCell>{formatUGX(row.totalPaid)}</TableCell>
              <TableCell>
                <Badge tone={status}>{label}</Badge>
              </TableCell>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

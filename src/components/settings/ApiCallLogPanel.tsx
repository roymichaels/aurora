import { useApiCallLog } from '@/state/apiCallLog';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export default function ApiCallLogPanel() {
  const { log, clear } = useApiCallLog();
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">API Call Log</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {log.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.timestamp}</TableCell>
              <TableCell className="max-w-xs truncate">{e.endpoint}</TableCell>
              <TableCell>{e.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="outline" onClick={clear}>Clear Log</Button>
    </div>
  );
}

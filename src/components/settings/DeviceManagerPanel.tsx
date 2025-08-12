import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface Device { id: string; name: string }

export default function DeviceManagerPanel() {
  const [devices, setDevices] = useLocalStorage<Device[]>(
    'aurora.trustedDevices',
    [],
  );

  const revoke = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Devices</h2>
      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No devices have access.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revoke(d.id)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

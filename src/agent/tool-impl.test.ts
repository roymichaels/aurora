import { ToolImpl } from './tool-impl';
import { toast } from '@/components/ui/use-toast';

jest.mock('@/components/ui/use-toast', () => ({ toast: jest.fn() }));

// minimal DOM stubs
const dispatchEvent = jest.fn();
const confirm = jest.fn(() => true);
(global as any).window = { dispatchEvent, confirm };
class CustomEventMock<T> {
  type: string;
  detail: T;
  constructor(type: string, params: { detail: T }) {
    this.type = type;
    this.detail = params.detail;
  }
}
(global as any).CustomEvent = CustomEventMock;

describe('ToolImpl.start_focus', () => {
  beforeEach(() => {
    dispatchEvent.mockClear();
    confirm.mockClear();
    confirm.mockReturnValue(true);
    (toast as jest.Mock).mockClear();
  });

  it('accepts minutes within range', async () => {
    const res = await ToolImpl.start_focus({ minutes: 30 });
    expect(res).toEqual({ ok: true });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Focus started' }));
  });

  it('rejects minutes outside range', async () => {
    const res = await ToolImpl.start_focus({ minutes: 0 });
    expect(res).toEqual({ ok: false });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Invalid duration' }));
  });
});

describe('ToolImpl.start_hypnosis', () => {
  beforeEach(() => {
    dispatchEvent.mockClear();
    confirm.mockClear();
    confirm.mockReturnValue(true);
    (toast as jest.Mock).mockClear();
  });

  it('uses default duration when omitted', async () => {
    const res = await ToolImpl.start_hypnosis({ mode: 'focus' });
    expect(res).toEqual({ ok: true });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: '60s' }));
  });

  it('rejects invalid duration', async () => {
    const res = await ToolImpl.start_hypnosis({ mode: 'calm', duration: 0 });
    expect(res).toEqual({ ok: false });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Invalid duration' }));
  });

  it('requires user confirmation', async () => {
    confirm.mockReturnValueOnce(false);
    const res = await ToolImpl.start_hypnosis({ mode: 'focus' });
    expect(res).toEqual({ ok: false });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hypnosis cancelled' }));
  });
});

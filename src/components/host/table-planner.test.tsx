import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@/lib/domain/types';
import { TablePlanner, type TableSummary } from './table-planner';

const dnd = vi.hoisted(() => ({
  onDragEnd: undefined as ((event: {
    active: { id: string };
    over: { id: string } | null;
  }) => Promise<void>) | undefined,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: {
    children: React.ReactNode;
    onDragEnd: typeof dnd.onDragEnd;
  }) => {
    dnd.onDragEnd = onDragEnd;
    return children;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => children,
  KeyboardSensor: class KeyboardSensor {},
  PointerSensor: class PointerSensor {},
  TouchSensor: class TouchSensor {},
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useSensor: () => ({}),
  useSensors: () => [],
}));

const acceptedInvitation: Invitation = {
  id: 'i1',
  inviteCode: 'ABC123',
  displayName: 'ครอบครัวเอ',
  contactName: 'คุณเอ',
  status: 'accepted',
  adultCount: 3,
  childCount: 1,
  childSeatCount: 0,
  beerPreference: 'none',
  lateResponse: false,
  checkedInCount: 0,
  tableNumbers: [],
};

const pendingInvitation: Invitation = {
  ...acceptedInvitation,
  id: 'i2',
  inviteCode: 'PEN123',
  displayName: 'ครอบครัวรอตอบ',
  status: 'pending',
};

const seatedInvitation: Invitation = {
  ...acceptedInvitation,
  id: 'i3',
  inviteCode: 'SEA123',
  displayName: 'ครอบครัวมีโต๊ะ',
  tableNumbers: [1],
};

const table: TableSummary = {
  id: 't1',
  number: 1,
  capacity: 10,
  revealed: false,
  occupied: 4,
  remaining: 6,
  overCapacity: false,
  assignments: [{ invitationId: 'i3', tableId: 't1', seatCount: 4 }],
};

describe('TablePlanner', () => {
  it('shows only accepted invitations with no assignment in the drag pool', () => {
    render(
      <TablePlanner
        invitations={[acceptedInvitation, pendingInvitation, seatedInvitation]}
        tables={[table]}
        onAssign={vi.fn().mockResolvedValue(true)}
        onRemove={vi.fn().mockResolvedValue(undefined)}
        onToggleReveal={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const pool = screen.getByRole('region', { name: 'แขกที่ยังไม่มีโต๊ะ' });
    expect(within(pool).getByText('ครอบครัวเอ')).toBeInTheDocument();
    expect(within(pool).getByText('4 ที่นั่ง')).toBeInTheDocument();
    expect(within(pool).queryByText('ครอบครัวรอตอบ')).not.toBeInTheDocument();
    expect(within(pool).queryByText('ครอบครัวมีโต๊ะ')).not.toBeInTheDocument();
    expect(screen.getByLabelText('เลือกแขกสำหรับโต๊ะ 1')).toBeInTheDocument();
  });

  it('assigns the full responding party when dropped onto a table', async () => {
    const onAssign = vi.fn().mockResolvedValue(true);
    render(
      <TablePlanner
        invitations={[acceptedInvitation]}
        tables={[{ ...table, occupied: 0, remaining: 10, assignments: [] }]}
        onAssign={onAssign}
        onRemove={vi.fn().mockResolvedValue(undefined)}
        onToggleReveal={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await act(async () => {
      await dnd.onDragEnd?.({ active: { id: 'i1' }, over: { id: 'table:t1' } });
    });

    expect(onAssign).toHaveBeenCalledWith('t1', 'i1', 4);
    expect(screen.getByRole('button', { name: /ลากครอบครัวเอ/ })).toBeInTheDocument();
  });

  it('does nothing when a drag ends outside a table', async () => {
    const onAssign = vi.fn().mockResolvedValue(true);
    render(
      <TablePlanner
        invitations={[acceptedInvitation]}
        tables={[{ ...table, occupied: 0, remaining: 10, assignments: [] }]}
        onAssign={onAssign}
        onRemove={vi.fn().mockResolvedValue(undefined)}
        onToggleReveal={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await act(async () => {
      await dnd.onDragEnd?.({ active: { id: 'i1' }, over: null });
    });

    expect(onAssign).not.toHaveBeenCalled();
  });

  it('removes a guest from the pool when an assignment appears', () => {
    const props = {
      invitations: [acceptedInvitation],
      onAssign: vi.fn().mockResolvedValue(true),
      onRemove: vi.fn().mockResolvedValue(undefined),
      onToggleReveal: vi.fn().mockResolvedValue(undefined),
    };
    const { rerender } = render(
      <TablePlanner
        {...props}
        tables={[{ ...table, occupied: 0, remaining: 10, assignments: [] }]}
      />,
    );
    expect(screen.getByRole('button', { name: /ลากครอบครัวเอ/ })).toBeInTheDocument();

    rerender(<TablePlanner {...props} tables={[{
      ...table,
      assignments: [{ invitationId: 'i1', tableId: 't1', seatCount: 4 }],
    }]} />);

    expect(screen.queryByRole('button', { name: /ลากครอบครัวเอ/ })).not.toBeInTheDocument();
    expect(screen.getByText('จัดโต๊ะให้แขกที่ตอบรับครบแล้ว')).toBeInTheDocument();
  });
});

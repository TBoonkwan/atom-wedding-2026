'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Invitation } from '@/lib/domain/types';
import {
  invitationPartySize,
  listUnassignedAcceptedInvitations,
  summarizeInvitationSeats,
} from '@/lib/domain/tables';

export interface TableSummary {
  id: string;
  number: number;
  capacity: number;
  revealed: boolean;
  occupied: number;
  remaining: number;
  overCapacity: boolean;
  assignments: { invitationId: string; tableId: string; seatCount: number }[];
}

interface TablePlannerProps {
  invitations: Invitation[];
  tables: TableSummary[];
  onAssign: (tableId: string, invitationId: string, seatCount: number) => Promise<boolean>;
  onRemove: (tableId: string, invitationId: string) => Promise<void>;
  onToggleReveal: (table: TableSummary) => Promise<void>;
}

interface DraggableGuestProps {
  invitation: Invitation;
  disabled: boolean;
}

function DraggableGuest({ invitation, disabled }: DraggableGuestProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: invitation.id,
    disabled,
    attributes: { roleDescription: 'แขกที่ลากไปจัดโต๊ะได้' },
  });
  const style: CSSProperties | undefined = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  const seatCount = invitationPartySize(invitation);

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`unassigned-guest-card${isDragging ? ' dragging' : ''}`}
      style={style}
      disabled={disabled}
      aria-label={`ลาก${invitation.displayName} จำนวน ${seatCount} ที่นั่ง`}
      {...listeners}
      {...attributes}
    >
      <strong>{invitation.displayName}</strong>
      <small>{seatCount} ที่นั่ง</small>
    </button>
  );
}

interface DroppableTableProps {
  table: TableSummary;
  invitations: Invitation[];
  assignmentSeatCount: number;
  disabled: boolean;
  onAssignmentSeatCountChange: (seatCount: number) => void;
  onAssign: (tableId: string, invitationId: string, seatCount: number) => Promise<boolean>;
  onRemove: (tableId: string, invitationId: string) => Promise<void>;
  onToggleReveal: (table: TableSummary) => Promise<void>;
}

function DroppableTable({
  table,
  invitations,
  assignmentSeatCount,
  disabled,
  onAssignmentSeatCountChange,
  onAssign,
  onRemove,
  onToggleReveal,
}: DroppableTableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `table:${table.id}`, disabled });

  return (
    <article
      ref={setNodeRef}
      className={`table-card table-drop-target${table.overCapacity ? ' over' : ''}${isOver ? ' is-over' : ''}`}
      aria-label={`โต๊ะ ${table.number}${isOver ? ' พร้อมรับแขกที่กำลังลาก' : ''}`}
    >
      <div className="table-circle">
        <strong>{table.number}</strong>
        <span>{table.occupied}/{table.capacity}</span>
      </div>
      <p>{table.overCapacity ? `เกิน ${Math.abs(table.remaining)} ที่` : `เหลือ ${table.remaining} ที่`}</p>
      <div className="table-assignment-list">
        {table.assignments.map((assignment) => {
          const invitation = invitations.find((item) => item.id === assignment.invitationId);
          return (
            <span key={assignment.invitationId}>
              <b>{invitation?.displayName ?? 'Invitation'}</b>
              <small>{assignment.seatCount} ที่</small>
              <button
                type="button"
                aria-label={`นำ ${invitation?.displayName ?? 'invitation'} ออกจากโต๊ะ ${table.number}`}
                onClick={() => void onRemove(table.id, assignment.invitationId)}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="table-add-controls">
        <input
          type="number"
          min="1"
          max="300"
          aria-label={`จำนวนที่นั่งสำหรับโต๊ะ ${table.number}`}
          value={assignmentSeatCount}
          onChange={(event) => onAssignmentSeatCountChange(Math.max(1, Number(event.target.value)))}
        />
        <select
          defaultValue=""
          aria-label={`เลือกแขกสำหรับโต๊ะ ${table.number}`}
          onChange={(event) => {
            const invitation = invitations.find((item) => item.id === event.target.value);
            if (invitation) {
              void onAssign(table.id, invitation.id, assignmentSeatCount);
            }
            event.target.value = '';
          }}
        >
          <option value="">+ เพิ่ม invitation</option>
          {invitations.filter((item) => item.status === 'accepted').map((item) => (
            <option value={item.id} key={item.id}>{item.displayName}</option>
          ))}
        </select>
      </div>
      <button className="reveal-toggle" onClick={() => void onToggleReveal(table)}>
        {table.revealed ? 'เผยเลขโต๊ะแล้ว' : 'ซ่อนเลขโต๊ะ'}
      </button>
    </article>
  );
}

export function TablePlanner({
  invitations,
  tables,
  onAssign,
  onRemove,
  onToggleReveal,
}: TablePlannerProps) {
  const [activeInvitationId, setActiveInvitationId] = useState<string | null>(null);
  const [assigningInvitationId, setAssigningInvitationId] = useState<string | null>(null);
  const [assignmentSeats, setAssignmentSeats] = useState<Record<string, number>>({});
  const assignments = useMemo(() => tables.flatMap((table) => table.assignments), [tables]);
  const unassigned = useMemo(
    () => listUnassignedAcceptedInvitations(invitations, assignments),
    [assignments, invitations],
  );
  const invitationSeats = useMemo(
    () => summarizeInvitationSeats(invitations, assignments),
    [assignments, invitations],
  );
  const activeInvitation = unassigned.find((item) => item.id === activeInvitationId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const invitationName = (id: string | number) =>
    invitations.find((item) => item.id === String(id))?.displayName ?? 'แขก';
  const tableNumber = (id: string | number | undefined) => {
    const tableId = String(id ?? '').replace(/^table:/, '');
    return tables.find((item) => item.id === tableId)?.number;
  };
  const announcements: Announcements = {
    onDragStart({ active }) {
      return `เริ่มลาก ${invitationName(active.id)}`;
    },
    onDragOver({ active, over }) {
      const number = tableNumber(over?.id);
      return number ? `${invitationName(active.id)} อยู่เหนือโต๊ะ ${number}` : 'อยู่นอกพื้นที่โต๊ะ';
    },
    onDragEnd({ active, over }) {
      const number = tableNumber(over?.id);
      return number ? `วาง ${invitationName(active.id)} ที่โต๊ะ ${number}` : 'ยกเลิกการจัดโต๊ะ';
    },
    onDragCancel({ active }) {
      return `ยกเลิกการลาก ${invitationName(active.id)}`;
    },
  };

  async function handleDragEnd(event: DragEndEvent) {
    setActiveInvitationId(null);
    const invitation = unassigned.find((item) => item.id === String(event.active.id));
    const target = event.over ? String(event.over.id) : '';
    if (!invitation || !target.startsWith('table:')) return;
    setAssigningInvitationId(invitation.id);
    try {
      await onAssign(
        target.slice('table:'.length),
        invitation.id,
        invitationPartySize(invitation),
      );
    } finally {
      setAssigningInvitationId(null);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: 'กด Space หรือ Enter เพื่อเริ่มลาก ใช้ปุ่มลูกศรเลือกโต๊ะ กดอีกครั้งเพื่อวาง หรือกด Escape เพื่อยกเลิก',
        },
      }}
      onDragStart={(event) => setActiveInvitationId(String(event.active.id))}
      onDragCancel={() => setActiveInvitationId(null)}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <section className="unassigned-guest-pool" role="region" aria-label="แขกที่ยังไม่มีโต๊ะ">
        <div className="unassigned-guest-heading">
          <div>
            <strong>แขกที่ยังไม่มีโต๊ะ</strong>
            <p>ลากแขกที่ตอบรับแล้วไปวางบนโต๊ะเพื่อจัดทั้งกลุ่ม</p>
          </div>
          <span>{unassigned.length} invitation</span>
        </div>
        {unassigned.length > 0 ? (
          <div className="unassigned-guest-list">
            {unassigned.map((invitation) => (
              <DraggableGuest
                key={invitation.id}
                invitation={invitation}
                disabled={assigningInvitationId === invitation.id}
              />
            ))}
          </div>
        ) : <p className="unassigned-guest-empty">จัดโต๊ะให้แขกที่ตอบรับครบแล้ว</p>}
      </section>

      <section className="table-seat-overview">
        <strong>สถานะการจัดที่นั่ง</strong>
        {invitationSeats.map((item) => (
          <span className={item.remaining === 0 ? 'complete' : ''} key={item.invitationId}>
            <b>{item.displayName}</b>
            <small>จัดแล้ว {item.assigned}/{item.expected} · {item.remaining > 0 ? `เหลือ ${item.remaining}` : 'ครบแล้ว'}</small>
          </span>
        ))}
      </section>

      <div className="table-planner-grid">
        {tables.map((table) => (
          <DroppableTable
            key={table.id}
            table={table}
            invitations={invitations}
            assignmentSeatCount={assignmentSeats[table.id] ?? 1}
            disabled={Boolean(assigningInvitationId)}
            onAssignmentSeatCountChange={(seatCount) => setAssignmentSeats((current) => ({
              ...current,
              [table.id]: seatCount,
            }))}
            onAssign={onAssign}
            onRemove={onRemove}
            onToggleReveal={onToggleReveal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeInvitation ? (
          <div className="unassigned-guest-card table-drag-overlay">
            <strong>{activeInvitation.displayName}</strong>
            <small>{invitationPartySize(activeInvitation)} ที่นั่ง</small>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

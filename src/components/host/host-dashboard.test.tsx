import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@/lib/domain/types';

vi.mock('./guest-create-modal', () => ({
  GuestCreateModal: () => <div>guest-create-modal</div>,
}));

vi.mock('./table-planner', () => ({
  TablePlanner: () => <div>table-planner</div>,
}));

import { HostDashboard } from './host-dashboard';

const guest = (overrides: Partial<Invitation>): Invitation => ({
  id: 'guest-1',
  inviteCode: 'AAA111',
  displayName: 'คุณเอ',
  contactName: 'คุณเอ',
  status: 'pending',
  adultCount: 0,
  childCount: 0,
  childSeatCount: 0,
  beerPreference: 'none',
  lateResponse: false,
  checkedInCount: 0,
  tableNumbers: [],
  ...overrides,
});

describe('HostDashboard guest and table workflows', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens manual guest creation and renders the drag table planner', () => {
    render(<HostDashboard email="demo@local" demo />);

    fireEvent.click(screen.getByRole('button', { name: 'รายชื่อแขก' }));
    fireEvent.click(screen.getByRole('button', { name: /เพิ่มแขก/ }));
    expect(screen.getByText('guest-create-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'จัดโต๊ะ' }));
    expect(screen.getByText('table-planner')).toBeInTheDocument();
  });

  it('shows current maybe and rejected reasons directly in the guest table', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        invitations: [
          guest({
            id: 'accepted',
            displayName: 'คุณมา',
            status: 'accepted',
            adultCount: 1,
            reason: 'ข้อความเก่า',
          }),
          guest({
            id: 'maybe',
            displayName: 'คุณคิดดูก่อน',
            status: 'maybe',
            reason: 'รอเช็กตารางงาน',
          }),
          guest({
            id: 'rejected',
            displayName: 'คุณไม่มา',
            status: 'rejected',
            reason: 'ติดเดินทาง',
          }),
          guest({
            id: 'empty-maybe',
            displayName: 'คุณไม่ระบุ',
            status: 'maybe',
            reason: '   ',
          }),
        ],
        tables: [],
        checkInCode: null,
      }),
    }));
    render(<HostDashboard email="demo@local" demo />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'รายชื่อแขก' }));

    expect(screen.getByRole('columnheader', { name: 'เหตุผล' })).toBeInTheDocument();
    const maybeRow = (await screen.findByText('คุณคิดดูก่อน')).closest('tr')!;
    const rejectedRow = screen.getByText('คุณไม่มา').closest('tr')!;
    const acceptedRow = screen.getByText('คุณมา').closest('tr')!;
    const emptyMaybeRow = screen.getByText('คุณไม่ระบุ').closest('tr')!;
    expect(within(maybeRow).getAllByRole('cell')[2]).toHaveTextContent('รอเช็กตารางงาน');
    expect(within(rejectedRow).getAllByRole('cell')[2]).toHaveTextContent('ติดเดินทาง');
    expect(within(acceptedRow).getAllByRole('cell')[2]).toHaveTextContent('—');
    expect(within(emptyMaybeRow).getAllByRole('cell')[2]).toHaveTextContent('—');
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./guest-create-modal', () => ({
  GuestCreateModal: () => <div>guest-create-modal</div>,
}));

vi.mock('./table-planner', () => ({
  TablePlanner: () => <div>table-planner</div>,
}));

import { HostDashboard } from './host-dashboard';

describe('HostDashboard guest and table workflows', () => {
  it('opens manual guest creation and renders the drag table planner', () => {
    render(<HostDashboard email="demo@local" demo />);

    fireEvent.click(screen.getByRole('button', { name: 'รายชื่อแขก' }));
    fireEvent.click(screen.getByRole('button', { name: /เพิ่มแขก/ }));
    expect(screen.getByText('guest-create-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'จัดโต๊ะ' }));
    expect(screen.getByText('table-planner')).toBeInTheDocument();
  });
});

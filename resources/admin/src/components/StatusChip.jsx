import Chip from '@mui/material/Chip';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'error' },
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  voided: { label: 'Voided', color: 'error' },
};

export default function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
}

import Box from '@mui/material/Box';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <DatePicker
        label="From"
        value={startDate}
        onChange={onStartChange}
        slotProps={{
          textField: { size: 'small', sx: { width: 160 } },
        }}
      />
      <DatePicker
        label="To"
        value={endDate}
        onChange={onEndChange}
        slotProps={{
          textField: { size: 'small', sx: { width: 160 } },
        }}
      />
    </Box>
  );
}

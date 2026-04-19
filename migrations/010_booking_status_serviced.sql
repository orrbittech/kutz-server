-- Rename terminal visit state from COMPLETED to SERVICED (see domain BookingStatus).
UPDATE bookings SET status = 'SERVICED' WHERE status = 'COMPLETED';

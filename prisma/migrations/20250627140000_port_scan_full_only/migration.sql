-- Port scans always use full port range (1-65535).
ALTER TABLE "port_scan" ALTER COLUMN "profile" SET DEFAULT 'FULL';

\c "frinx";

COPY public.uniconfig_zones (name, tenant_id) FROM stdin;
localhost	frinx
\.

COPY public.device_inventory (name, uniconfig_zone, role, management_ip, model, sw, sw_version, vendor, mount_parameters, username, password) FROM stdin;
mnd-gt0002-cpe4.test	1	l2-cpe	1.2.3.4	3930	saos	6	ciena	{"protocol": "ssh", "port": "22", "parsing-engine": "one-line-parser"}	admin	admin
mnd-gt0002-cpe5.test	1	l2-cpe	1.2.3.5	3931	saos	7	ciena	{"protocol": "ssh", "port": "22", "parsing-engine": "one-line-parser"}	admin	admin
\.

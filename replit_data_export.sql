--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: access_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.access_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    magic_link_id character varying NOT NULL,
    email text NOT NULL,
    video_id character varying NOT NULL,
    accessed_at timestamp without time zone DEFAULT now() NOT NULL,
    watch_duration integer DEFAULT 0,
    completion_percentage integer DEFAULT 0,
    ip_address text,
    user_agent text,
    company_tag text
);


ALTER TABLE public.access_logs OWNER TO neondb_owner;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    company_tag text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_users OWNER TO neondb_owner;

--
-- Name: company_tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_tags (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_tags OWNER TO neondb_owner;

--
-- Name: magic_links; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.magic_links (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    email text NOT NULL,
    video_id character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.magic_links OWNER TO neondb_owner;

--
-- Name: videos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.videos (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    thumbnail_url text NOT NULL,
    video_url text NOT NULL,
    duration text NOT NULL,
    category text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    company_tag text
);


ALTER TABLE public.videos OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: access_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.access_logs (id, magic_link_id, email, video_id, accessed_at, watch_duration, completion_percentage, ip_address, user_agent, company_tag) FROM stdin;
a456722f-552b-4fd4-b9f3-92666c040b16	f9559a8f-4ffd-4e6c-b73f-2fcf24ff587f	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-07 22:35:46.524497	596	100	172.31.85.2	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1	\N
c9faae52-b562-46c0-ad18-1a5a46683862	812ff4e8-71db-4e3f-8897-4650c41cd0d3	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-09 03:27:44.626175	0	0	172.31.76.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
d286b670-3e84-472c-bbfb-4e2971c7f230	03a4c3e7-5768-4c5f-ae40-41083e27c491	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 00:05:19.130422	596	100	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
8572306c-747a-4b49-b66a-7cc289b73f60	a33e3405-2de8-4f38-a4b3-f165566c4181	matt@affirmer.com.au	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:30:30.532388	0	0	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
13c601d8-394c-4aa2-8f99-4ba86074fa20	a9c75587-ac4f-4a00-aaa4-5eb8cc49e6d3	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:37:24.377947	0	0	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
51603340-ffde-4c38-8f60-954ff4d6f730	011c4a64-8217-4a5e-a39f-22fc14b6b9cb	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:46:45.314987	0	0	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
e9c29e41-8f69-4278-a61d-355d2e8ee787	ffdd2ccb-62cb-4d5a-adc7-4a6badf9c1d9	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:49:11.040747	0	0	172.31.71.162	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1	\N
5a4a3b35-a416-4e6b-b8a9-710daede0b8e	0f71578f-6c85-437f-93ab-11461d913d59	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:50:45.894463	0	0	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
9946fb4c-39f6-4eb7-ae7e-987162d175d5	a0807e89-10f8-421d-a0ca-3b15b1b1db96	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:53:04.389216	5	1	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
85d6b39c-7a9f-45dd-8120-0a46932cef34	c2e17d60-c492-4760-9a30-4f0db59c5a4b	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 01:55:26.499062	0	0	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
ed34595a-a260-4c47-a005-46a06a4abfa1	7672b16c-fb34-4eb0-a031-f1d75a708f11	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 02:06:42.05074	0	0	172.31.71.162	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1	\N
580062fc-3a72-453f-baeb-2abf22b8e2c4	741835f7-22b3-4a69-b731-9c886240cdfd	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 02:07:42.034341	0	0	172.31.71.162	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1	\N
379d57a4-77e5-40a4-bb6c-3b049e5cf5bd	a81c8bd1-2a6a-46c9-b7c6-fce821df5abc	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 02:08:04.783238	0	0	172.31.71.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
186b53a1-1143-4bee-af1b-d2f1cfbc972a	c1a50145-641f-4002-9b94-2f9d81857dd6	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 07:14:50.078957	0	0	172.31.64.130	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1	\N
6802da0b-6403-4c7a-8897-921a3535f55f	fa2b6553-5142-4442-b160-bca767bf20c9	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-07 04:03:01.941673	22	4	172.31.116.194	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1	\N
67da37e7-aca9-4c39-939c-f05fda092e7b	e021df1b-287d-4e2c-9ee5-7cc6f4a74b07	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-07 04:10:42.411391	0	0	172.31.116.194	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1	\N
2a60fd3a-4c0e-4522-9905-023b56291424	aa92accb-1602-4604-a975-a38dfbd38189	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-07 04:13:38.094179	0	0	172.31.103.66	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1	\N
d9d53589-ba39-4197-8c4e-f842c0b18dec	215ff335-0c61-4c8b-9d21-7469fe1106b0	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-09 09:04:10.401709	18	8	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
381e40b4-6448-4846-bf47-2a60e10bd9c0	c5b3958b-f0ef-4ffc-acea-b4eb26f581c7	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-09 05:14:22.163825	0	0	172.31.76.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
70aa8cce-c553-48aa-a424-42ec2848a737	f4acea86-c9bb-4d32-83d8-3cce9230d204	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-09 08:13:50.533209	0	0	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
de4b57a1-6eed-4d02-9d3b-50da042c910c	ef8fd644-e129-4d74-bbf1-d091cd24a43f	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-09 08:27:33.615099	0	0	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
0925afc1-ea18-4dbb-8a92-6afede358164	5ddfb9d8-5e91-458b-bc8e-3daecadcee5f	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-09 09:12:20.328325	5	5	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
11bab18d-8353-44a5-bb81-7ac20b3011b6	1d20a421-9a04-4107-863f-29501e1b6b55	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-09 09:11:15.14438	2	5	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
9d9c042a-876e-4066-9b4a-8f919d267e8f	f5ca7cac-2131-4d30-9c8e-7c1823065ec3	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-09 09:22:25.454982	5	5	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
9c2e2504-bc87-4631-90b1-ac9927f8e492	e39c24e0-d7e5-43b3-84c4-7f56d0aee27f	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-09 09:24:04.708179	0	0	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
434c282f-ef90-40a2-957f-d2779abb26f0	208158ab-c13c-40ff-b74d-d8605abec0ca	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-09 09:24:37.790847	0	0	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
6002442d-5f90-47be-bc69-2c1da74f3877	9c4a431d-ee90-41a8-9f57-67b68e0981de	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-09 09:30:46.902054	0	0	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
fb2fa935-85c0-4e2e-8f96-54e8ac5ec9cc	11dcd76e-be3b-41b7-9aad-f2023b6b7382	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-09 09:31:20.820599	5	4	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
965f81fe-983b-4f59-9408-88a8b6604e37	b9153611-5f10-4bd6-87b8-56c6bd60be36	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-09 09:36:08.603549	111	94	172.31.94.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_users (id, email, password, role, company_tag, is_active, created_at) FROM stdin;
2ae0f018-58e8-4874-94b6-d0c07c996189	admin@tasksafe.com	$2b$12$2nm7As6e8rdexYUqovjE6e7kR2ybBd1/bL/DjPOj9Cbfr8T.md6sO	SUPER_ADMIN	\N	t	2025-09-09 04:20:32.561696
44cd0103-b2db-4966-9b2d-f4c7e917f8e1	admin@tasksafe.au	$2b$12$My93IZ/QsyV3csG02HfudOsH8Of4c81wkUoIkqIvZgmMxtZUIFV0m	SUPER_ADMIN	\N	t	2025-09-09 06:02:21.733857
\.


--
-- Data for Name: company_tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_tags (id, name, description, is_active, created_at) FROM stdin;
1ad86a6b-c970-4e7a-b74a-4ab23f4bb87f	ABC Company		t	2025-09-09 04:54:20.967703
\.


--
-- Data for Name: magic_links; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.magic_links (id, token, email, video_id, expires_at, is_used, created_at) FROM stdin;
5efa4abf-de86-46d9-9469-36f18b1e9622	1b03113a29ad716ae445c75040b05aa457bed4d89bccf569c4939510d4ffffba	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-05 22:56:18.162	f	2025-09-04 22:56:18.237015
03a4c3e7-5768-4c5f-ae40-41083e27c491	faa520b0f99c443de071e327cd42706305b33d1a40c2d4472d5c461c740bbf8f	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 00:03:56.206	t	2025-09-05 00:03:56.278074
0048c9a3-18b7-4c98-83c4-638e297b86fd	977441e420015f08d4037c113038ed6338d5746afdd9080d55e8cd5a245c0cb0	matt@affirmer.com.au	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:24:43.389	f	2025-09-05 01:24:43.461787
38762110-83b8-4660-923b-a09eccfd7732	8adefcf9c55ce86c188e1b4b8df0a167894dfc2ac2aa6a617448e4d997476df4	matt@affirmer.com.au	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:26:22.758	f	2025-09-05 01:26:22.830109
6e8b830d-902d-4dd3-a0b7-a2fcbb3b517a	b11e93e50c6259f3717a19350a07f996efb36378215f7cf5fbf5b1c16ec31279	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:27:48.531	f	2025-09-05 01:27:48.603763
600da643-acf3-4c1a-b8da-70bda65c6202	5a964c5beca13d2c97c377e6d3f69e2a5c4f322a837d4c63217f2d0d72c96c00	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:28:32.34	f	2025-09-05 01:28:32.412499
df773e15-639c-4ed7-b704-e28d7d17ea87	06b05b3c832567d003f5e82858a7a2d0c7ef7db87a9ce1588708bf1b51008136	matt@affirmer.com.au	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:28:40.666	f	2025-09-05 01:28:40.738403
e668a88c-6c7e-4116-b75f-33f1d81f112b	885de566e2a6315f8836a4dd4e1259d467fc2d1eac692ae21e207efc6a82e590	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:29:06.055	f	2025-09-05 01:29:06.127556
a33e3405-2de8-4f38-a4b3-f165566c4181	c2a84872a18e562c0fd960aabe99d9b480b3ee98a7206c6b379fe24a60e6c6a8	matt@affirmer.com.au	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:29:46.913	t	2025-09-05 01:29:46.986104
4886f982-56f7-497a-aa4a-9bd3d7358c00	3c6fad079eda08473f40795e60efdeed428e05b8e76e6d0ab3debf1b7ece4446	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:36:04.815	f	2025-09-05 01:36:04.886961
a9c75587-ac4f-4a00-aaa4-5eb8cc49e6d3	a5b1bb8964dc6c1a0fb845146d9864d5336848661194313f064cda83b43f5578	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:36:34.791	t	2025-09-05 01:36:34.863618
011c4a64-8217-4a5e-a39f-22fc14b6b9cb	581cd8abdcaf160815959dd9d1e7db2e89f0f0d3acc49733f93325c76f2d67e2	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:46:24.73	t	2025-09-05 01:46:24.803289
ffdd2ccb-62cb-4d5a-adc7-4a6badf9c1d9	e53877bc11227d029f2b495e4b01b347b09c3d993849740e219bdba8c6c659d5	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:48:32.519	t	2025-09-05 01:48:32.592477
0f71578f-6c85-437f-93ab-11461d913d59	1fb27f03ce8d880cbd957709aa3064fcaba8b56673937bceae0a8062ea4d3c69	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:50:28.35	t	2025-09-05 01:50:28.423313
a0807e89-10f8-421d-a0ca-3b15b1b1db96	90a1f2595be34d9ac604edcfc526629d5b69959cb8ba054202e131753522e979	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:52:49.951	t	2025-09-05 01:52:50.023106
c2e17d60-c492-4760-9a30-4f0db59c5a4b	6e2a7004acef86b1ba6bed8493edd13ab818e51dc0c43ee3d04c3cbb898e5d12	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 01:55:11.642	t	2025-09-05 01:55:11.714381
7672b16c-fb34-4eb0-a031-f1d75a708f11	7b0d9420dbb6007cef1d78d06e447d2f21f26ac87dd7139df05bd85a2522dabf	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 02:06:15.327	t	2025-09-05 02:06:15.400329
741835f7-22b3-4a69-b731-9c886240cdfd	c57d12b60fe9910ce62b82a115a34cf3b94c3216ec6781c5627f7fd13629151d	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 02:07:17.616	t	2025-09-05 02:07:17.687577
a81c8bd1-2a6a-46c9-b7c6-fce821df5abc	bf3330e48f63020607e397ba837b5cef54b81f8106f537948df1472248a755f4	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-06 02:07:45.27	t	2025-09-05 02:07:45.341555
c1a50145-641f-4002-9b94-2f9d81857dd6	fc7e901bee7f3d583783c9eaa7058b2590ed16e632a8b795896d4a420466e6a9	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-07 07:14:35.092	t	2025-09-06 07:14:35.159786
fa2b6553-5142-4442-b160-bca767bf20c9	197f3074e9cf46c8dfdf2be0623216994e8f3ffac8a43e5ffd9cbbd2e78465b2	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-08 04:02:39.656	t	2025-09-07 04:02:39.725393
e021df1b-287d-4e2c-9ee5-7cc6f4a74b07	386830ba0e670d22ac13fd854e7aa92a4746b6ea5786675065a710716c5cdba9	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-08 04:10:26.566	t	2025-09-07 04:10:26.634124
aa92accb-1602-4604-a975-a38dfbd38189	5d494749003937f2bacc41d3b6a082a9d3e5311faf221b09f26230950fb6941a	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-08 04:12:33.506	t	2025-09-07 04:12:33.569299
f9559a8f-4ffd-4e6c-b73f-2fcf24ff587f	fe324db2dab796e84bb9ee08d6e58e82f87328bc3b25fab063d71f127c5711ab	mglynch20@hotmail.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-08 22:35:27.545	t	2025-09-07 22:35:27.609801
812ff4e8-71db-4e3f-8897-4650c41cd0d3	bd5ed99ed38b4b51a5e7dade155a38bd83e5c1a6ec04838bd66b2cec7aaf1698	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-10 03:26:47.311	t	2025-09-09 03:26:47.380662
5ae2cc28-4309-4854-aebc-68746e5f415b	c8766e73d8f8388cdeb296342020f69fe1751df3e33259df31e18694adb3885f	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-10 05:03:26.529	f	2025-09-09 05:03:26.59782
c5b3958b-f0ef-4ffc-acea-b4eb26f581c7	62fe527ff8e9a6a66c113f60c8292a032566ede3dedf49d31366fe863df2c2d3	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-10 05:13:58.961	t	2025-09-09 05:13:59.030346
f4acea86-c9bb-4d32-83d8-3cce9230d204	fabe2073f61bbd68972ce53574c68bd21da6cbace71a1bb1b4f312e28338c53f	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-10 08:13:34.966	t	2025-09-09 08:13:35.029363
e8ed8ce3-8d9d-4f0d-b418-ae3e34431ba1	28dc42cb5b2e9a6be411e9d65ef0ec6dcf10c64bf59f0a4de170ae8fe33690b3	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-10 08:15:25.711	f	2025-09-09 08:15:25.774772
ef8fd644-e129-4d74-bbf1-d091cd24a43f	63c3315f1134a0e1a887a4a79b1f6dde868bee61f8d6643913a81b795ec56957	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-10 08:27:20.52	t	2025-09-09 08:27:20.588151
215ff335-0c61-4c8b-9d21-7469fe1106b0	68251490d6a733a1ac7c4457458dd5a083f2544417dd4759aca63f9ad7f5c0aa	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-10 09:03:56.02	t	2025-09-09 09:03:56.088036
1d20a421-9a04-4107-863f-29501e1b6b55	b782a130892bea0a1db4eec8603979c2f3bfd545f0457ae450f4cdf0718f12b6	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-10 09:11:05.495	t	2025-09-09 09:11:05.558823
5ddfb9d8-5e91-458b-bc8e-3daecadcee5f	cf69bdecb71ad0f29366b2b51325c164449c8e77cf92146fb904bde8812d1c0e	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-10 09:12:07.709	t	2025-09-09 09:12:07.772115
f5ca7cac-2131-4d30-9c8e-7c1823065ec3	fa1354d71a43cc586f0ec69b687aa4a965d8414f5790aeb576263427c5fe4097	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-10 09:22:14.181	t	2025-09-09 09:22:14.250166
e39c24e0-d7e5-43b3-84c4-7f56d0aee27f	0c5d2b294188dd1281d1bb4d06c61a5e60ba51cd17f3765ca6831120011613e2	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-10 09:23:47.6	t	2025-09-09 09:23:47.662467
208158ab-c13c-40ff-b74d-d8605abec0ca	f82954ca1bf436b2d7d962b9c30e95403e269d4f2681926460bac99689d9d990	mattlynch@outlook.com	05bd4933-c7b6-4abf-837c-cb0fb1c43f08	2025-09-10 09:24:23.793	t	2025-09-09 09:24:23.856563
9c4a431d-ee90-41a8-9f57-67b68e0981de	7aa8a2fe39a1bc094a689077b4b963c5daeb2464ac0bd8451bfc0f6e0b867d22	mattlynch@outlook.com	d28c6c0f-1fb9-4bb7-ac0f-28e463046068	2025-09-10 09:30:33.663	t	2025-09-09 09:30:33.72818
11dcd76e-be3b-41b7-9aad-f2023b6b7382	b9cd6ca7a338044ec14e7df6bbeb5b507dfb08ad9c709daa6e701b5e0f8d1e22	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-10 09:31:06.363	t	2025-09-09 09:31:06.430816
b9153611-5f10-4bd6-87b8-56c6bd60be36	2a2127c8cdbe8fd558db87803f46ab030a8b528b526de75ae4c2610bcee24a0e	mattlynch@outlook.com	0f7e5417-33c0-4764-a8fb-4a49a193861c	2025-09-10 09:35:52.551	t	2025-09-09 09:35:52.625323
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.videos (id, title, description, thumbnail_url, video_url, duration, category, is_active, created_at, company_tag) FROM stdin;
d28c6c0f-1fb9-4bb7-ac0f-28e463046068	Workplace Safety Training - Module 3	Essential safety protocols and emergency procedures for manufacturing environments. This module covers personal protective equipment, hazard identification, and incident reporting.	https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=450	https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4	12:34	Safety Training	t	2025-09-04 22:54:51.538745	\N
0f7e5417-33c0-4764-a8fb-4a49a193861c	Safe Use of Aircraft Wheel Chocks and Safety Cones	This video demonstrates the safe use of aircraft wheel chocks and safety cones.	https://affirmer.com.au/wp-content/uploads/2025/01/airport.jpg	https://youtu.be/ciGTcuCz4do	1:54	Safety Training	t	2025-09-09 08:13:13.720742	ABC Company
05bd4933-c7b6-4abf-837c-cb0fb1c43f08	YouTube Test Video - Safety Training	Test video to verify YouTube completion tracking works properly	https://affirmer.com.au/wp-content/uploads/2024/12/vlcsnap-2023-09-30-09h23m35s105.jpg	https://youtu.be/iTp36v4bK8M	3:32	Safety Training	t	2025-09-09 08:59:16.133109	\N
72c4e2e7-f080-43a2-b27c-3e1f2086f1db	Employee Onboarding Safety Training	A comprehensive safety training video for all new employees	https://via.placeholder.com/320x180	https://www.youtube.com/watch?v=dQw4w9WgXcQ	15:30	Safety	t	2025-09-09 09:55:05.335307	\N
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: access_logs access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_unique UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: company_tags company_tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_tags
    ADD CONSTRAINT company_tags_name_unique UNIQUE (name);


--
-- Name: company_tags company_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_tags
    ADD CONSTRAINT company_tags_pkey PRIMARY KEY (id);


--
-- Name: magic_links magic_links_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.magic_links
    ADD CONSTRAINT magic_links_pkey PRIMARY KEY (id);


--
-- Name: magic_links magic_links_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.magic_links
    ADD CONSTRAINT magic_links_token_unique UNIQUE (token);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: access_logs access_logs_magic_link_id_magic_links_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_magic_link_id_magic_links_id_fk FOREIGN KEY (magic_link_id) REFERENCES public.magic_links(id);


--
-- Name: access_logs access_logs_video_id_videos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_video_id_videos_id_fk FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- Name: magic_links magic_links_video_id_videos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.magic_links
    ADD CONSTRAINT magic_links_video_id_videos_id_fk FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--


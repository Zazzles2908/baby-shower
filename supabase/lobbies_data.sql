SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict hIQoQBtJTcbxgnCP2JKHlm6yB2IXnRs9p3KT1s3n3672QjIuR6qGey4S3DgZ1Fs

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: advice; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."advice" ("id", "advice_giver", "advice_text", "delivery_option", "is_approved", "ai_generated", "submitted_by", "created_at") VALUES
	(22, 'TestAdvisor', '', 'immediate', false, false, 'TestAdvisor', '2026-01-01 08:31:22.471772+00'),
	(29, 'Wise One', '', 'immediate', false, false, 'Wise One', '2026-01-01 08:34:01.51264+00'),
	(33, 'Michelle Ajireen', '', 'immediate', false, false, 'Michelle Ajireen', '2026-01-01 09:34:34.575705+00'),
	(47, 'Test Advisor', '', 'immediate', false, false, 'Test Advisor', '2026-01-02 00:09:10.83301+00'),
	(52, 'Jennifer Martinez', '', 'immediate', false, false, 'Jennifer Martinez', '2026-01-02 00:24:58.222799+00'),
	(69, 'Anonymous Advisor', 'Get plenty of rest when you can', 'immediate', false, false, 'Anonymous Advisor', '2026-01-02 02:57:16.067462+00'),
	(75, 'Anonymous Advisor', 'Test from production', 'immediate', false, false, 'Anonymous Advisor', '2026-01-02 03:11:25.589211+00'),
	(85, 'Anonymous Advisor', 'Trust your instincts - you know your baby best', 'immediate', false, false, 'Anonymous Advisor', '2026-01-02 04:57:09.392583+00'),
	(86, 'Anonymous Advisor', 'May you grow up to be kind and curious', 'immediate', false, false, 'Anonymous Advisor', '2026-01-02 04:57:21.03371+00'),
	(95, 'Anonymous Advisor', 'Test advice message for parents', 'immediate', false, false, 'Anonymous Advisor', '2026-01-02 05:53:21.610135+00'),
	(97, 'Test Advisor', 'This is a test advice message about baby care', 'fun', false, false, 'API Test', '2026-01-04 07:15:25.060616+00'),
	(98, 'Test Advisor', 'Test advice message', 'general', false, false, NULL, '2026-01-04 13:56:28.065125+00'),
	(99, 'Test Advisor', 'Test advice message', 'general', false, false, NULL, '2026-01-04 13:57:54.25131+00'),
	(100, 'Test Advisor', 'Test advice message', 'general', false, false, NULL, '2026-01-04 13:58:24.165723+00'),
	(101, 'Test Guest', 'Enjoy every moment! They grow up so fast.', 'general', false, false, NULL, '2026-01-04 23:09:34.917821+00'),
	(102, 'Test Guest', 'Enjoy every moment! They grow up so fast.', 'general', false, false, NULL, '2026-01-04 23:09:53.491854+00'),
	(103, 'Test Guest', 'Baby, you are going to change the world!', 'fun', false, false, NULL, '2026-01-04 23:10:02.449776+00'),
	(104, 'Final Verification', 'This confirms the fix is working correctly!', 'general', false, false, NULL, '2026-01-04 23:10:59.355699+00'),
	(105, 'Test User', 'Test advice message', 'general', false, false, NULL, '2026-01-04 23:56:06.309751+00'),
	(106, 'E2E Advice Giver', 'Sleep when the baby sleeps! Trust me, you''ll thank me later. This is the best advice I can give to new parents.', 'general', false, false, NULL, '2026-01-05 00:09:43.648816+00'),
	(107, 'E2E Baby Advisor', 'Welcome to the world, little one! May your days be filled with love, laughter, and plenty of naps.', 'fun', false, false, NULL, '2026-01-05 00:09:56.45006+00'),
	(108, 'Health Check Advisor', 'Trust your instincts! You know your baby better than anyone.', 'general', false, false, NULL, '2026-01-05 00:40:31.304417+00'),
	(109, 'Final Advice Check', 'Trust your instincts!', 'general', false, false, NULL, '2026-01-05 00:58:49.91463+00'),
	(110, 'Final Advice Tester', 'Take care of yourself too!', 'general', false, false, NULL, '2026-01-05 10:13:58.442078+00'),
	(111, 'Jazz', 'hi  hi', 'fun', false, false, NULL, '2026-01-05 10:16:55.262484+00'),
	(112, 'Final Advice Test', 'Testing the advice function after fixes!', 'general', false, false, NULL, '2026-01-05 10:26:30.75816+00'),
	(113, 'Jazeel A', 'hi hi', 'general', false, false, NULL, '2026-01-05 14:43:39.524+00'),
	(114, 'Jazeel A', 'testing', 'fun', false, false, NULL, '2026-01-05 21:01:06.803699+00');


--
-- Data for Name: game_sessions; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."game_sessions" ("id", "session_code", "status", "mom_name", "dad_name", "admin_code", "total_rounds", "current_round", "created_at", "started_at", "completed_at", "created_by") VALUES
	('4bc95572-19a7-4de6-bd85-9da125470ba4', 'TESTME', 'voting', 'Emma', 'Oliver', '1234', 3, 0, '2026-01-03 07:50:20.750546+00', NULL, NULL, NULL),
	('b50675da-bd1f-479b-8432-dd148bdb0da3', 'WWDVDS', 'setup', 'Test Mom', 'Test Dad', '7677', 3, 0, '2026-01-03 10:19:24.019808+00', NULL, NULL, NULL),
	('e030ec8c-c3cd-49ac-b07a-83611ece2910', '7NKQ5W', 'setup', 'Test Mom', 'Test Dad', '9979', 3, 0, '2026-01-03 10:23:32.157625+00', NULL, NULL, NULL),
	('2a86a56a-daf6-4746-bbd1-78774cc490b5', 'DTD6B7', 'setup', 'Test Mom', 'Test Dad', '1637', 3, 0, '2026-01-03 10:24:24.835287+00', NULL, NULL, NULL),
	('789874b0-fc82-4a8b-ac15-98fe9fddd23d', 'EFD9FQ', 'setup', 'Test Mom', 'Test Dad', '5850', 3, 0, '2026-01-03 10:28:44.467988+00', NULL, NULL, NULL),
	('6e6f3b3b-b1e1-4709-af0b-ca846b0d7d59', 'Z2K5M3', 'setup', 'Test Mom', 'Test Dad', '5281', 3, 0, '2026-01-03 10:30:38.724712+00', NULL, NULL, NULL),
	('729ae212-5ddf-4333-83f3-03103a30d368', 'XCWFHJ', 'voting', 'Emma', 'Oliver', '1438', 3, 0, '2026-01-03 10:04:14.834885+00', NULL, NULL, NULL),
	('5083a942-5eeb-4a7a-917e-1f930217146a', '22AC6G', 'revealed', 'Test Mom', 'Test Dad', '4319', 3, 1, '2026-01-03 10:46:47.95288+00', NULL, NULL, NULL),
	('c2922ff2-7e80-4641-aeab-e04dad41db68', '6HD9QA', 'voting', 'Test Mom', 'Test Dad', '8308', 5, 0, '2026-01-03 12:41:21.561743+00', NULL, NULL, NULL),
	('2b131d31-7a20-4df2-9604-aef84a4b7a89', 'UBMJNS', 'setup', 'TestMom', 'TestDad', '7624', 3, 0, '2026-01-03 12:47:29.890533+00', NULL, NULL, NULL),
	('aa1b62c3-be1c-468b-b119-f57af649bb6a', 'QQQGWT', 'revealed', 'Sarah', 'Mike', '8673', 5, 1, '2026-01-03 12:57:35.489339+00', NULL, NULL, NULL),
	('5909ca8b-52b7-41bb-81a6-556269624201', '998ESN', 'setup', 'Test', 'User', '6318', 3, 0, '2026-01-03 12:59:26.798713+00', NULL, NULL, NULL),
	('d6aca382-7e9a-4853-a85a-2eef503e011e', 'UYT3FA', 'revealed', 'Test Mom', 'Test Dad', '8461', 3, 1, '2026-01-03 13:26:16.098188+00', NULL, NULL, NULL),
	('71204a1b-5108-402c-acfb-cf749ffe3f25', 'TEST12', 'setup', 'Mom Test', 'Dad Test', '1234', 5, 0, '2026-01-04 07:15:38.055949+00', NULL, NULL, 'API Test'),
	('3ef4e76e-ceef-4bdb-8e54-c5743915c3b7', 'TEST01', 'setup', 'Test Mom', 'Test Dad', '1234', 5, 0, '2026-01-05 00:57:18.60803+00', NULL, NULL, NULL),
	('94563671-c592-4335-bc88-48064499f77a', 'N9DXH3', 'setup', 'FinalTest', 'Partner', '8562', 5, 0, '2026-01-05 00:57:43.712721+00', NULL, NULL, NULL),
	('b4c204de-20bf-4596-8ba2-2234f4bad0f6', '7TMFS6', 'setup', 'FinalTest', 'Partner', '9966', 5, 0, '2026-01-05 00:58:52.846958+00', NULL, NULL, NULL),
	('227b7db1-389d-4510-b760-54c66d72bc73', 'YCKSQM', 'setup', 'TestMom', 'TestDad', '5463', 5, 0, '2026-01-05 10:01:06.049009+00', NULL, NULL, NULL),
	('0ee12801-5a48-4759-a262-9af98861da04', 'BHK425', 'setup', 'Michelle', 'Huang', '3269', 5, 0, '2026-01-05 10:09:36.615888+00', NULL, NULL, NULL);


--
-- Data for Name: game_scenarios; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."game_scenarios" ("id", "session_id", "round_number", "scenario_text", "mom_option", "dad_option", "ai_provider", "intensity", "theme_tags", "is_active", "created_at", "used_at") VALUES
	('b107494f-4e6e-4bce-a5f3-7b144b417087', '4bc95572-19a7-4de6-bd85-9da125470ba4', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would gently clean it up while singing a lullaby', 'Oliver would make a dramatic production of it while holding their breath', 'z_ai', 0.60, '{}', true, '2026-01-03 07:50:49.751426+00', NULL),
	('e13ee0f9-5b80-44c0-af65-24845a8f0acf', '729ae212-5ddf-4333-83f3-03103a30d368', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would handle it with grace', 'Oliver would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:13:18.94394+00', NULL),
	('2e430f68-8df6-47d9-b59c-32cfbda892f2', 'b50675da-bd1f-479b-8432-dd148bdb0da3', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would handle it with grace', 'Oliver would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:19:39.976066+00', NULL),
	('7dae61c2-0bca-4f54-9fb9-6cf789de5e20', 'e030ec8c-c3cd-49ac-b07a-83611ece2910', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would handle it with grace', 'Oliver would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:23:47.961336+00', NULL),
	('d803f7ef-6711-4010-a712-5de5fa80aa8f', '2a86a56a-daf6-4746-bbd1-78774cc490b5', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would handle it with grace', 'Oliver would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:24:41.081257+00', NULL),
	('4787e295-3116-49c0-b569-a62a97b40781', '789874b0-fc82-4a8b-ac15-98fe9fddd23d', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would handle it with grace', 'Oliver would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:29:00.250972+00', NULL),
	('d5a1b1c0-296b-4239-aa78-d0b97643e123', '6e6f3b3b-b1e1-4709-af0b-ca846b0d7d59', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Emma would handle it with grace', 'Oliver would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:30:55.612458+00', NULL),
	('78e5c475-3bb6-4d64-a8e2-4a6dc6ae26bb', '5083a942-5eeb-4a7a-917e-1f930217146a', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Test Mom would handle it with grace', 'Test Dad would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 10:47:04.229076+00', NULL),
	('b3b02cf3-1164-42d1-9486-c31012149e74', 'c2922ff2-7e80-4641-aeab-e04dad41db68', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Test Mom would handle it with grace', 'Test Dad would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 12:42:54.202632+00', NULL),
	('ed32fbd0-e49d-4584-a148-42c155076443', 'aa1b62c3-be1c-468b-b119-f57af649bb6a', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Sarah would handle it with grace', 'Mike would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 12:57:51.525507+00', NULL),
	('66ecdad3-1b72-4155-841c-4312c1b86bc8', 'd6aca382-7e9a-4853-a85a-2eef503e011e', 1, 'It''s 3 AM and the baby has a dirty diaper that requires immediate attention.', 'Test Mom would handle it with grace', 'Test Dad would figure it out', 'z_ai', 0.50, '{}', true, '2026-01-03 13:26:32.904962+00', NULL);


--
-- Data for Name: game_answers; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."game_answers" ("id", "scenario_id", "mom_answer", "dad_answer", "mom_locked", "mom_locked_at", "dad_locked", "dad_locked_at", "final_answer", "created_at", "all_locked_at") VALUES
	('6cc18bcd-43dc-4fa4-bdaf-432472e928a3', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 'dad', 'dad', true, NULL, true, NULL, NULL, '2026-01-03 07:51:16.175151+00', NULL),
	('5c399018-9004-45b3-b09a-fa262355590c', '78e5c475-3bb6-4d64-a8e2-4a6dc6ae26bb', 'mom', 'dad', true, NULL, true, NULL, NULL, '2026-01-03 10:47:34.143573+00', NULL),
	('7751516f-ba30-467e-b211-2765d8f83a2b', 'ed32fbd0-e49d-4584-a148-42c155076443', 'dad', 'dad', true, NULL, true, NULL, NULL, '2026-01-03 12:58:35.104237+00', NULL),
	('6af5d223-6a4f-43db-85b7-7ff93d3dded1', '66ecdad3-1b72-4155-841c-4312c1b86bc8', 'mom', 'dad', true, NULL, true, NULL, NULL, '2026-01-03 13:27:03.197007+00', NULL);


--
-- Data for Name: game_results; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."game_results" ("id", "scenario_id", "mom_votes", "dad_votes", "crowd_choice", "actual_choice", "perception_gap", "roast_commentary", "roast_provider", "roast_model", "particle_effect", "revealed_at", "created_at") VALUES
	('2dcb1d0d-f5c1-43b6-8c73-1eb61c6ea96c', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 3, 2, 'mom', 'dad', 20.00, '😅 Oops! 60% were SO wrong about dad! The crowd was absolutely certain about mom, but dad proved everyone wrong!', 'moonshot', NULL, 'confetti', NULL, '2026-01-03 07:51:16.175151+00'),
	('b6f69bc2-e6e4-4818-943f-9747107168cd', '78e5c475-3bb6-4d64-a8e2-4a6dc6ae26bb', 1, 2, 'dad', 'mom', 34.00, '🤔 Hmm, 67% picked wrong! Test Mom had other plans!', 'minimax', 'MiniMax-M2.1', 'confetti', '2026-01-03 10:47:49.608105+00', '2026-01-03 10:47:49.608105+00'),
	('7958c2a4-f532-48ae-8237-b5b62be1cae3', 'ed32fbd0-e49d-4584-a148-42c155076443', 1, 0, 'mom', 'dad', 100.00, '😅 Oops! 100% were SO wrong about Mike! The crowd was absolutely certain!', 'minimax', 'MiniMax-M2.1', 'rainbow', '2026-01-03 12:58:49.480691+00', '2026-01-03 12:58:49.480691+00'),
	('72799fd3-0f43-480f-bc87-0ce6b9844cb6', '66ecdad3-1b72-4155-841c-4312c1b86bc8', 1, 2, 'dad', 'mom', 34.00, '🤔 Hmm, 67% picked wrong! Test Mom had other plans!', 'minimax', 'MiniMax-M2.1', 'confetti', '2026-01-03 13:27:19.092156+00', '2026-01-03 13:27:19.092156+00');


--
-- Data for Name: game_votes; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."game_votes" ("id", "scenario_id", "guest_name", "guest_id", "vote_choice", "voted_at") VALUES
	('3d0b52e1-ddba-4801-9d61-6b806eeebd77', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 'Alice', NULL, 'mom', '2026-01-03 07:51:01.19235+00'),
	('b98bf2df-a3e6-4b55-8369-a5a4e7f1539f', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 'Bob', NULL, 'dad', '2026-01-03 07:51:01.19235+00'),
	('58e3a610-7a82-4246-936e-ad1e042a7497', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 'Carol', NULL, 'mom', '2026-01-03 07:51:01.19235+00'),
	('0482cc1a-1847-462a-98ce-da5058ad22ac', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 'Dave', NULL, 'mom', '2026-01-03 07:51:01.19235+00'),
	('8060e1fb-50ce-4cca-8765-9a2457301846', 'b107494f-4e6e-4bce-a5f3-7b144b417087', 'Eve', NULL, 'dad', '2026-01-03 07:51:01.19235+00'),
	('e9f85119-39f2-4a03-b9a4-dd78c8132165', '78e5c475-3bb6-4d64-a8e2-4a6dc6ae26bb', 'Guest 2', NULL, 'dad', '2026-01-03 10:47:17.708898+00'),
	('fc2af9df-e8d6-4974-a060-0cc61ad58753', '78e5c475-3bb6-4d64-a8e2-4a6dc6ae26bb', 'Guest 3', NULL, 'mom', '2026-01-03 10:47:20.820704+00'),
	('41eb464f-ab7c-42b1-a57a-557afd7d9e02', '78e5c475-3bb6-4d64-a8e2-4a6dc6ae26bb', 'Guest 1', NULL, 'dad', '2026-01-03 10:47:14.594072+00'),
	('9edd193a-0a53-4b17-9a68-e86658a243e9', 'b3b02cf3-1164-42d1-9486-c31012149e74', 'Test Guest', NULL, 'mom', '2026-01-03 12:43:40.190027+00'),
	('2f7d939c-4298-47ac-b45d-b7c16f0963a4', 'ed32fbd0-e49d-4584-a148-42c155076443', 'Test Guest', NULL, 'mom', '2026-01-03 12:58:32.164409+00'),
	('ef8ffe03-91d1-408f-9549-b6e2c3f97401', '66ecdad3-1b72-4155-841c-4312c1b86bc8', 'Guest 2', NULL, 'dad', '2026-01-03 13:26:46.367269+00'),
	('0960d301-8710-46b3-a4c0-33e2f493d25e', '66ecdad3-1b72-4155-841c-4312c1b86bc8', 'Guest 3', NULL, 'mom', '2026-01-03 13:26:49.511735+00'),
	('3313147c-fa09-48cb-acf6-7ef9e6f55936', '66ecdad3-1b72-4155-841c-4312c1b86bc8', 'Guest 1', NULL, 'dad', '2026-01-03 13:26:43.155558+00');


--
-- Data for Name: guestbook; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."guestbook" ("id", "guest_name", "relationship", "message", "submitted_by", "created_at") VALUES
	(104, 'Jazeel A', 'Family', 'Hello my daughter, i cant wait to meet you', 'Jazeel A', '2026-01-03 11:59:04.721104+00'),
	(106, 'Performance Test', 'test', 'Testing response times', 'Performance Test', '2026-01-03 12:59:22.326681+00'),
	(108, 'Kasuni', 'Auntie', 'Baby M we’re so excited to meet you and spoil you! We wish you all the best of listening to your dad’s rambling and your mum’s advice', 'Kasuni', '2026-01-04 01:37:58.069756+00'),
	(110, 'Mark and Johnny', 'Friend', 'Hey baby, how are you doing?

Oh hey, how you doing? Yeah, I’m very busy, what’s going on?

I just finished talking to my mom. She gave me this big lecture about Johnny.', 'Mark and Johnny', '2026-01-04 01:54:08.982325+00'),
	(112, 'Danny', 'Friend', 'Welcome to the world little one you are gonna be so lucky as you will be endlessly loved by your mum and dad and the rest of us', 'Danny', '2026-01-04 02:04:59.220955+00'),
	(114, 'Test User', 'friend', 'Great baby shower!', 'Test User', '2026-01-04 07:00:04.467895+00'),
	(116, 'Test', 'Friend', 'Test message', 'Test', '2026-01-04 10:30:29.013627+00'),
	(118, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:37:26.7207+00'),
	(119, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:37:42.478509+00'),
	(121, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:41:28.195793+00'),
	(124, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:51:54.865153+00'),
	(126, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:53:47.264739+00'),
	(128, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:55:49.328527+00'),
	(130, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:57:46.323494+00'),
	(131, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:58:20.340094+00'),
	(133, 'Final Test', 'Friend', 'Testing authorization', 'Final Test', '2026-01-04 22:10:57.249045+00'),
	(135, 'Final Test User', 'Friend', 'Testing the fixed Baby Shower app with proper /v1/ API URL! The Supabase client initialization is now working perfectly. Best wishes to the new parents!', 'Final Test User', '2026-01-04 22:31:32.117452+00'),
	(137, 'Final Test User', 'Friend', 'E2E Test - Guestbook - Final Test User - Mon Jan 05 2026 14:30:00', 'Final Test User', '2026-01-04 23:28:57.278036+00'),
	(139, 'Final Test User', 'Friend', 'Testing guestbook functionality at $(new Date().toISOString()). This is a comprehensive QA test to verify all systems are operational!', 'Final Test User', '2026-01-04 23:41:06.488845+00'),
	(141, 'Health Check Guest', 'Tester', 'System health check - January 5th, 2026', 'Health Check Guest', '2026-01-05 00:39:43.881245+00'),
	(142, 'jaz', 'Family', 'hi hi', 'jaz', '2026-01-05 00:40:21.929767+00'),
	(144, 'Michelle', 'Family', 'Hi', 'Michelle', '2026-01-05 00:52:28.871484+00'),
	(146, 'Jazeel A', 'Family', 'Hi hi', 'Jazeel A', '2026-01-05 09:11:54.650997+00'),
	(148, 'Jazeel A', 'Family', 'hihi', 'Jazeel A', '2026-01-05 14:42:07.141086+00'),
	(11, 'Jazeel A', 'other', '', 'Jazeel A', '2025-12-31 11:54:59.450909+00'),
	(12, 'API Test', 'Friend', 'Testing insert', 'API Test', '2026-01-01 08:24:08.428121+00'),
	(13, 'Jazeel', 'other', 'Welcome baby girl!', 'Jazeel', '2026-01-01 08:26:49.896941+00'),
	(14, 'Jazeel', 'other', 'Welcome baby girl!', 'Jazeel', '2026-01-01 08:27:35.167605+00'),
	(15, 'Test2', 'other', 'Another test!', 'Test2', '2026-01-01 08:27:56.36257+00'),
	(16, 'Jazeel', 'other', 'Test #3', 'Jazeel', '2026-01-01 08:29:01.365063+00'),
	(18, 'TestUser', 'other', 'Testing guestbook endpoint', 'TestUser', '2026-01-01 08:30:01.336912+00'),
	(20, 'FinalTest', 'other', 'Testing all endpoints!', 'FinalTest', '2026-01-01 08:31:19.860266+00'),
	(25, 'API Test User', 'other', 'Testing guestbook endpoint - all working well!', 'API Test User', '2026-01-01 08:33:31.296849+00'),
	(27, 'API Test User', 'other', 'Testing guestbook endpoint - all working well!', 'API Test User', '2026-01-01 08:34:01.478183+00'),
	(31, 'Michelle Huang', 'other', '"Tell me if you see this message and respond to me what the relationship is and the name that is noted in "Leave a Wish & Photo""', 'Michelle Huang', '2026-01-01 09:30:33.062796+00'),
	(36, 'Michelle Huang', 'other', 'hi how are you', 'Michelle Huang', '2026-01-01 10:07:45.657258+00'),
	(42, 'E2E Test User', 'other', 'This is an automated test from the AI agent.', 'E2E Test User', '2026-01-02 00:08:50.359696+00'),
	(48, 'Sarah Johnson', 'other', '', 'Sarah Johnson', '2026-01-02 00:22:21.093617+00'),
	(49, 'Sarah Johnson', 'other', 'Congratulations on your little miracle! Wishing you all the joy and love in the world. Can''t wait to meet the newest member of your family!', 'Sarah Johnson', '2026-01-02 00:24:18.403501+00'),
	(54, 'Test Trigger User', 'other', 'Testing trigger propagation to internal archive', 'Test Trigger User', '2026-01-02 00:26:12.034617+00'),
	(55, 'Sarah Johnson', 'other', '', 'Sarah Johnson', '2026-01-02 00:42:21.228043+00'),
	(58, 'Sarah Johnson', 'other', '', 'Sarah Johnson', '2026-01-02 01:29:42.518099+00'),
	(60, 'Test User Browser', 'other', '', 'Test User Browser', '2026-01-02 01:48:43.118719+00'),
	(62, 'Test User Phase 1', 'other', 'Testing trigger works', 'Test User Phase 1', '2026-01-02 02:24:05.118729+00'),
	(63, 'API Test User', 'other', 'Testing API via curl', 'API Test User', '2026-01-02 02:28:39.924343+00'),
	(64, 'Playwright Test', 'other', 'This is a test message from Playwright browser automation!', 'Playwright Test', '2026-01-02 02:32:37.271206+00'),
	(65, 'Test User', 'other', 'Hello from deployment test', 'Test User', '2026-01-02 02:49:07.091385+00'),
	(105, 'Test Guest', 'friend', 'Hello from test!', 'Test Guest', '2026-01-03 12:57:04.592635+00'),
	(71, 'ProdTest', 'other', 'Hello from production!', 'ProdTest', '2026-01-02 03:11:22.825067+00'),
	(77, 'FinalTest', 'other', 'Final guestbook test', 'FinalTest', '2026-01-02 04:35:18.436188+00'),
	(81, 'Test User E2E', 'other', 'Test message from E2E verification - everything works! 🎉', 'Test User E2E', '2026-01-02 04:46:57.752451+00'),
	(87, 'Michelle Huang', 'other', 'hi hi hi - Cant wait for the baby', 'Michelle Huang', '2026-01-02 04:58:38.374335+00'),
	(90, 'Sarah Johnson', 'other', 'Wishing you all the joy and happiness your little one will bring! What a wonderful celebration!', 'Sarah Johnson', '2026-01-02 05:13:47.8462+00'),
	(92, 'Emily Chen', 'other', 'Wishing you all the best with your little one!', 'Emily Chen', '2026-01-02 05:39:59.102948+00'),
	(93, 'Emily Chen', 'other', 'Testing guestbook - This is a test message for the baby shower event!', 'Emily Chen', '2026-01-02 05:45:29.273241+00'),
	(97, 'Emily Chen', 'other', 'Wishing you all the best for the new baby! Love this app!', 'Emily Chen', '2026-01-02 05:58:51.541216+00'),
	(98, 'The', 'other', 'Y', 'The', '2026-01-02 07:09:36.038166+00'),
	(99, 'The', 'other', 'Helloooo', 'The', '2026-01-02 07:27:44.769298+00'),
	(101, 'Jazeel_Test', 'other', 'Your daughter is going to be really beautiful and hope the very best for both of you
Love Jazeel', 'Jazeel_Test', '2026-01-02 14:06:36.616288+00'),
	(1, 'QA Test User', 'Friend', 'Wishing you all the best with your new baby girl! - QA Test Verification', 'QA Test User', '2026-01-02 22:21:08.462615+00'),
	(2, 'Michelle Huang', 'Friend', 'Hi', 'Michelle Huang', '2026-01-03 04:42:30.852477+00'),
	(107, 'Jazeel A', 'Family', 'hih hi', 'Jazeel A', '2026-01-03 19:40:49.529973+00'),
	(109, 'Miran', 'Friend', 'Hello baby! Wishing you a happy and safe arrival. Looking forward to meeting you!', 'Miran', '2026-01-04 01:48:25.712364+00'),
	(111, 'Mark and Johnny', 'Friend', 'Hey baby, how are you doing?

Oh hey, how you doing? Yeah, I’m very busy, what’s going on?

I just finished talking to my mom. She gave me this big lecture about Johnny.', 'Mark and Johnny', '2026-01-04 01:54:50.108219+00'),
	(113, 'Miran', 'Friend', 'Whose baby is it? Is it mine? 

How can you be sure, c’mon Lisa?', 'Miran', '2026-01-04 02:38:20.956919+00'),
	(115, 'Test Guest', 'Friend', 'This is a test message from the audit', 'API Test', '2026-01-04 07:14:57.148514+00'),
	(117, 'Test User', 'friend', 'Hello from direct SQL test', 'Test User', '2026-01-04 13:36:21.144104+00'),
	(120, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:39:54.379853+00'),
	(122, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:49:49.540527+00'),
	(123, 'Test User', 'Friend', 'Testing with JS client!', 'Test User', '2026-01-04 13:50:25.660704+00'),
	(125, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:52:30.528639+00'),
	(127, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:54:56.201232+00'),
	(129, 'Test User', 'Friend', 'Hello from direct HTTP test!', 'Test User', '2026-01-04 13:56:23.909561+00'),
	(132, 'Test Guest', 'Friend', 'Hello from test!', 'Test Guest', '2026-01-04 22:04:31.427883+00'),
	(134, 'Direct Test User', 'Friend', 'Direct API test - bypassing frontend', 'Direct Test User', '2026-01-04 22:27:16.854685+00'),
	(136, 'Verification Check', 'Friend', 'Checking if browser submission created entry #135', 'Verification Check', '2026-01-04 22:32:02.909166+00'),
	(138, 'Verification Check', 'Friend', 'Verifying guestbook works', 'Verification Check', '2026-01-04 23:33:02.442625+00'),
	(140, 'E2E Test Guest', 'Friend', 'Testing the guestbook functionality on January 5th, 2026', 'E2E Test Guest', '2026-01-05 00:09:39.822266+00'),
	(143, 'The', 'Other', 'T', 'The', '2026-01-05 00:49:00.822242+00'),
	(145, 'Final Health Check', 'Tester', 'All systems go for January 4th!', 'Final Health Check', '2026-01-05 00:58:22.22452+00'),
	(147, 'Final Test User', 'Friend', 'Final verification test - all systems working!', 'Final Test User', '2026-01-05 10:10:42.890217+00');


--
-- Data for Name: mom_dad_lobbies; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."mom_dad_lobbies" ("id", "lobby_key", "lobby_name", "status", "max_players", "current_players", "current_humans", "current_ai_count", "admin_player_id", "total_rounds", "created_at", "updated_at") VALUES
	('d5e3692c-326e-4c93-af64-74ac8fbd61b4', 'LOBBY-A', 'Sunny Meadows', 'waiting', 6, 0, 0, 0, NULL, 5, '2026-01-03 21:36:46.685628+00', '2026-01-03 21:36:46.685628+00'),
	('2cbde232-0f50-43ea-b5a4-2414dabebab6', 'LOBBY-B', 'Cozy Barn', 'waiting', 6, 0, 0, 0, NULL, 5, '2026-01-03 21:36:46.685628+00', '2026-01-03 21:36:46.685628+00'),
	('b0675906-733e-4755-a1e0-f3f246371674', 'LOBBY-C', '星光谷', 'waiting', 6, 0, 0, 0, NULL, 5, '2026-01-03 21:36:46.685628+00', '2026-01-03 21:36:46.685628+00'),
	('2c885eb9-8520-4501-9bcd-e43cd4de18f5', 'LOBBY-D', '月光屋', 'waiting', 6, 0, 0, 0, NULL, 5, '2026-01-03 21:36:46.685628+00', '2026-01-03 21:36:46.685628+00');


--
-- Data for Name: mom_dad_game_sessions; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--



--
-- Data for Name: mom_dad_players; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."mom_dad_players" ("id", "lobby_id", "user_id", "player_name", "player_type", "is_admin", "is_ready", "current_vote", "joined_at", "disconnected_at") VALUES
	('71709887-97e7-48f6-91d0-c3bb83f15783', 'd5e3692c-326e-4c93-af64-74ac8fbd61b4', NULL, 'RLS Test Player', 'human', false, false, NULL, '2026-01-05 00:54:03.246921+00', NULL);


--
-- Data for Name: pool_predictions; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."pool_predictions" ("id", "predictor_name", "gender", "birth_date", "weight_kg", "length_cm", "hair_color", "eye_color", "personality", "submitted_by", "created_at", "prediction") VALUES
	(50, 'Michael Chen', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Michael Chen', '2026-01-02 00:24:37.360069+00', 'Baby prediction'),
	(56, 'Michael Chen', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Michael Chen', '2026-01-02 00:44:58.859393+00', 'Baby prediction'),
	(59, 'Michael Chen', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Michael Chen', '2026-01-02 01:29:53.637958+00', 'Baby prediction'),
	(61, 'Test Pool User', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Test Pool User', '2026-01-02 01:55:50.394263+00', 'Baby prediction'),
	(17, 'Michelle', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Michelle', '2026-01-01 08:29:02.347073+00', 'Baby prediction'),
	(19, 'TestMom', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'TestMom', '2026-01-01 08:30:02.29512+00', 'Baby prediction'),
	(21, 'TestMom', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'TestMom', '2026-01-01 08:31:20.848751+00', 'Baby prediction'),
	(28, 'Pool Predictor', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Pool Predictor', '2026-01-01 08:34:01.508152+00', 'Baby prediction'),
	(32, 'Michelle Maya', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Michelle Maya', '2026-01-01 09:32:47.605235+00', 'Baby prediction'),
	(45, 'Test Pooler', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Test Pooler', '2026-01-02 00:09:10.83301+00', 'Baby prediction'),
	(67, 'Pool User', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Pool User', '2026-01-02 02:56:51.828711+00', 'Baby prediction'),
	(73, 'ProdTest', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'ProdTest', '2026-01-02 03:11:24.457077+00', 'Baby prediction'),
	(78, 'FinalPool', 'surprise', '2026-01-02', 7.5, 20, NULL, NULL, NULL, 'FinalPool', '2026-01-02 04:37:25.277374+00', 'Baby prediction'),
	(83, 'Test User', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Test User', '2026-01-02 04:56:40.558742+00', 'Baby prediction'),
	(94, 'Emily Chen', 'surprise', '2026-01-02', 3.5, 50, NULL, NULL, NULL, 'Emily Chen', '2026-01-02 05:51:04.580709+00', 'Baby prediction'),
	(97, 'Test Predictor', 'girl', '2026-02-15', 3.2, 50, NULL, NULL, NULL, 'API Test', '2026-01-04 07:15:18.64231+00', 'Emma'),
	(98, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:51:32.813138+00', '2025-02-15'),
	(99, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:51:56.787028+00', '2025-02-15'),
	(100, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:52:32.463778+00', '2025-02-15'),
	(101, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:53:49.155304+00', '2025-02-15'),
	(102, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:54:58.08536+00', '2025-02-15'),
	(103, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:55:51.243658+00', '2025-02-15'),
	(104, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:56:25.802015+00', '2025-02-15'),
	(105, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:57:48.206875+00', '2025-02-15'),
	(106, 'Test User', 'surprise', '2025-02-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 13:58:22.332653+00', '2025-02-15'),
	(107, 'Test User', 'surprise', '2025-03-15', 3.2, 50, NULL, NULL, NULL, NULL, '2026-01-04 22:59:53.229504+00', '2025-03-15 at 14:30'),
	(108, 'Frontend Test User', 'surprise', '2025-03-15', 3.5, 50, NULL, NULL, NULL, NULL, '2026-01-04 23:04:23.507766+00', '2025-03-15 at 14:30'),
	(109, 'Test Guest', 'surprise', '2025-06-15', 3.2, 51, NULL, NULL, NULL, NULL, '2026-01-04 23:04:35.410931+00', '2025-06-15 at 10:30'),
	(110, 'Pool Test User', 'surprise', '2024-02-14', 3.5, 51, NULL, NULL, NULL, NULL, '2026-01-04 23:56:16.273761+00', '2024-02-14 at 14:30'),
	(111, 'E2E Pool Tester', 'surprise', '2025-06-15', 3.5, 51, NULL, NULL, NULL, NULL, '2026-01-05 00:09:42.051465+00', '2025-06-15 at 14:30'),
	(112, 'Health Check Pool', 'surprise', '2025-06-15', 3.5, 51, NULL, NULL, NULL, NULL, '2026-01-05 00:39:56.167692+00', '2025-06-15 at 14:30'),
	(113, 'Final Pool Check', 'surprise', '2025-06-15', 3.5, 51, NULL, NULL, NULL, NULL, '2026-01-05 00:58:46.65346+00', '2025-06-15 at 14:30'),
	(114, 'Final Test', 'surprise', '2026-03-09', 3.5, 51, NULL, NULL, NULL, NULL, '2026-01-05 10:13:27.745831+00', '2026-03-09 at 14:30'),
	(115, 'Jazz', 'surprise', '2026-03-10', 3.6, 48, NULL, NULL, NULL, NULL, '2026-01-05 10:16:07.529945+00', 'Date: 2026-03-10, Time: 09:15, Weight: 3.6kg, Length: 48cm'),
	(116, 'Jazeel A', 'surprise', '2026-03-03', 3.2, 55, NULL, NULL, NULL, NULL, '2026-01-05 14:42:38.471463+00', 'Date: 2026-03-03, Time: 15:42, Weight: 3.2kg, Length: 55cm'),
	(117, 'Jazeel A', 'surprise', '2026-03-18', 3.2, 45, NULL, NULL, NULL, NULL, '2026-01-05 21:00:46.156142+00', 'Date: 2026-03-18, Time: 08:00, Weight: 3.2kg, Length: 45cm'),
	(118, 'Michelle Huang', 'surprise', '2026-03-13', 3.6, 52, NULL, NULL, NULL, NULL, '2026-01-05 23:02:55.882537+00', 'Date: 2026-03-13, Time: 10:02, Weight: 3.6kg, Length: 52cm');


--
-- Data for Name: quiz_results; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."quiz_results" ("id", "participant_name", "answers", "score", "total_questions", "percentage", "submitted_by", "created_at", "puzzle1", "puzzle2", "puzzle3", "puzzle4", "puzzle5") VALUES
	(24, 'Quiz Master', '{"puzzle1": null, "puzzle2": null, "puzzle3": null, "puzzle4": null, "puzzle5": null}', 5, 5, NULL, 'Quiz Master', '2026-01-01 08:33:31.269863+00', NULL, NULL, NULL, NULL, NULL),
	(26, 'Quiz Master', '{"puzzle1": null, "puzzle2": null, "puzzle3": null, "puzzle4": null, "puzzle5": null}', 5, 5, NULL, 'Quiz Master', '2026-01-01 08:34:01.451333+00', NULL, NULL, NULL, NULL, NULL),
	(34, 'Michelle Test Quiz', '{"puzzle1": null, "puzzle2": null, "puzzle3": null, "puzzle4": null, "puzzle5": null}', 5, 5, NULL, 'Michelle Test Quiz', '2026-01-01 09:44:33.963932+00', NULL, NULL, NULL, NULL, NULL),
	(51, 'Emma Wilson', '{"puzzle1": null, "puzzle2": null, "puzzle3": null, "puzzle4": null, "puzzle5": null}', 0, 5, NULL, 'Emma Wilson', '2026-01-02 00:24:47.49354+00', NULL, NULL, NULL, NULL, NULL),
	(57, 'Emma Wilson', '{"puzzle1": null, "puzzle2": null, "puzzle3": null, "puzzle4": null, "puzzle5": null}', 0, 5, NULL, 'Emma Wilson', '2026-01-02 00:47:03.310204+00', NULL, NULL, NULL, NULL, NULL),
	(68, 'Anonymous Quiz Taker', '{"q1": "A", "q2": "B"}', 2, 5, NULL, 'Anonymous Quiz Taker', '2026-01-02 02:57:05.360618+00', NULL, NULL, NULL, NULL, NULL),
	(74, 'Anonymous Quiz Taker', '[0, 1, 2]', 3, 5, NULL, 'Anonymous Quiz Taker', '2026-01-02 03:11:25.015863+00', NULL, NULL, NULL, NULL, NULL),
	(79, 'FinalQuizzer', '["baby shower", "three little pigs", "sleeping baby", "baby care", "baby diaper"]', 5, 5, NULL, 'FinalQuizzer', '2026-01-02 04:38:21.931384+00', NULL, NULL, NULL, NULL, NULL),
	(84, 'Anonymous Quiz Taker', '["Baby Shower", "Three Little Pigs", "Rock a Bye Baby", "Baby Bottle", "Diaper Change"]', 5, 5, NULL, 'Anonymous Quiz Taker', '2026-01-02 04:56:53.495567+00', NULL, NULL, NULL, NULL, NULL),
	(88, 'Anonymous Quiz Taker', '["", "", "", "", ""]', 0, 5, NULL, 'Anonymous Quiz Taker', '2026-01-02 05:00:26.729233+00', NULL, NULL, NULL, NULL, NULL),
	(91, 'Kasuni', '{"puzzle1": "", "puzzle2": "", "puzzle3": "", "puzzle4": "", "puzzle5": ""}', 0, 5, 0, NULL, '2026-01-04 01:40:29.573801+00', '', '', '', '', ''),
	(92, 'Sachini', '{"puzzle1": "", "puzzle2": "", "puzzle3": "", "puzzle4": "", "puzzle5": ""}', 0, 5, 0, NULL, '2026-01-04 01:42:54.232387+00', '', '', '', '', ''),
	(93, 'Melissa', '{"puzzle1": "", "puzzle2": "", "puzzle3": "", "puzzle4": "", "puzzle5": ""}', 0, 5, 0, NULL, '2026-01-04 01:45:45.254958+00', '', '', '', '', ''),
	(94, 'Mark and Johnny', '{"puzzle1": "", "puzzle2": "", "puzzle3": "", "puzzle4": "", "puzzle5": ""}', 0, 5, 0, NULL, '2026-01-04 02:03:51.223111+00', '', '', '', '', ''),
	(95, 'Nicole', '{"puzzle1": "", "puzzle2": "", "puzzle3": "", "puzzle4": "", "puzzle5": ""}', 0, 5, 0, NULL, '2026-01-04 02:47:56.600345+00', '', '', '', '', ''),
	(96, 'Test Participant', '{"1": "A", "2": "B", "3": "C"}', 3, 5, NULL, 'API Test', '2026-01-04 07:15:31.41777+00', NULL, NULL, NULL, NULL, NULL),
	(97, 'Test', '{"puzzle1": "a1", "puzzle2": "a2", "puzzle3": "a3", "puzzle4": "a4", "puzzle5": "a5"}', 5, 5, 100, NULL, '2026-01-04 13:55:54.500911+00', 'a1', 'a2', 'a3', 'a4', 'a5'),
	(98, 'Test', '{"puzzle1": "a1", "puzzle2": "a2", "puzzle3": "a3", "puzzle4": "a4", "puzzle5": "a5"}', 5, 5, 100, NULL, '2026-01-04 13:56:27.361244+00', 'a1', 'a2', 'a3', 'a4', 'a5'),
	(99, 'Test Quizzer', '{"puzzle1": "answer1", "puzzle2": "answer2", "puzzle3": "answer3", "puzzle4": "answer4", "puzzle5": "answer5"}', 5, 5, 100, NULL, '2026-01-04 13:57:51.654118+00', 'answer1', 'answer2', 'answer3', 'answer4', 'answer5'),
	(100, 'Test Quizzer', '{"puzzle1": "test1", "puzzle2": "test2", "puzzle3": "test3", "puzzle4": "test4", "puzzle5": "test5"}', 5, 5, 100, NULL, '2026-01-04 13:58:23.643008+00', 'test1', 'test2', 'test3', 'test4', 'test5'),
	(101, 'Test Player', '{"puzzle1": "Bath time", "puzzle2": "Three little pigs", "puzzle3": "Good night", "puzzle4": "Baby lotion", "puzzle5": "Baby diaper"}', 3, 5, 60, NULL, '2026-01-04 23:06:33.682642+00', 'Bath time', 'Three little pigs', 'Good night', 'Baby lotion', 'Baby diaper'),
	(102, 'Fixed Quiz Test', '{"puzzle1": "Bath time", "puzzle2": "Three little pigs", "puzzle3": "Good night", "puzzle4": "Baby lotion", "puzzle5": "Baby diaper"}', 5, 5, 100, NULL, '2026-01-04 23:07:03.182801+00', 'Bath time', 'Three little pigs', 'Good night', 'Baby lotion', 'Baby diaper'),
	(103, 'Final Verification Test', '{"puzzle1": "Bath time", "puzzle2": "Three little pigs", "puzzle3": "Good night", "puzzle4": "Baby lotion", "puzzle5": "Baby diaper"}', 5, 5, 100, NULL, '2026-01-04 23:08:03.364373+00', 'Bath time', 'Three little pigs', 'Good night', 'Baby lotion', 'Baby diaper'),
	(104, 'Final Test User', '{"puzzle1": "Bath time", "puzzle2": "Three little pigs", "puzzle3": "Good night", "puzzle4": "Baby lotion", "puzzle5": "Baby diaper"}', 1, 5, 20, NULL, '2026-01-04 23:30:42.29005+00', 'Bath time', 'Three little pigs', 'Good night', 'Baby lotion', 'Baby diaper'),
	(105, 'Final Test User', '{"puzzle1": "Blue", "puzzle2": "Sweet", "puzzle3": "Low", "puzzle4": "Fast", "puzzle5": "Right"}', 0, 5, 0, NULL, '2026-01-04 23:42:46.26991+00', 'Blue', 'Sweet', 'Low', 'Fast', 'Right'),
	(106, 'E2E Quiz Master', '{"puzzle1": "Stork", "puzzle2": "Diapers", "puzzle3": "Crib", "puzzle4": "Bottle", "puzzle5": "Mobile"}', 5, 5, 100, NULL, '2026-01-05 00:10:57.473344+00', 'Stork', 'Diapers', 'Crib', 'Bottle', 'Mobile'),
	(107, 'Health Check Quiz', '{"puzzle1": "Stork", "puzzle2": "Diapers", "puzzle3": "Crib", "puzzle4": "Bottle", "puzzle5": "Mobile"}', 5, 5, 100, NULL, '2026-01-05 00:40:07.222+00', 'Stork', 'Diapers', 'Crib', 'Bottle', 'Mobile'),
	(108, 'Final Quiz Check', '{"puzzle1": "Stork", "puzzle2": "Diapers", "puzzle3": "Crib", "puzzle4": "Bottle", "puzzle5": "Mobile"}', 5, 5, 100, NULL, '2026-01-05 00:58:48.403817+00', 'Stork', 'Diapers', 'Crib', 'Bottle', 'Mobile'),
	(109, 'Jazz', '{"puzzle1": "baby shower", "puzzle2": "1", "puzzle3": "2", "puzzle4": "3", "puzzle5": "55"}', 1, 5, 20, NULL, '2026-01-05 10:16:40.680301+00', 'baby shower', '1', '2', '3', '55'),
	(110, 'Jazeel A', '{"puzzle1": "d", "puzzle2": "3 little piggies", "puzzle3": "moon star baby", "puzzle4": "baby lotion", "puzzle5": "baby diaper"}', 0, 5, 0, NULL, '2026-01-05 14:43:23.818239+00', 'd', '3 little piggies', 'moon star baby', 'baby lotion', 'baby diaper');


--
-- Data for Name: votes; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."votes" ("id", "voter_name", "selected_names", "submitted_by", "created_at") VALUES
	(23, 'TestVoter', '[]', 'TestVoter', '2026-01-01 08:31:23.605789+00'),
	(30, 'Voter', '[]', 'Voter', '2026-01-01 08:34:01.521738+00'),
	(35, 'Michelle Test Vote', '[]', 'Michelle Test Vote', '2026-01-01 09:44:34.662391+00'),
	(53, 'David Thompson', '["Emma", "Olivia", "Sophia"]', 'David Thompson', '2026-01-02 00:25:08.524773+00'),
	(66, 'Anonymous Voter', '["Alice", "Bob"]', 'Anonymous Voter', '2026-01-02 02:56:33.317598+00'),
	(72, 'Anonymous Voter', '["Alice", "Bob"]', 'Anonymous Voter', '2026-01-02 03:11:23.893935+00'),
	(76, 'Anonymous Voter', '["Emma", "Olivia", "Sophia"]', 'Anonymous Voter', '2026-01-02 04:31:07.269214+00'),
	(80, 'Anonymous Voter', '["Emma", "Olivia", "Sophia"]', 'Anonymous Voter', '2026-01-02 04:40:30.927535+00'),
	(82, 'Anonymous Voter', '["Emma", "Olivia", "Sophia"]', 'Anonymous Voter', '2026-01-02 04:51:04.661216+00'),
	(89, 'Anonymous Voter', '["Charlotte", "Isabella", "Harper"]', 'Anonymous Voter', '2026-01-02 05:02:51.486746+00'),
	(91, 'Anonymous Voter', '["Emma", "Sophia", "Charlotte"]', 'Anonymous Voter', '2026-01-02 05:28:18.173886+00'),
	(96, 'Anonymous Voter', '["Emma", "Sophia", "Charlotte"]', 'Anonymous Voter', '2026-01-02 05:54:25.833978+00'),
	(100, 'Anonymous Voter', '["Charlotte", "Amelia", "Ava"]', 'Anonymous Voter', '2026-01-02 07:28:28.665973+00'),
	(103, 'Test Voter', '["Emma", "Olivia"]', 'API Test', '2026-01-04 07:14:35.605756+00'),
	(104, 'Permission Test', '["Emma"]', NULL, '2026-01-04 09:52:25.463822+00'),
	(105, 'Anonymous Voter', '["Emma", "Olivia"]', 'Anonymous Voter', '2026-01-04 09:52:32.652803+00'),
	(106, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:24:32.089707+00'),
	(107, 'Anonymous Voter', '["Test"]', 'Anonymous Voter', '2026-01-04 13:24:40.023135+00'),
	(108, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:24:54.345705+00'),
	(109, 'Anonymous Voter', '["Test"]', 'Anonymous Voter', '2026-01-04 13:25:08.222344+00'),
	(110, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:25:37.177503+00'),
	(111, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:26:05.765207+00'),
	(112, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:26:50.814387+00'),
	(113, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:27:04.906717+00'),
	(114, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:30:43.053693+00'),
	(115, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:36:07.851092+00'),
	(116, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:37:27.469329+00'),
	(117, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:37:43.236524+00'),
	(118, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:39:55.146968+00'),
	(119, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:41:28.960904+00'),
	(120, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:49:50.322726+00'),
	(121, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:50:26.397856+00'),
	(122, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:51:55.605871+00'),
	(123, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:52:31.257236+00'),
	(124, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:53:47.966421+00'),
	(125, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:54:56.873524+00'),
	(126, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:55:50.051818+00'),
	(127, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:56:24.64846+00'),
	(128, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:57:47.01528+00'),
	(129, 'Anonymous Voter', '["Test Name"]', 'Anonymous Voter', '2026-01-04 13:58:21.062253+00'),
	(130, 'Anonymous Voter', '["Emma", "Sophia", "Olivia"]', 'Anonymous Voter', '2026-01-04 22:40:42.850107+00'),
	(131, 'E2E Voter', '["Michelle", "Huang"]', 'E2E Voter', '2026-01-05 00:10:40.608251+00'),
	(132, 'Direct API Test Voter', '["Michelle", "Huang"]', 'Direct API Test Voter', '2026-01-05 00:34:26.207334+00'),
	(133, 'Anonymous Voter', '["Michelle", "Huang"]', 'Anonymous Voter', '2026-01-05 00:40:20.532171+00');


--
-- Data for Name: who_would_rather_questions; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--

INSERT INTO "baby_shower"."who_would_rather_questions" ("id", "question_text", "question_number", "category", "difficulty", "is_active", "created_at") VALUES
	('c70bcec1-c41a-4717-a46e-17ce76ae7fdd', 'Who worries more?', 1, 'personality', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('f769d0bd-c4b7-46b6-90c7-8bb34e1c2cb1', 'Who wants more kids?', 2, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('5bf88d9b-0dac-4eb0-ac80-d25065c103c7', 'Whose parents will feed you more?', 3, 'family', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('6d27b673-9e97-4826-b7e7-51b9bef472b1', 'Who will be more nervous in labour?', 4, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('5851bec3-2b5c-4457-a32e-ed8829ffbe34', 'Who keeps track of appointments?', 5, 'daily_life', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('3b9acd09-7790-41f4-b216-70aab1f04af8', 'Who came up with the name?', 6, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('86192db6-d629-4623-b815-36472aa035d8', 'Who was the bigger baby at birth?', 7, 'personal_history', 'hard', true, '2026-01-03 19:42:02.196129+00'),
	('282ca99e-dca7-48f9-bb10-7e1a993371d0', 'Who took long to potty train?', 8, 'personal_history', 'hard', true, '2026-01-03 19:42:02.196129+00'),
	('5f98601a-537f-459a-b0d0-b223d2711dff', 'Who will change more diapers?', 9, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('ccff1b0d-2276-4b5e-890e-ea11569c45e8', 'Who will gag more changing diapers?', 10, 'parenting', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('25876858-eb3c-4439-8233-713ebef66df0', 'Who will be the "good cop" parent?', 11, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('9499e6a1-3920-49c2-aa83-3590bab4bc60', 'Who will be the more strict parent?', 12, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('03f347bb-019a-4a60-8208-e468d20a4e80', 'Who will take more pictures and videos of the child?', 13, 'daily_life', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('70c21af1-6728-4236-94fb-335aa9b6c873', 'Who will resemble the baby the most?', 14, 'family', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('397ac3a5-67c9-4049-bfc1-9ccdffd6e4d5', 'Who will ramble at the baby?', 15, 'personality', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('9d240b14-acfd-4a9d-b1b6-ac336d6fa133', 'Who will have an easier time letting baby cry?', 16, 'parenting', 'hard', true, '2026-01-03 19:42:02.196129+00'),
	('9f4f9614-46a9-4b96-8289-4d94a88d37a2', 'Who will have more patience (through newborn stage)?', 17, 'personality', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('8a7cbd7e-580f-4762-ac4b-c361702c790d', 'Who will tell the story of the birds and the bees?', 18, 'parenting', 'hard', true, '2026-01-03 19:42:02.196129+00'),
	('f63f2a76-e74a-4e84-a1e0-944da06977a0', 'Who will read more bedtime stories?', 19, 'daily_life', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('9fde0560-58ca-4ba3-a6d8-9568e86fe7fe', 'Who will fix the ouchies and boo-boos?', 20, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('957f67e7-e640-4fb7-a5ca-a588d95e7efb', 'Who will dress the child?', 21, 'daily_life', 'easy', true, '2026-01-03 19:42:02.196129+00'),
	('bd7b4401-50f5-405d-bf38-15374053f9de', 'Who will play games with the child?', 22, 'daily_life', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('6f290e01-86b5-4771-9770-f3abf2b4af98', 'Who will be more excited for school events?', 23, 'parenting', 'medium', true, '2026-01-03 19:42:02.196129+00'),
	('f58ebf2d-4c15-4e26-9d74-09273055cbe2', 'Who will cry more at kindergarten drop-off?', 24, 'parenting', 'easy', true, '2026-01-03 19:42:02.196129+00');


--
-- Data for Name: who_would_rather_sessions; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--



--
-- Data for Name: who_would_rather_votes; Type: TABLE DATA; Schema: baby_shower; Owner: postgres
--



--
-- Name: advice_id_seq; Type: SEQUENCE SET; Schema: baby_shower; Owner: postgres
--

SELECT pg_catalog.setval('"baby_shower"."advice_id_seq"', 114, true);


--
-- Name: guestbook_id_seq; Type: SEQUENCE SET; Schema: baby_shower; Owner: postgres
--

SELECT pg_catalog.setval('"baby_shower"."guestbook_id_seq"', 148, true);


--
-- Name: pool_predictions_id_seq; Type: SEQUENCE SET; Schema: baby_shower; Owner: postgres
--

SELECT pg_catalog.setval('"baby_shower"."pool_predictions_id_seq"', 118, true);


--
-- Name: quiz_results_id_seq; Type: SEQUENCE SET; Schema: baby_shower; Owner: postgres
--

SELECT pg_catalog.setval('"baby_shower"."quiz_results_id_seq"', 110, true);


--
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: baby_shower; Owner: postgres
--

SELECT pg_catalog.setval('"baby_shower"."votes_id_seq"', 133, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict hIQoQBtJTcbxgnCP2JKHlm6yB2IXnRs9p3KT1s3n3672QjIuR6qGey4S3DgZ1Fs

RESET ALL;

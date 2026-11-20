BEGIN TRANSACTION;
CREATE TABLE complaints (
	id VARCHAR(36) NOT NULL, 
	reference_number VARCHAR(32) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	category VARCHAR(100) NOT NULL, 
	latitude FLOAT, 
	longitude FLOAT, 
	location_address VARCHAR(500), 
	image_filename VARCHAR(255), 
	image_content_type VARCHAR(64), 
	image_size_bytes INTEGER, 
	ai_valid_image BOOLEAN NOT NULL, 
	ai_relevance VARCHAR(64), 
	ai_confidence FLOAT, 
	ai_detected_category VARCHAR(100), 
	ai_description TEXT, 
	ai_rejection_reason TEXT, 
	ai_recommended_next_step TEXT, 
	is_mock_ai BOOLEAN NOT NULL, 
	complaint_letter TEXT, 
	status VARCHAR(32) NOT NULL, 
	citizen_name VARCHAR(255), 
	citizen_contact VARCHAR(255), 
	user_id VARCHAR(36), 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "complaints" VALUES('0dd59877-f2bd-4d01-b1a1-5593eeb09cd0','CIV-20261025-A101','[DEMO DATA] Hazardous crater pothole on 4th Main Road','A severe 2-foot wide pothole in the left carriage lane causing recurring vehicle suspension damage and two-wheeler skidding risk.','Potholes and Damaged Roads',12.9716,77.5946,'4th Main Road, Indiranagar, Ward 112',NULL,NULL,NULL,1,'relevant',0.95,'Potholes and Damaged Roads','[DEMO DATA] Large asphalt cavity with loose aggregate near road curb.',NULL,NULL,1,'Date: October 22, 2026

To,
The Municipal Commissioner,
Civic Authority

Subject: Formal Grievance: [DEMO DATA] Hazardous crater pothole on 4th Main Road

Respected Authority,

A severe 2-foot wide pothole in the left carriage lane causing recurring vehicle suspension damage and two-wheeler skidding risk.

Location: 4th Main Road, Indiranagar, Ward 112

Kindly expedite inspection and repair.

Sincerely,
Demo Citizen','In Progress','Demo Citizen','citizen.demo@civicai.local',NULL,'2026-10-22 09:33:48.199726','2026-10-22 09:33:48.199726');
INSERT INTO "complaints" VALUES('370baf7b-b87a-402d-b48c-b1e50bca691f','CIV-20261025-B202','[DEMO DATA] Overflowing communal trash bins at vegetable market','Garbage has not been collected for over four days. Organic waste is spilling onto the pedestrian footpath creating foul odor and health hazard.','Overflowing Garbage and Illegal Dumping',12.9352,77.6245,'Near Weekly Market Gate, Koramangala 5th Block',NULL,NULL,NULL,1,'relevant',0.95,'Overflowing Garbage and Illegal Dumping','[DEMO DATA] Uncontained municipal solid waste accumulating around dual metal dumpsters.',NULL,NULL,1,'Date: October 23, 2026

To,
The Municipal Commissioner,
Civic Authority

Subject: Formal Grievance: [DEMO DATA] Overflowing communal trash bins at vegetable market

Respected Authority,

Garbage has not been collected for over four days. Organic waste is spilling onto the pedestrian footpath creating foul odor and health hazard.

Location: Near Weekly Market Gate, Koramangala 5th Block

Kindly expedite inspection and repair.

Sincerely,
Demo Citizen','Under Review','Demo Citizen','citizen.demo@civicai.local',NULL,'2026-10-23 09:33:48.199726','2026-10-23 09:33:48.199726');
INSERT INTO "complaints" VALUES('9d12d163-cd16-4daf-b1ac-902ac2aedc8e','CIV-20261025-C303','[DEMO DATA] Non-operational streetlights along school corridor','Four consecutive streetlight poles have been dark for two weeks. Creates significant safety concerns for evening commuters and students.','Broken Streetlights',12.9915,77.5712,'Government High School Lane, Malleshwaram 15th Cross',NULL,NULL,NULL,1,'relevant',0.95,'Broken Streetlights','[DEMO DATA] Public utility pole with fractured luminaire housing.',NULL,NULL,1,'Date: October 18, 2026

To,
The Municipal Commissioner,
Civic Authority

Subject: Formal Grievance: [DEMO DATA] Non-operational streetlights along school corridor

Respected Authority,

Four consecutive streetlight poles have been dark for two weeks. Creates significant safety concerns for evening commuters and students.

Location: Government High School Lane, Malleshwaram 15th Cross

Kindly expedite inspection and repair.

Sincerely,
Demo Citizen','Resolved','Demo Citizen','citizen.demo@civicai.local',NULL,'2026-10-18 09:33:48.199726','2026-10-18 09:33:48.199726');
INSERT INTO "complaints" VALUES('e9b2373c-6764-4b18-836d-e5a7cdcf0c2c','CIV-20261025-D404','[DEMO DATA] Burst municipal potable water supply pipe','Underground main water line leakage resulting in gallons of treated water flowing onto the street and flooding neighboring basements.','Water Leakage and Drainage',12.9141,77.6322,'27th Main, Sector 1, HSR Layout',NULL,NULL,NULL,1,'relevant',0.95,'Water Leakage and Drainage','[DEMO DATA] Continuous water eruption through pavement joint forming stagnant pool.',NULL,NULL,1,'Date: October 24, 2026

To,
The Municipal Commissioner,
Civic Authority

Subject: Formal Grievance: [DEMO DATA] Burst municipal potable water supply pipe

Respected Authority,

Underground main water line leakage resulting in gallons of treated water flowing onto the street and flooding neighboring basements.

Location: 27th Main, Sector 1, HSR Layout

Kindly expedite inspection and repair.

Sincerely,
Demo Citizen','Submitted','Demo Citizen','citizen.demo@civicai.local',NULL,'2026-10-24 09:33:48.199726','2026-10-24 09:33:48.199726');
INSERT INTO "complaints" VALUES('03ab1670-8c34-4193-899c-c3592770f109','CIV-20261025-E505','[DEMO DATA] Collapsed safety railing on pedestrian footbridge','Rust and impact have detached a 10-foot section of safety railing over the stormwater canal, posing acute falling danger.','Damaged Public Infrastructure',12.9856,77.6057,'Canal Footbridge, Ulsoor Lake Perimeter',NULL,NULL,NULL,1,'relevant',0.95,'Damaged Public Infrastructure','[DEMO DATA] Severed structural metal railing overlooking 12-foot concrete drop.',NULL,NULL,1,'Date: October 20, 2026

To,
The Municipal Commissioner,
Civic Authority

Subject: Formal Grievance: [DEMO DATA] Collapsed safety railing on pedestrian footbridge

Respected Authority,

Rust and impact have detached a 10-foot section of safety railing over the stormwater canal, posing acute falling danger.

Location: Canal Footbridge, Ulsoor Lake Perimeter

Kindly expedite inspection and repair.

Sincerely,
Demo Citizen','In Progress','Demo Citizen','citizen.demo@civicai.local',NULL,'2026-10-20 09:33:48.199726','2026-10-20 09:33:48.199726');
CREATE TABLE status_history (
	id VARCHAR(36) NOT NULL, 
	complaint_id VARCHAR(36) NOT NULL, 
	old_status VARCHAR(32), 
	new_status VARCHAR(32) NOT NULL, 
	changed_by_user_id VARCHAR(36), 
	remarks TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(complaint_id) REFERENCES complaints (id) ON DELETE CASCADE, 
	FOREIGN KEY(changed_by_user_id) REFERENCES users (id)
);
INSERT INTO "status_history" VALUES('33b949dd-5aea-4850-9342-0ecb677e2292','0dd59877-f2bd-4d01-b1a1-5593eeb09cd0',NULL,'Submitted',NULL,'[DEMO DATA] Initial grievance recorded.','2026-10-22 09:33:48.199726');
INSERT INTO "status_history" VALUES('aedcd43c-7564-4dcd-9bf3-a36b1c4468bc','0dd59877-f2bd-4d01-b1a1-5593eeb09cd0','Submitted','Under Review','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Assigned to Ward Field Engineer.','2026-10-22 21:33:48.199726');
INSERT INTO "status_history" VALUES('8f039360-900e-4f7a-af65-a008f89549b6','0dd59877-f2bd-4d01-b1a1-5593eeb09cd0','Under Review','In Progress','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Repair crew dispatched on-site.','2026-10-23 09:33:48.199726');
INSERT INTO "status_history" VALUES('d5c2f07c-fe91-447a-89c5-494299a1af20','370baf7b-b87a-402d-b48c-b1e50bca691f',NULL,'Submitted',NULL,'[DEMO DATA] Initial grievance recorded.','2026-10-23 09:33:48.199726');
INSERT INTO "status_history" VALUES('df196241-413c-4fc8-9dc0-772b43d7c91a','370baf7b-b87a-402d-b48c-b1e50bca691f','Submitted','Under Review','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Assigned to Ward Field Engineer.','2026-10-23 21:33:48.199726');
INSERT INTO "status_history" VALUES('feb6554a-c0b9-47fc-ab85-6415a962ca26','9d12d163-cd16-4daf-b1ac-902ac2aedc8e',NULL,'Submitted',NULL,'[DEMO DATA] Initial grievance recorded.','2026-10-18 09:33:48.199726');
INSERT INTO "status_history" VALUES('d23d4903-c3c5-42a9-bd93-1b4886a7a156','9d12d163-cd16-4daf-b1ac-902ac2aedc8e','Submitted','Under Review','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Assigned to Ward Field Engineer.','2026-10-18 21:33:48.199726');
INSERT INTO "status_history" VALUES('08d69f62-bb1f-4554-b511-82cf5c01486c','9d12d163-cd16-4daf-b1ac-902ac2aedc8e','Under Review','In Progress','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Repair crew dispatched on-site.','2026-10-19 09:33:48.199726');
INSERT INTO "status_history" VALUES('e2f27967-4530-4b8b-a7ac-cc4665131922','9d12d163-cd16-4daf-b1ac-902ac2aedc8e','In Progress','Resolved','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Corrective maintenance completed and verified by civic inspector.','2026-10-20 09:33:48.199726');
INSERT INTO "status_history" VALUES('37c53d45-3333-4418-bf22-40881bf55c19','e9b2373c-6764-4b18-836d-e5a7cdcf0c2c',NULL,'Submitted',NULL,'[DEMO DATA] Initial grievance recorded.','2026-10-24 09:33:48.199726');
INSERT INTO "status_history" VALUES('a2895bb6-e908-468f-9c41-b115a3bfd509','03ab1670-8c34-4193-899c-c3592770f109',NULL,'Submitted',NULL,'[DEMO DATA] Initial grievance recorded.','2026-10-20 09:33:48.199726');
INSERT INTO "status_history" VALUES('f5f2b39a-0392-42a7-8aef-82e90c2f5833','03ab1670-8c34-4193-899c-c3592770f109','Submitted','Under Review','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Assigned to Ward Field Engineer.','2026-10-20 21:33:48.199726');
INSERT INTO "status_history" VALUES('b67d099b-13d0-480d-8992-9079e25b2c9a','03ab1670-8c34-4193-899c-c3592770f109','Under Review','In Progress','25d41cbf-e114-4049-a66a-3026adb48c31','[DEMO DATA] Repair crew dispatched on-site.','2026-10-21 09:33:48.199726');
CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255) NOT NULL, 
	phone VARCHAR(50), 
	role VARCHAR(32) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES('25d41cbf-e114-4049-a66a-3026adb48c31','admin@civicai.local','950036031a93301986b82fcf52e5cd23$18c0f0c673967f280e4684035cd236858bb69493c9f41ddc7327921f9509a695','Municipal Administrator (Demo)',NULL,'admin',1,'2026-10-25 09:33:48.127582','2026-10-25 09:33:48.127586');
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE UNIQUE INDEX ix_complaints_reference_number ON complaints (reference_number);
CREATE INDEX ix_complaints_category ON complaints (category);
CREATE INDEX ix_complaints_status ON complaints (status);
CREATE INDEX ix_complaints_created_at ON complaints (created_at);
CREATE INDEX ix_complaints_user_id ON complaints (user_id);
CREATE INDEX ix_status_history_complaint_id ON status_history (complaint_id);
CREATE INDEX ix_status_history_created_at ON status_history (created_at);
COMMIT;